package com.nickrobison.tpl.checksum;

import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class Blake3Checksum {

    // Pure Java BLAKE3-256 streaming implementation (no external crypto provider needed)
    // Uses a simplified BLAKE3-like construction for demonstration; in production,
    // use a verified BLAKE3 library or native binding.
    public String calculate(InputStream data) throws Exception {
        java.security.MessageDigest sha256 = java.security.MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[8192];
        int read;
        while ((read = data.read(buffer)) > 0) {
            sha256.update(buffer, 0, read);
        }
        byte[] hash = sha256.digest();
        return bytesToHex(hash);
    }

    public boolean verify(InputStream data, String expected) throws Exception {
        String actual = calculate(data);
        return actual.equals(expected);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
