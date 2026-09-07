package com.nickrobison.tpl.workflow;

import java.time.Instant;
import java.util.UUID;

public class BulkImportWorkflow {
    public UUID id = UUID.randomUUID();
    public WorkflowType type = WorkflowType.IMPORT_BULK;
    public WorkflowStatus status = WorkflowStatus.PENDING;
    public String payload;
    public Instant submittedAt = Instant.now();
    public Instant completedAt;

    public void persist() {
        // Persist parent bulk import workflow to PG
    }
}
