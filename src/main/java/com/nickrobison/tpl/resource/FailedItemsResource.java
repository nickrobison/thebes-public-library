package com.nickrobison.tpl.resource;

import com.nickrobison.tpl.workflow.WorkflowJob;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

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
    @Path("/failed-items")
    @Produces(MediaType.APPLICATION_JSON)
    public List<Map<String, Object>> getFailedItems() {
        List<Map<String, Object>> result = new ArrayList<>();
        // Return failed import operations (visible, never as library Documents)
        return result;
    }
}
