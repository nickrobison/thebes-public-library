package com.nickrobison.tpl.bulkimport;

import com.nickrobison.tpl.model.ImportOperation;
import com.nickrobison.tpl.workflow.WorkflowJob;
import com.nickrobison.tpl.workflow.WorkflowStatus;
import com.nickrobison.tpl.workflow.WorkflowType;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class BulkImportServiceIT {

    private Path writePdf(Path dir, String name, byte[] bytes) throws Exception {
        Path p = dir.resolve(name);
        Files.write(p, bytes);
        return p;
    }

    @Test
    @Transactional
    public void testRecursiveImportIsolatesFailures() throws Exception {
        Path dir = Files.createTempDirectory("bulk-import-test");
        try {
            byte[] valid = "%PDF-1.4 valid bulk bytes %%EOF".getBytes();
            writePdf(dir, "valid.pdf", valid);
            writePdf(dir, "corrupt.pdf", "not a pdf at all".getBytes());
            Files.write(dir.resolve("notes.txt"), "ignored".getBytes());
            Path sub = Files.createDirectory(dir.resolve("sub"));
            writePdf(sub, "nested.pdf", valid);
            try {
                Files.createSymbolicLink(dir.resolve("link.pdf"), dir.resolve("valid.pdf"));
            } catch (Exception ignored) {
            }

            List<String> before;
            try (Stream<Path> s = Files.walk(dir)) {
                before = s.map(Path::toString).sorted().toList();
            }

            BulkImportService service = new BulkImportService();
            long singlesBefore = WorkflowJob.count("type = ?1", WorkflowType.IMPORT_SINGLE);
            long pendingBefore = WorkflowJob.count("type = ?1 and status = ?2", WorkflowType.IMPORT_SINGLE, WorkflowStatus.PENDING);
            long opsBefore = ImportOperation.count();
            BulkImportResult result = service.importDirectory(dir, true);

            assertEquals(3, result.fileCount);
            assertEquals(3, result.files.size());

            WorkflowJob parent = WorkflowJob.findById(UUID.fromString(result.parentId));
            assertNotNull(parent);
            assertEquals(WorkflowType.IMPORT_BULK, parent.type);

            assertEquals(3, WorkflowJob.count("type = ?1", WorkflowType.IMPORT_SINGLE) - singlesBefore);

            ImportOperation op = ImportOperation.findById(UUID.fromString(result.parentId));
            assertNotNull(op);
            assertEquals("LOCAL_DIRECTORY", op.mechanism);
            assertEquals(dir.toString(), op.sourcePath);
            assertEquals(opsBefore + 1, ImportOperation.count());

            try (Stream<Path> s = Files.walk(dir)) {
                assertEquals(before, s.map(Path::toString).sorted().toList());
            }

            WorkflowJob oneChild = WorkflowJob.find("type = ?1 and status = ?2", WorkflowType.IMPORT_SINGLE, WorkflowStatus.PENDING).firstResult();
            assertNotNull(oneChild);
            oneChild.status = WorkflowStatus.FAILED;
            oneChild.persist();
            assertEquals(pendingBefore + 2, WorkflowJob.count("type = ?1 and status = ?2", WorkflowType.IMPORT_SINGLE, WorkflowStatus.PENDING));
        } finally {
            try (Stream<Path> s = Files.walk(dir)) {
                s.sorted(Comparator.reverseOrder()).forEach(p -> {
                    try {
                        Files.deleteIfExists(p);
                    } catch (Exception ignored) {
                    }
                });
            }
        }
    }

    @Test
    @Transactional
    public void testNonRecursiveIgnoresSubdirectory() throws Exception {
        Path dir = Files.createTempDirectory("bulk-import-flat");
        try {
            writePdf(dir, "top.pdf", "%PDF-1.4 top %%EOF".getBytes());
            Path sub = Files.createDirectory(dir.resolve("sub"));
            writePdf(sub, "nested.pdf", "%PDF-1.4 nested %%EOF".getBytes());

            BulkImportService service = new BulkImportService();
            BulkImportResult result = service.importDirectory(dir, false);

            assertEquals(1, result.fileCount);
            assertTrue(result.files.get(0).endsWith("top.pdf"));
        } finally {
            try (Stream<Path> s = Files.walk(dir)) {
                s.sorted(Comparator.reverseOrder()).forEach(p -> {
                    try {
                        Files.deleteIfExists(p);
                    } catch (Exception ignored) {
                    }
                });
            }
        }
    }
}
