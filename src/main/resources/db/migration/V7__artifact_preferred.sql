ALTER TABLE artifacts ADD COLUMN is_preferred BOOLEAN DEFAULT FALSE;
CREATE UNIQUE INDEX uq_preferred_per_doc ON artifacts (document_id) WHERE is_preferred;