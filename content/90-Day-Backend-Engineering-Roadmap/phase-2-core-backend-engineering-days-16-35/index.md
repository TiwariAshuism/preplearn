---
source: notion
title: "Phase 2 — Core Backend Engineering (Days 16–35)"
slug: "phase-2-core-backend-engineering-days-16-35"
notionId: "358da883-bddd-818a-b9d5-f344be71afb0"
notionRootId: "358da883bddd81e1b394ca83aa7ed599"
parent: "90-day-backend-engineering-roadmap"
children: []
order: 4
icon: "⚙️"
cover: null
---
> **Goal:** Learn Go as your primary backend language, design APIs at a professional level, and build secure auth systems including DPoP — a technique most senior engineers don’t know.

---


## 🧠 Mental model


Backend engineering is not just writing functions that run on a server. It’s designing contracts between systems. REST, gRPC, GraphQL are different contract languages — each with different tradeoffs. Auth is not a feature, it’s an infrastructure layer. This phase teaches you to design, not just code.


---


## 📚 Topics in order


### Day 16–18 — Go language internals

- The G-M-P scheduler model: Goroutines (G), OS threads (M), Processors (P)
- Why goroutines are cheap (2–8KB stack, grows dynamically)
- Channels: typed, directional, buffered vs unbuffered
- `select` for multiplexing channels
- `context.Context`: cancellation propagation across goroutines
- `defer`, `panic`, `recover` — and when NOT to use them
- Interfaces as implicit contracts
- The GC: tricolor mark-and-sweep, GOGC tuning

### Day 19–20 — Go vs Node.js vs Java

- Node.js: single-threaded event loop, non-blocking I/O, JS runtime overhead
- Java: JVM startup cost, GC pauses (G1 vs ZGC), JIT compilation benefits
- Go: compiled binary, tiny runtime, predictable GC pauses, no JVM
- Memory footprint comparison: Go ~10MB idle, Node ~50MB, Java ~200MB+
- When to choose each: Go for network services, Node for I/O-heavy scripts, Java for enterprise/legacy

### Day 21–22 — REST API design

- Richardson Maturity Model: Level 0 → Level 3 (HATEOAS)
- Idempotency: GET, PUT, DELETE are idempotent. POST is not. Why this matters for retries.
- HTTP status codes used correctly: 200 vs 201 vs 204 vs 400 vs 422 vs 429 vs 503
- API versioning strategies: URL path (`/v1/`), header, query param — tradeoffs
- Pagination: cursor-based vs offset. Why offset breaks at scale.
- Error response format: RFC 7807 (Problem Details for HTTP APIs)

### Day 23–24 — gRPC deep dive

- Protocol Buffers: binary wire format, field numbers, backward compatibility rules
- The 4 streaming types: Unary, Server streaming, Client streaming, Bidirectional
- Interceptors: the middleware of gRPC (logging, auth, retry, tracing)
- Deadlines and timeouts: `ctx.WithDeadline()` propagated across service boundaries
- Status codes vs HTTP codes
- Health checking with `grpc_health_v1`
- Why Uber migrated 1,000+ services from REST to gRPC

### Day 25 — GraphQL internals

- How the execution engine resolves a query: the resolver tree
- The N+1 problem: why `author { posts { comments } }` can fire 100+ SQL queries
- DataLoader: batching and caching resolver calls
- Persisted queries: sending a hash instead of the full query document
- When NOT to use GraphQL: public APIs, simple CRUD, mobile-first (consider REST + HTTP/2)

### Day 26–27 — Auth: Sessions, Cookies, JWT

- Cookie attributes: `Secure`, `HttpOnly`, `SameSite=Lax/Strict/None`
- Session-based auth: server stores state. Scales horizontally with Redis. Token is opaque.
- JWT structure: Header.Payload.Signature. None of this is encrypted by default.
- `alg: none` attack — why you must validate the algorithm
- The JWT revocation problem: tokens are valid until expiry. Solutions: short TTL + refresh, blocklist in Redis
- Signed vs encrypted JWTs (JWS vs JWE)

### Day 28–30 — OAuth 2.0 full flows

- Authorization Code + PKCE: the modern standard. `code_challenge`, `code_verifier`.
- Client Credentials: server-to-server. No user involved.
- Device Flow: smart TVs, CLIs. Polling for authorization.
- Token introspection: resource server asks auth server to validate a token
- Refresh token rotation: each use issues a new refresh token. Old one invalidated.
- The difference between authentication (who are you?) and authorization (what can you do?)

### Day 31–32 — DPoP — RFC 9449

