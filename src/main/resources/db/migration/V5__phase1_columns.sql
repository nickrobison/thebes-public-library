ALTER TABLE documents ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE artifacts ADD COLUMN status VARCHAR(50);
ALTER TABLE artifacts ADD COLUMN original_filename VARCHAR(500);
ALTER TABLE artifacts ADD COLUMN physical_metadata_json VARCHAR(4000);
ALTER TABLE artifacts ADD COLUMN import_provenance_json VARCHAR(2000);
ALTER TABLE artifacts ADD COLUMN failure_reason VARCHAR(1000);
CREATE TABLE import_operations (
    id UUID PRIMARY KEY,
    mechanism VARCHAR(50),
    source_path VARCHAR(1000),
    original_filename VARCHAR(500),
    status VARCHAR(50),
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP
);
