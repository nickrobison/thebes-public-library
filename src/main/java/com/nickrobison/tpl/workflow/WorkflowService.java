package org.acme.workflow;

import java.util.UUID;

public class WorkflowService {
    public void submit(WorkflowJob job) {
        // Persists job to PG
    }

    public WorkflowJob getStatus(UUID id) {
        // Reads job status from PG
        return new WorkflowJob();
    }

    public void retry(UUID id) {
        // Resets status to PENDING
    }
}
