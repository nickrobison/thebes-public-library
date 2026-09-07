package com.nickrobison.tpl.workflow;

import com.nickrobison.tpl.bulkimport.BulkImportResult;
import com.nickrobison.tpl.bulkimport.BulkImportService;
import jakarta.enterprise.context.ApplicationScoped;
import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;

@ApplicationScoped
public class BulkImportWorkflow {

    private final BulkImportService bulkImportService = new BulkImportService();

    public BulkImportResult run(Path dir, boolean recursive) throws Exception {
        BulkImportResult result = bulkImportService.importDirectory(dir, recursive);

        WorkflowJob parent = WorkflowJob.findById(UUID.fromString(result.parentId));
        if (parent != null) {
            parent.status = WorkflowStatus.COMPLETED;
            parent.completedAt = Instant.now();
            parent.persist();
        }
        return result;
    }

    public long countChildren(UUID parentId, WorkflowStatus status) {
        return WorkflowJob.count("type = ?1 and status = ?2", WorkflowType.IMPORT_SINGLE, status);
    }
}
