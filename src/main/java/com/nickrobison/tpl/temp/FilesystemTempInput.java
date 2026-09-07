package com.nickrobison.tpl.temp;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Filesystem implementation of TempInput.
 * Dev path: target/temp-input/ or ~/.thebes/temp-input/ (via TEMP_INPUT_DIR env).
 */
@ApplicationScoped
public class FilesystemTempInput implements TempInput {

    private Path tempDir;

    @PostConstruct
    void init() {
        String envPath = System.getenv("TEMP_INPUT_DIR");
        if (envPath != null && !envPath.isBlank()) {
            tempDir = Paths.get(envPath);
        } else {
            tempDir = Paths.get("target/temp-input");
        }
        try {
            Files.createDirectories(tempDir);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create temp input directory: " + tempDir, e);
        }
    }

    @Override
    public String store(InputStream data) throws TempInputException {
        String ref = UUID.randomUUID().toString();
        Path target = tempDir.resolve(ref);
        try {
            Files.copy(data, target, StandardCopyOption.REPLACE_EXISTING);
            return ref;
        } catch (IOException e) {
            throw new TempInputException("Failed to store temp input: " + ref, e);
        }
    }

    @Override
    public InputStream load(String ref) {
        try {
            return Files.newInputStream(tempDir.resolve(ref));
        } catch (IOException e) {
            throw new RuntimeException("Failed to load temp input: " + ref, e);
        }
    }

    @Override
    public void cleanup(String ref) {
        try {
            Files.deleteIfExists(tempDir.resolve(ref));
        } catch (IOException e) {
            // Best-effort cleanup; log but don't fail
        }
    }
}
