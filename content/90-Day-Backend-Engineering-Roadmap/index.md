---
source: notion
title: "🖥️ 90-Day Backend Engineering Roadmap"
slug: "90-day-backend-engineering-roadmap"
notionId: "358da883bddd81e1b394ca83aa7ed599"
notionRootId: "358da883bddd81e1b394ca83aa7ed599"
parent: null
children: ["phase-4-infrastructure-and-devops-days-56-75","phase-5-expert-systems-days-76-90","phase-3-databases-and-distributed-systems-days-36-55","phase-1-foundations-days-1-15","phase-2-core-backend-engineering-days-16-35"]
order: 0
icon: "🖥️"
cover: null
---
> 🎯 **Frontend → Backend transition roadmap.** 90 days. 5 phases. Production-grade systems thinking.

---


## 📌 How to use this template

- Work through phases **in order** — each phase is a prerequisite for the next
- Every day: read the topic → build something → note your mistakes
- Use the **Tracker database** to log daily progress
- Open each **Phase page** for full topic breakdowns, projects, and real-system references

---


## 🗺️ Roadmap overview


| Phase                                     | Days       | Focus                              | Status         |
| ----------------------------------------- | ---------- | ---------------------------------- | -------------- |
| Phase 1 — Foundations                     | Days 1–15  | TCP/IP, HTTP, OS, TLS, DNS         | 🔘 Not started |
| Phase 2 — Core Backend                    | Days 16–35 | Go, REST, gRPC, Auth, DPoP         | 🔘 Not started |
| Phase 3 — Databases & Distributed Systems | Days 36–55 | PostgreSQL, Kafka, CAP, Raft       | 🔘 Not started |
| Phase 4 — Infrastructure & DevOps         | Days 56–75 | K8s, Terraform, Vault, mTLS        | 🔘 Not started |
| Phase 5 — Expert Systems                  | Days 76–90 | Observability, SLOs, System Design | 🔘 Not started |


---


## ⚡ The master prompt

<details>
<summary>Copy this prompt into a new Claude session for a custom deep-dive</summary>

Act as a Staff Backend Engineer with 10+ years of production experience at companies like HashiCorp, AWS, and Stripe. I am a frontend engineer transitioning to backend/systems engineering. Generate a strict 90-day, phase-based roadmap structured as: Phase 1 Foundations (Days 1–15), Phase 2 Core Backend (Days 16–35), Phase 3 Databases & Distributed Systems (Days 36–55), Phase 4 Infrastructure & Cloud-Native (Days 56–75), Phase 5 Expert Systems (Days 76–90). For each phase, give me: (1) exact topics in learning order with sub-topics, (2) 2–3 concrete production-grade projects with tech stack and deliverables, (3) 3–5 common beginner mistakes with the correct mental model, (4) how a real company (AWS/Uber/HashiCorp/Cloudflare) solved this exact problem at scale, (5) interview-level depth on key concepts.


</details>


---


## 📊 My progress

- Current phase: **Phase 1**
- Current day: **Day 1 of 90**
- Projects completed: **0 / 12**
- Streak: **0 days**

---


## 🔖 Quick links

