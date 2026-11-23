package com.nickrobison.tpl.resource;

import com.nickrobison.tpl.workflow.WorkflowJob;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/api/v1")
public class FailedItemsResource {

    @GET
    @Path("/imports")
    @Produces(MediaType.APPLICATION_JSON)
    public List<Map<String, Object>> getImports() {
        List<Map<String, Object>> result = new ArrayList<>();
        // Return import history from workflow jobs
        return result;
    }

    @GET
    @Path("/imports/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getImport(@PathParam("id") UUID id) {
        WorkflowJob job = WorkflowJob.findById(id);
        if (job == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Import not found"))
                    .build();
        }
        Map<String, Object> result = new HashMap<>();
        result.put("id", job.id.toString());
        result.put("status", job.status.name());
        result.put("currentStage", job.currentStage);
        result.put("retryCount", job.retryCount);
        result.put("submittedAt", job.submittedAt);
        result.put("completedAt", job.completedAt);
        result.put("error", job.failureReason);
        return Response.ok(result).build();
    }

    @GET
    @Path("/failed-items")
    @Produces(MediaType.APPLICATION_JSON)
    public List<Map<String, Object>> getFailedItems() {
        List<Map<String, Object>> result = new ArrayList<>();
        // Return failed import operations (visible, never as library Documents)
        return result;
    }
}
