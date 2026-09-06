package com.nickrobison.tpl.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import java.time.Instant;
import java.util.UUID;

@Entity
public class Artifact extends PanacheEntity {
    public UUID id;
    public UUID documentId;
    public String storagePath;
    public String contentChecksum;
    public Instant createdAt;
}
