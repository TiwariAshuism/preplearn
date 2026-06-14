---
source: notion
title: "Phase 1 — Foundations of System Design (Days 1–15)"
slug: "phase-1-foundations-of-system-design-days-1-15"
notionId: "359da883-bddd-8105-b2d4-d86de3524659"
notionRootId: "359da883bddd81c38141f8f9b4db8e8a"
parent: "90-day-hld-roadmap-high-level-system-design"
children: []
order: 4
icon: "📐"
cover: null
---
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
