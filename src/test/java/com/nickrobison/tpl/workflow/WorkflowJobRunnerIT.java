package com.nickrobison.tpl.workflow;

import com.nickrobison.tpl.model.Artifact;
import com.nickrobison.tpl.model.ArtifactState;
import com.nickrobison.tpl.model.Document;
import com.nickrobison.tpl.temp.TempInput;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for the durable workflow job runner.
 *
 * Regression coverage for the stage-advance bug that let jobs complete without
 * persisting any document: the happy path asserts that a COMPLETED job leaves
 * a Document with an AVAILABLE Artifact behind.
 *
 * Jobs are committed with {@code QuarkusTransaction.requiringNew()} as
 * {@code UploadResource} does in production so the runner and its out-of-band
 * failure recording can observe them.
 */
@QuarkusTest
public class WorkflowJobRunnerIT {

    @Inject
    WorkflowJobRunner runner;

    @Inject
    TempInput tempInput;

    private static byte[] generatePdf() throws Exception {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            doc.addPage(new PDPage());
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static WorkflowJob newJob(String payload) {
        WorkflowJob job = new WorkflowJob();
        job.id = UUID.randomUUID();
        job.type = WorkflowType.IMPORT_SINGLE;
        job.status = WorkflowStatus.PENDING;
        job.payload = payload;
        job.submittedAt = Instant.now();
        QuarkusTransaction.requiringNew().run(job::persist);
        return job;
    }

    private static WorkflowJob waitFor(UUID id, WorkflowStatus status, Duration timeout)
            throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeout.toMillis();
        WorkflowJob job;
        do {
            Thread.sleep(200);
            try {
                job = QuarkusTransaction.requiringNew().call(() -> WorkflowJob.findById(id));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        } while ((job == null || job.status != status) && System.currentTimeMillis() < deadline);
        return job;
    }

    @Test
    public void claimRejectsNonPending() {
        WorkflowJob job = newJob("{}");
        assertTrue(runner.claim(job.id));
        assertEquals(WorkflowStatus.RUNNING, WorkflowJob.findById(job.id).status);

        // Second claim loses the race.
        assertFalse(runner.claim(job.id));
    }

    @Test
    public void runCompletesImportAndPersistsArtifact() throws Exception {
        byte[] pdf = generatePdf();
        String ref = tempInput.store(new ByteArrayInputStream(pdf));
        WorkflowJob job = newJob("{\"tempInputRef\":\"" + ref + "\",\"originalFilename\":\"sample.pdf\"}");

        assertTrue(runner.claim(job.id));
        runner.run(job.id);

        WorkflowJob done = waitFor(job.id, WorkflowStatus.COMPLETED, Duration.ofSeconds(30));
        assertNotNull(done, "job should reach COMPLETED");
        assertEquals(WorkflowStatus.COMPLETED, done.status);
        assertEquals(0, done.retryCount);
        assertNotNull(done.completedAt);

        // Regression: COMPLETED must not fire with a document/artifact silently missing.
        Artifact artifact = Artifact.find("importProvenanceJson LIKE ?1", "%\"" + job.id + "\"%")
                .firstResult();
        assertNotNull(artifact, "COMPLETED job must persist an artifact with this job's provenance");
        assertEquals(ArtifactState.AVAILABLE, artifact.status);
        Document doc = Document.findById(artifact.documentId);
        assertNotNull(doc);
        assertEquals("sample.pdf", doc.title);
    }
}