- The problem with bearer tokens: stolen token = stolen identity. Works from anywhere.
- DPoP concept: access token is cryptographically bound to a client’s private key
- DPoP proof structure: a signed JWT containing the HTTP method, URL, timestamp, and `jti`
- How the resource server validates a DPoP proof
- Nonce binding: server issues a nonce to prevent replay attacks
- Why this is now required for FAPI 2.0 (financial-grade APIs)
- Implementation: generating a DPoP key pair, signing proofs per request, rotating keys

### Day 33–35 — API security hardening

- Rate limiting per identity, per IP, per endpoint — different strategies
- CORS internals: preflight requests, wildcard origin risks
- SSRF prevention: validating URLs before making outbound requests
- Input validation at the boundary: never trust request data deeper than the handler
- SQL injection: why parameterized queries are not optional
- Secrets in environment variables: the wrong way and the right way (Vault)

---


## 🔨 Projects


### Project 1 — Production-grade REST API in Go


**Stack:** Go, `gin`, PostgreSQL, Redis, JWT, `zap` logger


Hexagonal architecture (ports and adapters). Domain layer has no framework imports. JWT auth with 15-minute access token and 7-day refresh token stored in Redis. Rate limiting per user ID (100 req/min). Structured JSON logging with request IDs. Graceful shutdown with `signal.NotifyContext`. Full error handling with RFC 7807 responses.


**Deliverable:** A fully deployable Go service with Dockerfile, proper error handling, and a Postman collection proving all endpoints work.


### Project 2 — gRPC service with TLS + interceptors


**Stack:** Go, `grpc-go`, `protobuf`, self-signed TLS certs


User service with 4 endpoints: `CreateUser`, `GetUser`, `ListUsers`, `DeleteUser`. Chain of interceptors: (1) logging with request duration, (2) auth token validation, (3) retry on `UNAVAILABLE`. Client uses `grpcurl` for manual testing. Server uses reflection for discovery.


**Deliverable:** `grpcurl -plaintext localhost:50051 describe` shows your service schema. All 4 methods work with proper status code responses.


### Project 3 — OAuth 2.0 + DPoP authorization server


**Stack:** Go, Redis, RSA/EC key generation, RFC 9449


Implement the Auth Code + PKCE flow end-to-end. Issue access tokens that are DPoP-bound: the token contains a confirmation (`cnf`) claim with the public key thumbprint. On the resource server, validate the DPoP proof JWT on every request: check HTTP method, URL, `iat` (timestamp), `jti` (unique ID, stored in Redis to prevent replay).


**Deliverable:** A Postman collection that demonstrates: (1) standard bearer token gets rejected by resource server, (2) DPoP-bound token only works with the matching private key.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Using goroutines as if they’re free.**


Each goroutine starts at 2KB and can grow to gigabytes. A goroutine that never exits is a memory leak. A server that spawns a goroutine per request without bounding them will OOM under load.


**✅ Mental model:** Use `context.Context` for cancellation. Use `sync.WaitGroup` to wait for completion. Use worker pools to bound concurrency. Use `goleak` in tests to catch goroutine leaks.


### Mistake 2


**❌ Storing JWT signing secrets in config files or environment variables.**


Config files end up in git. Env vars appear in process dumps and CI logs. A leaked signing secret means every token ever issued is compromised.


**✅ Mental model:** JWT keys should be managed by a secrets system (HashiCorp Vault, AWS Secrets Manager) and rotated regularly. Prefer asymmetric keys (RS256/ES256) so the public key can be published via JWKS without exposing the signing key.


### Mistake 3


**❌ Using bearer tokens without DPoP for financial or high-security APIs.**


A stolen bearer token works from any machine, any IP, any client. Bearer tokens stolen from logs, proxies, or MITM attacks can be replayed.


**✅ Mental model:** DPoP binds the token to the holder’s private key. The token becomes a “proof-of-possession” credential. Stealing the token without the private key is useless. This is why OAuth 2.0 FAPI 2.0 mandates DPoP.


### Mistake 4


**❌ Designing REST endpoints as RPC calls.**


`/getUser`, `/createOrder`, `/deleteProduct` is RPC masquerading as REST. You lose all the semantic benefits of HTTP: caching, idempotency semantics, method-based routing.


**✅ Mental model:** REST models resources, not actions. `GET /users/123`, `POST /orders`, `DELETE /products/456`. Actions that don't fit become state transitions: `POST /orders/456/cancel` (transitioning to cancelled state).


---


## 🏢 How real companies solved this


**Stripe:** Their API versioning strategy (date-based versions pinned per API key) is the industry gold standard. Every breaking change gets a new YYYY-MM-DD version. Existing integrations never break. This requires maintaining multiple API response formats simultaneously — a significant engineering investment that they view as a product moat.


**Uber:** Migrated from REST to gRPC across 1,000+ microservices. The key ROI: strongly typed Protobuf contracts eliminated entire classes of production bugs caused by undocumented REST API changes. They saw 30% reduction in serialization overhead.


