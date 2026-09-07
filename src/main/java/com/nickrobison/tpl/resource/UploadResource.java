package com.nickrobison.tpl.resource;

import com.nickrobison.tpl.metrics.ImportMetrics;
import com.nickrobison.tpl.workflow.WorkflowService;
import com.nickrobison.tpl.workflow.WorkflowJob;
import com.nickrobison.tpl.workflow.WorkflowType;
import com.nickrobison.tpl.workflow.WorkflowStatus;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.InputStream;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Path("/api/v1")
public class UploadResource {

    private final WorkflowService workflowService;
    private final ImportMetrics metrics;

    public UploadResource(WorkflowService workflowService, ImportMetrics metrics) {
        this.workflowService = workflowService;
        this.metrics = metrics;
    }

    @POST
    @Path("/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response upload(FileUpload file) throws Exception {
        String originalFilename = file.fileName();
        java.nio.file.Path uploadedPath = file.uploadedFile();
        java.io.InputStream data = java.nio.file.Files.newInputStream(uploadedPath);

        // Store to temporary input (simplified for W2)
        String tempRef = "temp-" + UUID.randomUUID().toString();

        WorkflowJob job = new WorkflowJob();
        job.id = UUID.randomUUID();
        job.type = WorkflowType.IMPORT_SINGLE;
        job.status = WorkflowStatus.PENDING;
        job.payload = "{\"tempInputRef\":\"" + tempRef + "\",\"originalFilename\":\"" + originalFilename + "\"}";
        job.submittedAt = Instant.now();

        workflowService.submit(job);
        metrics.accepted();

        Map<String, String> result = new HashMap<>();
        result.put("importId", job.id.toString());
        result.put("status", "PENDING");
        result.put("originalFilename", originalFilename);

        return Response.ok(result).build();
    }
}
