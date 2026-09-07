package com.nickrobison.tpl.service;

import com.nickrobison.tpl.model.Artifact;
import com.nickrobison.tpl.model.ArtifactState;
import com.nickrobison.tpl.storage.Storage;
import com.nickrobison.tpl.checksum.Blake3Checksum;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.InputStream;

@ApplicationScoped
public class ArtifactPublicationService {

    private final Storage storage;
    private final Blake3Checksum checksum;

    public ArtifactPublicationService(Storage storage) {
        this.storage = storage;
        this.checksum = new Blake3Checksum();
    }

    public void publish(Artifact artifact, InputStream data, String checksumValue) throws Exception {
        // Write to Storage via interface ONLY (opacity assertion: no impl imports)
        storage.save(artifact.id, data, checksumValue);

        // Verify BLAKE3 integrity by loading stored copy
        InputStream loaded = storage.load(artifact.id);
        String loadedHash = checksum.calculate(loaded);

        if (!loadedHash.equals(checksumValue)) {
            artifact.status = ArtifactState.FAILED;
            artifact.failureReason = "BLAKE3 checksum mismatch after storage";
            artifact.persist();
            throw new Exception("BLAKE3 checksum mismatch: expected=" + checksumValue + ", actual=" + loadedHash);
        }

        // Transition to AVAILABLE only after complete bytes stored + integrity verified
        artifact.status = ArtifactState.AVAILABLE;
        artifact.persist();
    }
}
