package com.nickrobison.tpl.resource;

import com.nickrobison.tpl.model.Document;
import com.nickrobison.tpl.model.Artifact;
import com.nickrobison.tpl.model.ArtifactState;
import com.nickrobison.tpl.workflow.WorkflowJob;
import com.nickrobison.tpl.workflow.WorkflowType;
import com.nickrobison.tpl.workflow.WorkflowStatus;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.transaction.Transactional;

import java.util.*;

@Path("/api/v1")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LibraryResource {

    @GET
    @Path("/library")
    public Response listDocuments(
            @QueryParam("limit") @DefaultValue("10") int limit,
            @QueryParam("sortField") @DefaultValue("createdAt") String sortField,
            @QueryParam("sortDir") @DefaultValue("asc") String sortDir,
            @QueryParam("cursor") String cursor) {
        String order = sortDir.equalsIgnoreCase("desc") ? "DESC" : "ASC";
        Set<String> allowed = Set.of("title", "authors", "pubYear", "journal", "volume", "issue", "pages", "doi", "createdAt");
        String field = allowed.contains(sortField) ? sortField : "createdAt";
        List<Document> allDocs = Document.listAll();
        // For server-side pagination/sorting with stable cursor semantics,
        // retrieve full sorted list and paginate in memory (suitable for ~10k corpus in Phase 3)
        // Sort by the requested field (manual sort for stability)
        // Sort by the requested field (manual sort for stability)
        Comparator<Document> comp = (a, b) -> {
            int cmp = 0;
            switch (field) {
                case "authors": cmp = a.authors != null && b.authors != null ? a.authors.compareTo(b.authors) : 0; break;
                case "pubYear": cmp = Integer.compare(a.pubYear != null ? a.pubYear : 0, b.pubYear != null ? b.pubYear : 0); break;
                case "volume": cmp = a.volume != null && b.volume != null ? a.volume.compareTo(b.volume) : 0; break;
                case "issue": cmp = a.issue != null && b.issue != null ? a.issue.compareTo(b.issue) : 0; break;
                case "pages": cmp = a.pages != null && b.pages != null ? a.pages.compareTo(b.pages) : 0; break;
                case "doi": cmp = a.doi != null && b.doi != null ? a.doi.compareTo(b.doi) : 0; break;
                default: cmp = a.createdAt != null && b.createdAt != null ? a.createdAt.compareTo(b.createdAt) : 0; break;
            }
            return sortDir.equalsIgnoreCase("desc") ? -cmp : cmp;
        };
        allDocs.sort(comp);
        int fromIndex = cursor != null && !cursor.isEmpty() ? allDocs.indexOf(Document.findById(UUID.fromString(cursor))) + 1 : 0;
        if (fromIndex < 0 || fromIndex >= allDocs.size()) fromIndex = 0;
        int toIndex = Math.min(fromIndex + limit, allDocs.size());
        List<Document> docs = allDocs.subList(fromIndex, toIndex);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Document d : docs) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", d.id.toString());
            item.put("title", d.title);
            item.put("authors", d.authors);
            item.put("publicationYear", d.pubYear);
            item.put("processingStatus", "PENDING"); // derived from workflow, not document column; placeholder for Phase 3
            result.add(item);
        }
        Map<String, Object> resp = new HashMap<>();
        resp.put("items", result);
        resp.put("nextCursor", docs.size() >= limit ? docs.get(docs.size() - 1).id.toString() : null);
        return Response.ok(resp).build();
    }

    @GET
    @Path("/documents/{id}")
    public Response getDocument(@PathParam("id") UUID docId) {
        Document d = Document.findById(docId);
        if (d == null) return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Document not found")).build();
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", d.id.toString());
        resp.put("title", d.title);
        resp.put("authors", d.authors);
        resp.put("publicationYear", d.pubYear);
        resp.put("journal", d.journal);
        resp.put("volume", d.volume);
        resp.put("issue", d.issue);
        resp.put("pages", d.pages);
        resp.put("doi", d.doi);
        resp.put("version", d.version);
        resp.put("createdAt", d.createdAt);
        resp.put("updatedAt", d.updatedAt);

        Artifact preferred = Artifact.find("documentId = ?1 AND isPreferred = true", docId).firstResult();
        resp.put("preferredArtifactId", preferred != null ? preferred.id.toString() : null);
        resp.put("artifacts", Artifact.list("documentId = ?1", docId));
        return Response.ok(resp).build();
    }

    @PUT
    @Path("/documents/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response updateDocument(@PathParam("id") UUID docId,
                                  @HeaderParam("If-Match") String ifMatch,
                                  Map<String, Object> payload) {
        Document existing = Document.findById(docId);
        if (existing == null) return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Document not found")).build();
        int expectedVersion = 1;
        if (ifMatch != null && !ifMatch.isEmpty()) {
            try {
                expectedVersion = Integer.parseInt(ifMatch);
            } catch (NumberFormatException e) {
                return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Invalid If-Match version")).build();
            }
        }
        if (expectedVersion > 0 && existing.version != expectedVersion) {
            return Response.status(409, "Document version mismatch. Expected version: " + expectedVersion + ", current: " + existing.version).build();
        }
        if (payload.containsKey("title")) existing.title = (String) payload.get("title");
        if (payload.containsKey("authors")) existing.authors = (String) payload.get("authors");
        if (payload.containsKey("publicationYear")) existing.pubYear = ((Number) payload.get("publicationYear")).intValue();
        if (payload.containsKey("journal")) existing.journal = (String) payload.get("journal");
        if (payload.containsKey("volume")) existing.volume = (String) payload.get("volume");
        if (payload.containsKey("issue")) existing.issue = (String) payload.get("issue");
        if (payload.containsKey("pages")) existing.pages = (String) payload.get("pages");
        if (payload.containsKey("doi")) existing.doi = (String) payload.get("doi");
        existing.version = existing.version + 1;
        existing.persist();
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", existing.id.toString());
        resp.put("version", existing.version);
        resp.put("status", "updated");
        return Response.ok(resp).build();
    }

    @GET
    @Path("/documents/{id}/artifacts")
    public Response getArtifacts(@PathParam("id") UUID docId) {
        List<Artifact> artifacts = Artifact.list("documentId = ?1", docId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Artifact a : artifacts) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", a.id.toString());
            item.put("documentId", a.documentId.toString());
            item.put("originalFilename", a.originalFilename);
            item.put("status", a.status.name());
            item.put("isPreferred", a.isPreferred);
            item.put("createdAt", a.createdAt);
            result.add(item);
        }
        return Response.ok(result).build();
    }

    @POST
    @Path("/documents/{id}/artifacts")
    public Response addArtifact(@PathParam("id") UUID docId, Map<String, Object> payload) {
        WorkflowJob job = new WorkflowJob();
        job.id = UUID.randomUUID();
        job.type = WorkflowType.IMPORT_SINGLE;
        job.status = WorkflowStatus.PENDING;
        job.payload = payload.containsKey("originalFilename") ? (String) payload.get("originalFilename") : "artifact-" + UUID.randomUUID();
        job.submittedAt = java.time.Instant.now();
        job.persist();
        Map<String, Object> resp = new HashMap<>();
        resp.put("jobId", job.id.toString());
        resp.put("status", "PENDING");
        resp.put("documentId", docId.toString());
        return Response.ok(resp).build();
    }

    @GET
    @Path("/documents/{id}/processing-history")
    public Response getProcessingHistory(@PathParam("id") UUID docId) {
        List<WorkflowJob> jobs = WorkflowJob.find("payload LIKE ?1", "%\"" + docId.toString() + "\"%").list();
        List<Map<String, Object>> result = new ArrayList<>();
        for (WorkflowJob j : jobs) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", j.id.toString());
            item.put("type", j.type.name());
            item.put("status", j.status.name());
            item.put("currentStage", j.currentStage);
            item.put("retryCount", j.retryCount);
            item.put("submittedAt", j.submittedAt);
            item.put("completedAt", j.completedAt);
            item.put("failureReason", j.failureReason);
            item.put("payload", j.payload);
            item.put("stages", new ArrayList<>());
            result.add(item);
        }
        return Response.ok(result).build();
    }
}
