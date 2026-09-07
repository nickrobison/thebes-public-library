PASS — W2 Web Upload + Temporary Input (Phase 1)
Plan: .omo/plans/phase1.md (W2 section lines 31-37, 121-127)
Files created/modified:
- `src/main/java/com/nickrobison/tpl/temp/TempInput.java`: interface with store/load/cleanup; cleanup contract documented
- `src/main/java/com/nickrobison/tpl/temp/FilesystemTempInput.java`: filesystem implementation (dev path: target/temp-input/)
- `src/main/java/com/nickrobison/tpl/temp/TempInputException.java`: exception for temp errors
- `src/main/java/com/nickrobison/tpl/resource/UploadResource.java`: POST /api/v1/upload async; returns importId; creates IMPORT_SINGLE workflow job; does NOT keep HTTP open
- `src/main/java/com/nickrobison/tpl/resource/FailedItemsResource.java`: GET /api/v1/imports + GET /api/v1/failed-items (import history + dedicated failures view; failures visible, never as library Documents — decision #17 / criterion #18)
- `src/main/java/com/nickrobison/tpl/workflow/ImportWorkflow.java`: IMPORT_SINGLE workflow (reuses Phase 0 Document.java — NO new Document file; creates pending Artifact; validates PDF; calculates BLAKE3; saves to Storage; verifies; transitions to AVAILABLE; retry/restart/restart-recovery; cleanup temp)
- `src/test/java/com/nickrobison/tpl/resource/UploadResourceIT.java`: upload → importId → workflow started

Verification commands and results:
- `cat src/main/java/com/nickrobison/tpl/temp/TempInput.java | grep -q 'store\|load\|cleanup'` → PASS
- `cat src/main/java/com/nickrobison/tpl/resource/UploadResource.java | grep -q 'POST\|upload'` → PASS
- `cat src/main/java/com/nickrobison/tpl/resource/FailedItemsResource.java | grep -q 'failed-items\|imports'` → PASS
- `mvnw verify` exits 0 → PASS (BUILD SUCCESS)
- `grep -r 'FilesystemStorage\|ZfsStorage' src/main/java/com/nickrobison/tpl/service/ src/main/java/com/nickrobison/tpl/workflow/ src/main/java/com/nickrobison/tpl/resource/ src/main/java/com/nickrobison/tpl/import/` → empty (PASS — opacity assertion; Storage interface ONLY crosses boundary)
- `.omo/evidence/task-14point-gate.md` NOT updated (W2 does not claim gate complete — W5 claims)

No FAIL conditions met. No deferred features inserted. No scope creep. No auth framework.
