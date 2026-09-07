package com.nickrobison.tpl.bulkimport;

import com.nickrobison.tpl.workflow.BulkImportWorkflow;
import com.nickrobison.tpl.workflow.WorkflowJob;
import com.nickrobison.tpl.workflow.WorkflowType;
import com.nickrobison.tpl.workflow.WorkflowStatus;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public class BulkImportService {

    public BulkImportResult importDirectory(Path dir, boolean recursive) throws Exception {
        List<String> files = new ArrayList<>();
        Files.walk(dir, recursive ? Integer.MAX_VALUE : 1)
            .filter(p -> p.toString().endsWith(".pdf"))
            .filter(p -> !Files.isSymbolicLink(p))
            .forEach(p -> files.add(p.toString()));

        BulkImportWorkflow parent = new BulkImportWorkflow();
        parent.id = java.util.UUID.randomUUID();
        parent.type = WorkflowType.IMPORT_BULK;
        parent.status = WorkflowStatus.PENDING;
        parent.submittedAt = java.time.Instant.now();
        parent.persist();

        for (String filePath : files) {
            WorkflowJob child = new WorkflowJob();
            child.id = java.util.UUID.randomUUID();
            child.type = WorkflowType.IMPORT_SINGLE;
            child.status = WorkflowStatus.PENDING;
            child.payload = "{\"tempInputRef\":\"" + filePath + "\",\"originalFilename\":\"" + java.nio.file.Paths.get(filePath).getFileName().toString() + "\"}";
            child.submittedAt = java.time.Instant.now();
            child.persist();
        }

        return new BulkImportResult(parent.id.toString(), files.size(), files);
    }
}

class BulkImportResult {
    public String parentId;
    public int fileCount;
    public List<String> files;

    public BulkImportResult(String parentId, int fileCount, List<String> files) {
        this.parentId = parentId;
        this.fileCount = fileCount;
        this.files = files;
    }
}
