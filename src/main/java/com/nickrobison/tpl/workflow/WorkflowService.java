package com.nickrobison.tpl.workflow;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.util.UUID;

@ApplicationScoped
public class WorkflowService {

    @Transactional
    public void submit(WorkflowJob job) {
        job.persist();
    }

    @Transactional
    public WorkflowJob getStatus(UUID id) {
        return WorkflowJob.findById(id);
    }

    @Transactional
    public void retry(UUID id) {
        WorkflowJob job = WorkflowJob.findById(id);
        if (job != null) {
            job.status = WorkflowStatus.PENDING;
            job.completedAt = null;
            job.failureReason = null;
            job.retryCount = 0;
            job.persist();
        }
    }
}
