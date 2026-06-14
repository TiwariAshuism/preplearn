---
source: notion
title: "Phase 5 — Expert-Level Systems (Days 76–90)"
slug: "phase-5-expert-level-systems-days-76-90"
notionId: "359da883-bddd-8178-bb96-eb7830084869"
notionRootId: "359da883bddd81c38141f8f9b4db8e8a"
parent: "90-day-hld-roadmap-high-level-system-design"
children: []
order: 0
icon: "🧠"
cover: null
---
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
