package com.nickrobison.tpl;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.HashMap;
import java.util.Map;

@Path("/hello")
public class GreetingResource {

    @GET
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
    public Map<String, String> health() {
        Map<String, String> result = new HashMap<>();
        result.put("postgresql", "up");
        result.put("elasticsearch", "unknown");
        result.put("status", "ok");
        return result;
    }
}
