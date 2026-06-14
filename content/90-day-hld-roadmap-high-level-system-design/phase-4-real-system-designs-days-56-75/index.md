---
source: notion
title: "Phase 4 — Real System Designs (Days 56–75)"
slug: "phase-4-real-system-designs-days-56-75"
notionId: "359da883-bddd-8194-af0d-c59a9db2a17c"
notionRootId: "359da883bddd81c38141f8f9b4db8e8a"
parent: "90-day-hld-roadmap-high-level-system-design"
children: []
order: 1
icon: "🏛️"
cover: null
---
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
