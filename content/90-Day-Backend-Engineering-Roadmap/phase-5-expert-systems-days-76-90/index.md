---
source: notion
title: "Phase 5 — Expert Systems (Days 76–90)"
slug: "phase-5-expert-systems-days-76-90"
notionId: "358da883-bddd-81b2-9d3f-ca248a4f4606"
notionRootId: "358da883bddd81e1b394ca83aa7ed599"
parent: "90-day-backend-engineering-roadmap"
children: []
order: 1
icon: "🧠"
cover: null
---
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
