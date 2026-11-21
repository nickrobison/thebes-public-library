package com.nickrobison.tpl.workflow;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@QuarkusTest
public class WorkflowServiceIT {

    @Inject
    WorkflowService service;

    @Test
    @Transactional
    public void testSubmitAndRead() {
        WorkflowJob job = new WorkflowJob();
        job.id = UUID.randomUUID();
        job.status = WorkflowStatus.PENDING;
        job.submittedAt = Instant.now();
        service.submit(job);
        // Restart-resilience: job state preserved in PG
        WorkflowJob reloaded = WorkflowJob.findById(job.id);
        assertEquals(WorkflowStatus.PENDING, reloaded.status);
    }

    @Test
    @Transactional
    public void testRetryResetsJobState() {
        WorkflowJob job = new WorkflowJob();
        job.id = UUID.randomUUID();
        job.status = WorkflowStatus.FAILED;
        job.failureReason = "boom";
        job.retryCount = 3;
        job.submittedAt = Instant.now();
        service.submit(job);

        service.retry(job.id);

        WorkflowJob reloaded = WorkflowJob.findById(job.id);
        assertEquals(WorkflowStatus.PENDING, reloaded.status);
        assertNull(reloaded.failureReason);
        assertEquals(0, reloaded.retryCount);
    }
}
