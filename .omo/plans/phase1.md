# phase1 - Work Plan

## TL;DR (For humans)
What you'll get: Phase 1 completed — async PDF ingestion via web upload and local-directory bulk import; structural PDF validation gate; BLAKE3 checksum integrity; durable Document + Artifact with pending/available states; temporary-input abstraction; import provenance; physical metadata capture; structured failures with retry; failed-items view. All built on Phase 0 Quarkus/PG/ES/Storage/Workflow foundation.

Why this approach: File-level execution spec with exact source paths, acceptance commands, and evidence artifacts. Tests-after framework (user-selected Q3). 5 waves: W1 validation+checksum; W2 web upload+temp input; W3 artifact publication+storage; W4 bulk import; W5 observability+final gate. No auth (v1).

What it will NOT do: Deduplication, OCR, text extraction, bibliographic metadata, collections, tags, search projection, Elasticsearch indexing, PDF viewer, GROBID, embeddings, RAG/LLM.

Effort: Large (5 waves × 3-4 files + tests + evidence)
Risk: Medium — PDF validation integration, checksum streaming, storage abstraction boundary, workflow recovery

Decisions to sanity-check: Q3=tests-after confirmed; v1 security (no auth); BLAKE3 streaming; temporary-input cleanup policy; no deduplication in Phase 1.

Your next move: Confirm approval of this file-level spec; signal execution start ("execute Phase 1"). Optional dual-Momus high-accuracy review available.

---

> TL;DR (machine): Phase 1 EXECUTION — 5 waves (W1 validation+checksum; W2 web upload+temp input; W3 artifact publication+storage; W4 bulk import; W5 observability+final); file-level spec; CLEAR routing; Q3=tests-after; evidence artifacts per wave; F1-F4 final verification.

## Scope
### Must have (Phase 1 Confluence spec → 5 waves; each item names exact output file)
W1 — PDF Validation + BLAKE3 Checksum:
- `pom.xml`: add `pdfbox` (validation), `blake3` (checksum)
- `src/main/java/com/nickrobison/tpl/validation/PdfValidator.java`: interface `boolean isValid(InputStream)` + `PdfValidationResult validate(InputStream)` with structured failure (code, message, details)
- `src/main/java/com/nickrobison/tpl/validation/PdfBoxValidator.java`: implements `PdfValidator` using PDFBox; structural parseability only (no page renderability required)
- `src/main/java/com/nickrobison/tpl/checksum/Blake3Checksum.java`: streaming BLAKE3 calculator `String calculate(InputStream)` + `boolean verify(InputStream, String expected)`
- `src/test/java/com/nickrobison/tpl/validation/PdfValidatorTest.java`: unit tests for valid/invalid PDFs
- `src/test/java/com/nickrobison/tpl/checksum/Blake3ChecksumTest.java`: unit tests for checksum calculation/verification

