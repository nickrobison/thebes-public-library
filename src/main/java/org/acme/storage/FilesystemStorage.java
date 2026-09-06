package org.acme.storage;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.UUID;

public class FilesystemStorage implements Storage {
    @Override
    public void save(UUID artifactId, InputStream data, String checksum) {
        // Dev/test path: target/storage/ or ~/.thebes/storage
    }

    @Override
    public InputStream load(UUID artifactId) {
        return new ByteArrayInputStream(new byte[0]);
    }
}
