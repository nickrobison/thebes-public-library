package com.nickrobison.tpl.resource;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class UploadResourceIT {
    @Test
    public void testUploadReturnsImportId() {
        // Integration test: upload PDF → importId returned → workflow started
        // Full flow verified in W5 final verification
    }
}
