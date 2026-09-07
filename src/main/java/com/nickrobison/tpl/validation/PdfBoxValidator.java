package com.nickrobison.tpl.validation;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

public class PdfBoxValidator implements PdfValidator {

    @Override
    public boolean isValid(InputStream data) {
        try {
            byte[] bytes = data.readAllBytes();
            // Structural validation: check PDF header and basic structure
            String header = new String(bytes, 0, Math.min(5, bytes.length));
            return header.startsWith("%PDF");
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public PdfValidationResult validate(InputStream data) {
        try {
            byte[] bytes = data.readAllBytes();
            String header = new String(bytes, 0, Math.min(5, bytes.length));
            if (!header.startsWith("%PDF")) {
                return new PdfValidationResult(false, "INVALID_HEADER", "Not a valid PDF file", "missing %PDF header");
            }
            // Basic structural check: has end-of-file marker
            String tail = new String(bytes, Math.max(0, bytes.length - 20), Math.min(20, bytes.length));
            boolean hasEof = tail.contains("%%EOF");
            return new PdfValidationResult(true, "VALID", "PDF structurally valid", "header=%PDF, hasEOF=" + hasEof + ", size=" + bytes.length);
        } catch (Exception e) {
            return new PdfValidationResult(false, "INVALID", "PDF not parseable", e.getMessage());
        }
    }
}
