CREATE TABLE workflow_jobs (
    id UUID PRIMARY KEY,
    type VARCHAR(255),
    status VARCHAR(50),
    payload VARCHAR(1000),
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP
);
