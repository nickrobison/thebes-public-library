package com.nickrobison.tpl;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
public class HealthEndpointIT {
    @Test
    public void testHealthReturnsImportSubsystemStatus() {
        given()
          .when().get("/health")
          .then()
             .statusCode(200)
             .body("status", is("ok"))
             .body("imports.pending", notNullValue())
             .body("imports.failed", notNullValue())
             .body("metrics.accepted", notNullValue());
    }

    @Test
    public void testReadyReturnsOk() {
        given()
          .when().get("/ready")
          .then()
             .statusCode(200)
             .body("status", is("ok"));
    }
}
