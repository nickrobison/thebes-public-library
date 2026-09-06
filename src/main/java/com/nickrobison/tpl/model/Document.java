package com.nickrobison.tpl.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import java.time.Instant;
import java.util.UUID;

@Entity
public class Document extends PanacheEntity {
    public UUID id;
    public String title;
    public Instant createdAt;
    public Instant updatedAt;
}
