package com.nickrobison.tpl.resource;

import com.nickrobison.tpl.model.Document;
import com.nickrobison.tpl.model.Artifact;
import com.nickrobison.tpl.model.ArtifactState;
import com.nickrobison.tpl.storage.Storage;
import com.nickrobison.tpl.workflow.WorkflowJob;
import com.nickrobison.tpl.workflow.WorkflowType;
import com.nickrobison.tpl.workflow.WorkflowStatus;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import jakarta.transaction.Transactional;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;

@Path("/api/v1")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LibraryResource {

    private final Storage storage;

    public LibraryResource(Storage storage) {
        this.storage = storage;
    }

    /** Null-safe string ordering; nulls sort last regardless of direction flip. */
    private static int compareStrings(String a, String b) {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return a.compareTo(b);
    }

    private static int compareInts(Integer a, Integer b) {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return Integer.compare(a, b);
    }

    private static int compareInstants(Instant a, Instant b) {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return a.compareTo(b);
    }

    @GET
    @Path("/library")
    public Response listDocuments(
            @QueryParam("limit") @DefaultValue("10") int limit,
            @QueryParam("sortField") @DefaultValue("createdAt") String sortField,
            @QueryParam("sortDir") @DefaultValue("asc") String sortDir,
            @QueryParam("cursor") String cursor) {
        Set<String> allowed = Set.of("title", "authors", "publicationYear", "pubYear",
                "processingStatus", "createdAt");
        String field = allowed.contains(sortField) ? sortField : "createdAt";
        List<Document> allDocs = Document.listAll();
        // Retrieve the full sorted list and paginate in memory.
        // Sufficient for the ~10k document corpus targeted in Phase 3; revisit with
        // keyset pagination if the corpus outgrows a single-page sort.
        Comparator<Document> comp = (a, b) -> {
            int cmp = switch (field) {
                case "title" -> compareStrings(a.title, b.title);
                case "authors" -> compareStrings(a.authors, b.authors);
                case "publicationYear", "pubYear" -> compareInts(a.pubYear, b.pubYear);
                case "processingStatus" -> compareStrings(a.processingStatus, b.processingStatus);
                default -> compareInstants(a.createdAt, b.createdAt);
            };
            return sortDir.equalsIgnoreCase("desc") ? -cmp : cmp;
        };
        // Tie-break on id so equal sort keys yield a stable, repeatable cursor order.
        allDocs.sort(comp.thenComparing(d -> d.id.toString()));
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
            item.put("processingStatus", d.processingStatus);
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
        resp.put("artifacts", toArtifactDtos(Artifact.list("documentId = ?1", docId)));
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
        return Response.ok(toArtifactDtos(Artifact.list("documentId = ?1", docId))).build();
    }

    /** Maps artifacts to the public DTO shape, keeping storage paths and checksums server-side. */
    private static List<Map<String, Object>> toArtifactDtos(List<Artifact> artifacts) {
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
        return result;
    }

    @POST
    @Path("/documents/{id}/artifacts")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response addArtifact(@PathParam("id") UUID docId, Map<String, Object> payload) {
        Document document = Document.findById(docId);
        if (document == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Document not found")).build();
        }
        String originalFilename = payload.get("originalFilename") instanceof String name
                ? name
                : "artifact-" + UUID.randomUUID();
        WorkflowJob job = new WorkflowJob();
        job.id = UUID.randomUUID();
        job.type = WorkflowType.IMPORT_SINGLE;
        job.status = WorkflowStatus.PENDING;
        // Store the documentId inside the JSON payload so processing-history can find this job.
        job.payload = "{\"documentId\":\"" + docId + "\",\"originalFilename\":\"" + originalFilename + "\"}";
        job.submittedAt = Instant.now();
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

    /**
     * Streams artifact bytes for the in-browser reader.
     * Only AVAILABLE artifacts are readable; storage paths and checksums stay server-side.
     */
    @GET
    @Path("/artifacts/{artifactId}/content")
    @Produces("application/pdf")
    public Response getArtifactContent(@PathParam("artifactId") UUID artifactId) {
        Artifact artifact = Artifact.findById(artifactId);
        if (artifact == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Artifact not found")).build();
        }
        if (artifact.status != ArtifactState.AVAILABLE) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "Artifact not available: " + artifact.status)).build();
        }

        InputStream data;
        try {
            data = storage.load(artifactId);
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Artifact bytes missing from storage")).build();
        }

        StreamingOutput stream = output -> {
            try (InputStream in = data) {
                in.transferTo(output);
            }
        };
        return Response.ok(stream)
                .type("application/pdf")
                .header("Content-Disposition",
                        "inline; filename=\"" + artifact.originalFilename + "\"")
                .build();
    }
}
