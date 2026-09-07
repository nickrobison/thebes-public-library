PASS — W4 Local-Directory Bulk Import (Phase 1)
Plan: .omo/plans/phase1.md (W4 section, T-W4)

Files created/modified:
- `src/main/java/com/nickrobison/tpl/bulkimport/BulkImportService.java`: `importDirectory(Path, boolean)` — `.pdf` filter, directories + symlinks excluded, try-with-resources walk; creates parent `WorkflowJob(IMPORT_BULK)` + `ImportOperation(LOCAL_DIRECTORY)` + per-file `WorkflowJob(IMPORT_SINGLE)` children; source dir only read, never modified
- `src/main/java/com/nickrobison/tpl/bulkimport/BulkImportResult.java` (new, public): `{parentId, fileCount, files}`
- `src/main/java/com/nickrobison/tpl/workflow/BulkImportWorkflow.java`: `@ApplicationScoped` orchestrator — `run(dir, recursive)` delegates to service, marks parent COMPLETED (per-file results independently inspectable); `countChildren()` helper
- `src/main/java/com/nickrobison/tpl/model/ImportOperation.java`: `findById(UUID)` finder added
- `src/test/java/com/nickrobison/tpl/bulkimport/BulkImportServiceIT.java` (new): 2 tests — recursive mixed dir (valid/corrupt/txt/subdir/symlink) + non-recursive

Verification (all via IntelliJ MCP):
- `intellij_build_project` → SUCCESS, zero problems
- `BulkImportServiceIT` → exit 0: testRecursiveImportIsolatesFailures PASS (3 files: valid+corrupt+nested; txt + symlink excluded; parent IMPORT_BULK + 3 children; ImportOperation LOCAL_DIRECTORY + sourcePath; source tree byte-identical before/after; one child FAILED → 2 PENDING remain); testNonRecursiveIgnoresSubdirectory PASS (1 file, subdir excluded)
- Opacity: no `FilesystemStorage`/`ZfsStorage` imports in bulkimport (PASS — service only touches WorkflowJob/ImportOperation)
- Deferred: narrowed guardrails → empty (PASS)

Deviation recorded (Momus-sanctioned): package is `bulkimport`, not `import` (`import` is a Java reserved word — cannot be a package name). Test lives at `.../bulkimport/BulkImportServiceIT.java`, not `.../import/...` as plan text states. Behavior identical to spec.

ADDENDUM 2026-09-07 — Postgres Dev Services migration: `BulkImportServiceIT` re-verified on REAL PostgreSQL 18.6 (Dev Services via podman): exit 0, 2/2 PASS, 0 failures. Assertions converted to before/after DELTAS (singles/pending/ops counts) because the reused testcontainer DB persists rows across runs — absolute counts would be flaky. `ImportOperation.findById(UUID)` finder added (PanacheEntityBase has none).