- 📘 [Phase 1 — Foundations](#)
- ⚙️ [Phase 2 — Core Backend](#)
- 🗄️ [Phase 3 — Databases & Distributed Systems](#)
- 🏗️ [Phase 4 — Infrastructure & DevOps](#)
- 🧠 [Phase 5 — Expert Systems](#)

📅 Daily Progress Tracker


## Phase 1 — Foundations (Days 1–15)
> **Goal:** Understand how computers and networks actually communicate before writing a single line of backend code. Everything in backend engineering — latency, reliability, security — traces back to these fundamentals.

---


## 🧠 Mental model


You've been building on top of abstractions your whole career. HTTP, fetch(), WebSockets — these all feel like magic. Phase 1 is about pulling back the curtain. When you finish this phase, you'll be able to trace exactly what happens — at the byte level — when a user clicks a button in your app.


---


## 📚 Topics in order


### Day 1–2 — How the internet works

- Packets, routing, BGP intuition
- ISPs, hops, traceroute
- IP addressing (CIDR notation, subnets)
- Why latency exists: physical speed-of-light constraints

### Day 3–4 — TCP vs UDP

- TCP 3-way handshake (SYN → SYN-ACK → ACK)
- Sequence numbers and acknowledgements
- Flow control (sliding window), congestion control (CWND)
- Why UDP wins for gaming, video streaming, DNS
- When to use each: the decision framework

### Day 5–6 — HTTP/1.1 vs HTTP/2 vs HTTP/3

- HTTP/1.1: text-based, head-of-line blocking, keep-alive
- HTTP/2: binary framing, multiplexing, header compression (HPACK), server push
- HTTP/3: QUIC over UDP, 0-RTT, connection migration, QPACK
- The head-of-line blocking problem and how each version solves (or doesn't solve) it

### Day 7 — DNS resolution

- Recursive resolver vs authoritative nameserver
- The full resolution chain: stub → recursive → root → TLD → authoritative
- TTL, negative caching, DNS over HTTPS (DoH)
- Why DNS failure takes down entire services

### Day 8–9 — TLS 1.3 handshake internals

- Symmetric vs asymmetric encryption
- Certificate chains and root CAs
- TLS 1.3 handshake: ClientHello → ServerHello → Finished (1-RTT)
- 0-RTT session resumption and its replay attack risk
- Why TLS 1.2 is slower (2-RTT)

### Day 10–11 — OS fundamentals

- Process vs thread: memory isolation, context switch cost
- Virtual memory: pages, page faults, the MMU
- File descriptors: everything is a file in Unix
- epoll / kqueue: how event loops actually work
- The C10K problem and why it matters for backend design

### Day 12–13 — Full request lifecycle

- Client → DNS → TCP connect → TLS handshake → HTTP request → App server → DB → HTTP response → Client
- Where latency hides at each step
- What happens when any step fails
- Exercise: curl -v a real API and identify every step in the output

### Day 14–15 — Network debugging tools

- `tcpdump` and `wireshark`: capturing real packets
- `curl -v`: reading TLS and HTTP negotiation
- `dig`: tracing DNS resolution
- `netstat` / `ss`: viewing open connections and socket states
- `strace`: tracing system calls
- `htop` + `lsof`: process and file descriptor inspection

---


## 🔨 Projects


### Project 1 — Raw TCP chat server


**Stack:** Go, `net` package, goroutines, `sync.Mutex`


Build a multi-client TCP chat server without any library. Accept connections in a loop. Spawn a goroutine per client. Broadcast messages to all connected clients using a shared slice protected by a mutex. No HTTP. No frameworks. Just raw bytes over TCP.


**Deliverable:** Server runs on port 8080. Multiple telnet clients can connect and see each other's messages in real-time.


**What you'll learn:** What a socket actually is. Why you need concurrency. What happens when a client disconnects mid-write.


### Project 2 — HTTP/1.1 parser from scratch


**Stack:** Go, `bufio.Scanner`, manual string parsing


Read raw bytes from a TCP connection. Parse the HTTP request line, headers, and body by hand. Route to 3 handlers: `GET /`, `GET /hello`, `POST /echo`. Write a valid HTTP response. Test with `telnet` and `curl`.


**Deliverable:** A server that any browser can hit and receive a real HTML response from — written in ~150 lines of Go with zero HTTP libraries.


### Project 3 — DNS query tracer CLI


**Stack:** Go, `golang.org/x/net/dns/dnsmessage`, CLI flags


Write a tool that takes a domain name and traces the full DNS resolution path: stub → recursive → authoritative. Print each hop, the server IP, the TTL, and the response time. Compare results for cached vs uncached lookups.


**Deliverable:** `./dnsTrace google.com` prints the full resolution chain with latency at each step.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Thinking HTTP is text over a socket.**


HTTP/2 is binary framing. HTTP/3 runs over UDP via QUIC. If you think of HTTP as just ASCII text, you won't understand multiplexing, stream prioritization, or why gRPC requires HTTP/2.


**✅ Mental model:** HTTP is a protocol layered on top of a transport. The transport changes (TCP, QUIC), and so does the framing format. Text is just the human-readable representation of HTTP/1.1.


### Mistake 2


**❌ Ignoring TCP backpressure in high-throughput systems.**


When the receiver's buffer fills up, the sender's TCP window closes. Your write() call blocks. If you don't handle this in your goroutine model, you'll silently lose throughput or deadlock.


**✅ Mental model:** TCP flow control is an end-to-end mechanism. Design your application-layer backpressure to match it.


### Mistake 3


**❌ Treating DNS as instant.**


Every uncached DNS lookup adds 20–120ms. If your microservice calls 5 external APIs, you could have 500ms of DNS overhead on cold starts.


**✅ Mental model:** DNS is a cache with TTLs. Pre-resolve critical hostnames at startup. Use connection pooling to avoid re-resolving on every request.


### Mistake 4


**❌ Skipping TLS internals because 'HTTPS just works'.**


In production, you need to understand certificate rotation, OCSP stapling, mTLS setup, and cipher suite configuration. "Just add HTTPS" breaks when certificates expire or when you need service-to-service auth.


**✅ Mental model:** TLS is an identity + confidentiality system. The certificate is a signed claim about who the server is. Understanding this is mandatory for mTLS, Vault PKI, and service mesh configuration.


---


## 🏢 How real companies solved this


**Cloudflare:** Built their edge network on HTTP/3 + QUIC before it became an RFC. Their engineering blog post on eliminating head-of-line blocking at scale is required reading. They saw 10–15% throughput improvement on mobile connections by switching to QUIC.


**AWS Route 53:** Uses Anycast routing — your DNS query is automatically answered by the nearest AWS PoP, which is why Route 53 resolves in under 1ms for most users globally.


**Google:** Invented QUIC internally to fix TCP head-of-line blocking in Chrome. It was used in production for years before it became the IETF standard HTTP/3 in 2022. This is how to think about working at the frontier: standardize what works.


**Cloudflare Workers:** Each Worker runs in an Isolate (not a container), sharing a single V8 process per edge node. This is only possible because they deeply understand OS process/thread models and could design a safer, lighter-weight isolation model.


---


> ✅ Write test successful — I can update this page now.


## 📝 Detailed notes (deep dive)


> 🎯 **How to study (daily loop):** learn → observe → build → break → debug → write a short post-mortem.


### Day 1–2 — How the internet works (notes)

<details>
<summary>Packets, routing, latency — what’s actually happening</summary>
- **Layers**: L2 frames → L3 packets → L4 TCP/UDP → L7 HTTP/DNS.
- **BGP** picks routes by policy, not shortest path.
- **Latency** = propagation + serialization + queueing + processing.
- **Labs**: `tracert <domain>`, `ping` 3 regions, write a 5-line conclusion.

</details>


### Day 3–4 — TCP vs UDP (notes)

<details>
<summary>Reliability, ordering, and backpressure</summary>
- **TCP**: ordered, reliable **byte stream**; handshake SYN → SYN-ACK → ACK.
- **Flow control** (receiver window) vs **congestion control** (network capacity).
- **UDP**: datagrams; reliability is app-level (e.g., QUIC).
- **Checkpoint**: explain how backpressure becomes slow `write()` + timeouts.

</details>


### Day 8–9 — TLS 1.3 handshake (notes)

<details>
<summary>Identity + encryption + operational realities</summary>
- TLS provides confidentiality + integrity + **server identity** (cert chain).
- Certs expire → hard outages. Missing intermediates → “works on my machine” failures.
- **Lab**: `curl -v https://...` and read issuer + validity dates.
- **Checkpoint**: explain why 0-RTT has replay risk.

</details>


### Day 5–6 — HTTP/1.1 vs HTTP/2 vs HTTP/3 (notes)

<details>
<summary>Framing, multiplexing, head-of-line blocking</summary>
- **HTTP/1.1**: text, limited multiplexing; request-level HOL.
- **HTTP/2**: binary framing + multiplexed streams + HPACK; still TCP HOL on packet loss.
- **HTTP/3**: QUIC over UDP; avoids TCP HOL; better on lossy/mobile networks.
- **Lab**: `curl -v --http2 https://example.com` and note negotiated protocol.

</details>


### Day 10–11 — OS fundamentals (notes)

<details>
<summary>Processes, threads, file descriptors, event loops</summary>
- **FDs** are finite; sockets and DB conns consume them → “too many open files”.
- Event loops (epoll/kqueue) = handle many sockets efficiently.
- **Checkpoint**: explain why “1 thread per connection” collapses under load.

</details>


[[PHASE1_NOTES_MARKER]]


## 📝 Detailed notes completion pass


### Day 7 — DNS resolution (notes)


**Core mental model:** DNS is a distributed, cached naming system. A hostname does not magically become an IP address; it is resolved through local cache, recursive resolvers, root servers, TLD servers, and authoritative nameservers.


**Resolution chain:** Browser/OS stub resolver checks local cache, then asks a recursive resolver. The recursive resolver may ask root, TLD, and authoritative servers before returning the answer. Each answer has a TTL that controls how long it can be cached.


**Records to know:** `A` for IPv4, `AAAA` for IPv6, `CNAME` for aliases, `NS` for delegation, `MX` for mail, and `TXT` for verification/security metadata. Production outages often come from wrong records, bad delegation, low TTL storms, or stale resolver caches.


**Backend relevance:** Cold DNS lookups add latency to outbound calls. Microservices that repeatedly create new clients may pay DNS and TCP/TLS setup again and again. Connection pooling avoids much of this cost.


**Practice:** Run `dig +trace example.com`, identify root/TLD/authoritative hops, then compare answers from `1.1.1.1` and `8.8.8.8`.


### Day 12–13 — Full request lifecycle (notes)


**Core mental model:** A backend request is a chain, and total latency is the sum of every link. Good debugging means locating which link is slow or failing.


**Lifecycle:** User action -> DNS lookup -> TCP connect -> TLS handshake -> HTTP negotiation -> load balancer -> reverse proxy/API gateway -> app handler -> cache/database/downstream service -> response serialization -> network transfer -> client processing.


**Where failures hide:** DNS NXDOMAIN or stale records, SYN timeout, TLS certificate errors, load balancer health checks, connection pool exhaustion, slow database query, retry storms, oversized responses, and client disconnects.


**Backend relevance:** Timeouts should be smaller as calls go deeper into the system. A public API with a 2s timeout should not call a downstream service with a 5s timeout.


**Practice:** Use `curl -v` and write a timeline: DNS, connect, TLS, first byte, total. Then repeat against a slow endpoint and explain the difference.


### Day 14–15 — Network debugging tools (notes)


**Core mental model:** Tools give you visibility at different layers. Do not use logs for everything; use the layer-specific tool that matches the symptom.


**Tool map:** `curl -v` for HTTP/TLS, `dig` for DNS, `tracert` for routing path, `tcpdump`/Wireshark for packets, `ss` or `netstat` for socket state, `lsof` for file descriptors, `strace` for syscalls, and `htop` for CPU/memory/process behavior.


**Common TCP states:** `LISTEN` means waiting for connections. `ESTABLISHED` means active connection. `TIME_WAIT` is normal after close but can indicate churn if excessive. `CLOSE_WAIT` often means the application did not close sockets properly.


**Practice:** Start a local server, connect with multiple clients, inspect listening sockets, established sockets, and open file descriptors. Then kill a client abruptly and observe server behavior.


## Phase 1 mastery checklist

- Explain BGP at a high level without claiming it always chooses shortest path.
- Explain TCP flow control vs congestion control.
- Explain why UDP is useful despite lacking reliability.
- Compare HTTP/1.1, HTTP/2, and HTTP/3 accurately.
- Trace DNS resolution and explain TTL effects.
- Read a TLS certificate chain and explain trust.
- Explain process, thread, virtual memory, and file descriptor basics.
- Use `curl -v`, `dig`, `ss`, `tcpdump`, and `strace` for real debugging.

## 📖 Resources

- _Computer Networks: A Top-Down Approach_ — Kurose & Ross (read Ch 1–3)
- Cloudflare blog: "The QUIC protocol" series
- Julia Evans: "How DNS works" (zine)
- _The Linux Programming Interface_ — Michael Kerrisk (Ch 56–61 for sockets)
- `man 7 tcp` — yes, the man page. Read it.

## Phase 2 — Core Backend Engineering (Days 16–35)
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

## Phase 3 — Databases & Distributed Systems (Days 36–55)
> **Goal:** Understand where data lives, how databases work internally, and how distributed systems make guarantees — or don't. This is where most backend engineers have the biggest gaps.

---


## 🧠 Mental model


Every architectural decision in a distributed system is a tradeoff between consistency, availability, and partition tolerance. You can't have all three. This phase teaches you to reason about those tradeoffs precisely — not with buzzwords, but with the actual mechanisms: WAL, MVCC, consensus protocols, partition strategies.


---


## 📚 Topics in order


### Day 36–38 — PostgreSQL internals

- MVCC (Multi-Version Concurrency Control): how Postgres serves reads without blocking writes
- WAL (Write-Ahead Log): durability before write, the basis of replication and point-in-time recovery
- B-tree index internals: pages, fanout, why range queries are fast, why low-cardinality indexes hurt
- `EXPLAIN ANALYZE`: reading cost estimates, actual rows, buffer hits, sequential vs index scan
- Vacuum: why dead tuples accumulate and what autovacuum does about it
- Connection pooling: why 10,000 Postgres connections kill performance. PgBouncer in transaction mode.
- Bloat: table bloat vs index bloat, FILLFACTOR tuning

### Day 39–40 — Query optimization

- Index selectivity: an index on a boolean column is almost never used
- Covering indexes: `CREATE INDEX ON orders (user_id) INCLUDE (status, created_at)` — zero heap access
- Partial indexes: `CREATE INDEX ON orders (status) WHERE status = 'pending'` — smaller, faster
- Composite index column order matters: leftmost prefix rule
- When the query planner chooses a sequential scan over an index scan and why
- Join strategies: nested loop vs hash join vs merge join — when Postgres picks each
- `pg_stat_statements`: finding your slowest queries in production

### Day 41–42 — ACID transactions in depth

- Atomicity: all or nothing. WAL ensures this even on crash.
- Consistency: constraint checking at commit time
- Isolation levels and what they prevent:
    - READ COMMITTED: no dirty reads. Default in Postgres.
    - REPEATABLE READ: no phantom reads for reads. Snapshot-based.
    - SERIALIZABLE: SSI (Serializable Snapshot Isolation). Postgres's implementation.
- Anomalies: dirty read, non-repeatable read, phantom read, write skew
- Write skew example: two doctors both read "on-call count > 1" and both go off-call. Neither violates constraints alone.
- Advisory locks: application-level locking without a dedicated lock table

### Day 43–44 — Redis internals

- Single-threaded event loop: why Redis is fast despite no parallelism
- Data structures and their implementations:
    - String: raw bytes or int encoding
    - Hash: ziplist (small) → hashtable (large)
    - Sorted Set: ziplist → skiplist + hashtable (why O(log N) for ZADD)
- Persistence: RDB (snapshot) vs AOF (append-only log) vs no persistence
- Eviction policies: LRU vs LFU vs `allkeys-lru` vs `volatile-ttl`
- Redis Cluster: hash slots (16,384 total), consistent hashing, cluster-bus
- The `WAIT` command: synchronous replication for critical writes

### Day 45–46 — CAP theorem — real understanding

- CAP: Consistency, Availability, Partition Tolerance. P is not optional in distributed systems.
- CP systems: prefer consistency. Return errors when partitioned. (Zookeeper, HBase, etcd)
- AP systems: prefer availability. Return stale data when partitioned. (Cassandra, CouchDB)
- PACELC: extends CAP to include latency tradeoff even without partitions
- Consistency models (weakest to strongest):
    - Eventual consistency: writes propagate eventually. No ordering guarantees.
    - Causal consistency: causally related writes seen in order.
    - Sequential consistency: all nodes see same order. Not necessarily real-time.
    - Linearizability: real-time ordering. Strongest. Most expensive.
- Why "eventual consistency" doesn't mean "eventually correct"

### Day 47–48 — Horizontal scaling strategies

- Read replicas: async replication lag. Replica reads may be stale. How to handle this in app code.
- Sharding strategies:
    - Range sharding: easy range queries, hotspot risk on monotonic keys
    - Hash sharding: even distribution, no range queries
    - Directory sharding: flexible, needs a lookup service (single point of failure)
- The hotspot problem: viral content, famous user accounts. Solutions: key expansion, micro-sharding.
- Resharding: the operational nightmare. How Stripe, Discord, and others handle it.
- Consistent hashing: virtual nodes, why adding a node only moves 1/N keys

### Day 49–50 — Kafka deep dive

- Log-structured storage: append-only, immutable. Retention by time or size.
- Partitions: unit of parallelism. More partitions = more consumers.
- Consumer groups: each partition assigned to exactly one consumer in a group
- Offset management: auto-commit vs manual commit. Exactly-once vs at-least-once semantics.
- Exactly-once semantics (EOS): transactional producer + idempotent producer
- Compacted topics: retain only the latest value per key. Used for materialized views.
- Kafka vs RabbitMQ: log retention, replay, throughput vs complex routing

### Day 51–52 — Event-driven architecture

- Outbox pattern: write to DB + outbox table in same transaction. Separate process publishes events.
- Saga pattern: distributed transactions without 2PC. Choreography vs orchestration.
- Event sourcing: state = sequence of events. Current state derived by replaying.
- CQRS: separate read model (query) from write model (command). Different datastores.
- Idempotency keys: every event carries a unique ID. Consumer tracks processed IDs in Redis.
- Dead letter queues: where messages go after N failed processing attempts

### Day 53–54 — Raft consensus intuition

- Why consensus is hard: network partitions, message delays, node failures
- Raft roles: Leader, Follower, Candidate
- Leader election: randomized election timeouts. First to timeout becomes candidate.
- Log replication: leader appends entry, sends AppendEntries RPC, commits when majority acks
- Committed vs applied: a log entry is committed when majority has it. Applied when executed.
- Split-brain prevention: a candidate needs majority votes. Two leaders can never coexist.
- Why etcd, CockroachDB, and Consul use Raft

### Day 55 — Distributed database survey

- CockroachDB: Raft per range (64MB chunks) + MVCC + distributed SQL. True ACID.
- DynamoDB: Paxos-based multi-leader. Eventual consistency default, strong consistency optional at cost.
- Cassandra: Leaderless, quorum reads/writes (R + W > N). No transactions.
- Spanner: TrueTime (GPS + atomic clocks) for external consistency at global scale.
- How to choose: need ACID? → CockroachDB/Spanner. Need massive scale + eventual? → Cassandra.

---


## 🔨 Projects


### Project 1 — High-throughput write service with Kafka


**Stack:** Go, Kafka (Docker), PostgreSQL, Outbox pattern


Order service that writes to PostgreSQL and an outbox table in the same transaction. A separate outbox processor polls for unpublished events and publishes to Kafka. Consumer processes events idempotently (Redis-backed deduplication by event ID). Includes a dead letter queue for failed processing. Test: kill the consumer mid-processing, restart, verify no duplicate processing and no lost events.


**Deliverable:** 10,000 events processed with zero duplicates and zero losses, verified by event ID count in source DB vs consumer state.


### Project 2 — Distributed rate limiter


**Stack:** Go, Redis, Lua scripts, sliding window algorithm


Token bucket algorithm backed by Redis. The check-and-decrement must be atomic — implement with a Lua script (`EVAL`). Support 3 limiters in parallel: per-user, per-IP, per-endpoint. Sliding window log variant: store timestamps in a Redis Sorted Set, trim expired entries, count remaining. Benchmark: measure latency added by the rate limiter under 10,000 concurrent requests.


**Deliverable:** Rate limiter that correctly enforces 100 req/min per user even with 50 concurrent goroutines hammering the same user ID.


### Project 3 — Read/write split + query analysis


**Stack:** PostgreSQL (primary + replica with Docker), pgBouncer, Go


Service that routes writes to primary and reads to replica. Detect replication lag with `pg_stat_replication`. For reads that require strong consistency (read-your-own-writes), route to primary. Add `EXPLAIN ANALYZE` output logging for queries over 100ms. Benchmark: measure query latency before and after adding a covering index on the hottest query.


**Deliverable:** Side-by-side `EXPLAIN ANALYZE` outputs showing 10x improvement from covering index. Replication lag monitor that alerts when lag > 500ms.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Adding an index on every column you filter on.**


Every index is a write overhead. A table with 8 indexes executes 8 index updates per INSERT. On high-write tables (events, logs), this can halve your write throughput.


**✅ Mental model:** Indexes are a read-write tradeoff. Profile first with `pg_stat_statements`. Index the queries that appear most in slow query logs. Use partial and covering indexes to minimize the tradeoff.


### Mistake 2


**❌ Using Redis as a primary database.**


Redis evicts data under memory pressure based on eviction policy. If you can't afford to lose it, Redis is the wrong primary store. Redis persistence (AOF) is slower than Postgres WAL and less mature.


**✅ Mental model:** Redis is an L2 cache and ephemeral state store. PostgreSQL is your source of truth. Cache derivable data in Redis. Anything that requires durability guarantees belongs in Postgres.


### Mistake 3


**❌ Thinking eventual consistency means "eventually correct."**


Eventual consistency means no global ordering guarantee across nodes. Cassandra can return stale data indefinitely if the reconciliation process (read repair, anti-entropy) hasn't run. It's a liveness property, not a safety property.


**✅ Mental model:** Design your domain to tolerate stale reads OR use strong consistency (quorum reads in Cassandra). Don't mix eventual consistency stores with business logic that requires ordering.


### Mistake 4


**❌ Treating Kafka as a message queue.**


In a queue, messages disappear after consumption. In Kafka, messages stay until the retention policy removes them. This changes everything: you can replay events, add new consumers without affecting others, and rebuild state from the beginning of the log.


**✅ Mental model:** Kafka is an append-only distributed log. Design your consumers to be stateless and replayable. The log is the source of truth; consumer state is derived from it.


---


## 🏢 How real companies solved this


**Uber:** Schemaless — their custom MySQL-backed NoSQL layer — solved multi-region replication at massive write scale by treating every row as an immutable append-only record. The "current" state is the latest appended row per entity ID. No UPDATE ever. This maps perfectly to Kafka's log model.


**Discord:** Migrated from Cassandra to ScyllaDB (Rust rewrite of Cassandra, drop-in replacement) after hitting JVM GC pauses at 1 trillion messages. Same API, same query model, 10x less infrastructure. The lesson: same data model, different runtime characteristics can matter enormously at scale.


**Stripe:** Every payment API call accepts an idempotency key. The backend stores the key + full response for 24 hours. A duplicate request returns the exact same response without re-executing. This is the outbox pattern at the API layer.


**LinkedIn:** Invented Kafka to solve their internal messaging infrastructure problem. The key insight: treating the event log as the primary system of record (not an afterthought) lets you derive any view of your data by replaying the log.


---


## 📝 Detailed notes by topic


### Day 36–38 — PostgreSQL internals


**Core mental model:** PostgreSQL is not just a place to store rows. It is a transactional storage engine with MVCC, WAL, indexes, a query planner, background maintenance, and replication machinery.


**MVCC:** Every transaction sees a consistent snapshot. Updates create new row versions instead of overwriting in place. This lets reads avoid blocking writes, but it also creates dead tuples that must later be vacuumed.


**WAL:** PostgreSQL writes changes to the Write-Ahead Log before data files. WAL enables crash recovery, replication, and point-in-time restore. If WAL is lost, durability is lost.


**Indexes:** B-tree indexes are balanced tree structures optimized for equality and range scans. Indexes speed reads but slow writes because every insert/update/delete must maintain each relevant index.


**Vacuum and bloat:** Dead tuples remain until vacuum removes them. Autovacuum settings matter on high-write tables. Bloat increases table size, cache pressure, and scan cost.


**Connection pooling:** PostgreSQL handles a limited number of active connections well. Too many connections increase memory usage and context switching. PgBouncer helps by multiplexing clients over fewer database connections.


**Practice:** Run `EXPLAIN ANALYZE` before and after adding an index, then inspect actual rows, buffers, and scan type.


### Day 39–40 — Query optimization


**Core mental model:** Query performance comes from selectivity, access path, join strategy, memory, and data distribution. An index is useful only when it helps the planner avoid enough work.


**Selectivity:** High-cardinality columns are usually better index candidates. Boolean indexes often do not help unless used as partial indexes for rare values.


**Composite indexes:** Column order matters. An index on `(user_id, created_at)` helps queries by `user_id` and by `user_id + created_at`, but not usually by `created_at` alone.


**Covering indexes:** `INCLUDE` columns can let PostgreSQL answer a query from the index without visiting the heap, but visibility checks may still matter.


**Partial indexes:** Index only the subset you query often, such as `WHERE status = 'pending'`. Smaller indexes are faster and cheaper to maintain.


**Join strategies:** Nested loops are good for small outer inputs with indexed lookups. Hash joins are good for large equality joins. Merge joins need sorted inputs and can be efficient for ordered data.


**Practice:** Enable `pg_stat_statements`, find the slowest query, and document why the chosen plan is slow.


### Day 41–42 — ACID transactions in depth


**Core mental model:** Transactions are not magic. They are guarantees created by logs, locks, snapshots, constraints, and conflict detection.


**Atomicity:** All transaction changes commit together or none do. WAL makes crash recovery possible.


**Consistency:** The database preserves declared constraints, but application-level invariants still need correct transaction design.


**Isolation:** `READ COMMITTED` sees a fresh snapshot per statement. `REPEATABLE READ` keeps a stable snapshot for the transaction. `SERIALIZABLE` detects dangerous structures and may abort transactions to preserve serial order.


**Anomalies:** Dirty reads, non-repeatable reads, phantom reads, and write skew are symptoms of weaker isolation. Write skew is especially important because each transaction can look valid alone while violating a cross-row invariant together.


**Practice:** Simulate two concurrent transactions that both read a condition and then write. Observe behavior under different isolation levels.


### Day 43–44 — Redis internals


**Core mental model:** Redis is fast because it keeps data in memory, uses efficient data structures, and processes commands through an event loop. It is usually a cache or coordination tool, not the source of truth.


**Data structures:** Strings, hashes, sets, sorted sets, streams, and bitmaps have different memory and time tradeoffs. Sorted sets are excellent for leaderboards, rate limits, and time-window tracking.


**Persistence:** RDB snapshots are compact but can lose recent writes. AOF logs more operations and can reduce data loss at higher write cost. No persistence is valid for pure cache use cases.


**Eviction:** If Redis reaches memory limits, eviction policy decides what disappears. Never store irreplaceable state unless durability is explicitly designed.


**Cluster:** Redis Cluster shards keys across 16,384 hash slots. Multi-key operations need keys in the same hash slot.


**Practice:** Implement a sliding-window rate limiter using a sorted set and then rewrite it as an atomic Lua script.


### Day 45–46 — CAP theorem


**Core mental model:** During a network partition, a distributed system must choose whether to reject some operations to preserve consistency or continue serving potentially stale/conflicting data.


**CP systems:** Prefer correctness and reject or block when a majority/quorum is unavailable. Examples include etcd and ZooKeeper-style coordination systems.


**AP systems:** Prefer availability and reconcile later. The application must tolerate stale reads, conflicts, or eventual convergence.


**PACELC:** Even when there is no partition, systems trade latency against consistency. Stronger coordination usually costs latency.


**Consistency models:** Eventual consistency gives no immediate ordering guarantee. Causal consistency preserves cause-effect order. Sequential consistency gives one global order but not necessarily real-time order. Linearizability respects real-time ordering and is the strongest common model.


**Practice:** For cart, bank transfer, analytics counter, and user profile, decide which consistency model is acceptable and why.


### Day 47–48 — Horizontal scaling strategies


**Core mental model:** Scaling data is harder than scaling stateless application servers because data has location, ownership, consistency, and migration costs.


**Read replicas:** Increase read capacity but introduce replication lag. Read-your-own-writes may require reading from primary after writes.


**Sharding:** Range sharding supports range queries but risks hotspots. Hash sharding spreads load but hurts range queries. Directory sharding is flexible but introduces lookup complexity.


**Hotspots:** Viral keys, celebrity users, and monotonic IDs can overload one shard. Key expansion, write spreading, and micro-sharding can help.


**Resharding:** Moving data while serving traffic is operationally hard. Plan for dual reads/writes, backfills, verification, and rollback.


**Practice:** Design shard keys for messages, payments, and timeline posts. Explain the hotspot risk for each.


### Day 49–50 — Kafka deep dive


**Core mental model:** Kafka is a distributed append-only log. Consumers track offsets; messages do not vanish simply because one consumer read them.


**Partitions:** Partitions provide ordering within a key range and parallelism across consumers. More partitions can increase throughput but also increase overhead.


**Consumer groups:** Within a group, each partition is assigned to one consumer. Different groups can independently read the same topic.


**Delivery semantics:** At-least-once can duplicate messages. At-most-once can lose messages. Exactly-once in Kafka relies on idempotent producers and transactions, but consumers still need careful design.


**Compaction:** Compacted topics keep the latest value per key and are useful for rebuilding materialized views.


**Practice:** Build a consumer that crashes after processing but before committing, then make processing idempotent.


### Day 51–52 — Event-driven architecture


**Core mental model:** Events decouple systems, but they move complexity into ordering, idempotency, retries, schema evolution, and observability.


**Outbox pattern:** Write business data and an outbox row in the same database transaction. A publisher later sends outbox rows to Kafka. This prevents the classic DB-write-succeeded/event-publish-failed bug.


**Sagas:** Coordinate multi-service workflows through local transactions and compensating actions. Choreography is event-driven; orchestration has a central coordinator.


**CQRS and event sourcing:** CQRS separates write and read models. Event sourcing stores events as source of truth and rebuilds state by replay.


**Idempotency:** Every event needs a stable unique ID. Consumers should safely handle duplicates.


**Practice:** Draw the failure cases for order-created, payment-authorized, inventory-reserved, and shipment-created.


### Day 53–54 — Raft consensus intuition


**Core mental model:** Consensus lets a cluster agree on a sequence of log entries even when some nodes fail. It is about majority agreement, leader election, and log replication.


**Roles:** Followers respond, candidates request votes, leaders accept writes and replicate log entries.


**Leader election:** Randomized timeouts reduce split votes. A leader must receive votes from a majority.


**Log replication:** The leader appends entries and sends `AppendEntries`. An entry is committed after a majority stores it, then applied to the state machine.


**Split-brain prevention:** Two leaders cannot both command a majority in the same term because majorities overlap.


**Practice:** Explain why a 3-node cluster can tolerate 1 failure and a 5-node cluster can tolerate 2.


### Day 55 — Distributed database survey


**Core mental model:** Distributed databases package different tradeoffs. Choosing one means choosing its consistency, latency, operational model, and failure behavior.


**CockroachDB:** Distributed SQL with MVCC and Raft per range. Good when SQL and strong consistency matter.


**DynamoDB:** Managed key-value/document database with single-digit millisecond goals, partition-key design constraints, and optional strong reads.


**Cassandra/ScyllaDB:** Leaderless, high-write, wide-column systems. Great for massive scale when query patterns are known and transactions are not central.


**Spanner:** Globally distributed SQL with external consistency using TrueTime. Powerful, but specialized and operationally sophisticated.


**Practice:** Pick a database for payments, chat messages, metrics, feature flags, and user sessions. Defend each choice.


## Phase 3 mastery checklist

- Read a PostgreSQL query plan and identify the bottleneck.
- Explain MVCC, WAL, vacuum, and bloat.
- Choose indexes based on query patterns, not instinct.
- Explain transaction isolation anomalies.
- Use Redis safely as cache/coordination, not accidental primary DB.
- Design idempotent Kafka consumers.
- Explain CAP, PACELC, and Raft without buzzwords.

## 📖 Resources

- _Designing Data-Intensive Applications_ — Martin Kleppmann (essential reading, read every page)
- _Database Internals_ — Alex Petrov (deeper on storage engines)
- Use The Index, Luke: [use-the-index-luke.com](http://use-the-index-luke.com/) (free, Postgres-focused)
- Aphyr's Jepsen analyses: [jepsen.io](http://jepsen.io/) (real distributed system failure stories)
- Kafka: The Definitive Guide — Narkhede, Shapira, Palino

## Phase 4 — Infrastructure & DevOps (Days 56–75)
> **Goal:** Learn to take a production Go service and deploy it reliably at scale — containers, orchestration, IaC, secret management, and zero-downtime deployments. This is where backend engineering meets systems engineering.

---


## 🧠 Mental model


A service that works on your laptop is not a product. Infrastructure is the bridge between code and reliability. Every decision here — L4 vs L7, Vault vs env vars, blue-green vs canary — has a direct cost in either operational complexity, latency, or blast radius when things go wrong.


---


## 📚 Topics in order


### Day 56–57 — L4 vs L7 load balancing

- L4 (Transport layer): operates on TCP/UDP. Sees IP + port only. Extremely fast, millions of packets/sec.
- L7 (Application layer): understands HTTP. Can route by path, header, host. Can terminate TLS.
- AWS NLB (L4): line-rate TCP forwarding. No TLS termination. Preserves client IP.
- AWS ALB (L7): HTTP routing rules, host-based routing, path-based routing, sticky sessions.
- Sticky sessions: cookie-based affinity. Why they break horizontal scaling guarantees.
- Connection draining: wait for in-flight requests to complete before removing an instance
- Health checks: `/healthz` vs `/readyz` — liveness vs readiness. Different semantics.

### Day 58–59 — Reverse proxies & API gateways

- Nginx internals: master process + worker processes, event-driven, epoll
- Nginx as reverse proxy: `proxy_pass`, `upstream` blocks, connection keepalive
- Envoy: data plane proxy, xDS protocol for dynamic config, used by Istio and Consul Connect
- API gateway responsibilities: auth, rate limiting, request transformation, SSL termination, routing
- Kong: plugin-based API gateway built on Nginx. Lua plugins.
- Circuit breaking at gateway layer: fail fast when downstream service is degraded
- Retries with jitter: `Retry-After`, exponential backoff, why naive retries cause thundering herd

### Day 60–61 — VPC & cloud networking

- VPC: logically isolated network in AWS. Your private data center in the cloud.
- Subnets: public (has internet gateway route) vs private (no direct internet access)
- NAT Gateway: lets private subnet instances initiate outbound connections. One-way.
- Security groups: stateful firewall at instance level. Allow rules only.
- NACLs: stateless firewall at subnet level. Allow and deny rules.
- VPC Peering: connect two VPCs. Non-transitive (A↔B, B↔C does NOT mean A↔C).
- AWS PrivateLink: expose a service to other VPCs without peering. One-directional.
- Route tables: how traffic is directed within and out of a VPC

### Day 62–63 — Docker internals

- Namespaces: PID, network, mount, UTS, IPC — process isolation without a hypervisor
- cgroups: CPU, memory, I/O limits per container
- Overlay filesystem: layers. Each Dockerfile instruction adds a layer. Read-only layers, writable container layer.
- Multi-stage builds: compile in a builder image, copy binary to a scratch/distroless image
- Distroless images: no shell, no package manager. Smallest attack surface.
- Docker networking: bridge (default, NAT), host (no isolation), overlay (multi-host)
- Layer caching: `COPY go.mod go.sum ./` then `RUN go mod download` before `COPY . .`

### Day 64–65 — Kubernetes core concepts

- Pod: smallest deployable unit. One or more containers sharing network namespace.
- Deployment: manages ReplicaSets. Declarative rollout and rollback.
- Service types: ClusterIP (internal), NodePort (node IP + static port), LoadBalancer (cloud LB)
- Ingress: HTTP routing rules into the cluster. Ingress controller (Nginx, Traefik) does the work.
- ConfigMap vs Secret: environment configuration vs sensitive data. Secrets are base64 encoded (not encrypted!) by default.
- HPA (Horizontal Pod Autoscaler): scale based on CPU/memory or custom metrics
- Resource limits and requests: `requests` for scheduling decisions, `limits` for enforcement
- Probes: `livenessProbe` (restart if unhealthy), `readinessProbe` (remove from load balancer if unready)

### Day 66–67 — Terraform & IaC

- Declarative infrastructure: describe what you want, not how to create it
- State file: Terraform's model of the world. Must be stored remotely (S3 + DynamoDB for locking).
- Plan/apply cycle: always `terraform plan` before `apply`. Review every change.
- Modules: reusable infrastructure components. Version pin your module sources.
- Drift detection: when the real world diverges from state. `terraform refresh`.
- Import: bring existing resources under Terraform management
- Provider plugins: AWS, GCP, Kubernetes, Vault, Datadog — all first-class providers
- Workspaces vs separate state files: when to use each

### Day 68–69 — CI/CD pipelines

- GitHub Actions: workflow triggers, job dependencies, matrix builds
- Artifact pinning: use SHA digest (`@sha256:...`), not tags, for security
- Environment promotion: dev → staging → prod with manual approval gates
- Secrets injection: GitHub Actions Secrets → env vars. Never hardcode. Rotate regularly.
- Rollback triggers: monitor error rate after deploy. Auto-rollback if threshold exceeded.
- Build caching: cache Go modules, Docker layers, Terraform plugins between runs
- PR-based deploys: ephemeral preview environments per pull request

### Day 70–71 — Deployment strategies

- Blue-green: two identical environments. Switch DNS/LB in seconds. Easy rollback. Double the cost.
- Canary: gradually shift traffic (1% → 5% → 25% → 100%). Monitor error rate at each step. Automatic rollback.
- Rolling: replace instances one by one. Zero downtime. Rollback is slow (must re-deploy old version).
- Feature flags: decouple deploy from release. Ship dark, enable per user segment.
- Database migrations and deploys: expand-contract pattern. Never break backward compatibility mid-deploy.

### Day 72–73 — Secret management (HashiCorp Vault)

- Dynamic secrets: Vault generates a fresh database credential per service, auto-expired
- Static secrets: versioned, ACL-controlled key-value store
- Transit secrets engine: encrypt/decrypt without exposing the key. Encryption as a service.
- PKI secrets engine: Vault as an internal CA. Issue short-lived TLS certificates.
- AppRole auth: machine-to-machine auth. Role ID + Secret ID = Vault token.
- Vault Agent sidecar: auto-renew tokens and push secrets to a shared volume in Kubernetes
- Secret leasing and renewal: every secret has a TTL. Renewal extends it. Revocation invalidates it.

### Day 74–75 — mTLS in production

- mTLS: both client and server present certificates. Mutual authentication.
- SPIFFE/SPIRE: workload identity. Every service gets a certificate based on its identity (not IP).
- Service mesh: Istio/Linkerd inject a sidecar proxy that handles mTLS transparently
- Certificate rotation: short-lived certs (24h) rotated automatically. No long-lived secrets.
- Zero-trust networking: no implicit trust based on network location. Every call is authenticated.
- Why IP-based security (security groups only) is not sufficient for internal service-to-service auth

---


## 🔨 Projects


### Project 1 — Kubernetes-deployed Go service with full observability


**Stack:** Kubernetes (minikube/kind), Helm, Docker, GitHub Actions


Write a Helm chart for your Phase 2 Go service. Configure resource requests and limits. Add liveness and readiness probes. Configure HPA to scale at 70% CPU. Write a GitHub Actions pipeline: test → build image → push to registry → helm upgrade. Test pod disruption budget: run `kubectl delete pod` during a load test and verify zero dropped requests.


**Deliverable:** Fully automated deploy from `git push`. `kubectl get hpa` shows autoscaling in action during a wrk load test.


### Project 2 — Full AWS stack in Terraform


**Stack:** Terraform, AWS (VPC, ALB, ECS, RDS, ElastiCache, Secrets Manager)


Provision from zero: VPC with public/private subnets across 2 AZs. NAT Gateway for private subnets. ALB in public subnet. ECS Fargate service in private subnet. RDS PostgreSQL in private subnet. ElastiCache Redis in private subnet. Secrets Manager for DB credentials. Zero manual AWS console interactions.


**Deliverable:** `terraform apply` provisions the entire stack. `terraform destroy` tears it down cleanly. State stored in S3 with DynamoDB locking.


### Project 3 — Canary deploy pipeline with automatic rollback


**Stack:** GitHub Actions, Kubernetes, ArgoCD, Prometheus


Pipeline: build → push → deploy 10% canary with a separate Deployment and weighted Service. Monitor error rate via Prometheus for 10 minutes. If error rate > 1%, automatically roll back by scaling canary to 0. If healthy, promote by scaling canary to 100% and scaling down old version.


**Deliverable:** Introduce a deliberate bug in a new image version. Pipeline deploys canary, detects the error rate spike, and rolls back — fully automated, zero human intervention.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Running stateful workloads (databases) inside Kubernetes.**


StatefulSets are complex. Persistent volumes are tricky. Storage class behavior varies by cloud. A database crash in a pod means complex recovery. The operational overhead is massive.


**✅ Mental model:** Use managed services for state: RDS for PostgreSQL, ElastiCache for Redis, MSK for Kafka. Keep Kubernetes for stateless application workloads. Let the cloud provider handle storage durability.


### Mistake 2


**❌ Passing secrets as environment variables through CI pipelines.**


Env vars appear in `kubectl describe pod` output, process dumps, crash reports, and CI logs. They're inherited by child processes. A leaked env var is a leaked secret.


**✅ Mental model:** Use Vault Agent sidecar or AWS Secrets Manager + IAM roles for service accounts (IRSA). Secrets are mounted as files in a tmpfs volume, not environment variables. Rotate them automatically with short TTLs.


### Mistake 3


**❌ Using ALB (L7) for gRPC services with long-lived bidirectional streams.**


ALB terminates HTTP/2 connections and enforces its own timeout. Long-lived gRPC streams get cut. ALB also doesn't support gRPC load balancing at the request level — it load balances at the connection level.


**✅ Mental model:** Use NLB (L4) in front of your gRPC services. Or use a service mesh (Istio) which understands gRPC at the application level and can load balance individual streams.


### Mistake 4


**❌ No circuit breaker on downstream service calls.**


One slow database or downstream API causes request threads to pile up. Connection pool exhausts. Memory grows. Your service is now also slow. This cascades until the entire call graph is down.


**✅ Mental model:** Every external call needs a timeout + circuit breaker. When the downstream is degraded, fail fast (return 503) instead of waiting. This preserves your service's capacity for other requests.


---


## 🏢 How real companies solved this


**HashiCorp Vault:** Dynamic secrets are their killer feature — Vault generates a fresh PostgreSQL credential per service instance, auto-expired in 1 hour. No long-lived database passwords anywhere in the fleet. Breaching one service's credentials expires in 60 minutes with no action required.


**AWS:** ALB + NLB in tandem is how AWS internally routes at scale. NLB handles TCP at line rate (millions of packets/sec), forwards to ALB for HTTP/2 routing decisions. This is the architecture behind API Gateway under the hood.


**Netflix:** Invented the canary deploy pattern and Chaos Monkey simultaneously. Their deployment pipeline automatically rolls back if error rate spikes >0.1% in the canary cohort. Every deploy is a chaos experiment.


**Cloudflare:** Zero-trust networking across their entire internal fleet using SPIFFE-based certificates. Every internal service-to-service call is mTLS. Network location (being inside the VPN) grants zero implicit trust.


---


## 📝 Detailed notes by topic


### Day 56–57 — L4 vs L7 load balancing


**Core mental model:** Load balancers distribute traffic, but different layers understand different things. L4 sees connections and packets. L7 understands application protocols such as HTTP.


**L4:** Routes by IP and port. It is fast, protocol-agnostic, and useful for raw TCP, UDP, and some gRPC workloads. It usually preserves more end-to-end behavior but cannot route by HTTP path or header.


**L7:** Terminates or understands HTTP. It can route by host, path, header, method, cookie, or auth context. It can also terminate TLS, inject headers, and apply request-level policies.


**Health checks:** Liveness means the process should be restarted if broken. Readiness means the instance should receive traffic. Mixing these causes bad deploy behavior.


**Connection draining:** Before removing an instance, the load balancer should stop sending new requests and allow in-flight requests to finish.


**Practice:** Design routing for REST, gRPC unary, and long-lived gRPC streams. Decide when ALB, NLB, or service mesh is appropriate.


### Day 58–59 — Reverse proxies & API gateways


**Core mental model:** A reverse proxy forwards traffic to backends. An API gateway adds policy: auth, rate limiting, transformation, routing, and observability.


**Nginx:** Event-driven workers handle many connections efficiently. Common uses include TLS termination, static assets, reverse proxying, buffering, and simple routing.


**Envoy:** A modern data-plane proxy built for dynamic configuration. xDS lets control planes update clusters, routes, listeners, and endpoints without restarts.


**Gateway responsibilities:** Validate identity, enforce quotas, route traffic, normalize headers, add trace IDs, transform requests/responses, and protect downstream services.


**Retries:** Use bounded retries with jitter and respect `Retry-After`. Never retry unsafe non-idempotent operations blindly.


**Circuit breaking:** Fail fast when downstreams are unhealthy to preserve capacity and prevent cascading failure.


### Day 60–61 — VPC & cloud networking


**Core mental model:** A VPC is your private cloud network boundary. Subnets, routes, gateways, security groups, and NACLs define how traffic moves.


**Public vs private subnets:** Public subnets have a route to an internet gateway. Private subnets do not accept direct inbound internet traffic and usually use NAT for outbound connections.


**Security groups:** Stateful instance-level firewall rules. If inbound is allowed, return traffic is automatically allowed.


**NACLs:** Stateless subnet-level rules. You must handle inbound and outbound explicitly.


**NAT Gateway:** Allows private resources to initiate outbound internet connections, such as package downloads or external API calls.


**PrivateLink:** Exposes a service privately across VPC boundaries without full network peering.


**Practice:** Draw a two-AZ VPC with public ALB, private app subnets, private database subnets, NAT gateways, and route tables.


### Day 62–63 — Docker internals


**Core mental model:** Containers are isolated processes, not lightweight virtual machines. Isolation comes from kernel features.


**Namespaces:** Separate views of process IDs, mounts, networking, hostnames, and IPC.


**cgroups:** Limit and account for CPU, memory, and I/O usage. Kubernetes resource limits eventually map to cgroups.


**Images and layers:** Images are layered filesystems. Each Dockerfile instruction can add a layer. Good Dockerfiles maximize cache reuse and minimize final image size.


**Multi-stage builds:** Compile in a builder image, then copy only the final binary into a smaller runtime image.


**Distroless:** Reduces attack surface by excluding shells and package managers. Debugging requires good logs and external tools.


**Practice:** Build a Go service image with a multi-stage Dockerfile and compare image sizes between full, alpine, and distroless variants.


### Day 64–65 — Kubernetes core concepts


**Core mental model:** Kubernetes continuously reconciles desired state against actual state. You declare what should exist; controllers work to make it true.


**Pod:** Smallest deployable unit. Containers in a pod share network namespace and can communicate over [localhost](http://localhost/).


**Deployment:** Manages ReplicaSets and rolling updates for stateless workloads.


**Service:** Stable virtual endpoint for pods. ClusterIP is internal, NodePort exposes a node port, LoadBalancer asks the cloud for an external load balancer.


**Ingress:** HTTP routing layer implemented by an ingress controller.


**ConfigMap vs Secret:** ConfigMaps hold non-sensitive config. Kubernetes Secrets are base64 by default and need encryption-at-rest plus careful access controls.


**Requests and limits:** Requests influence scheduling. Limits enforce maximum usage and can cause throttling or OOM kills.


**Practice:** Deploy a service with readiness/liveness probes, resource requests, and HPA. Break readiness and observe traffic removal.


### Day 66–67 — Terraform & IaC


**Core mental model:** Infrastructure as Code gives repeatability, reviewability, and drift detection, but state becomes critical infrastructure.


**State:** Terraform state maps config to real resources. Store it remotely with locking. Treat it as sensitive because it can contain secrets.


**Plan/apply:** `plan` shows intended changes. Read it carefully, especially destroys, replacements, IAM changes, and networking changes.


**Modules:** Reusable building blocks. Version modules and providers so changes are intentional.


**Drift:** Manual console edits create drift. Terraform may undo them or fail unexpectedly.


**Import:** Existing resources can be brought under Terraform, but imported state still needs matching configuration.


**Practice:** Create a VPC module and consume it from dev/staging/prod with separate state.


### Day 68–69 — CI/CD pipelines


**Core mental model:** CI proves a change is safe enough to merge. CD moves a verified artifact through environments with controlled risk.


**Pipeline stages:** Test, lint, build, scan, publish artifact, deploy to dev, promote to staging, approve/progress to prod.


**Artifact immutability:** Promote the same image digest through environments. Do not rebuild separately for prod.


**Secrets:** Avoid long-lived cloud keys in CI. Prefer OIDC federation to cloud IAM where possible.


**Caching:** Cache dependencies and Docker layers to reduce build time, but invalidate safely.


**Rollback:** A rollback plan should be part of the pipeline, not an emergency improvisation.


### Day 70–71 — Deployment strategies


**Core mental model:** Deploy strategy controls blast radius. Releasing safely is about progressive exposure and fast rollback.


**Rolling:** Replaces instances gradually. Efficient and common, but rollback may take time.


**Blue-green:** Two full environments. Switch traffic quickly. Easier rollback, higher cost.


**Canary:** Send a small percentage of traffic to the new version, measure health, then increase traffic gradually.


**Feature flags:** Separate deploy from release. They also need ownership, cleanup, and auditability.


**Database migrations:** Use expand-contract: add backward-compatible schema first, deploy code that uses it, then remove old schema later.


**Practice:** Write a deploy plan for a breaking database column rename without downtime.


### Day 72–73 — Secret management with Vault


**Core mental model:** Secrets should be short-lived, auditable, access-controlled, and rotated. Static secrets copied into environments create long-lived blast radius.


**Dynamic secrets:** Vault can create database credentials on demand with TTLs. Leaked credentials expire automatically.


**Transit engine:** Applications send plaintext to Vault and receive ciphertext, without ever owning encryption keys directly.


**PKI engine:** Vault can issue short-lived certificates for internal TLS and mTLS.


**Auth methods:** AppRole, Kubernetes auth, and cloud IAM auth let workloads authenticate without embedding human credentials.


**Vault Agent:** Sidecar or daemon that renews tokens and writes secrets to files for the app.


**Practice:** Design secret flow for a Kubernetes Go service accessing PostgreSQL with rotating credentials.


### Day 74–75 — mTLS in production


**Core mental model:** mTLS authenticates both ends of a connection. It changes internal networking from location-based trust to identity-based trust.


**Certificates:** Each workload presents a client certificate and validates the server certificate. Trust depends on CA roots and certificate identity fields.


**SPIFFE/SPIRE:** Provides workload identity in a standard format such as `spiffe://trust-domain/ns/default/sa/api`.


**Service mesh:** Sidecar proxies can handle mTLS transparently, but add operational complexity and latency.


**Rotation:** Short-lived certs reduce compromise window but require automated issuance and renewal.


**Practice:** Explain why security groups alone do not prove which workload made a request.


## Phase 4 mastery checklist

- Choose L4 vs L7 load balancing for a real service.
- Design VPC routing for public, private, and database subnets.
- Build small, cache-friendly Docker images.
- Deploy Kubernetes workloads with probes, requests, limits, and HPA.
- Manage Terraform state safely.
- Promote immutable artifacts through CI/CD.
- Use expand-contract database migrations.
- Explain Vault dynamic secrets and production mTLS.

## 📖 Resources

- HashiCorp Vault documentation — read the Architecture section
- Kubernetes: Up and Running — Burns, Beda, Hightower
- _Terraform: Up and Running_ — Yevgeniy Brikman
- AWS Well-Architected Framework — Security Pillar
- SPIFFE/SPIRE docs: [spiffe.io](http://spiffe.io/)

## Phase 5 — Expert Systems (Days 76–90)
> **Goal:** Think and design at staff-engineer level. Build complete production systems from scratch. Understand observability, reliability mathematics, and multi-region architecture. This is the phase where you become dangerous.

---


## 🧠 Mental model


At this level, the job is no longer "write code that works." It's "design systems that are correct under failure, observable when they degrade, and scalable to 10x current load without a rewrite." Every decision carries a latency cost, an operational burden, and a blast radius. You must be able to articulate all three.


---


## 📚 Topics in order


### Day 76–77 — Observability — OpenTelemetry

- The three pillars and why you need all three:
    - **Logs:** what happened. Structured JSON. Correlation IDs.
    - **Metrics:** how often / how much. Counters, histograms, gauges.
    - **Traces:** where the latency went. Spans, parent-child relationships, context propagation.
- OpenTelemetry: vendor-neutral instrumentation standard. OTLP protocol.
- Trace context propagation: `traceparent` header across service boundaries
- Exemplars: linking a metric data point to a specific trace ID
- Sampling strategies: head-based (decide at entry point) vs tail-based (decide after seeing full trace)
- Cardinality explosion: why `user_id` as a metric label kills Prometheus
- Grafana stack: Prometheus (metrics) + Tempo (traces) + Loki (logs) + Grafana (dashboards)

### Day 78 — SLO / SLI / SLA

- SLI (Service Level Indicator): the actual measurement. E.g., % of requests < 200ms.
- SLO (Service Level Objective): the target. E.g., 99.9% of requests < 200ms over 30 days.
- SLA (Service Level Agreement): the contractual commitment with penalties.
- Error budget math: 99.9% SLO = 43.8 minutes of downtime allowed per month.
- Error budget burn rate: how fast you're consuming the budget. Fast burn = page now. Slow burn = ticket.
- Multi-window burn rate alerts: 1h window (fast burn) + 6h window (slow burn) = covers all failure modes.
- The right SLI for each service type: availability, latency percentiles, error rate, throughput.
- Why you should never have 100% as an SLO (it kills velocity and is mathematically impossible)

### Day 79–80 — Performance & latency engineering

- p50 vs p95 vs p99 vs p999: what each means for user experience
- Why averages are dangerous: a 50ms average can hide a 5s p99
- Little's Law: L = λ * W. Concurrency = throughput × latency. The math behind queue depth.
- Latency tail amplification: in a system with 10 microservices, each at 99% availability = 90% end-to-end
- Profiling Go services with `pprof`: CPU profile, memory profile, goroutine dump, block profile
- Flame graphs: reading them, finding the hot path
- Database connection pool sizing: too small = contention, too large = DB overload. Formula: (core count * 2) + effective spindle count.
- Benchmarking: `go test -bench`, `wrk`, `vegeta`. Measure under realistic load, not microbenchmarks.

### Day 81–82 — Multi-region architecture

- Active-passive: primary region handles all traffic. Secondary is warm standby. Failover in minutes.
- Active-active: both regions handle traffic. Much harder. Requires conflict resolution.
- Global load balancing: AWS Global Accelerator, Cloudflare Load Balancing — Anycast-based
- Data locality: put data close to users. Read replicas per region.
- Cross-region replication: async (low latency impact, some data loss risk) vs sync (zero loss, high latency)
- Data sovereignty: GDPR requirements. EU user data must stay in EU. Requires region-aware routing.
- Conflict resolution for active-active writes: last-writer-wins, vector clocks, CRDTs
- The "follow the sun" pattern for global operations teams

### Day 83–84 — System design: API Gateway

- Core responsibilities: auth verification, rate limiting, request routing, SSL termination, request/response transformation
- Plugin/middleware system: ordered chain of plugins per route
- Rate limiting at gateway: global limit (Redis-backed) vs local limit (in-memory, faster, less accurate)
- Circuit breaking: per upstream service. Track error rate in a sliding window.
- Request tracing: inject trace ID at entry, propagate downstream
- Service discovery integration: gateway reads live service registry, not static config
- Envoy xDS protocol: dynamic configuration via gRPC streams. No restart needed for config changes.
- How Kong, AWS API Gateway, and Apigee implement this differently

### Day 85–86 — System design: Auth server with DPoP

- Token issuance pipeline: validate credentials → issue DPoP-bound access token + refresh token
- DPoP proof validation on resource server: check `htm` (method), `htu` (URL), `iat` (timestamp), `jti` (unique ID)
- Nonce service: resource server issues nonces. Client must include current nonce in next DPoP proof. Prevents replay.
- JWKS endpoint: public key discovery. Clients fetch to verify token signatures without calling auth server.
- Key rotation: new signing key added to JWKS, old key retained for validation during transition period
- Revocation: access token (short TTL, Redis blocklist), refresh token (server-side state, invalidate on rotation)
- Token introspection endpoint: resource servers that can't validate JWTs call auth server
- Rate limiting on auth endpoints: credential stuffing prevention

### Day 87–88 — System design: Real-time streaming system

- Transport comparison:
    - Long polling: HTTP request held open, server responds when data available. Simple. High latency.
    - SSE (Server-Sent Events): one-way server push over HTTP. Auto-reconnect. HTTP/2 multiplexed.
    - WebSocket: full-duplex. Requires connection upgrade. Not HTTP-compatible at the proxy layer.
- Fan-out architecture: one event must reach N subscribers. Two approaches:
    - Push fan-out: write to each subscriber's queue at publish time. Fast reads, slow writes.
    - Pull fan-out: subscribers poll from shared stream. Slow reads, fast writes.
- Presence system: who is online? Heartbeat TTL in Redis. Sorted set of last-seen timestamps.
- Kafka-backed delivery: each user has a Kafka partition (or a consumer that filters). Allows replay for missed messages.
- Backpressure: slow WebSocket clients must not block the server. Use buffered channels with overflow handling.
- Horizontal scaling of WebSocket servers: sticky sessions OR stateless servers + Redis pub/sub for broadcast

### Day 89–90 — System design: Distributed cache

- Consistent hashing: each node is placed on a ring. A key maps to the nearest clockwise node.
- Virtual nodes: each physical node has 150+ virtual nodes. Ensures even distribution.
- Cache invalidation strategies:
    - TTL-based: simple. Stale data window = TTL.
    - Event-driven: invalidate on write. Complex. Requires event bus.
    - Write-through: write to cache and DB simultaneously. Always fresh. Higher write latency.
    - Write-behind: write to cache, async flush to DB. Risk of data loss.
- Cache stampede (thundering herd): all TTLs expire simultaneously. Thousands of DB queries at once.
- Probabilistic Early Recomputation (PER): start recomputing slightly before TTL expires, probabilistically. Spreads the load.
- Stale-while-revalidate: return stale data immediately, trigger async refresh. Zero latency on cache hit.
- Multi-tier caching: L1 in-process cache (fastest, small, node-local) → L2 Redis (shared, larger) → L3 database

---


## 🔨 Projects


### Project 1 — Full observability stack


**Stack:** OpenTelemetry Go SDK, Jaeger, Prometheus, Loki, Grafana


Instrument your Phase 2 Go service end-to-end. Every HTTP handler and gRPC method emits: (1) a trace span with custom attributes, (2) a request duration histogram, (3) a structured log with trace ID. Export to Jaeger (traces), Prometheus (metrics), Loki (logs). Build a Grafana dashboard: request rate, p99 latency, error rate, active goroutines. Write an SLO alert: page if error budget burn rate exceeds 5x for 1 hour.


**Deliverable:** A single Grafana dashboard where you can click a spike in the error rate chart → drill into the trace → see the exact log line that caused the error. Zero context switching between tools.


### Project 2 — Mini API Gateway in Go


**Stack:** Go, Redis, JWT, circuit breaker (custom implementation)


Reverse proxy that handles: (1) JWT validation on every request — reject 401 before forwarding, (2) rate limiting per user ID in Redis (sliding window), (3) request logging with trace IDs injected as headers, (4) circuit breaker per upstream: track error rate in a 10-second window, open circuit at 50% error rate, half-open after 30 seconds. Route config loaded from a YAML file without restart (file watcher).


**Deliverable:** Gateway handles 5,000 req/sec on a single core. Circuit breaker opens when you intentionally kill an upstream. Dashboard shows the circuit state transitions.


### Project 3 — Real-time notification service


**Stack:** Go, WebSocket (`gorilla/websocket`), Kafka, Redis pub/sub


Architecture: Producer publishes events to Kafka. Consumer reads from Kafka and publishes to Redis pub/sub channels per user. WebSocket server subscribes to Redis channel for each connected client. Handle: graceful reconnect (client sends last received event ID, server replays missed events from Kafka), backpressure (drop messages to slow clients after buffer fills), presence (Redis sorted set with heartbeat TTL).


**Deliverable:** 1,000 concurrent WebSocket connections. Kill a WebSocket server instance — clients reconnect to another instance and receive all missed messages with no duplicates.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Using average latency as your SLI.**


A service with average 50ms response time can have a p99 of 4 seconds if 1% of requests hit a slow path. 1 in 100 users is experiencing a 4-second load time. The average hides this completely.


**✅ Mental model:** Always measure and alert on percentiles: p95 for “typical” bad experience, p99 for “tail” bad experience, p999 for “worse case”. Averages are for capacity planning only, never for reliability signals.


### Mistake 2


**❌ Active-active multi-region without a conflict resolution strategy.**


Two regions accepting writes to the same entity simultaneously means write conflicts. Without explicit conflict resolution, you'll silently lose data or serve inconsistent state.


**✅ Mental model:** Define your conflict resolution model before designing active-active. Options: last-writer-wins (simple, loses data), vector clocks (tracks causality), CRDTs (merge-friendly data structures), or avoid it entirely with region-affinity routing (route each user to their home region).


### Mistake 3


**❌ Treating observability as logging only.**


Logs answer “what happened.” They don’t tell you why your p99 spiked, which downstream call is slow, or how a request flowed through 8 microservices. You need all three pillars.


**✅ Mental model:** Use traces to find WHERE latency is. Use metrics to see HOW OFTEN it happens. Use logs to understand WHAT specifically failed. The debugging workflow is: metrics alert → trace for context → logs for root cause.


### Mistake 4


**❌ Cache invalidation via TTL only.**


TTL causes thundering herd: when TTL expires for a popular key, thousands of concurrent requests all miss the cache simultaneously and all query the database. The DB collapses under the spike.


**✅ Mental model:** Use Probabilistic Early Recomputation (PER): each cache read has a small probability of triggering a background refresh as TTL approaches. This spreads recomputation over time. Or use stale-while-revalidate: return stale data immediately and refresh async.


---


## 🏢 How real companies solved this


**Google SRE:** Invented the SLO/error budget framework documented in the SRE book. Their rule is iron-clad: if the error budget is depleted, all feature work freezes until reliability is restored. This creates a shared incentive between product and infrastructure.


**Cloudflare:** Their Workers platform uses a distributed cache backed by Durable Objects with consistent hashing across 300+ PoPs. Cache invalidation is broadcast via the Durable Objects messaging system — not TTL-based. This is how they achieve near-instant cache purge globally.


**Discord:** Real-time presence system handles 500M+ events per day. They shard by guild ID — all members of a guild connect to the same process, making fan-out local instead of distributed. The lesson: smart sharding strategy can eliminate an entire class of distributed systems problems.


**Uber:** Their multi-region architecture for payments uses region-affinity: each driver and rider is assigned a home region. Payments involving cross-region parties go through an arbitration service. This avoids active-active write conflicts entirely by making conflict impossible through design.


---


## 🏆 You’re done — what’s next


After 90 days, you should be able to:

- Design and implement any service from scratch in Go with proper architecture
- Reason about database internals and make informed indexing/scaling decisions
- Deploy services to Kubernetes with zero-downtime strategies
- Debug production incidents using traces, metrics, and logs
- Design distributed systems with explicit consistency guarantees
- Pass staff-level system design interviews at any company

**Next steps:**

- Contribute to an open-source distributed system (etcd, CockroachDB, Prometheus)
- Attempt the system design problems in the DDIA book exercises
- Read Aphyr’s Jepsen analyses for real distributed system failure stories
- Take on an on-call rotation to experience production incidents firsthand

---


## 📝 Detailed notes by topic


### Day 76–77 — Observability with OpenTelemetry


**Core mental model:** Observability is the ability to understand system behavior from external signals. Logs, metrics, and traces answer different questions and become powerful when correlated.


**Logs:** Record discrete events. Use structured JSON, stable field names, request IDs, trace IDs, user/org identifiers where safe, and clear error fields. Avoid high-volume noisy logs and secrets.


**Metrics:** Measure behavior over time. Counters only increase, gauges go up/down, histograms capture distributions. Use labels carefully because high cardinality can break metric stores.


**Traces:** Show request flow through services. Spans represent units of work. Parent-child relationships reveal where latency is spent.


**OpenTelemetry:** Vendor-neutral instrumentation standard. Apps emit traces/metrics/logs through SDKs and exporters, often via the OpenTelemetry Collector.


**Sampling:** Head sampling decides at request start. Tail sampling decides after seeing the whole trace and can retain errors or slow requests more intelligently.


**Practice:** Instrument one handler, one outbound HTTP call, and one database query. Confirm the same trace ID appears in logs and spans.


### Day 78 — SLO / SLI / SLA


**Core mental model:** Reliability is a product decision expressed through measurements and error budgets.


**SLI:** What you measure, such as request success rate, p99 latency, or freshness.


**SLO:** Target for the SLI over a time window, such as 99.9% successful requests over 30 days.


**SLA:** Contractual promise with external consequences.


**Error budget:** Allowed unreliability. A 99.9% monthly availability SLO allows about 43.8 minutes of bad time per 30 days.


**Burn rate:** How quickly the service is consuming budget. Multi-window alerts catch both fast outages and slow degradation.


**Practice:** Define SLIs for an API, background worker, streaming system, and cache. Not all systems should use the same SLI.


### Day 79–80 — Performance & latency engineering


**Core mental model:** Users feel tail latency. Averages hide pain. Capacity and latency are connected by queueing behavior.


**Percentiles:** p50 is typical, p95 is common bad experience, p99 is tail pain, and p999 reveals rare but severe failures. Alert on percentiles, not averages.


**Little’s Law:** `L = lambda * W`. In service terms, concurrency equals throughput multiplied by latency. If latency rises under fixed throughput, in-flight work grows.


**Tail amplification:** End-to-end reliability drops as services are chained. Ten dependencies each at 99% success can produce much worse total success.


**Profiling:** Use `pprof` CPU, heap, goroutine, mutex, and block profiles. Flame graphs show where time or allocations concentrate.


**Benchmarking:** Use realistic data, concurrency, payloads, and dependencies. Microbenchmarks alone do not prove production performance.


**Practice:** Load test an endpoint with `wrk` or `vegeta`, capture p99, then profile while the test runs.


### Day 81–82 — Multi-region architecture


**Core mental model:** Multi-region design trades latency, availability, consistency, cost, and operational complexity. Active-active is not a default; it is a commitment.


**Active-passive:** One primary region serves writes. Secondary waits for failover. Simpler consistency, slower recovery.


**Active-active:** Multiple regions serve traffic. Improves locality and availability but requires conflict resolution, routing, and careful data design.


**Replication:** Async replication is faster but can lose recent writes during failover. Sync replication reduces loss but increases latency.


**Data locality:** Store and process data near users when latency or regulation demands it. GDPR and data residency can shape architecture.


**Conflict resolution:** Last-writer-wins is simple but can lose data. Vector clocks track causality. CRDTs allow mergeable state. Region affinity can avoid many conflicts.


**Practice:** Design multi-region for profile reads, payment writes, chat messages, and analytics events. Choose active-passive or active-active deliberately.


### Day 83–84 — System design: API Gateway


**Core mental model:** An API gateway is the controlled entry point to a service graph. It should protect services without becoming an unmaintainable central bottleneck.


**Responsibilities:** TLS termination, auth verification, routing, rate limiting, request transformation, response transformation, tracing, logging, and circuit breaking.


**Rate limiting:** Local in-memory limits are fast but approximate. Redis-backed global limits are more accurate but add dependency and latency.


**Circuit breakers:** Track failures per upstream. Closed means normal traffic. Open means fail fast. Half-open probes recovery.


**Service discovery:** Gateways should use live service registry data or dynamic config rather than hardcoded endpoints.


**Plugin order:** Authentication should happen before expensive transformations. Rate limits may be per anonymous IP before auth and per identity after auth.


**Practice:** Sketch the request path through gateway plugins and define what happens when auth, rate limit, or upstream call fails.


### Day 85–86 — System design: Auth server with DPoP


**Core mental model:** A secure auth server is a key-management, token-lifecycle, replay-defense, and policy-enforcement system.


**Issuance pipeline:** Validate client and user, enforce grant rules, bind access token to DPoP public key, issue refresh token, log security-relevant events.


**JWKS:** Publish public signing keys so resource servers can validate JWTs without calling the auth server. Keep old public keys until old tokens expire.


**Key rotation:** Introduce new signing key, publish it, start signing new tokens, keep old keys for validation, then retire old keys after expiry windows.


**DPoP validation:** Resource server checks proof signature, method, URL, timestamp, unique `jti`, nonce if required, and key binding through the token `cnf` claim.


**Revocation:** Use short-lived access tokens, stateful refresh tokens, rotation, blocklists for emergency access-token revocation, and audit logs.


**Practice:** Write the validation checklist for one incoming DPoP request and identify every rejection condition.


### Day 87–88 — System design: Real-time streaming system


**Core mental model:** Real-time systems are about fan-out, ordering, backpressure, reconnection, and replay.


**Transport choice:** Long polling is simple but inefficient. SSE is excellent for one-way server push. WebSockets provide full-duplex communication but require connection management and careful load balancing.


**Fan-out:** Push fan-out writes to each subscriber queue at publish time. Pull fan-out lets subscribers read from a shared stream. Choose based on read/write ratio and subscriber count.


**Presence:** Use heartbeat TTLs and last-seen timestamps. Presence is usually eventually consistent; design UI accordingly.


**Backpressure:** Slow clients must not block the whole server. Use bounded buffers, drop policies, disconnect thresholds, or replay-based recovery.


**Reconnect and replay:** Clients should send last received event ID. Server replays missed events and deduplicates on client or server side.


**Practice:** Design what happens when a WebSocket server dies while a user has unread messages in flight.


### Day 89–90 — System design: Distributed cache


**Core mental model:** Caches trade freshness and complexity for latency and load reduction. A cache is part of correctness once users depend on it.


**Consistent hashing:** Maps keys to nodes so adding/removing a node moves only a fraction of keys. Virtual nodes improve distribution.


**Invalidation:** TTL is simple but creates stale windows and stampedes. Event-driven invalidation is fresher but more complex. Write-through and write-behind change write latency and durability risk.


**Stampede control:** Use request coalescing, locks, stale-while-revalidate, jittered TTLs, or probabilistic early recomputation.


**Multi-tier caching:** L1 in-process cache is fastest but local and inconsistent. L2 Redis is shared. L3 database is source of truth.


**Practice:** Design cache strategy for product details, user permissions, feature flags, and timeline feeds. Define freshness requirements for each.


## Phase 5 mastery checklist

- Correlate logs, metrics, and traces through one request.
- Define useful SLIs and SLOs with burn-rate alerts.
- Explain p95/p99 latency and tail amplification.
- Use `pprof` to find CPU, memory, goroutine, and lock issues.
- Design multi-region architecture with explicit consistency choices.
- Design an API gateway with auth, rate limiting, tracing, and circuit breaking.
- Design DPoP token issuance and validation.
- Design real-time fan-out with replay and backpressure.
- Design cache invalidation without relying only on TTL.

## 📖 Resources

- Google SRE Book (free online): [sre.google/sre-book](http://sre.google/sre-book)
- _Systems Performance_ — Brendan Gregg (the bible of performance engineering)
- OpenTelemetry documentation: [opentelemetry.io](http://opentelemetry.io/)
- Distributed Systems lecture notes — Martin Kleppmann (Cambridge, free on YouTube)
- Brendan Gregg’s flamegraph tool: [github.com/brendangregg/FlameGraph](http://github.com/brendangregg/FlameGraph)
