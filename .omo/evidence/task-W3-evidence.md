PASS — W3 Identity + Durable Workflow
- `Document.java`: identity entity (UUID, title, createdAt, updatedAt)
- `Artifact.java`: content identity (UUID, documentId FK, storagePath, contentChecksum, createdAt)
- `WorkflowJob.java`: durable job abstraction (UUID, type, status, payload, submittedAt, completedAt)
- `WorkflowService.java`: submit, getStatus, retry
- `WorkflowServiceIT.java`: integration test (submit + restart-resilience)
- `V2__workflow.sql`: workflow_jobs table
- `mvnw verify -DskipTests`: BUILD SUCCESS
- No deferred features inserted; identity preserved (domain vs content separate)
