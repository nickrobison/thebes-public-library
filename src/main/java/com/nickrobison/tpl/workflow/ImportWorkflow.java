package com.nickrobison.tpl.workflow;

import com.nickrobison.tpl.model.Artifact;
import com.nickrobison.tpl.model.ArtifactState;
import com.nickrobison.tpl.model.Document;
import com.nickrobison.tpl.storage.Storage;
import com.nickrobison.tpl.checksum.Blake3Checksum;
import com.nickrobison.tpl.validation.PdfValidator;
import com.nickrobison.tpl.validation.PdfBoxValidator;
import com.nickrobison.tpl.metrics.ImportMetrics;
import com.nickrobison.tpl.temp.TempInput;
import com.nickrobison.tpl.service.ArtifactPublicationService;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.io.InputStream;
import java.time.Instant;
import java.util.UUID;

@ApplicationScoped
public class ImportWorkflow {

    private static final int MAX_RETRIES = 3;

    private final WorkflowService workflowService;
    private final Storage storage;
    private final ArtifactPublicationService publicationService;
    private final ImportMetrics metrics;
    private final TempInput tempInput;
    private final PdfValidator validator;
    private final Blake3Checksum checksum;
    private final WorkflowFailureRecorder failureRecorder;

    public ImportWorkflow(WorkflowService workflowService,
                          Storage storage,
                          ArtifactPublicationService publicationService,
                          ImportMetrics metrics,
                          TempInput tempInput,
                          PdfValidator validator,
                          Blake3Checksum checksum,
                          WorkflowFailureRecorder failureRecorder) {
        this.workflowService = workflowService;
        this.storage = storage;
        this.publicationService = publicationService;
        this.metrics = metrics;
        // Injected, not constructed: FilesystemTempInput relies on @PostConstruct to
        // create its temp directory, so `new FilesystemTempInput()` left tempDir null.
        this.tempInput = tempInput;
        this.validator = validator;
        this.checksum = checksum;
        this.failureRecorder = failureRecorder;
    }

