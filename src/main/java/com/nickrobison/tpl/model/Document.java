package com.nickrobison.tpl.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents")
public class Document extends PanacheEntityBase {
    @Id
    public UUID id = UUID.randomUUID();
    public String title;
    public Instant createdAt;
    public Instant updatedAt;
}
