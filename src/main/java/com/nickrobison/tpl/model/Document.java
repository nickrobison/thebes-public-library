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
    public String authors;
    public Integer pubYear;
    public String journal;
    public String volume;
    public String issue;
    public String pages;
    public String doi;
    public int version = 1;
    public Instant createdAt;
    public Instant updatedAt;
    public String processingStatus = "PENDING";
}
