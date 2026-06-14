---
source: notion
title: "🏗️ 90-Day HLD Roadmap — High-Level System Design"
slug: "90-day-hld-roadmap-high-level-system-design"
notionId: "359da883bddd81c38141f8f9b4db8e8a"
notionRootId: "359da883bddd81c38141f8f9b4db8e8a"
parent: null
children: ["phase-5-expert-level-systems-days-76-90","phase-4-real-system-designs-days-56-75","phase-3-distributed-system-patterns-days-36-55","phase-2-core-system-components-days-16-35","phase-1-foundations-of-system-design-days-1-15"]
order: 1
icon: "🏗️"
cover: null
---
> 🏗️ **Frontend → Systems Engineer transition.** 90 days. 5 phases. High-Level Design mastery from first principles to staff-engineer level.

---


## 📌 How to use this template

- Work through phases **in order** — each phase builds directly on the last
- Every day: study the topic → sketch a design → log one mistake you caught yourself making
- Use the **Daily Tracker** database to stay accountable
- Open each **Phase page** for full topic breakdowns, projects, real-system references, and mistake corrections
> 💡 **The #1 rule of HLD:** Never draw a single box until you've written down the requirements and estimated the scale. Senior engineers spend 40% of a design session on constraints before touching architecture.

---


## 🗺️ Roadmap at a glance


| Phase                          | Days       | Focus                                        | Projects                                   |
| ------------------------------ | ---------- | -------------------------------------------- | ------------------------------------------ |
| Phase 1 — Foundations          | Days 1–15  | Vocabulary, estimation, CAP, building blocks | URL Shortener requirements, Estimation CLI |
| Phase 2 — Core Components      | Days 16–35 | Caching, queues, CDN, load balancing, search | Caching layer design, Rate limiter doc     |
| Phase 3 — Distributed Patterns | Days 36–55 | Sagas, consistency, sharding, consensus      | Job scheduler, Saga design, Sharding doc   |
| Phase 4 — Real System Designs  | Days 56–75 | Twitter, Uber, Netflix, Payments, WhatsApp   | Full HLD docs, Mock interview              |
| Phase 5 — Expert Systems       | Days 76–90 | Multi-region, migrations, staff review       | Notification system, Architecture critique |


---


## ⚡ The RESHADED Framework


Use this structure for every system design — interview or production.

- **R** — Requirements (functional + non-functional)
- **E** — Estimation (QPS, storage, bandwidth, memory)
- **S** — Storage schema (which DB, why, what schema)
- **H** — High-level design (component diagram)
- **A** — APIs (REST/gRPC endpoints, contracts)
- **D** — Detailed design (deep dive on 2–3 critical components)
- **E** — Evaluate (failure scenarios, bottlenecks, tradeoffs)
- **D** — Distinguish (what makes your design better than the naive approach)

---


## 📊 My progress

- Current phase: **Phase 1**
- Current day: **Day 1 of 90**
- Systems fully designed: **0 / 12**
- Design docs written: **0**

---


## 🔖 Quick links

- 📐 Phase 1 — Foundations of System Design
- ⚙️ Phase 2 — Core System Components
- 🔀 Phase 3 — Distributed System Patterns
- 🏛️ Phase 4 — Real System Designs
- 🧠 Phase 5 — Expert-Level Systems

---


## 📐 Latency numbers every designer must know


| Operation                         | Latency |
| --------------------------------- | ------- |
| L1 cache reference                | ~1 ns   |
| L2 cache reference                | ~4 ns   |
| RAM reference                     | ~100 ns |
| SSD read (4KB)                    | ~100 µs |
| Read 1MB from SSD                 | ~1 ms   |
| Network round-trip (same DC)      | ~0.5 ms |
| Network round-trip (cross-region) | ~100 ms |
| Read 1MB from network             | ~10 ms  |
| HDD seek                          | ~10 ms  |

> These numbers drive every architecture tradeoff. Memorise them. Use them in every estimation.

📅 HLD Daily Tracker


## Phase 1 — Foundations of System Design (Days 1–15)
> **Core insight:** Before you draw a single box, write down the requirements and estimate the numbers. This is the skill that separates a junior who draws boxes from a senior who designs systems.

---


## 🧠 Why this phase exists


Most engineers who struggle with HLD interviews don't lack knowledge of systems — they lack a structured thinking process. They jump to solutions, skip estimation, and design for imaginary constraints. This phase gives you the mental operating system that every subsequent phase runs on.


---


## 📚 Topics in order


### Day 1–2 — What is HLD vs LLD

- HLD (High-Level Design): component responsibilities, data flow between services, technology choices, tradeoffs. No code.
- LLD (Low-Level Design): class design, data structures, algorithms, API method signatures. Code-adjacent.
- When to switch levels: start HLD, zoom into LLD on the 2–3 most critical components only
- The five outputs of a good HLD: component diagram, API contracts, database schema choice, data flow description, failure scenarios

### Day 3–4 — Requirements engineering

- Functional requirements: what the system does. Core features only — not nice-to-haves.
- Non-functional requirements (NFRs): availability target (99.9% vs 99.99%), latency SLO (p99 < 200ms), consistency model (strong vs eventual), durability guarantees
- Scope constraints: what’s explicitly out of scope (saves time in interviews, prevents scope creep in production)
- Template: “The system must [action] for [user] within [constraint] with [quality attribute]”

### Day 5–6 — Back-of-envelope estimation

- **QPS calculation:** DAU × requests/user/day ÷ 86,400 seconds = avg QPS. Peak = avg × 3
- **Storage sizing:** writes/day × bytes/write × days retention
- **Bandwidth:** QPS × payload size per request
- **Memory (cache):** hot data = 20% of daily active data (80/20 rule)
- Powers of 2 table: 10 = 1K, 20 = 1M, 30 = 1B, 40 = 1T
- Byte sizes: char = 1B, UUID = 16B, long = 8B, timestamp = 4B

### Day 7–8 — CAP theorem for designers

- CAP: Consistency, Availability, Partition Tolerance. Partition tolerance is not optional in any distributed system.
- CP systems: return an error when partitioned rather than serve stale data. Examples: ZooKeeper, etcd, HBase.
- AP systems: return potentially stale data when partitioned rather than an error. Examples: Cassandra, DynamoDB (default), CouchDB.
- PACELC extension: even without a partition, there is a latency-consistency tradeoff (L vs C)
- Decision framework: “If this service is partitioned, is it better to show stale data or show an error?” — that’s a product decision.

### Day 9–10 — Core building blocks

- **Load balancer:** distributes traffic across server instances. L4 (TCP) vs L7 (HTTP). When to use each.
- **Cache:** reduces latency and DB load. Redis, Memcached. When to cache, when not to.
- **Database:** relational (ACID, SQL) vs NoSQL (various consistency, various models). Choose by access pattern.
- **Message queue:** decouples services, enables async processing. RabbitMQ, Kafka, SQS.
- **CDN:** serves static and cacheable content from the edge. Biggest ROI scaling win.
- **Object storage:** S3-like. For blobs > 1MB. Never store in SQL.
- Rule: reach for each building block only when you have a specific problem it solves.

### Day 11–12 — Scalability fundamentals

- Vertical scaling (scale-up): bigger machine. Simple. Has a ceiling. Single point of failure.
- Horizontal scaling (scale-out): more machines. Complex. Requires stateless services.
- Stateless vs stateful: stateless services can be horizontally scaled trivially. State must live in a shared store.
- Shared-nothing architecture: no instance shares in-memory state with another. Scale to any number of nodes.
- Read scaling: add read replicas. Write scaling: requires sharding or a different architecture.

### Day 13 — Latency numbers every designer must know

- L1 cache: ~1ns · L2 cache: ~4ns · RAM: ~100ns
- SSD read 4KB: ~100µs · Read 1MB from SSD: ~1ms
- Same datacenter network: ~0.5ms · Cross-region network: ~100ms
- HDD seek: ~10ms · Read 1MB from network: ~10ms
- How to use these: a design that makes 10 cross-region calls per request has 1 second of unavoidable latency.

### Day 14–15 — The HLD interview framework: RESHADED

- **R** — Requirements: clarify functional + non-functional. Never skip.
- **E** — Estimation: QPS, storage, bandwidth. Takes 3 minutes. Constrains every decision.
- **S** — Storage: which database(s), why, what schema shape
- **H** — High-level design: boxes and arrows at component level
- **A** — APIs: REST/gRPC endpoints, request/response shape
- **D** — Detailed design: deep dive on 2–3 critical components
- **E** — Evaluate: failure scenarios, bottlenecks, SPOFs
- **D** — Distinguish: what makes your design better than the obvious approach

