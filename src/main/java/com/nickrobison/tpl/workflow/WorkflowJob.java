package com.nickrobison.tpl.workflow;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_jobs")
public class WorkflowJob extends PanacheEntityBase {
    @Id
    public UUID id = UUID.randomUUID();
    @Enumerated(EnumType.STRING)
    public WorkflowType type;
    @Enumerated(EnumType.STRING)
    public WorkflowStatus status;
    public String payload;
    public String failureReason;
    public String currentStage;
    public int retryCount = 0;
    public Instant submittedAt;
    public Instant completedAt;

    public static WorkflowJob findById(UUID id) {
        return find("id", id).firstResult();
    }
}
