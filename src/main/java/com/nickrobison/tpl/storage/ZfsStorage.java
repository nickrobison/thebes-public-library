package com.nickrobison.tpl.storage;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.UUID;

public class ZfsStorage implements Storage {
    @Override
    public void save(UUID artifactId, InputStream data, String checksum) {
        // ZFS-backed storage architecture stub — deferred to later ingestion
    }

    @Override
    public InputStream load(UUID artifactId) {
        return new ByteArrayInputStream(new byte[0]);
    }
}
