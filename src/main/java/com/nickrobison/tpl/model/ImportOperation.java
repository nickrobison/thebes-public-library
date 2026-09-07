package com.nickrobison.tpl.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "import_operations")
public class ImportOperation extends PanacheEntityBase {
    @Id
    public UUID id = UUID.randomUUID();
    public String mechanism; // WEB_UPLOAD or LOCAL_DIRECTORY
    public String sourcePath;
    public String originalFilename;
    public String status;
    public Instant submittedAt = Instant.now();
    public Instant completedAt;
}
