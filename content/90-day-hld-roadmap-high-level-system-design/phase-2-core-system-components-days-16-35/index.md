---
source: notion
title: "Phase 2 — Core System Components (Days 16–35)"
slug: "phase-2-core-system-components-days-16-35"
notionId: "359da883-bddd-8164-804d-f0bae76374b8"
notionRootId: "359da883bddd81c38141f8f9b4db8e8a"
parent: "90-day-hld-roadmap-high-level-system-design"
children: []
order: 3
icon: "⚙️"
cover: null
---
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
