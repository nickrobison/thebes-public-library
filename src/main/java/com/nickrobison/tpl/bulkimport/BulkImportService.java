package com.nickrobison.tpl.bulkimport;

import com.nickrobison.tpl.model.ImportOperation;
import com.nickrobison.tpl.workflow.WorkflowJob;
import com.nickrobison.tpl.workflow.WorkflowStatus;
import com.nickrobison.tpl.workflow.WorkflowType;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

public class BulkImportService {

    public BulkImportResult importDirectory(Path dir, boolean recursive) throws Exception {
        List<String> files = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(dir, recursive ? Integer.MAX_VALUE : 1)) {
            walk.filter(p -> !Files.isDirectory(p))
                .filter(p -> !Files.isSymbolicLink(p))
                .filter(p -> p.toString().endsWith(".pdf"))
                .forEach(p -> files.add(p.toString()));
        }

        WorkflowJob parent = new WorkflowJob();
        parent.id = UUID.randomUUID();
        parent.type = WorkflowType.IMPORT_BULK;
        parent.status = WorkflowStatus.PENDING;
        parent.payload = "{\"sourceDir\":\"" + dir + "\",\"recursive\":" + recursive + "}";
        parent.submittedAt = Instant.now();
        parent.persist();

        ImportOperation op = new ImportOperation();
        op.id = parent.id;
        op.mechanism = "LOCAL_DIRECTORY";
        op.sourcePath = dir.toString();
        op.status = "PENDING";
        op.submittedAt = Instant.now();
        op.persist();

        for (String filePath : files) {
            WorkflowJob child = new WorkflowJob();
            child.id = UUID.randomUUID();
            child.type = WorkflowType.IMPORT_SINGLE;
            child.status = WorkflowStatus.PENDING;
            child.payload = "{\"tempInputRef\":\"" + filePath + "\",\"originalFilename\":\"" + Paths.get(filePath).getFileName().toString() + "\",\"parentId\":\"" + parent.id + "\"}";
            child.submittedAt = Instant.now();
            child.persist();
        }

        return new BulkImportResult(parent.id.toString(), files.size(), files);
    }
}
