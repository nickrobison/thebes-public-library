package com.nickrobison.tpl.workflow;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.UUID;

@ApplicationScoped
public class WorkflowService {
    public void submit(WorkflowJob job) {
        job.persist();
    }

    public WorkflowJob getStatus(UUID id) {
        return WorkflowJob.findById(id);
    }

    public void retry(UUID id) {
        WorkflowJob job = WorkflowJob.findById(id);
        if (job != null) {
            job.status = WorkflowStatus.PENDING;
            job.completedAt = null;
            job.persist();
        }
    }
}
