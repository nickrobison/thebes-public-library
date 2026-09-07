package com.nickrobison.tpl.validation;

public class PdfValidationResult {
    private boolean valid;
    private String code;
    private String message;
    private String details;

    public PdfValidationResult(boolean valid, String code, String message, String details) {
        this.valid = valid;
        this.code = code;
        this.message = message;
        this.details = details;
    }

    public boolean isValid() { return valid; }
    public String getCode() { return code; }
    public String getMessage() { return message; }
    public String getDetails() { return details; }
}
