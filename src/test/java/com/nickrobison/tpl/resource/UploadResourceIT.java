package com.nickrobison.tpl.resource;

import com.nickrobison.tpl.workflow.WorkflowJob;
import com.nickrobison.tpl.workflow.WorkflowStatus;
import com.nickrobison.tpl.workflow.WorkflowType;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.UserTransaction;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class UploadResourceIT {

    @Inject
    UserTransaction transaction;

    private void inTransaction(Runnable work) {
        try {
            transaction.begin();
            work.run();
            transaction.commit();
        } catch (Exception e) {
            try {
                transaction.rollback();
            } catch (Exception rollbackError) {
                e.addSuppressed(rollbackError);
            }
            throw new RuntimeException(e);
        }
    }

    @Test
    public void testUploadReturnsImportId() {
        given()
            .multiPart("file", "sample.pdf", "PDF-BYTES".getBytes(), "application/pdf")
            .when()
            .post("/api/v1/upload")
            .then()
            .statusCode(200)
            .body("importId", notNullValue())
            .body("status", equalTo("PENDING"))
            .body("originalFilename", equalTo("sample.pdf"));
    }

    @Test
    public void testGetImportStatus() {
        UUID jobId = UUID.randomUUID();
        inTransaction(() -> {
            WorkflowJob job = new WorkflowJob();
            job.id = jobId;
            job.type = WorkflowType.IMPORT_SINGLE;
            job.status = WorkflowStatus.PENDING;
            job.submittedAt = Instant.now();
            job.payload = "{\"originalFilename\":\"sample.pdf\"}";
            job.persist();
        });

        given()
            .when()
            .get("/api/v1/imports/{id}", jobId)
            .then()
            .statusCode(200)
            .body("id", equalTo(jobId.toString()))
            .body("status", equalTo("PENDING"));

        given()
            .when()
            .get("/api/v1/imports/{id}", UUID.randomUUID())
            .then()
            .statusCode(404);
    }
}
