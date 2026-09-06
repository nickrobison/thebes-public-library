PASS — W2 Storage + Elasticsearch
- `Storage.java`: interface with `void save(UUID, InputStream, String)` + `InputStream load(UUID)`
- `FilesystemStorage.java`: implements Storage (dev/test path)
- `ZfsStorage.java`: stub implementing Storage (architecture boundary)
- `LibraryIndex.java`: creates index; health check method
- `pom.xml`: added `quarkus-elasticsearch-rest-client`
- `application.properties`: added `quarkus.elasticsearch.hosts=http://localhost:9200`
- `mvnw verify -DskipTests`: BUILD SUCCESS
- No deferred features inserted; no auth framework
