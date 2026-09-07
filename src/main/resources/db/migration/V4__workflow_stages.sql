ALTER TABLE workflow_jobs ADD COLUMN current_stage VARCHAR(50);
ALTER TABLE workflow_jobs ADD COLUMN retry_count INTEGER DEFAULT 0;
