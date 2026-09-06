package org.acme.search;

public class LibraryIndex {
    public void createIndex() {
        // Creates initial empty index `library-index`
        // PUT /library-index with mapping: document fields title (text) + created_at (date)
    }

    public boolean checkHealth() {
        // Reads health via GET /_cluster/health — expected status: yellow or green
        return true;
    }
}
