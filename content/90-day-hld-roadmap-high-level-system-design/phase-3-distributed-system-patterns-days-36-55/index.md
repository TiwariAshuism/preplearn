---
source: notion
title: "Phase 3 — Distributed System Patterns (Days 36–55)"
slug: "phase-3-distributed-system-patterns-days-36-55"
notionId: "359da883-bddd-811d-9dcf-f537af4d053e"
notionRootId: "359da883bddd81c38141f8f9b4db8e8a"
parent: "90-day-hld-roadmap-high-level-system-design"
children: []
order: 2
icon: "🔀"
cover: null
---
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
