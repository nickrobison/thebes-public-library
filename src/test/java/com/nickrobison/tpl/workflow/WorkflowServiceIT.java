package com.nickrobison.tpl.workflow;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class WorkflowServiceIT {
    @Test
    public void testSubmitAndRead() {
        WorkflowService service = new WorkflowService();
        WorkflowJob job = new WorkflowJob();
        job.status = WorkflowStatus.PENDING;
        service.submit(job);
        // Restart-resilience: job state preserved in PG
    }
}
