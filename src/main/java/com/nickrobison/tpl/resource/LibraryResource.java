package com.nickrobison.tpl.resource;

import com.nickrobison.tpl.model.Artifact;
import com.nickrobison.tpl.model.Document;
import com.nickrobison.tpl.model.ArtifactState;
import com.nickrobison.tpl.storage.Storage;
import com.nickrobison.tpl.temp.TempInput;
import com.nickrobison.tpl.workflow.WorkflowJob;
import com.nickrobison.tpl.workflow.WorkflowType;
import com.nickrobison.tpl.workflow.WorkflowStatus;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.resteasy.reactive.RestForm;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import jakarta.transaction.Transactional;

import java.io.InputStream;
import java.nio.file.Files;
import java.time.Instant;
import java.util.*;

@Path("/api/v1")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LibraryResource {

    private final Storage storage;
    private final TempInput tempInput;

    public LibraryResource(Storage storage, TempInput tempInput) {
        this.storage = storage;
        this.tempInput = tempInput;
    }

    /** Maps a document to its sortable value for the requested field; null when unset/unknown. */
    private static Object sortValue(Document doc, String field) {
        return switch (field) {
            case "title" -> doc.title;
            case "authors" -> doc.authors;
            case "publicationYear", "pubYear" -> doc.pubYear;
            case "processingStatus" -> doc.processingStatus;
            case "createdAt" -> doc.createdAt;
            default -> null;
        };
    }

    private static int compareValues(Object a, Object b) {
        if (a instanceof String sa && b instanceof String sb) return sa.compareTo(sb);
        if (a instanceof Integer ia && b instanceof Integer ib) return Integer.compare(ia, ib);
        if (a instanceof Instant ia && b instanceof Instant ib) return ia.compareTo(ib);
        return 0;
    }

    /** Nulls always sort last; non-null comparisons flip on `desc`. */
    private static int applyDirection(boolean aNull, boolean bNull, boolean desc, int cmp) {
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;
        return desc ? -cmp : cmp;
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
        boolean desc = sortDir.equalsIgnoreCase("desc");
        List<Document> allDocs = Document.listAll();
        // Retrieve the full sorted list and paginate in memory.
        // Sufficient for the ~10k document corpus targeted in Phase 3; revisit with
        // keyset pagination if the corpus outgrows a single-page sort.
        Comparator<Document> comp = (a, b) -> {
            Object va = sortValue(a, field);
            Object vb = sortValue(b, field);
            return applyDirection(va == null, vb == null, desc, compareValues(va, vb));
        };
        // Tie-break on id so equal sort keys yield a stable, repeatable cursor order.
        allDocs.sort(comp.thenComparing(d -> d.id.toString()));
        // Build the page after the cursor. An unknown, malformed, or past-the-end
        // cursor returns an empty page with a null nextCursor instead of restarting.
        int fromIndex = 0;
        if (cursor != null && !cursor.isEmpty()) {
            Document cursorDoc = null;
            try {
                cursorDoc = Document.findById(UUID.fromString(cursor));
            } catch (IllegalArgumentException ignored) {
                cursorDoc = null;
            }
            int idx = cursorDoc != null ? allDocs.indexOf(cursorDoc) : -1;
            if (idx < 0) {
                fromIndex = allDocs.size();
            } else {
                fromIndex = idx + 1;
            }
        }
        int limitClamped = Math.max(0, limit);
        int toIndex = Math.min(fromIndex + limitClamped, allDocs.size());
        List<Document> docs = fromIndex < allDocs.size()
                ? allDocs.subList(fromIndex, toIndex) : List.of();
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
        resp.put("nextCursor", (toIndex < allDocs.size() && !docs.isEmpty())
                ? docs.get(docs.size() - 1).id.toString() : null);
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
        if (payload.containsKey("title") && payload.get("title") instanceof String v) existing.title = v;
        if (payload.containsKey("authors") && payload.get("authors") instanceof String v) existing.authors = v;
        if (payload.containsKey("publicationYear") && payload.get("publicationYear") instanceof Number v) existing.pubYear = v.intValue();
        if (payload.containsKey("journal") && payload.get("journal") instanceof String v) existing.journal = v;
        if (payload.containsKey("volume") && payload.get("volume") instanceof String v) existing.volume = v;
        if (payload.containsKey("issue") && payload.get("issue") instanceof String v) existing.issue = v;
        if (payload.containsKey("pages") && payload.get("pages") instanceof String v) existing.pages = v;
        if (payload.containsKey("doi") && payload.get("doi") instanceof String v) existing.doi = v;
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
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response addArtifact(@PathParam("id") UUID docId, @RestForm FileUpload file) throws Exception {
        Document document = Document.findById(docId);
        if (document == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Document not found")).build();
        }
        // Stage the bytes so the artifact workflow can read them by temp ref,
        // mirroring the upload-pipeline payload shape (see UploadResource).
        String tempRef = tempInput.store(Files.newInputStream(file.uploadedFile()));
        String originalFilename = file.fileName();

        WorkflowJob job = new WorkflowJob();
        job.id = UUID.randomUUID();
        job.type = WorkflowType.ADD_ARTIFACT;
        job.status = WorkflowStatus.PENDING;
        // Store the documentId + tempInputRef inside the JSON payload so the
        // workflow attaches the new artifact to the existing document and so
        // processing-history can find this job.
        job.payload = "{\"documentId\":\"" + docId + "\",\"tempInputRef\":\"" + tempRef
                + "\",\"originalFilename\":\"" + originalFilename.replace("\"", "") + "\"}";
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