---


## 🔨 Projects


### Project 1 — URL Shortener requirements doc (constraints only)


**Deliverable:** A written constraints document — no architecture yet.


Answer in writing before designing anything:

- Who are the users? Read-heavy or write-heavy? What ratio?
- What’s the peak QPS for reads? For writes?
- How long do links live? What’s the storage requirement over 5 years?
- What’s the latency SLO for redirects? (Hint: should be < 10ms)
- Consistency requirement: is it OK to redirect to an old URL for 1 second after update?
- What’s explicitly out of scope for v1?

**Why:** Every system design mistake traces back to a missing or wrong requirement. Building this muscle now prevents 80% of bad designs later.


### Project 2 — Estimation calculator


**Stack:** Any spreadsheet or simple CLI tool


Build a reusable estimation template. Inputs: DAU, requests per user per day, data size per request, read:write ratio, retention days. Outputs: average QPS, peak QPS, storage per year, daily bandwidth, cache memory needed (20% of hot data).


Run it for: Twitter (500M DAU), WhatsApp (2B DAU), a startup (100K DAU). See how the architecture must change at each scale.


### Project 3 — Three architecture case studies


**Deliverable:** One A4 page per system


Read the following engineering blog posts and write a 1-page summary for each: (1) Uber’s architecture evolution, (2) Discord’s message storage migration from MongoDB to Cassandra to ScyllaDB, (3) Slack’s job queue system.


For each, answer: What was the original design? What broke at scale? What did they change? What was the core tradeoff they made?


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Jumping to architecture before writing requirements.**


You design a complex distributed system, then the interviewer says “oh, this only needs to handle 1K users.” 20 minutes wasted.


**✅ Correct approach:** Spend the first 5 minutes only on requirements and estimation. Ask: “Before I start designing, let me confirm the scale and core constraints.” This also signals seniority.


### Mistake 2


**❌ Treating NFRs as vague aspirations (‘fast and reliable’).**


‘Fast’ could mean 1ms or 1 second depending on the system. ‘Reliable’ could mean 99% or 99.999% uptime.


**✅ Correct approach:** Every NFR must be a number: “99.9% availability (43 min downtime/month), p99 latency < 200ms, RPO < 1 hour, RTO < 10 minutes.” Numbers drive architecture. Adjectives don’t.


### Mistake 3


**❌ Memorising specific system designs to regurgitate.**


Interviewers change one requirement and the memorised design collapses completely.


**✅ Correct approach:** Learn WHY Twitter chose fan-out-on-write, not just THAT they did. The why (write-heavy tradeoff for read-heavy users) generalises to every feed system. Principles transfer; facts don’t.


### Mistake 4


**❌ Treating CAP theorem as a theoretical checkbox.**


Everyone mentions CAP, almost nobody uses it to actually make a design decision.


**✅ Correct approach:** When choosing a database, explicitly state your CAP choice and justify it. “We need AP because showing a slightly stale cart is better than showing an error page” is a real architectural decision backed by CAP reasoning.


---


## 🏢 How real companies solved this


**Amazon (2002 — Bezos’s API mandate):** Every team must expose data only through service interfaces. No direct database access between teams. This single requirements decision — made before any architecture — created AWS. Requirements shape architectures for decades.


**Google — Jeff Dean’s latency table:** The “Numbers Every Engineer Should Know” document originated inside Google and became the foundation of how every large-scale system at the company is reasoned about. Back-of-envelope estimation is a first-class engineering skill there.


**Netflix — CAP decision for recommendations:** They explicitly chose AP. If the recommendation service is partitioned, users get slightly stale suggestions — not an error page. This was a deliberate product decision that preceded the architecture, not the other way around.


---


## 📖 Resources

