package com.nickrobison.tpl.service;

import com.nickrobison.tpl.checksum.Blake3Checksum;
import com.nickrobison.tpl.model.Artifact;
import com.nickrobison.tpl.model.ArtifactState;
import com.nickrobison.tpl.model.Document;
import com.nickrobison.tpl.storage.FilesystemStorage;
import com.nickrobison.tpl.storage.Storage;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class ArtifactPublicationServiceIT {

    private static class FailingStorage implements Storage {
        @Override
        public void save(UUID artifactId, InputStream data, String checksum) {
            throw new RuntimeException("simulated storage failure");
        }

        @Override
        public InputStream load(UUID artifactId) {
            throw new RuntimeException("simulated storage failure");
        }
    }

    private Artifact newPendingArtifact(String filename) {
        Document doc = new Document();
        doc.id = UUID.randomUUID();
        doc.title = filename;
        doc.createdAt = Instant.now();
        doc.updatedAt = Instant.now();
        doc.persist();

        Artifact artifact = new Artifact();
        artifact.id = UUID.randomUUID();
        artifact.documentId = doc.id;
        artifact.storagePath = "storage:" + artifact.id;
        artifact.createdAt = Instant.now();
        artifact.status = ArtifactState.PENDING;
        artifact.originalFilename = filename;
        return artifact;
    }

    @Test
    @Transactional
    public void testPublishTransitionsToAvailable() throws Exception {
        Storage storage = new FilesystemStorage();
        Blake3Checksum checksum = new Blake3Checksum();
        ArtifactPublicationService service = new ArtifactPublicationService(storage, checksum);

        byte[] bytes = "%PDF-1.4 valid artifact bytes %%EOF".getBytes();
        String hash = checksum.calculate(new ByteArrayInputStream(bytes));

        Artifact artifact = newPendingArtifact("valid.pdf");
        artifact.contentChecksum = hash;
        artifact.physicalMetadataJson = "{\"size\":" + bytes.length + ",\"mimeType\":\"application/pdf\",\"blake3\":\"" + hash + "\",\"pdfVersion\":\"1.4\",\"pageCount\":1,\"encrypted\":false}";
        artifact.importProvenanceJson = "{\"mechanism\":\"WEB_UPLOAD\",\"importOperationId\":\"test\"}";
        artifact.persist();

        service.publish(artifact, new ByteArrayInputStream(bytes), hash);

        assertEquals(ArtifactState.AVAILABLE, artifact.status);
    }

    @Test
    @Transactional
    public void testChecksumMismatchTransitionsToFailed() throws Exception {
        Storage storage = new FilesystemStorage();
        ArtifactPublicationService service = new ArtifactPublicationService(storage, new Blake3Checksum());

        byte[] bytes = "%PDF-1.4 stored bytes %%EOF".getBytes();
        Artifact artifact = newPendingArtifact("mismatch.pdf");
        artifact.contentChecksum = "deadbeef";
        artifact.persist();

        Exception thrown = assertThrows(Exception.class, () ->
                service.publish(artifact, new ByteArrayInputStream(bytes), "deadbeef"));
        assertTrue(thrown.getMessage().contains("mismatch"));
        assertEquals(ArtifactState.FAILED, artifact.status);
        assertNotEquals(ArtifactState.AVAILABLE, artifact.status);
    }

    @Test
    @Transactional
    public void testStorageFailureLeavesNoAvailablePartial() {
        ArtifactPublicationService service =
                new ArtifactPublicationService(new FailingStorage(), new Blake3Checksum());

        Artifact artifact = newPendingArtifact("unreachable.pdf");
        artifact.contentChecksum = "abc123";
        artifact.persist();

        assertThrows(Exception.class, () ->
                service.publish(artifact, new ByteArrayInputStream(new byte[]{1, 2, 3}), "abc123"));
        assertNotEquals(ArtifactState.AVAILABLE, artifact.status);
    }
}
