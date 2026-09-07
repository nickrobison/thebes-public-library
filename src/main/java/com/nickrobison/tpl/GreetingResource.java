package com.nickrobison.tpl;

import com.nickrobison.tpl.metrics.ImportMetrics;
import com.nickrobison.tpl.workflow.WorkflowJob;
import com.nickrobison.tpl.workflow.WorkflowStatus;
import com.nickrobison.tpl.workflow.WorkflowType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.HashMap;
import java.util.Map;

@Path("/")
@ApplicationScoped
public class GreetingResource {

    private final ImportMetrics metrics;

    public GreetingResource(ImportMetrics metrics) {
        this.metrics = metrics;
    }

    @GET
    @Path("/hello")
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() {
        return "Hello from Quarkus REST";
    }

    @GET
    @Path("/ready")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> ready() {
        Map<String, String> result = new HashMap<>();
        result.put("postgresql", "up");
        result.put("elasticsearch", "unknown");
        result.put("status", "ok");
        return result;
    }

    @GET
    @Path("/health")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("postgresql", "up");
        result.put("elasticsearch", "unknown");
        result.put("status", "ok");
        Map<String, Object> imports = new HashMap<>();
        try {
            imports.put("pending", WorkflowJob.count("type = ?1 and status = ?2", WorkflowType.IMPORT_SINGLE, WorkflowStatus.PENDING));
            imports.put("failed", WorkflowJob.count("type = ?1 and status = ?2", WorkflowType.IMPORT_SINGLE, WorkflowStatus.FAILED));
        } catch (Exception e) {
            imports.put("pending", "unknown");
            imports.put("failed", "unknown");
        }
        result.put("imports", imports);
        try {
            result.put("metrics", metrics.snapshot());
        } catch (Exception e) {
            result.put("metrics", "unknown");
        }
        return result;
    }
}
