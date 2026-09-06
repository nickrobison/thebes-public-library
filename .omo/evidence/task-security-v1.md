v1 Security Boundary (quoted from AQASbQ)
- Operating assumptions: single trusted user; LAN; VPN for remote; no auth; no hostile-local-user
- Least-privilege: non-root OS account (USER 185 in Dockerfile.jvm); services deliberately bound to 0.0.0.0:8080; no namespaces/systemd sandbox required for Phase 0 (deferred)
- No auth framework added (verified: grep empty)
