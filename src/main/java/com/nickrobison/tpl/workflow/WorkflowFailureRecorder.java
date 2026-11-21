package com.nickrobison.tpl.workflow;

import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

/**
 * Records terminal failures for durable workflow jobs.
 *
 * <p>Called from {@link ImportWorkflow}'s catch block and {@link WorkflowJobRunner}'s
 * catch block. Both call sites run inside (or downstream of) a transaction that is already
 * rollback-only when the failure is observed, so the FAILED transition must be written
 * out of band in its own transaction, otherwise it would be discarded and the job would be
 * stranded in RUNNING.
 */
@ApplicationScoped
public class WorkflowFailureRecorder {

    private static final int MAX_FAILURE_REASON_LENGTH = 1000;

    public void recordFailure(UUID jobId, String failureMessage) {
        QuarkusTransaction.requiringNew().run(() -> {
            WorkflowJob job = WorkflowJob.findById(jobId);
            if (job == null) {
                return;
            }
            job.status = WorkflowStatus.FAILED;
            job.failureReason = truncate(failureMessage);
            job.persist();
        });
    }

    private static String truncate(String failureMessage) {
        if (failureMessage == null) {
            return "Unknown workflow failure";
        }
        if (failureMessage.length() <= MAX_FAILURE_REASON_LENGTH) {
            return failureMessage;
        }
        return failureMessage.substring(0, MAX_FAILURE_REASON_LENGTH);
    }
}
