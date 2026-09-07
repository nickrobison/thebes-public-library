package com.nickrobison.tpl.resource;

import com.nickrobison.tpl.model.Document;
import com.nickrobison.tpl.model.Artifact;
import com.nickrobison.tpl.workflow.WorkflowJob;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import org.junit.jupiter.api.Test;
import java.util.UUID;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class LibraryResourceIT {

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
        testDoc.persist();

        given()
            .when()
            .get("/api/v1/documents/" + testId)
            .then()
            .statusCode(200)
            .body("title", equalTo("Test Document"));

        testDoc.delete();
    }

    @Test
    public void testArtifactList() {
        UUID testDocId = UUID.randomUUID();
        Document testDoc = new Document();
        testDoc.id = testDocId;
        testDoc.title = "Artifact Test";
        testDoc.authors = "Author";
        testDoc.version = 1;
        testDoc.persist();

        Artifact testArtifact = new Artifact();
        testArtifact.id = UUID.randomUUID();
        testArtifact.documentId = testDocId;
        testArtifact.storagePath = "/test/path";
        testArtifact.persist();

        given()
            .when()
            .get("/api/v1/documents/" + testDocId + "/artifacts")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(1));

        testArtifact.delete();
        testDoc.delete();
    }

    @Test
    public void testStaleVersion409() {
        UUID testId = UUID.randomUUID();
        Document testDoc = new Document();
        testDoc.id = testId;
        testDoc.title = "Test Document";
        testDoc.authors = "Test";
        testDoc.version = 1;
        testDoc.persist();

        Document updatedDoc = new Document();
        updatedDoc.id = testId;
        updatedDoc.title = "Updated Document";
        updatedDoc.authors = "Updated";
        updatedDoc.version = 1; // same version for stale test
        updatedDoc.persist();

        given()
            .header("If-Match", "1")
            .contentType("application/json")
            .body(updatedDoc)
            .when()
            .put("/api/v1/documents/" + testId)
            .then()
            .statusCode(409);

        testDoc.delete();
        updatedDoc.delete();
    }

    @Test
    public void testProcessingHistory() {
        UUID testDocId = UUID.randomUUID();
        WorkflowJob testJob = new WorkflowJob();
        testJob.id = UUID.randomUUID();
        testJob.payload = "{\"documentId\":\"" + testDocId + "\"}";
        testJob.persist();

        given()
            .when()
            .get("/api/v1/documents/" + testDocId + "/processing-history")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(1));

        testJob.delete();
    }
}