**Auth0 / Okta:** DPoP adoption is now required for financial-grade APIs (FAPI 2.0). Auth0 shipped DPoP support and documented the implementation in detail. If you’re building fintech auth, DPoP is mandatory, not optional.


**GitHub:** Migrated from REST to GraphQL for their public API v4. They solved N+1 with DataLoader. Then found that introspection queries were expensive at scale and introduced query complexity limits and persisted queries. The lesson: GraphQL requires active performance management.


---


## 📝 Detailed notes by topic


### Day 16–18 — Go language internals


**Core mental model:** Go is built for network services: cheap concurrency, fast startup, simple deployment, and explicit error handling. Learn the runtime because production bugs often happen at the boundary between goroutines, memory, cancellation, and I/O.


**G-M-P scheduler:** Goroutines (G) are scheduled onto OS threads (M) through logical processors (P). A P owns runnable goroutine queues and enables Go to multiplex many goroutines over fewer OS threads. This is why Go can handle many concurrent requests without creating one expensive OS thread per request.


**Goroutines:** They start with small stacks that grow as needed, but they are not free. Goroutines blocked forever on channels, timers, network calls, or missing cancellation are memory leaks. Every goroutine should have an exit path.


**Channels and select:** Channels coordinate ownership and communication. Use unbuffered channels for handoff and buffered channels for bounded queues. `select` lets one goroutine wait on multiple channel operations, especially cancellation through `ctx.Done()`.


**Context:** `context.Context` carries cancellation, deadlines, and request-scoped values across goroutines and service boundaries. Do not store it in structs. Pass it as the first parameter to functions that do I/O or may block.


**Interfaces:** Interfaces are implicit contracts. Prefer small interfaces defined near the consumer. This keeps tests simple and prevents framework-style abstractions too early.


**GC:** Go uses concurrent mark-and-sweep GC. Lower allocation rates usually matter more than tuning. Tune `GOGC` only after profiling.


**Practice:** Build a worker pool with context cancellation, a timeout, graceful shutdown, and tests that prove all goroutines exit.


### Day 19–20 — Go vs Node.js vs Java


**Core mental model:** Language choice is an operational decision, not only a syntax preference.


**Node.js:** Excellent for I/O-heavy workloads and frontend-adjacent teams. The event loop is efficient, but CPU-heavy work blocks unless moved to workers or separate services. Package and runtime complexity can become operational overhead.


**Java:** Strong ecosystem, mature observability, excellent performance after warmup, and great for large enterprise systems. JVM startup, memory overhead, and GC tuning are the common costs.


**Go:** Small static binaries, fast startup, simple deployment, good concurrency, and predictable performance. Tradeoffs include less expressive type-system features than Java/Scala and manual care around error handling and shared memory.


**Decision frame:** Choose Go for API services, proxies, CLIs, infrastructure tools, and network-heavy systems. Choose Java when ecosystem maturity, JVM tooling, or existing enterprise architecture dominates. Choose Node when product velocity and JavaScript ecosystem alignment matter most.


### Day 21–22 — REST API design


**Core mental model:** REST is about resources, representations, and HTTP semantics. Good API design makes retries, caching, pagination, errors, and versioning predictable.


**Resource design:** Use nouns, not verbs: `GET /users/123`, `POST /orders`, `DELETE /sessions/current`. Actions that do not map cleanly can be modeled as state transitions, such as `POST /orders/123/cancel`.


**Idempotency:** Idempotent operations can be retried safely because repeated execution has the same effect. `GET`, `PUT`, and `DELETE` should be idempotent. `POST` is normally not, so payment/order APIs use idempotency keys.


**Status codes:** Use `201` for created, `204` for successful no-body responses, `400` for malformed requests, `401` unauthenticated, `403` unauthorized, `409` conflict, `422` semantically invalid data, `429` rate limited, and `503` unavailable.


**Pagination:** Offset pagination becomes slow and inconsistent at scale. Cursor pagination uses stable ordering and a cursor from the last item seen.


**Errors:** RFC 7807 Problem Details gives clients a consistent structure: `type`, `title`, `status`, `detail`, and optional fields.


**Practice:** Design a `users/orders/payments` API and write retry behavior for each endpoint.


### Day 23–24 — gRPC deep dive


**Core mental model:** gRPC is contract-first RPC over HTTP/2 with Protobuf. It shines for internal service-to-service communication where strong typing and performance matter.


**Protobuf:** Field numbers are the wire contract. Never reuse removed field numbers. Add fields as optional-compatible changes. Renaming a field is usually safe on the wire, but changing field meaning is dangerous.


**Streaming:** Unary is request-response. Server streaming sends many responses. Client streaming sends many requests. Bidirectional streaming lets both sides send independently.


