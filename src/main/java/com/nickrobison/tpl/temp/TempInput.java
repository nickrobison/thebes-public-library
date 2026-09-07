package com.nickrobison.tpl.temp;

import java.io.InputStream;

/**
 * Temporary input abstraction for staging uploaded files before import workflow processing.
 * Temp refs never escape as Artifact storage refs (decision #5).
 * Cleanup contract: cleanup on success AND terminal failure (no orphan temp bytes).
 */
public interface TempInput {
    /**
     * Store input stream to temporary location.
     * @return opaque temp reference string
     */
    String store(InputStream data) throws TempInputException;

    /**
     * Load previously stored temp input by reference.
     */
    InputStream load(String ref);

    /**
     * Remove temp input by reference. Called on success and terminal failure.
     */
    void cleanup(String ref);
}
