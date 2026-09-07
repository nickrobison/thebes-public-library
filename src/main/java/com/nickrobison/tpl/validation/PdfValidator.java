package com.nickrobison.tpl.validation;

import java.io.InputStream;

public interface PdfValidator {
    boolean isValid(InputStream data);
    PdfValidationResult validate(InputStream data);
}
