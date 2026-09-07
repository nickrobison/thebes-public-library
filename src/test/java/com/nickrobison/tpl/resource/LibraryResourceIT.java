package com.nickrobison.tpl.resource;

import com.nickrobison.tpl.model.Document;
import com.nickrobison.tpl.model.Artifact;
import com.nickrobison.tpl.workflow.WorkflowJob;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.UserTransaction;
import io.restassured.RestAssured;
import org.junit.jupiter.api.Test;
import java.util.UUID;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class LibraryResourceIT {

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
    public void testPagination() {
        given()
            .param("limit", "10")
            .param("cursor", "")
            .when()
            .get("/api/v1/library")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(0));
    }

    @Test
    public void testSortingByTitle() {
        given()
            .param("limit", "10")
            .param("sortField", "title")
            .param("sortDir", "asc")
            .when()
            .get("/api/v1/library")
            .then()
            .statusCode(200);
    }

    @Test
    public void testSortingByAuthors() {
        given()
            .param("limit", "10")
            .param("sortField", "authors")
            .param("sortDir", "asc")
            .when()
            .get("/api/v1/library")
            .then()
            .statusCode(200);
    }

    @Test
    public void testSortingByPubYear() {
        given()
            .param("limit", "10")
            .param("sortField", "pubYear")
            .param("sortDir", "asc")
            .when()
            .get("/api/v1/library")
            .then()
            .statusCode(200);
    }

    @Test
    public void testSortingByProcessingStatus() {
        given()
            .param("limit", "10")
            .param("sortField", "processingStatus")
            .param("sortDir", "asc")
            .when()
            .get("/api/v1/library")
            .then()
            .statusCode(200);
    }

    @Test
    public void testSortingByCreatedAt() {
        given()
            .param("limit", "10")
            .param("sortField", "createdAt")
            .param("sortDir", "asc")
            .when()
            .get("/api/v1/library")
            .then()
            .statusCode(200);
    }

    @Test
    public void testDocumentDetail() {
        UUID testId = UUID.randomUUID();
        Document testDoc = new Document();
        testDoc.id = testId;
        testDoc.title = "Test Document";
        testDoc.authors = "Test Author";
        testDoc.pubYear = 2024;
        testDoc.version = 1;
        inTransaction(testDoc::persist);

        given()
            .when()
            .get("/api/v1/documents/" + testId)
            .then()
            .statusCode(200)
            .body("title", equalTo("Test Document"));

        inTransaction(testDoc::delete);
    }

    @Test
    public void testArtifactList() {
        UUID testDocId = UUID.randomUUID();
        Document testDoc = new Document();
        testDoc.id = testDocId;
        testDoc.title = "Artifact Test";
        testDoc.authors = "Author";
        testDoc.version = 2;
        Artifact testArtifact = new Artifact();
        testArtifact.id = UUID.randomUUID();
        testArtifact.documentId = testDocId;
        testArtifact.storagePath = "/test/path";
        inTransaction(() -> {
            testDoc.persist();
            testArtifact.persist();
        });

        given()
            .when()
            .get("/api/v1/documents/" + testDocId + "/artifacts")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(1));

        inTransaction(() -> {
            testArtifact.delete();
            testDoc.delete();
        });
    }

    @Test
    public void testStaleVersion409() {
        UUID testId = UUID.randomUUID();
        Document testDoc = new Document();
        testDoc.id = testId;
        testDoc.title = "Test Document";
        testDoc.authors = "Test";
        testDoc.version = 2;
        inTransaction(testDoc::persist);

        given()
            .header("If-Match", "1")
            .contentType("application/json")
            .body("{\"title\":\"Updated Document\",\"authors\":\"Updated\"}")
            .when()
            .put("/api/v1/documents/" + testId)
            .then()
            .statusCode(409);

        inTransaction(testDoc::delete);
    }

    @Test
    public void testProcessingHistory() {
        UUID testDocId = UUID.randomUUID();
        WorkflowJob testJob = new WorkflowJob();
        testJob.id = UUID.randomUUID();
        testJob.type = com.nickrobison.tpl.workflow.WorkflowType.IMPORT_SINGLE;
        testJob.status = com.nickrobison.tpl.workflow.WorkflowStatus.PENDING;
        testJob.payload = "{\"documentId\":\"" + testDocId + "\"}";
        inTransaction(testJob::persist);

        given()
            .when()
            .get("/api/v1/documents/" + testDocId + "/processing-history")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(1));

        inTransaction(testJob::delete);
    }
}
