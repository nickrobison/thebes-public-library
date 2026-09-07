v1 Security Boundary (quoted from AQASbQ)
- Operating assumptions: single trusted user; LAN; VPN for remote; no auth; no hostile-local-user
- Least-privilege: non-root OS account (USER 185 in Dockerfile.jvm); services deliberately bound to 0.0.0.0:8080; no namespaces/systemd sandbox required for Phase 0 (deferred)
- No auth framework added (verified: grep empty)

Phase 1 affirmation (2026-09-07): same v1 posture. Phase 1 adds no auth framework (narrowed pom grep → empty), no user identity, no session handling. Upload/bulk-import endpoints are intentionally unauthenticated per v1 LAN/trusted-user assumptions. Import provenance records mechanism, never credentials.
