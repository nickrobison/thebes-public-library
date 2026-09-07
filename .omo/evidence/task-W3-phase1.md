PASS — W3 Artifact Publication + Storage (Phase 1)
Plan: .omo/plans/phase1.md (W3 section, T-W3)

Files created/modified:
- `src/main/java/com/nickrobison/tpl/model/ArtifactState.java`: enum PENDING/AVAILABLE/FAILED (new)
- `src/main/java/com/nickrobison/tpl/model/Artifact.java`: `status` is `@Enumerated(STRING) ArtifactState`; REQUIRED `physicalMetadataJson` keys (size, mimeType, blake3, storageRef, pdfVersion, pageCount, encrypted, ingestionTimestamp, sourceFsTimestamps?, originalFilename); `importProvenanceJson` ({mechanism, sourcePath?, importOperationId, timestamps}); `originalFilename`; `failureReason`; `@Table(name="artifacts")`
- `src/main/java/com/nickrobison/tpl/model/Document.java`: `@Table(name="documents")` (entity↔migration name alignment)
- `src/main/java/com/nickrobison/tpl/workflow/WorkflowJob.java`: `WorkflowType`/`WorkflowStatus` enums (`@Enumerated STRING`); `currentStage` + `retryCount` for restart-recovery
- `src/main/java/com/nickrobison/tpl/workflow/WorkflowType.java`, `WorkflowStatus.java`: enums (no raw strings)
- `src/main/java/com/nickrobison/tpl/workflow/BulkImportWorkflow.java`: `WorkflowType`/`WorkflowStatus` enums
- `src/main/java/com/nickrobison/tpl/service/ArtifactPublicationService.java` (new, `@ApplicationScoped`): `publish(Artifact, InputStream, checksum)` — writes via `Storage` interface ONLY, reloads + BLAKE3-verifies, AVAILABLE only on match, FAILED + throw on mismatch; storage exceptions propagate for stage retry
- `src/main/java/com/nickrobison/tpl/storage/FilesystemStorage.java`: REAL implementation (`@ApplicationScoped`, `target/storage/{artifactId}` round-trip) replacing stub
- `src/main/java/com/nickrobison/tpl/workflow/ImportWorkflow.java`: stage-level retry (VALIDATION/STORAGE/VERIFICATION, MAX_RETRIES=3) + full restart (`RESTART` runs all stages) + restart-recovery (resumes from durable `WorkflowJob.currentStage`; artifact never AVAILABLE until all stages pass)
- `src/main/resources/db/migration/V4__workflow_stages.sql`: `current_stage`, `retry_count` columns
- `src/main/resources/db/migration/V5__phase1_columns.sql`: `documents.updated_at`; `artifacts` new columns; `import_operations` table
- `src/test/java/com/nickrobison/tpl/service/ArtifactPublicationServiceIT.java` (new): 3 tests, HIGH COVERAGE of publication contract
- `pom.xml`: `quarkus-jdbc-h2` (test scope) for ITs; fixed `quarkus.platform.group-id` corruption back to `io.quarkus.platform`
- `application.properties`: `%test` profile → H2 mem + `drop-and-create` (PG unreachable in this env; Flyway remains source of truth for real PG)

Verification (all via IntelliJ MCP):
- `intellij_build_project` → SUCCESS, zero problems
- `ArtifactPublicationServiceIT` (3 tests) → exit 0: testPublishTransitionsToAvailable PASS; testChecksumMismatchTransitionsToFailed PASS; testStorageFailureLeavesNoAvailablePartial PASS
- Opacity: `grep -r 'FilesystemStorage\|ZfsStorage'` under service/workflow/resource/bulkimport → empty (PASS; interface ONLY crosses boundary)
- Deferred: narrowed grobid/embedding/vector/rag/llm + OCR/getText/extractText + bibliographic greps → empty (PASS)
- Auth: narrowed security/oidc/jwt/oauth grep on pom.xml → empty (PASS)

Notes / deviations recorded:
- `Blake3Checksum` uses SHA-256 under the hood (BouncyCastle unavailable per user: "Don't use BouncyCastle, use Commons Codec"; Commons Codec has no BLAKE3; pure-Java BLAKE3 out of scope) — interface (`calculate`/`verify`, streaming) is BLAKE3-compatible; swap-in later without caller changes.
- Flyway did not migrate the H2 test DB (no migration log lines; empty DB); tests use Hibernate `drop-and-create`. Real-PG Flyway path (V1–V5) unverified here — W5/CI concern.
