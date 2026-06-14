---
source: notion
title: "Phase 3 — Databases & Distributed Systems (Days 36–55)"
slug: "phase-3-databases-and-distributed-systems-days-36-55"
notionId: "358da883-bddd-81af-9a76-fb70e0ddd251"
notionRootId: "358da883bddd81e1b394ca83aa7ed599"
parent: "90-day-backend-engineering-roadmap"
children: []
order: 2
icon: "🗄️"
cover: null
---
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