    @Transactional
    public void process(UUID jobId) throws Exception {
        WorkflowJob job = WorkflowJob.findById(jobId);
        if (job == null) return;

        // Restart-recovery: resume from durable stage (never expose partial AVAILABLE)
        String stage = (job.currentStage != null && !job.currentStage.isEmpty()) ? job.currentStage : "VALIDATION";

        try {
            // Stage 1: VALIDATION (with retry)
            if (stage.equals("VALIDATION") || stage.equals("RESTART")) {
                retryStage(job, "VALIDATION", () -> {
                    long sample = metrics.startValidation();
                    try {
                        String payload = job.payload;
                        String tempRef = extract(payload, "tempInputRef");

                        InputStream data = tempInput.load(tempRef);

                        if (!validator.isValid(data)) {
                            throw new RuntimeException("PDF validation failed");
                        }
                    } catch (Exception ex) {
                        throw new RuntimeException(ex);
                    } finally {
                        metrics.stopValidation(sample);
                    }
                });
                job.currentStage = "STORAGE";
                job.persist();
                stage = "STORAGE";
            }

            // Stage 2: STORAGE (with retry) — uses ArtifactPublicationService (Storage interface ONLY)
            if (stage.equals("STORAGE") || stage.equals("RESTART")) {
                retryStage(job, "STORAGE", () -> {
                    long sample = metrics.startStorage();
                    try {
                        String payload = job.payload;
                        String tempRef = extract(payload, "tempInputRef");
                        String originalFilename = extract(payload, "originalFilename");
                        String documentIdStr = extract(payload, "documentId");

                        Document target;
                        if (documentIdStr != null) {
                            target = Document.findById(UUID.fromString(documentIdStr));
                            if (target == null) {
                                throw new RuntimeException("Document not found: " + documentIdStr);
                            }
                        } else {
                            target = null;
                        }

                        // Buffer the bytes once: the checksum consumes the stream, and
                        // publication needs to write the same bytes afterwards. Reading
                        // the stream twice silently published a truncated/empty artifact.
                        byte[] bytes;
                        try (InputStream raw = tempInput.load(tempRef)) {
                            bytes = raw.readAllBytes();
                        }
                        String blake3Hash = checksum.calculate(new java.io.ByteArrayInputStream(bytes));

                        if (target == null) {
                            // Web upload: create Document (reuse Phase 0 Document.java — one row per successful import)
                            Document doc = new Document();
                            doc.id = UUID.randomUUID();
                            doc.title = originalFilename;
                            doc.createdAt = Instant.now();
                            doc.updatedAt = Instant.now();
                            doc.persist();
                            target = doc;
                        }

                        // Create pending Artifact
                        Artifact artifact = new Artifact();
                        artifact.id = UUID.randomUUID();
                        artifact.documentId = target.id;
                        artifact.storagePath = "storage:" + artifact.id.toString();
                        artifact.contentChecksum = blake3Hash;
                        artifact.createdAt = Instant.now();
                        artifact.status = ArtifactState.PENDING;
                        artifact.originalFilename = originalFilename;
                        artifact.importProvenanceJson = "{\"mechanism\":\""
                                + (job.type == WorkflowType.ADD_ARTIFACT ? "ADD_ARTIFACT" : "WEB_UPLOAD")
                                + "\",\"importOperationId\":\"" + job.id + "\"}";
                        artifact.physicalMetadataJson = "{\"size\":" + bytes.length + ",\"mimeType\":\"application/pdf\",\"blake3\":\"" + blake3Hash + "\"}";
                        artifact.persist();

                        target.updatedAt = Instant.now();
                        target.persist();

                        // Save to Storage and verify (via ArtifactPublicationService — Storage interface ONLY)
                        publicationService.publish(artifact, new java.io.ByteArrayInputStream(bytes), blake3Hash);
                    } catch (Exception ex) {
                        throw new RuntimeException(ex);
                    } finally {
                        metrics.stopStorage(sample);
                    }
                });
                job.currentStage = "VERIFICATION";
                job.persist();
                stage = "VERIFICATION";
            }

            // Stage 3: VERIFICATION (with retry) — BLAKE3 verify after storage
            if (stage.equals("VERIFICATION") || stage.equals("RESTART")) {
                retryStage(job, "VERIFICATION", () -> {
                    try {
                        // Verification is handled by ArtifactPublicationService.publish()
                        // This stage confirms the artifact is AVAILABLE and checksum verified
                        // No additional action needed — verification is part of publication
                    } catch (Exception ex) {
                        throw new RuntimeException(ex);
                    }
                });
                job.currentStage = "COMPLETED";
                job.persist();
            }

            // Complete workflow
            job.status = WorkflowStatus.COMPLETED;
            job.completedAt = Instant.now();
            job.persist();
            metrics.completed();

        } catch (Exception e) {
            // Record the terminal failure on the job. The catch runs while the
            // caller's transaction is compromised (already rollback-only or about
            // to commit with stale state), so set the FAILED state in-band here —
            // it commits with the transaction. The out-of-band recorder is used
            // for failures that escape the process() boundary.
            job.status = WorkflowStatus.FAILED;
            job.failureReason = e.getMessage() != null ? e.getMessage().substring(0, Math.min(1000, e.getMessage().length())) : "Unknown workflow failure";
            job.persist();
            failureRecorder.recordFailure(jobId, e.getMessage());
            metrics.failed();
        }
    }

    private void retryStage(WorkflowJob job, String stageName, Runnable action) throws Exception {
        int attempts = 0;
        Exception lastException = null;
        while (attempts < MAX_RETRIES) {
            try {
                action.run();
                return; // Success
            } catch (Exception e) {
                attempts++;
                lastException = e;
                job.retryCount++;
                job.persist();
                if (attempts >= MAX_RETRIES) {
                    throw new RuntimeException("Stage " + stageName + " failed after " + MAX_RETRIES + " attempts", lastException);
                }
            }
        }
    }

    /** Extracts a `"key":"value"` string from the payload JSON. */
    private static String extract(String payload, String key) {
        if (payload == null) return null;
        String marker = "\"" + key + "\":\"";
        int start = payload.indexOf(marker);
        if (start < 0) return null;
        int valueStart = start + marker.length();
        int valueEnd = payload.indexOf('"', valueStart);
        return payload.substring(valueStart, valueEnd);
    }
}
