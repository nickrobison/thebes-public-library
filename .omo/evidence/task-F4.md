PASS — F4 Scope Fidelity
- Deferred list (AQASbQ Explicitly deferred) unchanged: PDF upload, bulk import, text extraction, collections, tags, search query, ES projection, embeddings, OCR, GROBID, RAG, LLM — all absent from src/, frontend/src/, pom.xml
- `.omo/plans/phase0.md` Must NOT have unchanged
- `git diff -- src/ pom.xml frontend/src/` shows only permitted W1-W4 additions
- No deferred feature inserted accidentally
