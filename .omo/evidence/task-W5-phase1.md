PASS — W5 Observability + Final Verification (Phase 1)
Plan: .omo/plans/phase1.md (W5 section, T-W5)

Files created/modified:
- `src/main/java/com/nickrobison/tpl/metrics/ImportMetrics.java` (new, `@ApplicationScoped`, dependency-free): counters `thebes.imports.accepted/completed/failed` + validation/storage timing totals+avgs + `snapshot()` map. Deviation recorded: NO quarkus-micrometer dependency — IntelliJ Maven model would not reimport it (stale classpath, build-breaking); JDK-atomics implementation is behaviorally equivalent for Phase 1 observability and swappable later.
- `src/main/java/com/nickrobison/tpl/resource/UploadResource.java`: `metrics.accepted()` on every accepted upload (CDI-injected ImportMetrics)
- `src/main/java/com/nickrobison/tpl/workflow/ImportWorkflow.java`: validation + storage stage timing via `metrics.start/stopValidation|Storage`; `metrics.completed()`/`failed()` on terminal states; `@ApplicationScoped` (+ restored `ApplicationScoped` import)
- `src/main/java/com/nickrobison/tpl/GreetingResource.java`: class `@Path("/")` with explicit `@Path("/hello|/health|/ready")` (FIX: methods were nested under `/hello`, so `/health` 404'd — HealthEndpointIT caught it); `/health` now returns `imports:{pending,failed}` (WorkflowJob counts, "unknown" on DB failure) + `metrics` snapshot (criterion #21)
- `.github/workflows/ci.yml`: `Integration tests (Phase 1, H2 test profile)` step (`./mvnw verify -DskipITs=false`; H2 needs no external PG)
- `src/test/java/com/nickrobison/tpl/HealthEndpointIT.java` (new): live-HTTP assertions — `/health` 200 + status ok + imports.pending/failed + metrics.accepted; `/ready` 200 + ok

Verification (all via IntelliJ MCP — per user instruction, no mvn CLI):
- `intellij_build_project` → SUCCESS, zero problems (final state)
- `HealthEndpointIT` → exit 0: 2/2 PASS (real HTTP against booted app, H2)
- `PdfValidatorTest` → exit 0: 4/4 PASS
- `Blake3ChecksumTest` → exit 0: 5/5 PASS
- `GreetingResourceTest` → exit 0: 1/1 PASS (`/hello` preserved after path fix)
- Earlier this session: `ArtifactPublicationServiceIT` 3/3 PASS, `BulkImportServiceIT` 2/2 PASS (evidence in W3/W4 files)
- F1-F4: all PASS (see task-F1..F4-phase1.md)
- `.omo/evidence/task-14point-gate.md` final line = `Phase 1 complete`

No FAIL conditions met. No auth framework. Deferred list unchanged (F4 false positives ruled out with reasons).
