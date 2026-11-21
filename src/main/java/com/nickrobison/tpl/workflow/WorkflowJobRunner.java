package com.nickrobison.tpl.workflow;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.UUID;

/**
 * Claims a single queued job and runs it.
 *
 * <p>Separate bean from {@link WorkflowWorker} on purpose: the claim and the work run
 * in two independent transactions, and splitting them across beans is what makes the
 * CDI proxies apply (a self-invocation inside one bean would bypass
 * {@code @Transactional} entirely).
 */
@ApplicationScoped
public class WorkflowJobRunner {

    private static final Logger LOG = Logger.getLogger(WorkflowJobRunner.class);

    private final ImportWorkflow importWorkflow;
    private final WorkflowFailureRecorder failureRecorder;

    public WorkflowJobRunner(ImportWorkflow importWorkflow, WorkflowFailureRecorder failureRecorder) {
        this.importWorkflow = importWorkflow;
        this.failureRecorder = failureRecorder;
    }

    /** Moves the job out of the queue. Returns false if another worker won the race. */
    @Transactional
    public boolean claim(UUID jobId) {
        WorkflowJob job = WorkflowJob.findById(jobId);
        if (job == null || job.status != WorkflowStatus.PENDING) {
            return false;
        }
        // A new claim starts with a clean slate.
        job.retryCount = 0;
        job.failureReason = null;
        job.status = WorkflowStatus.RUNNING;
        job.persist();
        return true;
    }

    /**
     * Executes the job. Never throws: any failure is recorded on the job so the row
     * leaves the queue instead of being stranded in RUNNING.
     */
    public void run(UUID jobId) {
        try {
            importWorkflow.process(jobId);
        } catch (Throwable t) {
            LOG.errorf(t, "Workflow job %s failed outside its own error handling", jobId);
            failureRecorder.recordFailure(jobId, String.valueOf(t.getMessage()));
        }
    }
}
