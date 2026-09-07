package com.nickrobison.tpl.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "artifacts")
public class Artifact extends PanacheEntityBase {
    @Id
    public UUID id = UUID.randomUUID();
    public UUID documentId;
    public String storagePath;
    public String contentChecksum;
    @Enumerated(EnumType.STRING)
    public ArtifactState status = ArtifactState.PENDING;
    public String originalFilename;
    public String physicalMetadataJson;
    public String importProvenanceJson;
    public String failureReason;
    public boolean isPreferred = false;
    public Instant createdAt;
}
