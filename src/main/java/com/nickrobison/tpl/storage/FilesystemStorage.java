package com.nickrobison.tpl.storage;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@ApplicationScoped
public class FilesystemStorage implements Storage {
    private final Path baseDir = Paths.get("target/storage");

    private Path resolve(UUID artifactId) {
        return baseDir.resolve(artifactId.toString());
    }

    @Override
    public void save(UUID artifactId, InputStream data, String checksum) {
        try {
            Files.createDirectories(baseDir);
            Files.copy(data, resolve(artifactId), StandardCopyOption.REPLACE_EXISTING);
        } catch (Exception e) {
            throw new RuntimeException("FilesystemStorage.save failed for " + artifactId, e);
        }
    }

    @Override
    public InputStream load(UUID artifactId) {
        try {
            return Files.newInputStream(resolve(artifactId));
        } catch (Exception e) {
            throw new RuntimeException("FilesystemStorage.load failed for " + artifactId, e);
        }
    }
}