- _System Design Interview Vol. 1 & 2_ — Alex Xu (use as reference, not scripture)
- _Designing Data-Intensive Applications_ — Kleppmann (Ch. 1–2 for foundations)
- ByteByteGo newsletter — weekly system design breakdowns
- High Scalability blog: [highscalability.com](http://highscalability.com/) (real architecture case studies)
- Jeff Dean’s ‘Building Large-Scale Internet Services’ talk (YouTube)

## Phase 2 — Core System Components (Days 16–35)
> **Core insight:** Most engineers know WHAT these components are. Great designers know WHY to choose Redis over Memcached, WHY Kafka over RabbitMQ, WHY consistent hashing over random assignment. The ‘why’ is the entire skill.

---


## 🧠 Why this phase exists


Every large system is assembled from the same 10–12 primitives. This phase makes you dangerous with each one — not just naming them, but knowing their internal mechanics, failure modes, and the precise conditions under which each becomes the right tool.


---


## 📚 Topics in order


### Day 16–17 — SQL databases at scale

- MVCC (Multi-Version Concurrency Control): how Postgres serves reads without blocking writes
- Indexing strategy: B-tree for equality + range, Hash for equality only, GiST for geospatial
- When does SQL stop scaling? ~10M writes/day on a single node is a rough ceiling
- Solutions in order: (1) add indexes, (2) add read replicas, (3) connection pooling (pgBouncer), (4) vertical scale, (5) shard — in that order, not all at once
- Connection pooling: why 10,000 Postgres connections kill performance (each is an OS process)
- Query optimisation: EXPLAIN ANALYZE, covering indexes, partial indexes, avoiding N+1

### Day 18–19 — NoSQL selection framework

- **Key-Value (Redis, DynamoDB):** O(1) get/set by key. No relationships. Use for: sessions, caching, leaderboards.
- **Document (MongoDB, Firestore):** JSON documents, flexible schema. Use for: user profiles, product catalogues, content.
- **Wide-Column (Cassandra, HBase):** rows with dynamic columns, optimised for write-heavy time-series. Use for: event logs, IoT data, messaging.
- **Graph (Neo4j, Neptune):** nodes + edges. Use for: social graphs, recommendation engines, fraud detection.
- Selection rule: choose by access pattern, not by what’s trendy. What queries will be run 80% of the time?

### Day 20–21 — Caching deep dive

- **Cache-aside (lazy loading):** app checks cache first, loads from DB on miss, populates cache. Most common pattern.
- **Read-through:** cache sits in front of DB. Cache handles misses automatically. Simpler app code.
- **Write-through:** every DB write also writes to cache. Always fresh. Higher write latency.
- **Write-behind (write-back):** write to cache immediately, flush to DB async. Lowest write latency. Risk of data loss.
- Eviction policies: LRU (evict least recently used) vs LFU (evict least frequently used)
- Cache stampede (thundering herd): when a popular key expires, thousands of requests hit DB simultaneously. Solutions: mutex lock on cache miss, probabilistic early expiration, background refresh.
- Cache invalidation: TTL-based (simple, stale window) vs event-driven (complex, always fresh)

### Day 22–23 — CDN architecture

- Origin vs edge: origin is your server, edge is a CDN PoP (Point of Presence) close to users
- Push CDN: you proactively push content to edge nodes. Best for known, finite asset sets.
- Pull CDN: edge fetches from origin on first request, caches for subsequent. Best for large, dynamic asset sets.
- Cache-Control headers: `max-age`, `s-maxage`, `stale-while-revalidate`, `no-cache` vs `no-store`
- CDN for APIs: `Cache-Control: public, max-age=60` on GET endpoints caches them at edge. Biggest scaling win for read-heavy APIs.
- Purging: cache key invalidation by URL, tag, or prefix. Design your URLs to be purge-friendly.
- Cloudflare Workers: CDN as a compute layer. Run business logic at the edge, eliminate origin entirely.

### Day 24–25 — Load balancing in depth

- Round robin: even distribution, ignores server load. Good for homogeneous servers.
- Least connections: route to server with fewest active connections. Better for variable request duration.
- IP hash: same client always hits same server. Enables sticky sessions. Breaks horizontal scaling.
- Consistent hashing: keys map deterministically to nodes. Adding/removing a node only remaps 1/N keys. Used for sharding and distributed caches.
- L4 vs L7: L4 (TCP, fast, no HTTP awareness) vs L7 (HTTP, can route by path/header, can terminate TLS)
- Health checks: passive (detect failures from responses) vs active (periodic pings to /healthz)
- Connection draining: wait for in-flight requests before removing a node from rotation

### Day 26–27 — Message queues & event streaming

- Queue (RabbitMQ, SQS): message deleted after consumption. Best for task distribution (one consumer per task).
- Log/stream (Kafka): messages retained by time/size. Multiple independent consumer groups. Replay possible.
- At-least-once delivery: the safe default. Consumer must be idempotent (handle duplicate messages).
- At-most-once: faster, but messages can be lost. Use for metrics, logs — never for payments.
- Exactly-once: requires transactional producer (Kafka) or deduplication store. Expensive. Use only when necessary.
- Dead letter queue (DLQ): messages that fail N times go here. Alert on DLQ depth.
- Decision rule: need replay / multiple independent consumers / event history? → Kafka. Simple job queue? → SQS/RabbitMQ.

### Day 28–29 — Object storage & blob systems

- S3 architecture: flat namespace (no real folders), eventual consistency on list operations, strong consistency on reads after writes (since 2020)
- Multipart upload: files > 100MB split into parts, uploaded in parallel, assembled server-side
- Pre-signed URLs: generate a time-limited URL that gives clients direct upload/download access to S3. No proxying through your server.
- Never store blobs in SQL: VARCHAR(MAX) or BLOB columns destroy query performance. Always store the URL, not the file.
- Lifecycle policies: automatically move objects to cheaper storage tiers (S3 IA, Glacier) after N days
- Design pattern: client uploads directly to S3 via pre-signed URL → S3 event triggers Lambda/SQS → your service processes. Zero blob traffic through your servers.

### Day 30–31 — Search systems

- Inverted index: maps every term to a list of document IDs containing that term. Core data structure of every search engine.
- Elasticsearch architecture: cluster of shards (primary + replicas). Each shard is a Lucene index.
- Refresh interval: newly indexed documents become searchable after 1 second (default). Not real-time.
- Query types: match (full-text, analysed), term (exact, not analysed), range, bool (AND/OR/NOT composition)
- Typeahead/autocomplete: Trie data structure (fast prefix lookup, complex to distribute) vs prefix-indexed Elasticsearch/Redis sorted set (simpler to scale)
- Search vs database: search indexes are eventually consistent and not ACID. Never use Elasticsearch as your primary data store.

### Day 32–33 — Rate limiting patterns

- **Fixed window:** count requests per time window. Simple. Allows 2x limit at window boundary.
- **Sliding window log:** store timestamp of each request. Accurate. High memory for high QPS.
- **Sliding window counter:** hybrid. Estimate using previous window’s count proportionally. Accurate enough, low memory.
- **Token bucket:** bucket refills at a fixed rate. Allows short bursts. Most common in production.
- **Leaky bucket:** requests process at a fixed rate. No bursting. Good for smoothing traffic.
- Where to enforce: (1) API gateway (global limit), (2) per-service (service-level protection), (3) database level (connection limit). Enforce at the outermost layer first.
- Distributed rate limiting: Redis Lua script for atomic check-and-decrement. One script = one atomic operation across all instances.

### Day 34–35 — API design at scale

- REST vs gRPC vs GraphQL: REST for public/simple, gRPC for internal service-to-service (binary, typed, fast), GraphQL for complex client-driven queries
- Pagination: offset (`?page=3&limit=20`) — breaks on deletes, slow on large tables. Cursor-based (`?after=xyz&limit=20`) — stable, scalable, use this.
- Backward compatibility: never remove or rename fields in a response. Add new fields; mark old ones deprecated. Version only on breaking changes.
- Idempotency keys: client sends a unique key per request. Server stores key + response. Duplicate requests return the same response without re-executing.
- API versioning: URL path (`/v1/`) for major breaks, headers for minor variations. Date-based versioning (Stripe pattern) for long-lived APIs.

---


## 🔨 Projects


### Project 1 — Caching strategy design doc


**Scenario:** A news feed service is handling 50K QPS on a single PostgreSQL instance. Response times are degrading.


**Deliverable:** A full written design document covering: (1) what to cache (feed results, user profiles, article metadata), (2) which cache pattern per data type, (3) TTL values and justification, (4) invalidation triggers on write, (5) what happens during a cache stampede and your mitigation, (6) what to do if Redis goes down (graceful degradation plan).


### Project 2 — Distributed rate limiter design


**Deliverable:** A complete design doc for a production rate limiter serving 100K QPS.


Cover: algorithm choice + justification (token bucket or sliding window counter), Redis data structure used (sorted set vs string with INCR), why Lua script is required for atomicity, how to handle 3 tiers (per-user 100/min, per-IP 1000/min, per-endpoint 10K/min), behaviour when Redis is unavailable (fail-open vs fail-closed tradeoff), and how to test it under concurrent load.


### Project 3 — Technology selection matrix


**Deliverable:** A reference table for your own future use.


For each of these 10 scenarios, write: the technology you’d choose, the data structure/model it uses, and a one-sentence justification: (1) user sessions, (2) real-time leaderboard, (3) full-text search, (4) time-series metrics, (5) social graph traversal, (6) event streaming with replay, (7) simple task queue, (8) geospatial nearest-neighbor, (9) large file storage, (10) flexible product schema.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Defaulting to Redis for everything.**


Redis evicts data under memory pressure based on your eviction policy. An LRU eviction means your ‘stored’ data can silently disappear.


**✅ Correct approach:** Redis is a cache and ephemeral state store. If durability matters, the source of truth is your database. Redis is L2, not L1. Cache derivable data; store durable data in Postgres.


### Mistake 2


**❌ Choosing Kafka for a simple background job queue.**


Kafka’s operational complexity (brokers, ZooKeeper/KRaft, partition management, consumer group lag monitoring) is overkill for ‘send a welcome email after signup.’


**✅ Correct approach:** For task queues with one consumer per task: SQS or RabbitMQ. For event streaming with multiple independent consumers, log retention, and replay: Kafka. The replay capability is Kafka’s distinguishing feature — use it only when you need it.


### Mistake 3


**❌ Treating CDN as an afterthought for static files only.**


Most engineers add a CDN for images and JS bundles, then leave all API traffic going to origin.


**✅ Correct approach:** Any GET endpoint that returns data that’s the same for all users within a time window can be CDN-cached. `Cache-Control: public, max-age=60` on your `/trending` endpoint serves millions of reads from edge nodes with zero origin load.


### Mistake 4


**❌ Offset-based pagination.**


`SELECT * FROM posts OFFSET 1000000 LIMIT 20` requires Postgres to scan and discard 1 million rows. On a large table this takes seconds.


**✅ Correct approach:** Always use cursor-based pagination. `WHERE id > :last_seen_id LIMIT 20` uses the index directly. Stable (inserts don’t shift pages), fast (index seek), and scales to billions of rows.


---


## 🏢 How real companies solved this


**Discord — database migration:** Started on MongoDB (document store, flexible schema). Migrated to Cassandra (wide-column) when message storage hit billions. Hit JVM GC pauses at 1 trillion messages and migrated to ScyllaDB (Rust, same Cassandra API, no GC pauses). Three different database technologies for the same access pattern — chosen at different scale inflection points.


**Cloudflare — CDN as compute:** Their Workers platform runs business logic at 300+ edge PoPs. For cacheable + personalised responses, they eliminate the origin server entirely. CDN architecture merged with application architecture. This is the direction all CDNs are heading.


**Uber — distributed rate limiter:** Token bucket algorithm, Redis-backed, with a Lua script for atomic check-and-decrement. A single Lua EVAL command is the entire rate limit check — atomic, sub-millisecond, and consistent across all service instances hitting the same Redis cluster.


---


## 📖 Resources

- _Designing Data-Intensive Applications_ — Kleppmann Ch. 3, 5, 11 (storage engines, replication, streams)
- Redis University: [university.redis.com](http://university.redis.com/) (free, deep on data structures)
- Use The Index, Luke: [use-the-index-luke.com](http://use-the-index-luke.com/) (SQL indexing for designers)
- Confluent’s Kafka documentation: the ‘Kafka: The Definitive Guide’ is free online
- AWS Architecture Center: [aws.amazon.com/architecture](http://aws.amazon.com/architecture) (real reference architectures)

## Phase 3 — Distributed System Patterns (Days 36–55)
> **Core insight:** Every distributed systems pattern is a direct response to a specific failure mode. Learn the failure mode first, then the pattern. If you can’t name what breaks without the pattern, you don’t understand the pattern.

---


## 🧠 Why this phase exists


Single-machine systems are solved problems. The interesting failures — and the interesting design challenges — happen when data is spread across machines that can fail independently and communicate over networks that can partition. This phase gives you the precise mental models for every distributed systems challenge you’ll face in production.


---


## 📚 Topics in order


### Day 36–37 — Monolith vs microservices decision

- Conway’s Law: your architecture mirrors your org chart. Microservices are an organisational scaling solution first.
- When to split into microservices: (1) teams need independent deployment, (2) components have wildly different scaling needs, (3) clear domain boundaries exist (bounded contexts from DDD), (4) different SLOs per component
- When NOT to split: early-stage product with <5 engineers, no clear domain boundaries, shared database (the worst anti-pattern), inability to define service contracts
- The right order: monolith → modular monolith → microservices. Never start with microservices.
- Operational cost of microservices: distributed tracing, service discovery, network latency, distributed transactions, polyglot persistence. Each is a full-time concern.

### Day 38–39 — Service-to-service communication

- **Synchronous (REST/gRPC):** request-response. Caller waits. Tight coupling. Use when: you need the result to continue, the operation is fast, the callee is reliable.
- **Asynchronous (Kafka/SQS):** caller publishes an event and continues. Loose coupling. Use when: the result isn’t needed immediately, the callee can be slow/unreliable, you need retry resilience.
- gRPC advantages over REST for internal: binary protocol (smaller payload), strongly typed contracts (Protobuf), bidirectional streaming, built-in deadline propagation
- Deadline propagation: if a request has a 200ms budget and 80ms has elapsed, the downstream call should have a 120ms deadline — not a fresh 200ms. Most engineers miss this.
- Service mesh (Istio/Linkerd): handles mTLS, retries, circuit breaking, and tracing at the infrastructure level. Worth it at 50+ services.

### Day 40–41 — Data consistency patterns

- **Strong consistency (linearisability):** reads always return the most recent write. Requires coordination. Expensive. Use for: payments, inventory, user auth.
- **Eventual consistency:** writes propagate eventually. Reads may be stale temporarily. Use for: social feeds, search indexes, recommendation engines.
- **Causal consistency:** causally related operations are seen in order by all nodes. Weaker than strong, stronger than eventual. Vector clocks implement this.
- Read-your-own-writes: after writing, your next read must see that write. Solved by: routing your reads to the same replica you wrote to (session consistency) or always reading from primary.
- Rule: choose the weakest consistency model that your domain can tolerate. Weaker = cheaper + faster.

### Day 42–43 — Distributed transactions

- **2-Phase Commit (2PC):** coordinator sends ‘prepare’ to all participants, collects acks, then sends ‘commit’. Atomic. But: blocks if coordinator fails between prepare and commit. Slow.
- **Saga pattern:** break the transaction into a sequence of local transactions, each with a compensating transaction for rollback. No global locks.
    - Choreography saga: each service listens for events and publishes events. No central coordinator. Hard to debug.
    - Orchestration saga: a central saga orchestrator tells each service what to do. Easier to trace. Single point of control.
- **Outbox pattern:** write your domain event to an outbox table in the same DB transaction as the business data. A separate process publishes outbox events to Kafka. Guarantees at-least-once event publishing without 2PC.
- Rule: avoid distributed transactions. Design your domain so that a single service owns each business operation.

### Day 44–45 — Fault tolerance patterns

- **Circuit breaker:** tracks error rate to a downstream service. CLOSED (normal) → OPEN (fail fast, no calls sent) → HALF-OPEN (probe if recovered). Prevents cascade failures.
- **Bulkhead:** isolate resources per downstream. Separate thread pools/connection pools per dependency. A slow downstream exhausts only its pool, not the entire service.
- **Retry with exponential backoff + jitter:** retry after 1s, 2s, 4s, 8s — with random jitter added. Without jitter, all clients retry simultaneously (thundering herd).
- **Timeout budget:** every network call has a deadline. Set timeouts at every layer. Propagate remaining budget downstream.
- **Graceful degradation:** if the recommendation service is down, show a generic list. If the review service is down, show the product without reviews. Never cascade a non-critical failure into a critical failure.
- **Idempotency:** every write operation that can be retried must produce the same result regardless of how many times it’s called.

### Day 46–47 — Data partitioning at scale

- **Range sharding:** data split by value range (user IDs 1–1M on shard 1, 1M–2M on shard 2). Pro: range queries work. Con: monotonic keys create write hotspots.
- **Hash sharding:** `shard = hash(key) % num_shards`. Pro: even distribution. Con: no range queries, resharding is expensive.
- **Directory sharding:** lookup table maps keys to shards. Pro: maximum flexibility. Con: lookup table is a single point of failure.
- **Consistent hashing:** keys and nodes are both placed on a ring. A key is served by the nearest node clockwise. Adding/removing a node remaps only 1/N keys — not all keys.
- Virtual nodes: each physical node owns 150+ positions on the ring. Ensures even distribution even with heterogeneous nodes.
- Hotspot problem: a celebrity user’s data is read millions of times/second on one shard. Solutions: shard key expansion (append random suffix), dedicated shard for known hot keys.

### Day 48–49 — Replication strategies

- **Single-leader replication:** one primary accepts writes, replicas sync. Simple. Write throughput limited to one node. Leader failure requires election. Used by: Postgres, MySQL, MongoDB.
- **Multi-leader replication:** multiple nodes accept writes. Higher write throughput. Write conflicts are inevitable — must be resolved. Used by: CockroachDB (global), some geo-distributed setups.
- **Leaderless replication:** any node accepts writes. Quorum reads/writes (R + W > N). No leader election. Used by: Cassandra, DynamoDB.
- **Replication lag:** async replication means replicas can be seconds behind. Design your app to tolerate stale reads or route critical reads to primary.
- Synchronous vs async replication: synchronous = zero lag but write latency includes replica ack. Async = low write latency but potential data loss on primary failure.

### Day 50–51 — Idempotency & exactly-once delivery

- **Idempotency key pattern:** client generates a unique key (UUID) per operation. Server stores `key → result`. Duplicate request returns stored result without re-executing.
- Deduplication window: how long to store idempotency state. Stripe uses 24 hours. Choose based on your retry window.
- **Kafka exactly-once semantics (EOS):** transactional producer assigns a producer ID + epoch. Broker deduplicates by sequence number. Consumer commits offset and processes in the same transaction.
- **Database-level idempotency:** `INSERT INTO orders ON CONFLICT (idempotency_key) DO NOTHING` — atomic deduplication at the DB layer.
- Why exactly-once is expensive: requires coordination between producer, broker, and consumer. Adds latency. Use at-least-once + idempotent consumers instead wherever possible.

### Day 52–53 — Event-driven architecture

- **Event sourcing:** system state is derived by replaying a log of events. Current state = `fold(events, initial_state)`. You get a complete audit log for free. Complex to query current state.
- **CQRS (Command Query Responsibility Segregation):** separate write model (command side, normalised, ACID) from read model (query side, denormalised, optimised for specific queries). Often used with event sourcing.
- When EDA is right: audit requirements, complex business workflows, multiple consumers of the same event, need for temporal decoupling.
- When EDA is wrong: simple CRUD, debugging is already hard, team doesn’t have observability tooling, events have unclear ownership.
- The debugging challenge: a bug in an event-driven system can manifest in a consumer 10 steps and 3 services downstream from where it was introduced.

### Day 54–55 — Consensus & leader election

- Why consensus is hard: any node can fail, messages can be delayed indefinitely, you can’t distinguish a slow node from a dead one.
- **Raft algorithm intuition:** each node is Leader, Follower, or Candidate. On timeout, a Follower becomes Candidate and requests votes. First to get majority votes becomes Leader. Leader sends heartbeats. Leader replicates log entries; they’re ‘committed’ when a majority has them.
- Why split-brain is impossible in Raft: to be elected, a candidate needs votes from a majority (>N/2). Two candidates can never simultaneously have majority votes.
- **etcd and ZooKeeper:** distributed key-value stores built on consensus. Use for: service discovery, distributed locks, feature flag storage, leader election.
- Rule: don’t implement your own consensus protocol. Use etcd. Consensus is notoriously difficult to implement correctly.

---


## 🔨 Projects


### Project 1 — Design a distributed job scheduler


**Scenario:** Schedule and execute 10M cron jobs across a fleet of worker nodes. Jobs must execute at-least-once, never more than once within a 60-second window. Handle worker failures mid-execution.


**Deliverable:** Full HLD document covering: job store schema (PostgreSQL), leader election for the scheduler process (etcd), work distribution (Kafka partitions or consistent hashing), idempotency mechanism, dead letter queue for failed jobs, recovery procedure when a worker dies mid-job, and failure scenario analysis.


### Project 2 — Saga pattern design: e-commerce checkout


**Scenario:** Checkout flow: (1) payment charge, (2) inventory reservation, (3) shipping label creation. Any step can fail.


**Deliverable:** Design both versions: (A) Choreography saga using Kafka events — draw the event flow, define each event type, and the compensating transaction for each step. (B) Orchestration saga — design the central orchestrator state machine. Compare: which version is easier to debug? Which is more resilient? When would you choose each?


### Project 3 — Sharding strategy design doc


**Scenario:** Social network with 2B users. Design the user data sharding strategy.


**Deliverable:** Document covering: shard key selection and justification, strategy choice (hash vs consistent hashing) with tradeoffs, how to handle celebrity/hotspot users, cross-shard queries (how do you find a user by email if sharded by user ID?), resharding procedure with zero-downtime steps, and what you’d monitor to detect shard imbalance.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Microservices from day one.**


Distributed systems are inherently more complex: network calls fail, distributed tracing is required, each service needs its own deployment pipeline and monitoring.


**✅ Correct approach:** Monolith → modular monolith (well-separated modules in one codebase) → microservices (when a module genuinely needs independent scaling or deployment). Most startups should be on step 2, not step 3.


### Mistake 2


**❌ Using 2PC for distributed transactions.**


2PC holds locks across services and blocks if the coordinator crashes between the prepare and commit phases. In a microservices architecture this creates fragility proportional to the number of participants.


**✅ Correct approach:** Use the saga pattern with compensating transactions. Design your domain so that each service owns its own data and can compensate independently. Accept that distributed transactions are eventually consistent by nature.


### Mistake 3


**❌ Synchronous calls to non-critical downstream services in the critical path.**


If the email service goes down, should checkout fail? No. If the analytics service is slow, should the product page load slowly? No.


**✅ Correct approach:** Only synchronously call services whose failure should fail the current request. Everything else — notifications, analytics, audit logs, recommendations — goes async via Kafka/SQS. Non-critical failures must not propagate.


### Mistake 4


**❌ No circuit breaker on downstream calls = cascading failures.**


One slow database causes DB connection pool exhaustion → request threads queue up → upstream service times out → its thread pool exhausts → full cascade.


**✅ Correct approach:** Circuit breakers contain blast radius. Every external network call needs: a timeout, a circuit breaker, and a fallback response. The fallback can be cached data, a default response, or a graceful error — never a silent hang.


---


## 🏢 How real companies solved this


**Uber — Saga orchestration for trips:** Every trip is a saga: driver matching → payment pre-auth → trip start. Each step has a compensating transaction. The orchestrator retries failed steps and triggers rollbacks on terminal failures. The state machine is persisted so it survives orchestrator crashes.


**Amazon Dynamo paper (2007):** Chose leaderless replication with sloppy quorum. For the shopping cart specifically, they chose AP: it is better to show a slightly stale cart than an error page. This paper shaped a decade of NoSQL database design and is required reading for any distributed systems engineer.


**Netflix — Chaos Engineering:** They built Chaos Monkey because they discovered their circuit breakers and fallbacks had never been exercised in production. They now inject failures daily. The lesson: fault tolerance that has never been tested in production does not exist.


---


## 📖 Resources

- _Designing Data-Intensive Applications_ — Kleppmann Ch. 5, 7, 8, 9 (replication, transactions, distributed systems, consistency)
- Amazon Dynamo paper (2007): the canonical AP database design document
- Martin Fowler on Sagas: [martinfowler.com/articles/patterns-of-distributed-systems](http://martinfowler.com/articles/patterns-of-distributed-systems)
- Aphyr’s Jepsen analyses: [jepsen.io](http://jepsen.io/) (real distributed system failure stories with proof)
- Raft visualisation: [raft.github.io](http://raft.github.io/) (animated, makes leader election and log replication intuitive)

## Phase 4 — Real System Designs (Days 56–75)
> **Core insight:** In a design interview or review, the question is never the destination — it’s the journey. Demonstrating that you considered 3 approaches and chose one with explicit tradeoffs shows far more depth than stating the ‘right’ answer.

---


## 🧠 Why this phase exists


The first three phases gave you primitives and patterns. This phase applies them to the 8 canonical system design problems that appear in staff-level interviews and production architecture reviews. Each is treated not as a puzzle to solve, but as a design space to navigate with explicit tradeoffs.


---


## 📚 Systems in order


### Day 56–57 — URL Shortener (revisited with full depth)

- **Hash function:** MD5/SHA256 of long URL → take first 7 characters. Collision probability at 365B URLs: ~50% (birthday paradox). Handle with: retry on collision, pre-generated key space, base62 encoding.
- **301 vs 302 redirect:** 301 is permanent (browser caches it — no future traffic to your server, can’t track clicks). 302 is temporary (browser always checks — you get click tracking). Explicitly choose based on product requirements.
- **Custom aliases:** allow users to choose their short URL. Store in separate namespace. Rate-limit to prevent squatting.
- **Analytics:** unique clicks require HyperLogLog (probabilistic, O(1) memory per counter vs O(N) for exact). Approximate is fine for analytics.
- **Geo-distributed redirects:** put redirect servers at edge (Cloudflare Workers or Lambda@Edge). The URL metadata is globally replicated. A redirect from Tokyo hits a Tokyo edge node, not your US origin. Target: <10ms redirect latency globally.

### Day 58–59 — Twitter / Social Feed

- **Fan-out-on-write (push model):** when a user tweets, write to all followers’ feed caches immediately. O(followers) writes per tweet. Fast reads (O(1) from Redis). Used for users with <10K followers.
- **Fan-out-on-read (pull model):** each user’s feed is computed at read time by fetching tweets from all followees. O(followees) reads per feed load. Slow reads. Used for inactive users and users following celebrities.
- **Hybrid approach (Twitter’s actual solution):** fan-out-on-write for normal users. Fan-out-on-read (merge at read time) for celebrity followees. The timeline service merges pre-computed feed + on-demand celebrity tweets on load.
- **Timeline cache:** Redis sorted set. Score = tweet timestamp. `ZADD timeline:{user_id} {timestamp} {tweet_id}`. Trim to last 800 entries.
- **Inactive users:** don’t fan out to users who haven’t logged in for 30 days. Recompute their feed on next login.

### Day 60–61 — WhatsApp / Messaging system

- **Message ordering:** guaranteed within a conversation, not across conversations. Each message has a sequence number per conversation. Client orders by sequence number, not server receipt time.
- **Delivery receipt state machine:** SENT → DELIVERED (device received) → READ (user opened). Each state change is an acknowledgement from the client to the server.
- **Offline message queue:** if recipient is offline, messages are stored server-side. When they connect, they pull all pending messages since last seen sequence number.
- **End-to-end encryption (E2E) key design:** each device has a public key registered with the server. Sender fetches recipient’s public key, encrypts message client-side. Server sees only ciphertext. Server cannot read messages.
- **Group messaging fan-out:** sender’s device encrypts the message for each group member’s public key individually. Server routes per-recipient ciphertext. Expensive for large groups (WhatsApp caps at 1024).
- **Connection layer:** WebSocket per device. WhatsApp uses Erlang/OTP — one process per connection. 100M concurrent connections across the fleet.

### Day 62–63 — Uber / Ride-sharing

- **Driver location pipeline:** drivers send GPS updates every 5 seconds. 5M active drivers = 1M location updates/second. Storage: Redis Geo (Geohash-indexed sorted set). Persistence: Kafka for replay + Cassandra for history.
- **Matching algorithm:** geographically-aware. Candidate drivers within radius, ranked by ETA (not just distance). ETA requires a routing engine (OSRM, Google Maps). Matching runs every 5 seconds per unmatched rider.
- **Geohash vs S2 cells:** Geohash: base32 string, easy prefix-based range queries. S2: Google’s spherical geometry library, more accurate for distance calculations. Uber uses H3 (hexagonal grid, Uber’s own library).
- **Trip state machine:** REQUESTED → ACCEPTED → DRIVER_ARRIVING → IN_PROGRESS → COMPLETED / CANCELLED. Each transition is an event published to Kafka. State persisted in PostgreSQL.
- **Surge pricing:** computed in batch every minute per geographic cell. Demand (rider requests) / Supply (available drivers) ratio. Published to a cache read by the pricing service at trip request time.

### Day 64–65 — Netflix / Video streaming

- **Adaptive bitrate streaming (ABR):** video encoded at multiple quality levels (360p, 720p, 1080p, 4K). Player downloads small segments (2–10 seconds each). Player measures bandwidth and switches quality level per segment. DASH and HLS protocols.
- **CDN strategy:** popular content (top 10K titles) pushed to all CDN edge nodes proactively. Long-tail content (older films) pulled on demand. Netflix operates its own CDN (Open Connect) co-located inside ISP networks.
- **Encoding pipeline:** raw video → encoding farm (thousands of EC2 instances) → multiple quality variants → S3 → CDN. A 2-hour movie produces ~1,200 files across all bitrates and resolutions.
- **Personalisation without serving PII to CDN:** CDN serves generic content segments. The personalised parts (recommendations, thumbnails) are served from origin APIs. Never put user-specific data into CDN-cached URLs.
- **Playback start time target:** <200ms to first frame. Achieved by: pre-selecting CDN node before play button is pressed, pre-fetching the first segment, using HTTP/2 server push for initial segments.

### Day 66–67 — Google Typeahead / Search suggestions

- **Trie data structure:** tree where each node is a character. Prefix lookup is O(L) where L = prefix length. Fast. Hard to distribute across machines (trie sharding by prefix is complex).
- **Prefix-indexed alternative:** store top-K suggestions per prefix in Redis sorted set. `ZADD suggestions:{prefix} {frequency_score} {suggestion}`. Simple to scale. Tradeoff: storage grows with all possible prefixes.
- **Personalisation layer:** merge global suggestions with user-specific history. User history stored per user in a separate store. Merge at read time in the API layer.
- **Trending queries:** computed in batch (MapReduce/Spark) on query logs from the past 24 hours. Top trending queries injected into the global suggestion store.
- **Real-time vs batch index updates:** batch is simpler (rebuild trie nightly). Real-time is complex (incremental trie updates). Hybrid: batch for the main index, real-time Kafka consumer for trending queries only.
- **Latency target:** <100ms for suggestion response. Achieved by: in-memory trie at edge, pre-computed top-K suggestions, Bloom filter to skip prefixes with no results.

### Day 68–69 — Distributed file storage (Dropbox)

- **Content-based chunking:** file split into variable-size chunks based on content (Rabin fingerprinting). Identical chunks across files are stored once (global deduplication). Saves ~30-40% storage.
- **Delta sync:** on file change, only modified chunks are uploaded. Client-side diff identifies changed chunks. A 100MB file with 1KB change uploads 1KB, not 100MB.
- **Metadata service:** stores file tree, chunk references, version history. Separate from blob storage (S3). The metadata service is the hard part — it must handle concurrent edits, versioning, and sharing permissions.
- **Conflict resolution:** last-writer-wins with conflict copy preserved. If two clients modify the same file while offline, both versions are kept and a conflict copy is created.
- **Offline-first sync protocol:** client maintains a local journal of changes. On reconnect: push local changes, pull remote changes, merge. The merge logic handles the conflict case.

### Day 70–71 — Payment processing system

- **Idempotency keys:** client generates UUID per payment attempt. Server stores `key → result` in the payments DB. Duplicate request returns stored result. Key stored for 24 hours (retry window).
- **Double-spend prevention:** single-row lock on the account record during debit. Use `SELECT FOR UPDATE` in a transaction. Alternatively: optimistic concurrency with version number.
- **Ledger design:** append-only. Every credit and debit is a row. Current balance = `SUM(credits) - SUM(debits)`. Never update a balance column directly — every change is auditable.
- **Reconciliation jobs:** daily batch job compares ledger to payment processor statements. Detects discrepancies. Critical for financial compliance.
- **PCI DSS architecture implications:** cardholder data (card number, CVV) must be isolated in a separate, heavily audited zone. Most systems use a payment vault (Stripe, Braintree) to never touch raw card data directly.

### Day 72–73 — Live sports scoreboard

- **Push vs pull tradeoff:** polling (client requests score every 5 seconds) — simple, high load. SSE (server pushes events to client) — lower load, persistent connection. WebSocket (bidirectional) — overkill for score updates.
- **SSE vs WebSocket for scoreboards:** scoreboard is server-to-client only. SSE is the right choice: HTTP-based, works through proxies, auto-reconnects, no WebSocket upgrade complexity.
- **Fan-out to millions of connections:** single score update → needs to reach 10M concurrent viewers. Approach: Kafka topic per sport. Score update published to Kafka. Consumer fleet subscribes to Kafka and maintains SSE connections. Each consumer handles 50K connections. 200 consumers for 10M connections.
- **Consistent score view across regions:** score source of truth in primary DB. Published to a globally replicated cache (Redis with async cross-region replication). Users may see score 1–2 seconds delayed in far regions. Acceptable for this use case.

### Day 74–75 — Design review: critique your own work

- Revisit your Day 1–15 URL shortener constraints document. Now design the full system.
- Apply all 9 weeks of knowledge: which building blocks, which patterns, which tradeoffs.
- Compare your new design to the Day 57 deep-dive. What did you add? What’s still missing?
- This delta — the gap between your Day 1 design and your Day 75 design — is a concrete measure of your growth.

---


## 🔨 Projects


### Project 1 — Full HLD doc: Twitter feed system


**Deliverable:** Complete written design document.


Structure using RESHADED: requirements (DAU, tweets/day, timeline load QPS), estimation (storage/year, fan-out writes/second), storage (Redis for timelines, PostgreSQL for tweets/users, Kafka for fan-out), high-level design (component diagram with 8+ components), APIs (`GET /feed`, `POST /tweet`, `GET /user/:id/tweets`), detailed design (fan-out service: hybrid model, celebrity threshold at 1M followers), evaluate (what happens if Redis goes down? If a celebrity tweets?), distinguish (why hybrid over pure push or pure pull).


### Project 2 — Full HLD doc: Ride-sharing backend


**Deliverable:** Complete written design document.


Cover: driver location update pipeline (1M updates/sec), matching service design (geohash grid, candidate selection, ETA ranking), trip state machine (6 states, all transitions), surge pricing computation (batch job, per-cell, cache-served), multi-region considerations (riders in one region, drivers in the same), and top 3 failure scenarios with mitigations.


### Project 3 — Self-timed mock design interview


**Format:** 45 minutes. Timer running. No notes from this roadmap.


**Prompt:** “Design a notification system that can send push notifications, emails, and SMS to 200M users.”


After the 45 minutes: review your design against the RESHADED rubric. Did you estimate fan-out load? Did you cover priority queues (transactional vs marketing notifications)? Did you handle the case where APNs/FCM is slow? Grade yourself. Identify the 3 biggest gaps. These gaps are your study targets for Phase 5.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Designing the ideal system while ignoring operational cost.**


A perfectly consistent distributed cache with 20 nodes costs 20x to operate compared to a managed Redis cluster. Real designs include: who operates this at 3am, what’s the failure recovery runbook, and what does it cost per month.


**✅ Correct approach:** Always include operational cost as a constraint. Prefer managed services (ElastiCache, RDS, MSK) over self-managed for any component that isn’t a core differentiator. Reserve custom implementations for truly differentiated components.


### Mistake 2


**❌ Fan-out-on-write for users with 50M followers.**


Publishing Taylor Swift’s tweet to 50M follower timelines = 50M Redis writes per tweet. At 100 tweets/day, that’s 5 billion writes/day from one user.


**✅ Correct approach:** Hybrid fan-out. Normal users get push model. Celebrities (>1M followers) use pull model: their tweets are fetched and merged at read time. The threshold is a product + infrastructure decision, not a technical one. Twitter uses ~1M followers as the threshold.


### Mistake 3


**❌ Designing without naming your top 3 failure scenarios.**


‘The system will be reliable’ is not a design. Every production system will fail. The question is: in what way, and what happens when it does?


**✅ Correct approach:** Before ending any design, explicitly state: “The top 3 failure modes are X, Y, Z. For X: we handle it by… For Y: we detect it via… and recover by…” This turns a design into an architecture.


### Mistake 4


**❌ One database for everything.**


Uber uses MySQL for trips (ACID), Redis for driver locations (ephemeral, geo-indexed), Kafka for event streaming (durable, ordered), and Elasticsearch for search. Each data store is chosen for a specific access pattern.


**✅ Correct approach:** Different data types have different access patterns. Normalise by asking: “what queries will this data serve?” Then choose the store optimised for those queries. Polyglot persistence is correct at scale, not a sign of over-engineering.


---


## 🏢 How real companies solved this


**Twitter — Hybrid fan-out:** Most users get fan-out-on-write. Accounts with >1M followers are excluded from pre-computed timelines. Instead, their tweets are fetched and merged at read time when any of their followers loads their timeline. This solved the celebrity hotspot without sacrificing feed latency for normal users.


**Stripe — Idempotency key implementation:** The key maps to a stored request/response pair, kept for 24 hours. A distributed lock prevents two concurrent requests with the same key from both executing. This is their core reliability primitive for payments and the reason their API is trusted for financial-grade operations.


**WhatsApp — Simplicity at scale:** Before the Facebook acquisition, WhatsApp had 900M users and 2 engineers on infrastructure. Their architecture: Erlang/OTP processes (one per connection), Mnesia (in-memory distributed database), FreeBSD. Radical simplicity. The lesson: operational simplicity is an architectural requirement, not a luxury.


---


## 📖 Resources

- _System Design Interview Vol. 1 & 2_ — Alex Xu (reference for each system in this phase)
- Engineering blogs: Uber Engineering, Discord Engineering, Netflix Tech Blog, Stripe Engineering
- ByteByteGo YouTube channel: visual walkthroughs of all 8 systems in this phase
- Excalidraw: draw your component diagrams. Practice drawing cleanly under time pressure.
- Pramp / [Interviewing.io](http://interviewing.io/): mock interviews with real engineers for Phase 4 systems

## Phase 5 — Expert-Level Systems (Days 76–90)
> **Core insight:** The difference between a senior and a staff engineer in system design is this — a senior designs a system that solves the problem. A staff engineer designs a system that solves the problem AND accounts for org structure, operational burden, migration path from the current state, and the 3 ways it will need to evolve in 18 months.

---


## 🧠 Why this phase exists


At this level, you are no longer answering ‘how would you build X?’ You are answering ‘given that we have Y today and need to reach Z, what is the safest, cheapest, most evolvable path?’ The systems in this phase push the limits of distributed computing. The skill is not memorising these designs — it’s being able to critique and evolve any design under pressure.


---


## 📚 Topics in order


### Day 76–77 — Multi-region architecture

- **Active-passive:** primary region handles all traffic. Secondary region is a warm standby. Failover takes 1–10 minutes (DNS TTL + health check detection). RTO ~10 min. RPO = replication lag (seconds to minutes).
- **Active-active:** both regions handle traffic simultaneously. Much harder: requires conflict resolution for concurrent writes to the same record.
- **Global load balancing options:** AWS Global Accelerator (Anycast, routes to nearest healthy region), Cloudflare Load Balancing (DNS-based with health checks), Route 53 latency routing.
- **Data sovereignty (GDPR compliance):** EU user data must be processed and stored in the EU. Requires region-aware routing: identify user’s region at the API gateway and route to the appropriate data plane. Data must not leave the region even for analytics.
- **Conflict resolution for active-active writes:** Last-writer-wins (LWW): simple, loses concurrent writes. Vector clocks: track causality, detect conflicts, require application-level resolution. CRDTs (Conflict-free Replicated Data Types): data structures that merge automatically. Region affinity: route each user to a home region — avoids conflicts by design.
- **Cross-region replication strategies:** async (low latency impact, some data loss risk on region failure) vs sync (zero loss, significantly higher write latency for all users).

### Day 78–79 — Zero-downtime migrations

- **Expand-contract pattern (the safe migration pattern):**
    - Expand: add the new column/table/service alongside the old one
    - Migrate: dual-write to both old and new. Backfill existing data.
    - Verify: compare old and new. Read from new, verify matches old.
    - Contract: stop writing to old. Remove old column/service.
    - At no point is there a deployment that breaks the running system.
- **Dual-write during migration:** write to both old DB and new DB simultaneously. Read from old. After verifying new is consistent, switch reads to new. Then stop writing to old.
- **Database column migrations at scale:** adding a column to a 1B-row table with `ALTER TABLE` locks the table for hours. Solution: add column as nullable, backfill in small batches with rate limiting, then add NOT NULL constraint.
- **Feature flags:** decouple deploy from release. Ship the new code path behind a flag. Enable for 1% of users. Gradually increase. Roll back instantly by flipping the flag, without a re-deploy.
- **Shadow traffic:** send a copy of production traffic to the new service without using its response. Verify the new service produces correct results before switching real traffic.

### Day 80–81 — Observability for large systems

- **Distributed tracing across 50+ services:** every request gets a trace ID at the entry point. Every downstream call propagates the trace ID (W3C `traceparent` header). Visualise: which service took the most time? Where did latency spike?
- **SLO design for complex systems:** identify the user-visible outcomes that matter. “99.9% of feed loads complete in < 2 seconds” is a meaningful SLO. “cpu_utilization < 70%” is not an SLO — it’s a capacity metric.
- **Error budget policy:** if the error budget is burning faster than the 30-day window allows, freeze non-essential feature work until reliability is restored. This must be a formal policy, not a suggestion.
- **Multi-window burn rate alerts:** 1-hour window catches fast burns (outage). 6-hour window catches slow burns (gradual degradation). Both are needed. Single-window alerts miss one or the other.
- **Symptom-based vs cause-based alerts:** alert on what users experience (latency, error rate, availability). Not on what causes it (CPU usage, memory). Users don’t care about your CPU; they care about the page loading.
- **Runbook-driven alerting:** every alert must have a corresponding runbook. An alert without a runbook is noise.

### Day 82–83 — Design: Global API Gateway

- **Core responsibilities:** TLS termination, authentication (JWT validation), authorisation (RBAC check), rate limiting per identity/IP/endpoint, request routing to upstream services, circuit breaking, observability (inject trace ID, emit metrics).
- **Plugin/middleware pipeline:** ordered chain of plugins per route. Plugin examples: auth, rate-limit, request-transform, circuit-break, logging. Each plugin can short-circuit the chain (e.g., auth rejects with 401).
- **Dynamic routing via service discovery:** gateway reads live service registry (Consul/etcd). Route config updates without restart. New service instances are discovered automatically.
- **Per-tenant rate limiting:** in a multi-tenant SaaS, each tenant has a tier (free/pro/enterprise) with different rate limits. Rate limit data stored in Redis keyed by `tenant_id:endpoint`.
- **Traffic shaping:** canary routing (send 5% of traffic to v2 upstream), A/B testing, blue-green switching. All done at the gateway layer without touching upstream services.
- **Shadow traffic at gateway:** duplicate every request and send a copy to a new service. Compare responses. Never use shadow response in production. Validates new service without risk.
- **Envoy xDS protocol:** gateway configuration delivered dynamically via gRPC streams from a control plane (e.g., Istio Pilot). No config file restarts. Change routes in milliseconds.

### Day 84–85 — Design: Global notification system

- **Scale:** 500M users. Mix of push (APNs/FCM), email (SendGrid/SES), and SMS (Twilio/SNS). Each channel has different throughput limits, latency, and cost.
- **Fan-out pipeline:** notification event → Kafka topic → fan-out service (expands to per-user per-channel events) → channel-specific Kafka partitions → channel delivery workers.
- **Priority lanes:** transactional notifications (OTP, payment confirmation, security alerts) — highest priority, dedicated Kafka partition, SLO < 5 seconds. Marketing notifications — best effort, can be delayed hours.
- **Preference engine:** per-user preferences stored (which channels enabled, silent hours, frequency caps). Fan-out service checks preferences before generating per-channel events. Cache preferences in Redis (hot path).
- **Silent hours:** do not send non-transactional notifications between 10pm–38am (user’s local time). Requires knowing user timezone. Scheduler holds notifications and releases at 8am.
- **Deduplication:** if the same notification is triggered twice (at-least-once delivery from upstream), the notification must reach the user only once. Deduplication key stored in Redis for 24 hours.
- **Channel failure handling:** APNs rejects a token (user uninstalled app) — mark as inactive, stop sending push. Try email instead if enabled. Circuit break channel after N consecutive failures.

### Day 86–87 — Design: Distributed search engine

- **Crawler architecture:** URL frontier (priority queue of URLs to crawl), fetcher fleet (robots.txt compliant, rate limited per domain), parser (extract text + links), storage (raw HTML in S3, extracted text in indexer pipeline).
- **Inverted index construction:** tokenise text → remove stop words → stem/lemmatise → build term → document list mapping. Merge posting lists from crawl batches into the main index (log-structured merge, like LSM trees).
- **Index distribution:** shard the index by document ID (each shard contains a slice of all documents). A query is broadcast to all shards, each returns top-K results, a coordinator merges and re-ranks the combined results.
- **Ranking pipeline:** TF-IDF (term frequency × inverse document frequency) for relevance scoring. PageRank for authority scoring. Learned ranking (ML model trained on click signals) for final re-ranking.
- **Index freshness vs cost:** full rebuild nightly (consistent, expensive). Incremental updates (complex, near-real-time). Hybrid: main index rebuilt weekly, delta index for last 7 days’ new/updated documents, query both at runtime.
- **Query federation:** a complex query may require multiple specialised indexes (web, images, news, local). The query router breaks the query and federates to each index. Results are blended using a merge strategy.

### Day 88–89 — Design: Multi-region key-value store

- **Consistent hashing with virtual nodes:** physical nodes own multiple positions on the ring. A new node joining claims positions from its neighbours — data rebalancing is proportional, not total.
- **Replication strategy:** each key is replicated to the next N nodes clockwise on the ring (N=3 typically). Quorum: W + R > N prevents stale reads. W=2, R=2, N=3 is a common balance.
- **Conflict resolution:** vector clocks: each write carries a version vector. On read conflict, the store returns all conflicting versions. Application resolves (Dynamo does this). OR last-writer-wins: simpler, silently discards concurrent writes.
- **Anti-entropy (background sync):** Merkle tree per node. Two nodes compare Merkle trees to identify divergent key ranges. Only exchange divergent ranges, not the full dataset. Efficient reconciliation.
- **Read repair:** when a read reveals inconsistency across replicas (one replica has older data), the coordinator sends the latest value to the stale replica. Eventual consistency enforced lazily.
- **Gossip protocol for membership:** each node periodically exchanges its view of cluster membership with a random peer. Failures detected when a node’s heartbeat counter stops incrementing. No centralised membership server.
- **Hinted handoff:** if a node is temporarily down, writes meant for it are stored on a substitute node with a ‘hint’. When the original node recovers, hints are replayed. Enables high write availability during node failures.

### Day 90 — The Staff Engineer design review

- Take a complete architecture (your Phase 4 Twitter design) and conduct a staff-level critique.
- **Write a formal review document with these sections:**
    - **What’s good:** 3–5 specific strengths with justification
    - **What breaks under 10x load:** identify the first 3 bottlenecks. Be specific: “the fan-out service saturates at 2M tweets/hour because…”
    - **What’s operationally dangerous:** components that would be painful to maintain, debug, or recover from failure
    - **What’s missing for compliance:** GDPR data residency, audit logging, PII handling
    - **The migration path:** if this were running on the current naive architecture, what are the migration steps in order?
- This is the actual output of a staff engineer in a design review — not a better design, but a better understanding of the existing one.

---


## 🔨 Projects


### Project 1 — Full HLD: Global notification system (500M users)


**Deliverable:** Complete written design document with component diagram.


Requirements: 500M users, 3 channels (push/email/SMS), transactional + marketing tiers, silent hours, user preferences, regional data sovereignty. Estimation: peak fan-out events/second during a global marketing campaign. Components: event ingestion API, Kafka fan-out topology (draw partition layout), preference service with caching strategy, channel delivery workers with circuit breakers, deduplication store, retry + DLQ strategy per channel. Failure scenarios: APNs is down for 30 minutes, preference service Redis is cold, a marketing campaign sends to all 500M simultaneously.


### Project 2 — Architecture critique document


**Format:** Read one of these real engineering blog posts and write a 2-page formal critique: (A) Figma’s multiplayer sync engine, (B) Linear’s data sync architecture, or (C) PlanetScale’s database branching.


Critique structure: (1) What problem does this architecture solve and why is it genuinely hard?, (2) What design decisions are clever and why?, (3) What are the failure modes not discussed in the post?, (4) What would break at 10x their current scale?, (5) What would you design differently and why?


### Project 3 — System design portfolio (5 systems)


**Deliverable:** Your personal reference document for interviews and design reviews.


Document your 5 best designs from this roadmap. For each: (1) one-sentence problem statement, (2) component diagram (Excalidraw export), (3) top 3 design decisions with explicit tradeoffs made, (4) top 2 failure scenarios and mitigations, (5) one thing you’d do differently with more time. This becomes your system design interview prep kit and your design review reference.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Active-active multi-region without a defined conflict resolution strategy.**


Two regions accepting writes to the same user record simultaneously will produce conflicts. Without an explicit merge strategy, you’ll silently lose writes or serve corrupted state.


**✅ Correct approach:** Before designing active-active, write down your conflict resolution strategy: LWW (simple, data loss), CRDTs (complex, automatic merge), or region affinity (route each user to their home region, avoid conflicts by design). Region affinity is the most practical starting point for most systems.


### Mistake 2


**❌ Designing for current scale, not 10x.**


The design that works for 1M users often breaks at 10M. The design for 10M breaks at 100M. Designing only for today means a rewrite in 18 months.


**✅ Correct approach:** At the end of every design, ask: “At 10x current scale, what is the first component to break?” That component becomes your next architecture investment. Good designs are explicitly extensible at their identified bottleneck.


### Mistake 3


**❌ Over-engineering version 1.**


WhatsApp had 900M users with 2 infrastructure engineers. Amazon ran on a monolith for years. Complexity has operational cost: more things to break, more expertise required, more to debug at 3am.


**✅ Correct approach:** Design v1 to be simple, v2 to be scalable, v3 to be globally distributed — only if you ever need v3. “We’ll need this eventually” is not a justification for complexity today. “We hit this bottleneck and can’t solve it without…” is.


### Mistake 4


**❌ Proposing a new architecture without a migration path.**


‘We should migrate to CockroachDB’ is useless if you have 10TB of data in MySQL with no migration plan. A design that cannot be migrated to from the current state is not a real proposal.


**✅ Correct approach:** Any architectural change must include: current state, target state, migration steps in order (using expand-contract or strangler fig pattern), rollback plan at each step, and estimated migration duration. Without this, it’s an idea, not a design.


---


## 🏢 How real companies solved this


**Google Spanner — Active-active globally:** Solved concurrent writes with TrueTime — GPS + atomic clocks give every write a globally ordered timestamp with a bounded uncertainty interval. Commits wait for the uncertainty window to pass before being visible. External consistency at planetary scale. Most companies should understand why it exists and use Cloud Spanner rather than building it.


**Figma — Multiplayer conflict resolution:** Their LiveGraph engine uses Operational Transformation (OT) for conflict-free collaborative editing. Concurrent edits are transformed relative to each other and applied in a deterministic order. This is active-active with automatic conflict resolution for a document data model. Their engineering blog post is the canonical real-world example of this pattern.


**Linear — Sync engine:** Client has an optimistic local store. Every mutation is applied locally immediately (zero latency feel) and also sent to the server. Server is authoritative. On reconnect, server reconciles with client. This is the correct pattern for collaborative apps where perceived latency matters more than perfect consistency.


---


## 🏆 You’ve completed the 90-day HLD roadmap


After 90 days you should be able to:

- Design any system end-to-end using the RESHADED framework in 45 minutes
- Make explicit technology choices with justified tradeoffs
- Identify the top 3 failure modes of any architecture and their mitigations
- Conduct a staff-level design review: critique, not just create
- Hold your own in a system design interview at any tier-1 company

**What’s next:**

- Read the Google SRE Book (free online at [sre.google](http://sre.google/))
- Do 10 timed mock interviews on Pramp or [Interviewing.io](http://interviewing.io/)
- Read 5 engineering blog posts from companies you admire and critique each
- Take on a real architecture decision at work and write a design doc using this framework

---


## 📖 Resources

- Google SRE Book: [sre.google/sre-book](http://sre.google/sre-book) (free) — Ch. 3–4 on SLOs
- Figma engineering blog: ‘How Figma’s multiplayer technology works’
- Martin Fowler: ‘Patterns of Distributed Systems’ series ([martinfowler.com](http://martinfowler.com/))
- Excalidraw: [excalidraw.com](http://excalidraw.com/) — the tool for clean architecture diagrams
- _Software Architecture: The Hard Parts_ — Ford, Richards, Sadalage, Dehghani
