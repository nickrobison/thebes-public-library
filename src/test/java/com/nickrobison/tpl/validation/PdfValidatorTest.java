package com.nickrobison.tpl.validation;

import org.junit.jupiter.api.Test;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;

public class PdfValidatorTest {

    @Test
    public void testValidPdf() throws Exception {
        // Create a minimal valid PDF for testing
        byte[] pdfBytes = new byte[]{0x25, 0x50, 0x44, 0x46}; // %PDF header
        PdfValidator validator = new PdfBoxValidator();
        assertTrue(validator.isValid(new ByteArrayInputStream(pdfBytes)));
    }

    @Test
    public void testInvalidPdf() throws Exception {
        PdfValidator validator = new PdfBoxValidator();
        assertFalse(validator.isValid(new ByteArrayInputStream("not a pdf".getBytes())));
    }

    @Test
    public void testEmptyStream() throws Exception {
        PdfValidator validator = new PdfBoxValidator();
        assertFalse(validator.isValid(new ByteArrayInputStream(new byte[0])));
    }

    @Test
    public void testValidateReturnsStructuredResult() throws Exception {
        PdfValidator validator = new PdfBoxValidator();
        PdfValidationResult result = validator.validate(new ByteArrayInputStream("not pdf".getBytes()));
        assertNotNull(result);
        assertNotNull(result.getCode());
        assertNotNull(result.getMessage());
    }
}
