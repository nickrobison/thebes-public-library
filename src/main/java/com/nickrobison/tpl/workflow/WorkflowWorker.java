package com.nickrobison.tpl.workflow;

import io.quarkus.scheduler.Scheduled;
import io.quarkus.scheduler.Scheduled.ConcurrentExecution;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.UUID;

/**
 * Drains the durable job queue.
 *
 * <p>Jobs are written by the REST layer and were previously never executed: nothing
 * referenced {@link ImportWorkflow}, so uploads stayed PENDING forever and no artifact
 * ever reached AVAILABLE. This poller hands queued jobs to {@link WorkflowJobRunner}.
 */
@ApplicationScoped
public class WorkflowWorker {

    private static final Logger LOG = Logger.getLogger(WorkflowWorker.class);
    private static final int BATCH_SIZE = 10;

    private final WorkflowJobRunner jobRunner;

    public WorkflowWorker(WorkflowJobRunner jobRunner) {
        this.jobRunner = jobRunner;
    }

    @Scheduled(
            every = "${thebes.workflow.poll-interval:2s}",
            concurrentExecution = ConcurrentExecution.SKIP,
            identity = "workflow-worker"
    )
    void poll() {
        for (UUID jobId : queuedJobIds()) {
            if (jobRunner.claim(jobId)) {
                LOG.debugf("claimed workflow job %s", jobId);
                jobRunner.run(jobId);
            }
        }
    }

    @Transactional
    List<UUID> queuedJobIds() {
        List<WorkflowJob> queued = WorkflowJob.find(
                        "status = ?1 order by submittedAt asc", WorkflowStatus.PENDING)
                .page(0, BATCH_SIZE)
                .list();
        return queued.stream().map(job -> job.id).toList();
    }
}