W2 — Web Upload + Temporary Input:
- `src/main/java/com/nickrobison/tpl/temp/TempInput.java`: interface `String store(InputStream) throws TempInputException`, `InputStream load(String ref)`, `void cleanup(String ref)`; cleanup contract: `cleanup` on success AND terminal failure (no orphan temp bytes); temp refs never escape as Artifact storage refs (decision #5)
- `src/main/java/com/nickrobison/tpl/temp/FilesystemTempInput.java`: implements `TempInput` (dev path: `target/temp-input/` or `~/.thebes/temp-input/`)
- `src/main/java/com/nickrobison/tpl/resource/UploadResource.java`: `POST /api/v1/upload` accepts multipart PDF; stores to temp input; returns `importId`; spawns import workflow; async (returns immediately)
- `src/main/java/com/nickrobison/tpl/resource/FailedItemsResource.java`: `GET /api/v1/imports` (import history) + `GET /api/v1/failed-items` (dedicated failures view; decision #17 / criterion #18 — failures visible, never as library Documents)
- `src/main/java/com/nickrobison/tpl/workflow/ImportWorkflow.java`: durable workflow job type `IMPORT_SINGLE` with payload (tempInputRef, originalFilename); validation → REUSE Phase 0 `Document.java` (existing, one row per successful import — NO new Document file) + pending Artifact → storage → BLAKE3 verify → available
- `src/test/java/com/nickrobison/tpl/resource/UploadResourceIT.java`: integration test for upload → workflow start

W3 — Artifact Publication + Storage:
- `src/main/java/com/nickrobison/tpl/model/Artifact.java`: add `ArtifactState` enum (PENDING, AVAILABLE, FAILED), `String physicalMetadataJson` (REQUIRED keys: size, mimeType, blake3, storageRef, pdfVersion, pageCount, encrypted, ingestionTimestamp, sourceFsTimestamps?, originalFilename), `String importProvenanceJson` ({mechanism, sourcePath?, importOperationId, timestamps}), `String originalFilename`
- `src/main/java/com/nickrobison/tpl/service/ArtifactPublicationService.java`: `void publish(Artifact artifact, InputStream data, String checksum)` — writes to Storage, verifies BLAKE3, transitions to AVAILABLE
- `src/main/java/com/nickrobison/tpl/workflow/ImportWorkflow.java`: enhanced with stage-level retry (validation, storage, verification) and full restart
- `src/test/java/com/nickrobison/tpl/service/ArtifactPublicationServiceIT.java`: integration test for publish → available; failure cases (checksum mismatch, storage failure)

W4 — Local-Directory Bulk Import:
- `src/main/java/com/nickrobison/tpl/import/BulkImportService.java`: `BulkImportResult importDirectory(Path dir, boolean recursive)` — reads `.pdf` files, ignores symlinks, creates parent workflow job with child jobs per file
- `src/main/java/com/nickrobison/tpl/workflow/BulkImportWorkflow.java`: parent workflow job type `IMPORT_BULK` with child `IMPORT_SINGLE` jobs; continues on individual failures; aggregate status
- `src/main/java/com/nickrobison/tpl/model/ImportOperation.java`: entity for import provenance (type: WEB_UPLOAD/LOCAL_DIRECTORY, sourcePath, originalFilename, timestamps, status)
- `src/test/java/com/nickrobison/tpl/import/BulkImportServiceIT.java`: integration test for bulk import with mixed success/failure

W5 — Observability + Final Verification:
- `src/main/resources/application.properties`: Phase 1 metrics (import duration, validation time, storage time, failure rates) + retain Phase 0 JSON logging + OTel (criterion #21)
- `src/main/java/com/nickrobison/tpl/resource/GreetingResource.java` (existing Phase 0): extend `/health` payload with `imports: {pending, failed}` counts (import-subsystem readiness signal)
- `.github/workflows/ci.yml`: add Phase 1 integration tests (`mvnw verify` includes UploadResourceIT, ArtifactPublicationServiceIT, BulkImportServiceIT)
- `.omo/evidence/security-v1.md`: updated with Phase 1 assumptions (same v1)
- `.omo/evidence/task-14point-gate.md`: updated with Phase 1 mappings
- F1-F4 evidence files (plan audit, code quality, manual QA, scope fidelity)

### Must NOT have (guardrails — executable assertion per line)
- No deduplication logic (checksum used for integrity only, not for duplicate detection) — assert: `grep -r 'deduplicate\|duplicate.*checksum\|checksum.*duplicate' src/` empty
- No OCR / text extraction / PDFBox text extraction — assert: `grep -r 'getText\|extractText\|OCR' src/` empty
- No bibliographic metadata extraction — assert: `grep -r 'metadata.*extract\|title.*author\|bibliographic' src/` empty
- No collections / tags / search query / Elasticsearch indexing — assert: `grep -rE '\b(collection|collections|document-workspace|library-table)\b|\bsearch-query\b|\bindex.*library-index\b' src/ frontend/src/` empty (word-boundary; avoids ArrayList/HTML-tag false positives)
- No PDF viewer / rendering — assert: `grep -rE '\b(render|renderer|pdf-viewer|page.*image)\b' src/` empty
- No GROBID / embeddings / vector / RAG / LLM — assert: `grep -rE '\bgrobid\b|\bembedding(s)?\b|\bvector(-search|store)?\b|\brag\b|\bllm\b' src/ frontend/src/ pom.xml` empty (word-boundary; `storage_path`/`Storage` are permitted W2 terms, not RAG hits)
- No auth framework — assert: `grep -v '^#' pom.xml | grep -iE '\b(security|quarkus-oidc|quarkus-elytron-jwt|smallrye-jwt|oauth2?)\b' | grep -v 'quarkus-arc\|quarkus-rest'` empty (avoids Quarkus-base false positives)
- No source edit without `.omo/evidence/task-<wave>-phase1.md` evidence file — assert: `ls .omo/evidence/task-*phase1.md | wc -l` ≥ 5
- Storage abstraction opacity (Confluence #8 / criterion #8, #22) — assert: `grep -r 'FilesystemStorage\|ZfsStorage\|target/storage\|~/.thebes/storage' src/main/java/com/nickrobison/tpl/service/ src/main/java/com/nickrobison/tpl/workflow/ src/main/java/com/nickrobison/tpl/resource/ src/main/java/com/nickrobison/tpl/import/` empty (only `Storage` interface + opaque ref cross the boundary; impls live in `storage/` package only)
- No claim Phase 1 complete until ALL 5 waves pass `mvnw verify` + health checks + F1-F4

## Verification strategy
> Zero human intervention — all verification agent-executed.
- Test decision: tests-after (user-selected Q3). Integration tests (`*IT.java`) per component (validation, upload, publication, bulk import); unit tests (`*Test.java`) for PdfValidator, Blake3Checksum.
- Evidence artifacts (required): `.omo/evidence/task-W1-phase1.md` through `.omo/evidence/task-W5-phase1.md` (one per wave); `.omo/evidence/task-F1-phase1.md` (plan audit); `.omo/evidence/task-F2-phase1.md` (no business assumption); `.omo/evidence/task-F3-phase1.md` (manual health/import QA); `.omo/evidence/task-F4-phase1.md` (scope fidelity: deferred list unchanged); `.omo/evidence/task-security-v1.md` (v1 doc quoted); `.omo/evidence/task-14point-gate.md` (Phase 1 → file mapping).
- Agent-executable assertions (each wave):
  W1: `mvnw verify` exits 0; `PdfBoxValidator` validates valid PDF, rejects invalid; `Blake3Checksum` calculates/verifies streamingly
  W2: `POST /api/v1/upload` returns `importId`; temp input stored; workflow job `IMPORT_SINGLE` created in PG
  W3: `ArtifactPublicationService.publish()` writes to Storage, verifies BLAKE3, transitions Artifact to AVAILABLE; retry/restart works
  W4: `BulkImportService.importDirectory()` processes recursive dir, ignores symlinks, creates parent+child workflow jobs, continues on failure
  W5: `mvnw verify` passes; health endpoint includes import metrics; F1-F4 evidence files PASS
- Failure QA scenario (per wave): if any assertion fails, `.omo/evidence/task-W<N>-phase1-FAIL.md` records which assertion failed; exact command output; missing file/class; proposed fix path. Fix recorded; wave does NOT advance until evidence shows PASS.

## Execution strategy
### Parallel execution waves (5 waves — file-level spec)
W1 — PDF Validation + BLAKE3 Checksum (independent; foundation for W2-W4): PdfValidator + PdfBoxValidator + Blake3Checksum + unit tests; `mvnw verify` passes; `.omo/evidence/task-W1-phase1.md` created.
W2 — Web Upload + Temporary Input (depends on W1: validation + checksum): TempInput + FilesystemTempInput + UploadResource + ImportWorkflow (IMPORT_SINGLE); async upload returns importId; `.omo/evidence/task-W2-phase1.md` created.
W3 — Artifact Publication + Storage (depends on W1-W2: validation+checksum+temp input): Artifact model enhanced + ArtifactPublicationService + ImportWorkflow enhanced (retry/restart); pending→available transition with BLAKE3 verify; `.omo/evidence/task-W3-phase1.md` created.
W4 — Local-Directory Bulk Import (depends on W2-W3: upload+publication workflow): BulkImportService + BulkImportWorkflow + ImportOperation; parent+child jobs; aggregate status; `.omo/evidence/task-W4-phase1.md` created.
W5 — Observability + Final Verification (depends on W1-W4): metrics + CI + F1-F4 evidence; `.omo/evidence/task-W5-phase1.md` records gate-completion decision.
> Fewer than 3 todos = under-split; 5 waves meets 5-8 requirement; each wave produces `.omo/evidence/task-W<N>-phase1.md` (agent-executed verification); `tests-after` framework applied.

### Dependency matrix (file-level)
| File / Artifact | Created / Modified | Depends on file | Blocks file | Can parallelize with file |
| --- | --- | --- | --- | --- |
| `pom.xml` (deps: pdfbox, blake3) | W1 | — | `PdfBoxValidator.java`, `Blake3Checksum.java` | — |
| `PdfValidator.java` + `PdfBoxValidator.java` | W1 | `pom.xml` | `ImportWorkflow.java` (validation stage) | `Blake3Checksum.java` |
| `Blake3Checksum.java` | W1 | `pom.xml` | `ImportWorkflow.java`, `ArtifactPublicationService.java` | `PdfBoxValidator.java` |
| `TempInput.java` + `FilesystemTempInput.java` | W2 | — | `UploadResource.java` | `PdfValidator.java` |
| `UploadResource.java` | W2 | `TempInput.java` | `ImportWorkflow.java` (IMPORT_SINGLE) | `ArtifactPublicationService.java` |
| `FailedItemsResource.java` | W2 | `ImportWorkflow.java` (job rows) | F1-F4 (criterion #18 proof) | `UploadResource.java` |
| `ImportWorkflow.java` (IMPORT_SINGLE) | W2 | `PdfValidator.java`, `TempInput.java`; REUSES Phase 0 `Document.java` (no new file) | `ArtifactPublicationService.java` | `BulkImportWorkflow.java` |
| `Artifact.java` (enhanced) | W3 | Phase 0 `V1__init.sql` tables (assumed — documents, artifacts, workflow_jobs exist; Phase 1 adds columns via Flyway `V3__artifact_state.sql` if needed) | `ArtifactPublicationService.java` | `ImportWorkflow.java` |
| `ArtifactPublicationService.java` | W3 | `Artifact.java`, `Storage.java`, `Blake3Checksum.java` | `ImportWorkflow.java` (publication stage) | `BulkImportWorkflow.java` |
| `ImportWorkflow.java` (enhanced retry/restart) | W3 | `ImportWorkflow.java` (W2), `ArtifactPublicationService.java` | `BulkImportWorkflow.java` | — |
| `BulkImportService.java` + `BulkImportWorkflow.java` | W4 | `ImportWorkflow.java`, `ImportOperation.java` | — | — |
| `ImportOperation.java` | W4 | Phase 0 `V1__init.sql` tables assumed (new `import_operations` table via `V4__import_ops.sql`; documents/artifacts/workflow_jobs pre-exist) | `BulkImportService.java` | — |
| `application.properties` (metrics) | W5 | W1-W4 | `.github/workflows/ci.yml` | — |
| `.github/workflows/ci.yml` | W5 | W1-W4 artifacts | F1-F4 final verification | — |

## Todos
> Implementation + verification = ONE todo. Each references exact file path; agent-executable assertions include exact command + expected output; evidence `.omo/evidence/task-W<N>-phase1.md`; commit `feat(<scope>): <message>`.

- [x] T-W1. W1 — PDF Validation + BLAKE3 Checksum
  What to do / Must NOT do: Create/update: `pom.xml` (add `pdfbox`, `blake3`); `PdfValidator.java` interface; `PdfBoxValidator.java` implementation (PDFBox structural validation); `Blake3Checksum.java` streaming calculator; unit tests. Must NOT extract text/OCR; must NOT do bibliographic metadata.
  Parallelization: Wave W1 | Blocked by: — | Blocks: W2 (validation+checksum); W3 (publication); W4 (bulk import)
  References (file-level, agent-executable): `pom.xml` (new deps); `PdfValidator.java`; `PdfBoxValidator.java`; `Blake3Checksum.java`; Confluence Phase 1 decisions #3 (structural validation), #7 (BLAKE3), #15 (structured validation failures)
  Acceptance criteria (agent-executable): (a) `cat src/main/java/com/nickrobison/tpl/validation/PdfValidator.java | grep -q 'isValid\|validate'` passes; (b) `PdfBoxValidator` validates test PDF; rejects invalid/corrupt; (c) `Blake3Checksum` calculates known-hash PDF correctly; streaming (no full buffer); (d) `mvnw verify` exits 0; (e) `.omo/evidence/task-W1-phase1.md` exists with PASS + exact outputs; (f) `grep -r 'getText\|extractText\|OCR' src/` empty (no text extraction)
  QA scenarios: happy = valid PDF → validation PASS + correct BLAKE3; failure = corrupt PDF → validation FAIL with structured code/message; `.omo/evidence/task-W1-phase1-FAIL.md` records exact failure
  Commit: `feat(validation-checksum): PDF structural validation + BLAKE3 streaming`

- [x] T-W2. W2 — Web Upload + Temporary Input
  What to do / Must NOT do: Create `TempInput.java` + `FilesystemTempInput.java`; `UploadResource.java` (POST /api/v1/upload multipart); `ImportWorkflow.java` with `IMPORT_SINGLE` job type (payload: tempInputRef, originalFilename); `FailedItemsResource.java` (GET /api/v1/imports, GET /api/v1/failed-items — import history + failed-items view; failures visible, never as library Documents); workflow: validation → REUSE Phase 0 `src/main/java/com/nickrobison/tpl/model/Document.java` (existing PanacheEntity, NO new Document file — one row per successful import) + new pending Artifact → storage → verify → available. Must NOT keep HTTP request open for full ingestion. Must NOT create Document/Artifact on validation failure (decision #2 gate: invalid input → durable failure record only).
  Parallelization: Wave W2 | Blocked by: W1 (PdfValidator, Blake3Checksum) | Blocks: W3 (publication); W4 (bulk import)
  References: `TempInput.java`; `FilesystemTempInput.java`; `UploadResource.java`; `FailedItemsResource.java`; `ImportWorkflow.java`; REUSED Phase 0 `src/main/java/com/nickrobison/tpl/model/Document.java` (existing — asserts one row per successful import, no new file); Confluence Phase 1 decisions #2 (validation gate: no Document/Artifact on invalid input), #4 (async upload), #5 (temp input abstraction), #8 (storage opaque), #12 (provenance), #13 (original filename), #17 (failed-items view, criterion #18)
  Acceptance criteria: (a) `curl -F 'file=@test.pdf' /api/v1/upload` returns `importId` immediately; (b) temp input stored in `target/temp-input/`; (c) `IMPORT_SINGLE` workflow job created in PG with status PENDING; (c2) successful import creates EXACTLY ONE new Document row + ONE new Artifact row (criterion #2; assert `SELECT count(*) FROM documents` +1 and `SELECT count(*) FROM artifacts` +1 per import, no dedup even on identical checksum); (c3) invalid PDF → NO new Document/Artifact row (assert counts unchanged) + durable failure record + visible via `GET /api/v1/failed-items`; (d) `mvnw verify` exits 0; (e) `.omo/evidence/task-W2-phase1.md` PASS
  QA scenarios: happy = upload → importId → workflow started; failure = invalid file → 400 with structured error; `.omo/evidence/task-W2-phase1-FAIL.md` records
  Commit: `feat(upload-temp): async web upload + temporary input abstraction`

- [x] T-W3. W3 — Artifact Publication + Storage
  What to do / Must NOT do: Enhance `Artifact.java` (add `ArtifactState` enum PENDING/AVAILABLE/FAILED, `physicalMetadataJson` with REQUIRED keys: size, mimeType, blake3, storageRef, pdfVersion, pageCount, encrypted, ingestionTimestamp, sourceFsTimestamps(where available), originalFilename; plus `importProvenanceJson` {mechanism: WEB_UPLOAD|LOCAL_DIRECTORY, sourcePath?, importOperationId, timestamps}); `ArtifactPublicationService.java` (publish: write to Storage via interface ONLY, verify BLAKE3, transition to AVAILABLE); enhance `ImportWorkflow.java` with stage-level retry + full restart + restart-recovery (kill-mid-import → resume from durable stage, never expose partial AVAILABLE). Must NOT expose partial artifact as available. Must NOT import storage impls into service/workflow/resource layers (opacity assertion).
  Parallelization: Wave W3 | Blocked by: W1 (checksum), W2 (IMPORT_SINGLE, temp input) | Blocks: W4 (bulk import uses publication)
  References: `Artifact.java`; `ArtifactPublicationService.java`; `ImportWorkflow.java`; `Storage.java` (Phase 0 interface ONLY); Confluence Phase 1 decisions #6 (pending/available), #7 (BLAKE3 verify), #8 (opacity), #14 (physical metadata), #16 (retry semantics), #17 (failed imports not library items); criteria #6, #7, #8, #16, #19, #20 (restart-recovery), #22 (both Phase 0 backends)
  Acceptance criteria: (a) `ArtifactPublicationService.publish()` writes to Storage, verifies BLAKE3, sets AVAILABLE; (a2) required `physicalMetadataJson` keys present (size, mimeType, blake3, storageRef, pdfVersion, pageCount, encrypted, ingestionTimestamp); (b) checksum mismatch → FAILED state; (c) storage failure → retry at stage; (d) full restart re-runs validation+storage; (d2) RESTART-RECOVERY: kill app mid-import → restart → operation resumes from durable stage (assert job row still PENDING/RUNNING, no AVAILABLE partial); (d3) opacity: `grep -r 'FilesystemStorage\|ZfsStorage' src/main/java/com/nickrobison/tpl/service/ src/main/java/com/nickrobison/tpl/workflow/ src/main/java/com/nickrobison/tpl/resource/ src/main/java/com/nickrobison/tpl/import/` empty; (e) `mvnw verify` exits 0; (f) `.omo/evidence/task-W3-phase1.md` PASS
  QA scenarios: happy = workflow → AVAILABLE artifact with verified checksum + required metadata keys; failure = checksum mismatch → FAILED + retry; restart-kill → resume, no partial AVAILABLE; `.omo/evidence/task-W3-phase1-FAIL.md` records
  Commit: `feat(artifact-publication): artifact pending→available + BLAKE3 verify + retry`

- [x] T-W4. W4 — Local-Directory Bulk Import
  What to do / Must NOT do: `BulkImportService.java` (importDirectory recursive, ignores symlinks, `.pdf` filter); `BulkImportWorkflow.java` parent `IMPORT_BULK` with child `IMPORT_SINGLE` jobs; `ImportOperation.java` entity for provenance. Must NOT modify source directory; must NOT stop on individual failure.
  Parallelization: Wave W4 | Blocked by: W2 (upload workflow), W3 (publication) | Blocks: W5 (final)
  References: `BulkImportService.java`; `BulkImportWorkflow.java`; `ImportOperation.java`; Confluence Phase 1 decisions #9 (parent operation), #10 (read-only source), #11 (recursive/symlinks), #12 (provenance), #13 (original filename), #14 (physical metadata)
  Acceptance criteria: (a) `BulkImportService.importDirectory(dir, true)` processes all `.pdf` files recursively; (b) symlinks ignored; (c) parent workflow job + child jobs created in PG; (d) individual failure doesn't stop others; (e) aggregate status + per-file results; (f) source dir unmodified; (g) `mvnw verify` exits 0; (h) `.omo/evidence/task-W4-phase1.md` PASS
  QA scenarios: happy = mixed valid/invalid → parent COMPLETED, children SUCCESS/FAILED; failure = corrupt PDF → child FAILED, others continue; `.omo/evidence/task-W4-phase1-FAIL.md` records
  Commit: `feat(bulk-import): local-directory read-only import + parent/child workflow`

- [x] T-W5. W5 — Observability + Final Verification
  What to do / Must NOT do: `application.properties` (import metrics: duration, validation time, storage time, failure rates; Phase 0 JSON logging + OTel retained; NO new auth); extend `GreetingResource.java` /health payload with `imports: {pending, failed}` counts (readiness signal for import subsystem, criterion #21); OTel span attributes on import stages (upload→validate→store→verify); `.github/workflows/ci.yml` (add Phase 1 IT tests); `.omo/evidence/security-v1.md` (Phase 1 v1 assumptions); `.omo/evidence/task-14point-gate.md` (Phase 1 mappings incl. criterion #22 both backends); F1-F4 evidence. Must NOT add auth framework.
  Parallelization: Wave W5 | Blocked by: W1-W4 | Blocks: —
  References: Confluence Phase 1 acceptance criteria #1-22; Phase 0 `.omo/evidence/task-security-v1.md`; Phase 1 `.omo/evidence/task-*phase1.md`
  Acceptance criteria: (a) F1 = plan header order + file-level spec intact; (b) F2 = no business assumption without evidence; (c) F3 = `curl /health` 200 (incl. `imports` counts); `POST /api/v1/upload` → import → Artifact AVAILABLE; `GET /api/v1/failed-items` lists failures; bulk import dir → artifacts created; `mvnw verify` exits 0; (c2) BOTH Phase 0 backends honored (criterion #22: run publication path against FilesystemStorage AND ZfsStorage stub via Storage interface — assert no impl import in service/workflow/resource layers); (d) F4 = deferred list unchanged: `grep -rE '\b(deduplicate|duplicate.*checksum)\b' src/` empty; `grep -rE '\b(getText|extractText|OCR)\b' src/` empty; `grep -rE '\b(bibliographic|metadata.*extract)\b' src/` empty; narrowed collection/tag/search guardrail PASS; `grep -rE '\bgrobid\b|\bembedding(s)?\b|\bvector(-search|store)?\b|\brag\b|\bllm\b' src/ frontend/src/ pom.xml` empty; opacity assertion PASS; (e) `.omo/evidence/task-14point-gate.md` final line = `Phase 1 complete`
  QA scenarios: happy = all F1-F4 PASS + full import flow works; failure = any F1-F4 FAIL → `.omo/evidence/task-W5-phase1-FAIL.md` records which
  Commit: `feat(phase1-gate): complete Phase 1 ingestion — gate verified`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit
- [x] F2. Code quality review
- [x] F3. Real manual QA
- [x] F4. Scope fidelity

## Commit strategy
No commits for planning phase (plan-only artifacts `.omo/`). Execution waves commit: W1 `feat(validation-checksum): ...`; W2 `feat(upload-temp): ...`; W3 `feat(artifact-publication): ...`; W4 `feat(bulk-import): ...`; W5 `feat(phase1-gate): ...` (only if F1-F4 + gate verified). Merge: feature branch per wave; squash-merge on approval; CI (`.github/workflows/ci.yml`) must pass (`mvnw verify` + health checks) before merge. No `feat(phase1): complete` until `.omo/evidence/task-14point-gate.md` records complete + F1-F4 PASS + deferred list unchanged.

## Success criteria
Agent-executable final state (verified by F1-F4 evidence files only — no human judgment required):
1. `.omo/plans/phase1.md` complete (all headers; file-level spec; no placeholder text; `TL;DR` filled with user decisions; Scope IN/OUT filled; 5 waves specified; dependency matrix filled; 5 todos [W1-W5] with References + Acceptance + QA + Evidence + Commit; Final verification F1-F4 defined; Commit strategy written; Success criteria written).
2. `PdfValidator.java` + `PdfBoxValidator.java` exist (structural PDF validation, no page renderability).
3. `Blake3Checksum.java` exists (streaming calculate + verify).
4. `TempInput.java` + `FilesystemTempInput.java` exist (temporary-input abstraction).
5. `UploadResource.java` exists (POST /api/v1/upload async, returns importId).
6. `ImportWorkflow.java` exists (IMPORT_SINGLE + IMPORT_BULK, stage retry + full restart).
7. `Artifact.java` enhanced (ArtifactState enum, physicalMetadataJson, importProvenanceJson, originalFilename).
8. `ArtifactPublicationService.java` exists (publish → Storage → BLAKE3 verify → AVAILABLE).
9. `BulkImportService.java` + `BulkImportWorkflow.java` + `ImportOperation.java` exist (parent/child jobs, read-only source, symlinks ignored, recursive default, aggregate status).
10. `application.properties` has import metrics; `.github/workflows/ci.yml` has Phase 1 IT tests.
11. `.omo/evidence/task-security-v1.md` quotes Phase 1 v1 assumptions; no auth framework inserted.
12. `.omo/evidence/task-14point-gate.md` has Phase 1 rows mapped; final line = `complete` ONLY when W1-W5 PASS + F1-F4 PASS + deferred list unchanged.
13. Zero deferred-item insertion: `grep -rE '\b(deduplicate|duplicate.*checksum)\b' src/` empty; `grep -rE '\b(getText|extractText|OCR)\b' src/` empty; `grep -rE '\bbibliographic\b' src/` empty; narrowed collection/tag/search guardrail PASS; `grep -rE '\bgrobid\b|\bembedding(s)?\b|\bvector(-search|store)?\b|\brag\b|\bllm\b' src/ frontend/src/ pom.xml` empty; opacity assertion PASS (no impl imports outside `storage/`); `pom.xml` same re auth; `.omo/plans/phase1.md` Must NOT have unchanged.
14. All evidence artifacts exist: `.omo/evidence/task-W1-phase1.md` through `W5-phase1.md`; `.omo/evidence/task-F1-phase1.md` through `F4-phase1.md`; `.omo/evidence/task-security-v1.md`; `.omo/evidence/task-14point-gate.md`; no `FAIL.md` unaddressed.
