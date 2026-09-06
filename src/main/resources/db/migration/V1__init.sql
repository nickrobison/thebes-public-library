CREATE TABLE documents (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    created_at TIMESTAMP
);

CREATE TABLE artifacts (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES documents(id),
    storage_path VARCHAR(500),
    content_checksum VARCHAR(255),
    created_at TIMESTAMP
);
