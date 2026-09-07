14-Point Gate Mapping (Phase 0 complete — all 14 points verified)
#1 Quarkus backend → GreetingResource.java
#2 React/Vite frontend → frontend/src/App.tsx
#3 REST/JSON → GreetingResource.java
#4 PG → application.properties + V1__init.sql
#5 ES → LibraryIndex.java
#6 Migration mechanism → pom.xml flyway + V1__init.sql
#7 Document identity → Document.java
#8 Artifact identity → Artifact.java
#9 Storage abstraction → Storage.java + FilesystemStorage.java + ZfsStorage.java
#10 Durable workflow → WorkflowJob.java + WorkflowService.java
#11 REST/JSON — confirmed
#12 Structured logs/health/metrics/OTel → application.properties + /health + App.tsx
#13 Initial ES index → LibraryIndex.java
#14 Security boundary doc → .omo/evidence/task-security-v1.md
Phase 0 complete — all 14 points verified

---
# Phase 1 — 22-point acceptance gate → file mapping
Source: Confluence "Phase 1 Artifact Ingestion & Durable Storage" (decisions #1-17, criteria #1-22, non-goals).

| # | Acceptance criterion | File(s) | Evidence |
|---|---|---|---|
| 1 | Async web import, HTTP not held | `resource/UploadResource.java` (returns importId immediately) | task-W2-phase1.md |
| 2 | Exactly one Document + one Artifact per success, no dedup | `workflow/ImportWorkflow.java` (reuses Phase 0 `model/Document.java`); no-dedup guardrail | task-W2-phase1.md |
| 3 | Invalid PDFs rejected pre-durability | `validation/PdfBoxValidator.java` + decision-#2 gate in `ImportWorkflow` | task-W1/W2-phase1.md |
| 4 | Structural parseability, not renderability | `validation/PdfBoxValidator.java` (header + EOF) | task-W1-phase1.md |
| 5 | Temporary-input abstraction first | `temp/TempInput.java`, `temp/FilesystemTempInput.java` | task-W2-phase1.md |
| 6 | AVAILABLE only after stored + verified | `service/ArtifactPublicationService.java`, `model/ArtifactState.java` | task-W3-phase1.md |
| 7 | BLAKE3 canonical, distinct from identity/storage | `checksum/Blake3Checksum.java` (streaming interface) | task-W1/W3-phase1.md |
| 8 | Storage layout opaque | `storage/Storage.java` interface-only boundary; opacity assertion | task-W3-phase1.md |
| 9 | Bulk import read-only vs source | `bulkimport/BulkImportService.java` (walk + read only) | task-W4-phase1.md |
| 10 | Recursion configurable, default recursive | `importDirectory(Path, boolean)` + non-recursive test | task-W4-phase1.md |
| 11 | `.pdf` filter; validation authoritative | `.pdf` filter + `!isDirectory` + validation gate | task-W4-phase1.md |
| 12 | Symlinks ignored | `!isSymbolicLink` filter + symlink test case | task-W4-phase1.md |
| 13 | Per-file failure isolation | children independent; FAILED child → rest PENDING (test) | task-W4-phase1.md |
| 14 | Aggregate status + per-file results | `IMPORT_BULK` parent + `countChildren()` + `ImportOperation` | task-W4-phase1.md |
| 15 | Provenance + original filenames durable | `importProvenanceJson`, `originalFilename`, `model/ImportOperation.java` | task-W3/W4-phase1.md |
| 16 | Physical metadata retained | `physicalMetadataJson` REQUIRED keys enumerated + asserted | task-W3-phase1.md |
| 17 | Structured validation failures | `validation/PdfValidationResult.java` (code/message/details) | task-W1-phase1.md |
| 18 | Failed-items view, no library pollution | `resource/FailedItemsResource.java` (`/imports`, `/failed-items`) | task-W2-phase1.md |
| 19 | Stage retry + full restart | `ImportWorkflow` retryStage + `RESTART` + `ArtifactPublicationServiceIT` | task-W3-phase1.md |
| 20 | Restart does not lose op / no partial AVAILABLE | `WorkflowJob.currentStage` resume; no-AVAILABLE-partial tests | task-W3-phase1.md |
| 21 | Observability captures workflow | `/health` imports+metrics; `metrics/ImportMetrics.java`; CI IT step | task-W5-phase1.md |
| 22 | Works with both Phase 0 backends, boundary kept | `Storage` interface; opacity assertion; `FilesystemStorage` real impl (`ZfsStorage` stub unchanged) | task-W3/W5-phase1.md |

Phase 1 complete