**Deadlines:** Every RPC should have a deadline. Deadlines propagate downstream so a slow dependency does not continue work after the caller has given up.


**Interceptors:** Use for cross-cutting behavior such as auth, logging, metrics, tracing, validation, and retries.


**Status codes:** Return typed gRPC status codes instead of random strings. Map domain errors intentionally.


**Practice:** Build one service with unary and streaming endpoints, then inspect it with `grpcurl`.


### Day 25 — GraphQL internals


**Core mental model:** GraphQL gives clients flexible querying, but the server pays the complexity cost.


**Resolver tree:** Each field can trigger a resolver. Nested queries can explode into many backend/database calls.


**N+1 problem:** If each parent row triggers a child lookup, one query becomes hundreds. DataLoader batches and caches lookups within a request.


**Operational controls:** Use persisted queries, depth limits, complexity scoring, timeouts, and auth checks at resolver boundaries.


**When to avoid:** Do not use GraphQL just for CRUD or public APIs where caching, simplicity, and HTTP semantics are more valuable.


### Day 26–27 — Auth: Sessions, Cookies, JWT


**Core mental model:** Authentication proves who the user is. Authorization decides what they can do. Session design is about state, revocation, and compromise impact.


**Cookies:** `HttpOnly` blocks JavaScript access. `Secure` requires HTTPS. `SameSite` reduces CSRF. Cookie-based auth must still handle CSRF correctly.


**Sessions:** Server stores state; client holds opaque session ID. Easy revocation and rotation. Horizontal scaling needs shared storage such as Redis or sticky sessions, with Redis preferred.


**JWT:** Signed claims carried by the client. Good for distributed validation, but revocation is hard. JWT payload is not encrypted unless using JWE. Always validate signature, issuer, audience, expiry, and algorithm.


**Safe pattern:** Short-lived access token, refresh token rotation, Redis/session store for refresh tokens, and JWKS for public-key validation.


### Day 28–30 — OAuth 2.0 full flows


**Core mental model:** OAuth is delegated authorization. It lets a client obtain limited access without handling the user’s password.


**Authorization Code + PKCE:** Best default for user-facing apps. PKCE prevents intercepted authorization codes from being exchanged by attackers.


**Client Credentials:** Server-to-server auth where the client itself is the principal.


**Device Flow:** Useful for CLIs, TVs, and limited-input devices.


**Refresh rotation:** Each refresh use returns a new refresh token and invalidates the old one. Reuse of an old token signals theft.


**Token introspection:** Resource server asks authorization server whether a token is active and what it represents. Useful for opaque tokens.


### Day 31–32 — DPoP — RFC 9449


**Core mental model:** Bearer tokens work like cash. Whoever has the token can use it. DPoP turns the access token into proof-of-possession by binding it to a private key.


**How it works:** Client generates a key pair. During token issuance, the access token includes a confirmation claim tied to the client public key thumbprint. For every API request, the client signs a DPoP proof JWT containing method, URL, timestamp, and unique `jti`.


**Validation:** The resource server verifies the proof signature, checks `htm`, `htu`, `iat`, `jti`, optional nonce, and confirms the proof key matches the access token `cnf` claim.


**Replay defense:** Store `jti` values temporarily and reject reuse. Use server-provided nonces for stronger replay protection.


### Day 33–35 — API security hardening


**Core mental model:** Security belongs at every boundary: request parsing, authentication, authorization, outbound calls, database access, logs, and secrets.


**Rate limiting:** Apply different limits per IP, user, token, route, and organization. Auth endpoints need stricter limits than normal reads.


**CORS:** CORS is browser protection, not backend auth. Wildcard origins with credentials are dangerous.


**SSRF:** Validate outbound URLs by scheme, host, resolved IP, redirects, and private network ranges.


**SQL injection:** Always use parameterized queries. Do not build SQL with string concatenation.


**Secrets:** Prefer secret managers and short-lived credentials. Avoid leaking tokens in logs, errors, metrics, and crash reports.


## Phase 2 mastery checklist

- Explain goroutine scheduling and cancellation.
- Design REST endpoints with correct methods, status codes, errors, and pagination.
- Build gRPC services with deadlines and interceptors.
- Explain JWT revocation tradeoffs.
- Implement OAuth Authorization Code + PKCE.
- Validate a DPoP-bound request end to end.
- Threat-model API inputs, outbound URLs, secrets, and logs.

## 📖 Resources

- _The Go Programming Language_ — Donovan & Kernighan
- _Learning Go_ — Jon Bodner (more modern, covers generics)
- RFC 6749 — OAuth 2.0 (read it, don’t just use a library)
- RFC 9449 — DPoP (read the full spec, 20 pages)
- Stripe API docs — study as a REST API design reference
- `grpc-go` examples on GitHub
