package com.nickrobison.tpl.bulkimport;

import java.util.List;

public class BulkImportResult {
    public final String parentId;
    public final int fileCount;
    public final List<String> files;

    public BulkImportResult(String parentId, int fileCount, List<String> files) {
        this.parentId = parentId;
        this.fileCount = fileCount;
        this.files = files;
    }
}
