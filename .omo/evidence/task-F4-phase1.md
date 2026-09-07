PASS — F4 Scope fidelity (Phase 1)
Deferred list (Confluence Explicit non-goals) verified absent from src/, frontend/src/, pom.xml:
- dedup (`\b(deduplicate|duplicate.*checksum)\b`) → empty. Checksum is integrity-only.
- text/OCR (`\b(getText|extractText|OCR)\b`) → empty. PdfBoxValidator checks %PDF header + %%EOF only.
- bibliographic (`\bbibliographic\b`) → empty.
- viewer (`\b(render|renderer|pdf-viewer|page.*image)\b`) → empty.
- grobid/embeddings/vector/RAG/LLM (word-boundary) → empty.
- collections/tags/search pattern: 3 hits, ALL ruled out — (1) `LibraryIndex.java` comment "Creates initial empty index `library-index`" is the Phase 0 ES-index stub, not a search-query feature; (2-3) `Dockerfile.jvm` + `Dockerfile.legacy-jar` `# - GC_TIME_RATIO` comments are pre-existing Phase 0 JVM tuning notes. No `search-query`/`library-table`/`document-workspace` code anywhere.
- auth (narrowed security/oidc/jwt/oauth, minus quarkus-arc/rest) → empty.
- opacity: no `FilesystemStorage`/`ZfsStorage` imports in service/workflow/resource/bulkimport → empty.
- `git diff --stat` shows only W1-W5 additions (validation, checksum, temp, resource, service, workflow, bulkimport, metrics, model/migration/test-infra, ci.yml, evidence, plan).
- Must NOT have section of phase1.md unchanged in intent; patterns narrowed per Momus with false-positive documentation (this file).
