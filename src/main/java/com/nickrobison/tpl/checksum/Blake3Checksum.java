package com.nickrobison.tpl.checksum;

import jakarta.enterprise.context.ApplicationScoped;

import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

@ApplicationScoped
public class Blake3Checksum {

    // NOTE: despite the class name, this currently computes SHA-256, not BLAKE3.
    // It is a stable streaming digest and is self-consistent for integrity checks,
    // but the `blake3` field name in artifact metadata is misleading. Swap in a
    // verified BLAKE3 implementation before treating the digest as BLAKE3 anywhere.
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
