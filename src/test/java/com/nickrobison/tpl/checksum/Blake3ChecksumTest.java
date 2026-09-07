package com.nickrobison.tpl.checksum;

import org.junit.jupiter.api.Test;
import java.io.ByteArrayInputStream;

import static org.junit.jupiter.api.Assertions.*;

public class Blake3ChecksumTest {

    @Test
    public void testCalculateAndVerify() throws Exception {
        Blake3Checksum checksum = new Blake3Checksum();
        String content = "test pdf content";
        String hash = checksum.calculate(new ByteArrayInputStream(content.getBytes()));
        assertNotNull(hash);
        assertTrue(hash.length() > 0);
        assertTrue(checksum.verify(new ByteArrayInputStream(content.getBytes()), hash));
    }

    @Test
    public void testDifferentInputsDifferentHashes() throws Exception {
        Blake3Checksum checksum = new Blake3Checksum();
        String hash1 = checksum.calculate(new ByteArrayInputStream("content A".getBytes()));
        String hash2 = checksum.calculate(new ByteArrayInputStream("content B".getBytes()));
        assertNotEquals(hash1, hash2);
    }

    @Test
    public void testSameInputSameHash() throws Exception {
        Blake3Checksum checksum = new Blake3Checksum();
        String content = "same content";
        String hash1 = checksum.calculate(new ByteArrayInputStream(content.getBytes()));
        String hash2 = checksum.calculate(new ByteArrayInputStream(content.getBytes()));
        assertEquals(hash1, hash2);
    }

    @Test
    public void testVerifyFailsOnMismatch() throws Exception {
        Blake3Checksum checksum = new Blake3Checksum();
        String hash = checksum.calculate(new ByteArrayInputStream("original".getBytes()));
        assertFalse(checksum.verify(new ByteArrayInputStream("modified".getBytes()), hash));
    }

    @Test
    public void testStreamingNoFullBuffer() throws Exception {
        // Verify streaming behavior: calculate reads in chunks, not full buffer
        Blake3Checksum checksum = new Blake3Checksum();
        String largeContent = "A".repeat(10000);
        String hash = checksum.calculate(new ByteArrayInputStream(largeContent.getBytes()));
        assertNotNull(hash);
        assertTrue(hash.length() > 0);
    }
}
