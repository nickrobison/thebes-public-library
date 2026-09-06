package org.acme.storage;

import java.io.InputStream;
import java.util.UUID;

public interface Storage {
    void save(UUID artifactId, InputStream data, String checksum);
    InputStream load(UUID artifactId);
}
