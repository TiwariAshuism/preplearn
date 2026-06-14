---
source: manual
title: "Phase 3 — Databases & Distributed Systems"
parent: null
order: 22
icon: "🗄️"
---

# Phase 3 — Databases, Distributed Systems & Event Architecture (Detailed Notes in Hinglish)

> **Goal:** Samjho ki data kahan rehta hai, databases internally kaise kaam karte hain, aur distributed systems guarantees kaise dete hain — ya nahi dete. Yahi woh jagah hai jahaan most backend engineers ke sabse bade gaps hote hain.

---

## Day 36–38: PostgreSQL Internals

### MVCC — Multi-Version Concurrency Control

**Problem:** Ek user row padh raha hai, dusra user usi row ko update kar raha hai. Kya reader ko block karein jab tak writer done na ho? **Nahi!**

**Solution:** PostgreSQL har row ki **multiple versions** rakhta hai. Writer nayi version banata hai, reader purani version padhta hai. Kisi ko kisi ka wait nahi karna padta.

```
Transaction 100 (Writer):                Transaction 101 (Reader):
UPDATE users SET name='B'                SELECT * FROM users WHERE id=1
WHERE id=1;                              
                                         → Sees name='A' (old version)
                                         → Not blocked!

Internal row storage:
┌──────────────────────────────────────┐
│ xmin=50, xmax=100  │ name='A'        │  ← old version (visible to txn 101)
│ xmin=100, xmax=∞   │ name='B'        │  ← new version (not yet visible to 101)
└──────────────────────────────────────┘
```

**Key concepts:**
- **xmin:** Konsi transaction ne yeh row version create ki
- **xmax:** Konsi transaction ne yeh row version delete/update ki (∞ = active)
- Har transaction ko ek **snapshot** milta hai — "mujhe sirf woh rows dikhao jo mere start se pehle committed thi"

**Consequences:**
- Readers NEVER block writers, writers NEVER block readers
- **Lekin:** Purani row versions (dead tuples) accumulate hote hain — inhe clean karna padta hai (**VACUUM**)
- UPDATE actually = INSERT new version + mark old version as dead. Isliye heavy-update tables mein bloat hota hai

### WAL — Write-Ahead Log

**Core rule:** "Pehle log likho, phir data." Yeh durability ka foundation hai.

```
Client: INSERT INTO orders (...)

Step 1: Write change to WAL (sequential write, FAST)
        → WAL is on disk → DURABLE
        → Client gets "OK, committed"

Step 2: Eventually, background writer flushes actual data pages to disk
        (checkpoint process)

Crash happens between step 1 and step 2?
  → No problem! WAL replay karke data recover ho jayega
```

**WAL kyun important hai:**

1. **Crash recovery:** System crash hua? WAL replay karo, sab data wapas aa jayega
2. **Replication:** WAL records replicas ko bhejo → streaming replication
3. **Point-in-time recovery (PITR):** Base backup + WAL replay = kisi bhi past moment ka state recover karo
4. **Performance:** WAL sequential write hai (fast). Data pages random write hain (slow). WAL pehle likhne se client ko jaldi response milta hai.

```
Analogy: 
WAL = diary mein note likhna (fast, sequential)
Data files = proper file mein organize karna (slow, random access)

Pehle diary mein likho (guaranteed safe), baad mein organize karo.
```

### B-Tree Index Internals

PostgreSQL ka default index type **B-tree** hai. Samjho kaise kaam karta hai:

```
                    [50]                     ← Root page
                   /    \
             [20, 35]    [70, 85]            ← Internal pages
            /   |   \    /   |   \
         [10,15] [25,30] [55,60] [90,95]     ← Leaf pages
                                              (contain pointers to actual rows)
```

**Properties:**
- **Balanced:** Root se har leaf tak ka path same length hai → predictable O(log N) lookup
- **Fanout:** Har page mein bahut saare keys fit hote hain (8KB page). High fanout = shallow tree = fewer disk reads
- **Sorted:** Leaf pages linked list mein connected hain → range queries fast (`WHERE created_at BETWEEN x AND y`)

**B-tree kab helpful:**
- Equality: `WHERE id = 123` → root se leaf tak traverse, O(log N)
- Range: `WHERE price BETWEEN 100 AND 500` → leaf pe pahuncho, linked list follow karo
- Sorting: `ORDER BY created_at` → already sorted in index

**B-tree kab NAHI helpful:**
- **Low cardinality:** `WHERE is_active = true` jab 95% rows true hain → index selectivity bahut low hai, sequential scan faster hoga
- **Pattern matching:** `WHERE name LIKE '%kumar'` (leading wildcard) → B-tree use nahi ho sakta (trailing wildcard `'kumar%'` chal jaata hai)

### EXPLAIN ANALYZE — Query Plan Reading

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42 AND status = 'pending';
```

```
Index Scan using idx_orders_user_id on orders  (cost=0.43..12.50 rows=3 width=120)
  (actual time=0.025..0.031 rows=3 loops=1)
  Index Cond: (user_id = 42)
  Filter: (status = 'pending')
  Rows Removed by Filter: 7
Planning Time: 0.150 ms
Execution Time: 0.055 ms
```

**Kaise padhein:**

| Field | Matlab |
|-------|--------|
| `Index Scan` | Index use ho raha hai (good!) |
| `Seq Scan` | Poori table scan ho rahi hai (usually bad for large tables) |
| `cost=0.43..12.50` | Estimated cost (arbitrary units, relative comparison ke liye) |
| `rows=3` (estimated) | Planner ko lagta hai 3 rows milenge |
| `actual time=0.025..0.031` | Real execution time in milliseconds |
| `rows=3` (actual) | Actually 3 rows mili |
| `Rows Removed by Filter: 7` | 10 rows index se aayi, 7 filter se hat gayi |
| `Buffers: shared hit=4` | 4 pages RAM cache se mili (no disk read) |
| `Buffers: shared read=2` | 2 pages disk se padhi gayi (slow!) |

**Red flags:**
- `Seq Scan` on a large table with a WHERE clause → index missing ya not useful
- `Rows Removed by Filter` bahut zyada hai → index sahi columns cover nahi kar raha
- Estimated rows vs actual rows mein bada difference → statistics outdated, run `ANALYZE`
- `Sort Method: external merge` → data memory mein fit nahi hua, disk sort hua (slow)

### Vacuum — Dead Tuple Cleanup

```
Transaction 1: UPDATE users SET name='B' WHERE id=1;

Table state:
  [id=1, name='A', xmax=txn1]  ← DEAD TUPLE (purani version)
  [id=1, name='B', xmin=txn1]  ← LIVE TUPLE (nayi version)

Bina vacuum ke:
  Dead tuples accumulate → table size badhti jaati hai
  → Sequential scans slow hoti hain (dead tuples bhi scan hote hain)
  → Index entries purane tuples ko point karti hain
  → BLOAT!

VACUUM kya karta hai:
  1. Dead tuples identify karta hai (koi active transaction inhe nahi dekh raha)
  2. Space ko reusable mark karta hai (naye inserts yahan aa sakte hain)
  3. Visibility map update karta hai

VACUUM FULL:
  Table ko completely rewrite karta hai, space OS ko wapas karta hai
  ⚠️ EXCLUSIVE LOCK leta hai — production mein avoid karo!
```

**Autovacuum:** Background process jo automatically vacuum chalaata hai. Settings tune karo high-write tables ke liye:

```sql
-- High-write table ke liye aggressive autovacuum
ALTER TABLE events SET (
    autovacuum_vacuum_scale_factor = 0.01,  -- 1% dead tuples pe trigger (default 20%)
    autovacuum_analyze_scale_factor = 0.005  -- frequent statistics update
);
```

**Problem:** Agar koi long-running transaction open hai, toh vacuum uske snapshot se purani dead tuples clean nahi kar sakta → **bloat badhta jaata hai.** Isliye long-running transactions avoid karo!

### Connection Pooling — PgBouncer

**Problem:** Har PostgreSQL connection ek **OS process** hai (~5-10MB RAM). 1000 connections = 10GB RAM sirf connections ke liye + massive context switching.

```
Without PgBouncer:
  App Server (1000 goroutines) ──── 1000 connections ──── PostgreSQL
  PostgreSQL: 😵 OOM, context switching, shared buffer contention

With PgBouncer:
  App Server (1000 goroutines) ──── 1000 connections ──── PgBouncer ──── 50 connections ──── PostgreSQL
  PostgreSQL: 😊 50 connections, manageable
```

**PgBouncer modes:**
- **Session mode:** Client ko dedicated connection milta hai jab tak disconnect na kare. Kam benefit.
- **Transaction mode:** Connection sirf transaction ke dauran assign hoti hai. Transaction end → connection pool mein wapas. **Most common production setup.**
- **Statement mode:** Har statement ke baad connection wapas. Multi-statement transactions nahi chal sakte. Rarely used.

**Rule of thumb:** PostgreSQL ke liye **max 100-200 active connections** rakhna ideal hai, chahe application mein thousands of concurrent requests hon. PgBouncer yeh enforce karta hai.

### Table Bloat vs Index Bloat

```
Table bloat:
  Dead tuples space lete hain → table file size badhta hai
  → Seq scans slow (zyada pages scan karni padti hain)
  → Cache efficiency kam (dead data RAM mein baithi hai)
  
  Fix: VACUUM regularly. VACUUM FULL for extreme cases (downtime required).
  Prevention: Tune autovacuum. Avoid long transactions.

Index bloat:
  Deleted/updated rows ke index entries remain even after vacuum
  → Index size grows beyond what's needed
  → Index scans become slower
  
  Fix: REINDEX (exclusive lock) or CREATE INDEX CONCURRENTLY + swap.
```

**FILLFACTOR tuning:**
```sql
-- Default FILLFACTOR = 100 (pages completely filled)
-- For frequently updated tables, leave room for HOT updates:
ALTER TABLE orders SET (fillfactor = 80);
-- 20% space reserved → updates can reuse space in same page
-- Reduces bloat for tables with frequent updates
```

**HOT (Heap-Only Tuple) update:** Agar updated row same page mein fit ho jaaye aur koi indexed column change nahi hua, toh PostgreSQL index update skip kar sakta hai. FILLFACTOR kam karke HOT updates ki probability badhti hai.

---

## Day 39–40: Query Optimization

### Index Selectivity

**Selectivity = kitni rows filter ho jaati hain.** High selectivity = zyada rows eliminate = index useful.

```sql
-- HIGH selectivity (good for index)
SELECT * FROM users WHERE email = 'ash@example.com';
-- 1 row out of millions → selectivity ~0.00001%

-- LOW selectivity (bad for index)
SELECT * FROM users WHERE is_active = true;
-- 950,000 out of 1,000,000 → selectivity ~95%
-- Sequential scan faster hoga — kyun 950K index lookups karein 
-- jab direct table scan se kaam ban jaata hai?

-- MEDIUM selectivity (depends)
SELECT * FROM orders WHERE status = 'pending';
-- 5,000 out of 1,000,000 → selectivity ~0.5%
-- Index useful hoga. PARTIAL INDEX aur bhi better:
CREATE INDEX idx_pending ON orders (created_at) WHERE status = 'pending';
```

### Covering Indexes

**Problem:** Index se row ka pointer mila, ab heap (actual table) mein jaake baaki columns padho. Yeh **heap lookup** extra I/O hai.

**Solution:** Index mein hi woh columns include kar do jo query ko chahiye:

```sql
-- Query:
SELECT status, created_at FROM orders WHERE user_id = 42;

-- Normal index:
CREATE INDEX idx_user ON orders (user_id);
-- Flow: Index scan → get row pointers → heap lookup for status, created_at

-- Covering index:
CREATE INDEX idx_user_covering ON orders (user_id) INCLUDE (status, created_at);
-- Flow: Index scan → answer directly from index! No heap lookup!
-- EXPLAIN mein dikhega: "Index Only Scan" ← yeh goal hai
```

**Caveat:** Covering index size badi hoti hai (extra columns stored). Aur visibility check ke liye kabhi kabhi heap visit zaroori hota hai (recently modified pages ke liye). Regular VACUUM se visibility map updated rehta hai.

### Partial Indexes

Sirf relevant subset ko index karo:

```sql
-- Full index (10 lakh rows indexed):
CREATE INDEX idx_status ON orders (status);

-- Partial index (sirf 5000 pending orders indexed):
CREATE INDEX idx_pending ON orders (created_at) WHERE status = 'pending';
-- 200x chhota! Faster to scan, cheaper to maintain.
```

**Use cases:**
- `WHERE status = 'pending'` — sirf active/pending items index karo
- `WHERE deleted_at IS NULL` — sirf non-deleted items
- `WHERE error_count > 0` — sirf problematic items

### Composite Index Column Order — Leftmost Prefix Rule

```sql
CREATE INDEX idx_composite ON orders (user_id, status, created_at);

-- ✅ Uses index (leftmost prefix match):
WHERE user_id = 42
WHERE user_id = 42 AND status = 'pending'
WHERE user_id = 42 AND status = 'pending' AND created_at > '2024-01-01'

-- ❌ Does NOT use this index:
WHERE status = 'pending'                    -- user_id missing (leftmost)
WHERE created_at > '2024-01-01'             -- user_id missing
WHERE status = 'pending' AND created_at > '2024-01-01'  -- user_id missing
```

**Column order decide karne ka rule:**
1. **Equality columns pehle:** `WHERE user_id = ?` (exact match)
2. **Range columns baad mein:** `WHERE created_at > ?` (range scan)
3. **High cardinality pehle:** user_id (millions) before status (5 values)

```sql
-- Query: WHERE user_id = 42 AND created_at > '2024-01-01' ORDER BY created_at
-- Best index: (user_id, created_at)
--   → user_id se filter, created_at se already sorted (no extra sort!)
```

### Sequential Scan vs Index Scan — Planner ka Decision

Kabhi kabhi PostgreSQL index hote hue bhi sequential scan choose karta hai:

```
1. Table chhoti hai (few pages):
   → Seq scan se poori table ek baar padh lo, index overhead nahi chahiye

2. Query result large portion of table:
   → WHERE is_active = true (95% rows)
   → Seq scan: 1 sequential disk read
   → Index scan: thousands of random disk reads (SLOWER!)

3. Statistics outdated:
   → Planner ko lagta hai table mein 100 rows hain, actually 10 million
   → Run: ANALYZE tablename;

4. random_page_cost too high:
   → Default 4.0 (assumes spinning disk)
   → SSD pe set to 1.1: SET random_page_cost = 1.1;
   → SSD pe random reads almost sequential jitni fast hain
```

### Join Strategies

```
1. Nested Loop Join:
   FOR each row in outer_table:
       FOR each row in inner_table WHERE join_condition:
           emit result
   
   Best when: Outer table small, inner table has index on join column
   Worst when: Both tables large → O(N × M)

2. Hash Join:
   Build hash table from smaller table
   Probe hash table with each row from larger table
   
   Best when: Large tables, equality join, enough memory for hash table
   Worst when: Hash table doesn't fit in work_mem → spills to disk

3. Merge Join:
   Both tables sorted on join column
   Merge like merge-sort merge step
   
   Best when: Both inputs already sorted (index), large tables
   Needs: Sorted input (or sorts first, which adds cost)
```

```sql
-- See join strategy:
EXPLAIN ANALYZE
SELECT o.*, u.name 
FROM orders o 
JOIN users u ON o.user_id = u.id 
WHERE o.status = 'pending';

-- Tune:
SET work_mem = '256MB';  -- more memory for hash joins
SET enable_hashjoin = off;  -- force planner to try other strategies (debugging only!)
```

### pg_stat_statements — Production Query Analysis

```sql
-- Enable (postgresql.conf):
shared_preload_libraries = 'pg_stat_statements'

-- Top 10 slowest queries:
SELECT 
    calls,
    mean_exec_time::numeric(10,2) as avg_ms,
    total_exec_time::numeric(10,2) as total_ms,
    rows,
    query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Top 10 most called queries:
SELECT calls, query 
FROM pg_stat_statements 
ORDER BY calls DESC 
LIMIT 10;

-- Queries with worst hit ratio (most disk reads):
SELECT 
    query,
    shared_blks_hit,
    shared_blks_read,
    (shared_blks_hit::float / NULLIF(shared_blks_hit + shared_blks_read, 0) * 100)::numeric(5,2) as hit_ratio
FROM pg_stat_statements
ORDER BY shared_blks_read DESC
LIMIT 10;
```

**Production workflow:**
1. `pg_stat_statements` enable karo
2. Top slow queries identify karo
3. `EXPLAIN ANALYZE` run karo
4. Index add karo ya query optimize karo
5. Before/after compare karo
6. Repeat

---

## Day 41–42: ACID Transactions in Depth

### Atomicity — All or Nothing

```sql
BEGIN;
    UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
    UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
    INSERT INTO transfers (from_id, to_id, amount) VALUES (1, 2, 1000);
COMMIT;

-- Agar COMMIT se pehle crash ho jaaye:
-- WAL mein incomplete transaction hai
-- Recovery pe: rollback ho jayega
-- Koi bhi partial state visible nahi hoga
-- Account 1 se paise kat gaye but account 2 mein nahi aaye — YEH KABHI NAHI HOGA
```

### Consistency — Constraint Enforcement

```sql
-- Constraints at commit time:
ALTER TABLE accounts ADD CONSTRAINT positive_balance CHECK (balance >= 0);

BEGIN;
    UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
    -- balance -500 ho gaya
COMMIT;
-- ERROR: new row for relation "accounts" violates check constraint "positive_balance"
-- Transaction ABORT! Koi change nahi hua.
```

**Deferred constraints:** Kuch constraints transaction end pe check hote hain, har statement pe nahi:
```sql
SET CONSTRAINTS ALL DEFERRED;
-- Ab constraints COMMIT pe check honge, individual statements pe nahi
-- Useful: circular foreign keys, batch operations
```

### Isolation Levels — Anomalies Samjho

#### Anomaly 1: Dirty Read
```
Txn A: UPDATE users SET balance = 0 WHERE id = 1;  (not committed yet!)
Txn B: SELECT balance FROM users WHERE id = 1;     → reads 0 (DIRTY!)
Txn A: ROLLBACK;  (balance is actually still 1000)
Txn B used wrong data!

PostgreSQL: NEVER allows dirty reads. Even READ COMMITTED prevents this.
```

#### Anomaly 2: Non-Repeatable Read
```
Txn B: SELECT balance FROM users WHERE id = 1;     → reads 1000
Txn A: UPDATE users SET balance = 500 WHERE id = 1; COMMIT;
Txn B: SELECT balance FROM users WHERE id = 1;     → reads 500 😱
Same query, different result within same transaction!

READ COMMITTED: Allows this (each statement sees fresh snapshot)
REPEATABLE READ: Prevents this (entire transaction sees one snapshot)
```

#### Anomaly 3: Phantom Read
```
Txn B: SELECT count(*) FROM orders WHERE user_id = 1;  → 5
Txn A: INSERT INTO orders (user_id, ...) VALUES (1, ...); COMMIT;
Txn B: SELECT count(*) FROM orders WHERE user_id = 1;  → 6 😱
New row appeared (phantom)!

READ COMMITTED: Allows this
REPEATABLE READ in Postgres: Actually prevents this too (snapshot-based)
```

#### Anomaly 4: Write Skew — The Tricky One

```
Rule: Hospital mein minimum 1 doctor on-call hona chahiye.

Currently: Doctor A (on-call), Doctor B (on-call) → 2 doctors on-call ✓

Txn A: SELECT count(*) FROM doctors WHERE on_call = true;  → 2
       "2 > 1, so I can go off-call"
       UPDATE doctors SET on_call = false WHERE id = 'A';

Txn B: SELECT count(*) FROM doctors WHERE on_call = true;  → 2 (same snapshot!)
       "2 > 1, so I can go off-call"  
       UPDATE doctors SET on_call = false WHERE id = 'B';

Both COMMIT.
Result: 0 doctors on-call! 💀 CONSTRAINT VIOLATED!

But neither transaction violated anything ALONE. Each saw 2 and left 1.
Problem: they were reading overlapping data but writing different rows.
```

**Write skew sirf SERIALIZABLE isolation level pe prevent hota hai:**

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
    SELECT count(*) FROM doctors WHERE on_call = true;
    -- Postgres tracks this read
    UPDATE doctors SET on_call = false WHERE id = 'A';
COMMIT;
-- If another txn modified on_call between our read and write,
-- Postgres detects the conflict → SERIALIZATION FAILURE → retry!
```

### Isolation Levels Summary

| Level | Dirty Read | Non-Repeatable | Phantom | Write Skew |
|-------|-----------|----------------|---------|------------|
| READ COMMITTED | ❌ No | ✅ Possible | ✅ Possible | ✅ Possible |
| REPEATABLE READ | ❌ No | ❌ No | ❌ No (in PG) | ✅ Possible |
| SERIALIZABLE | ❌ No | ❌ No | ❌ No | ❌ No |

**PostgreSQL default:** READ COMMITTED. Zyada strict chahiye toh explicitly set karo.

**SERIALIZABLE ka cost:** Transactions abort ho sakte hain (serialization failure). Application mein **retry logic** mandatory hai.

```go
// Serializable transaction with retry
for retries := 0; retries < 3; retries++ {
    err := db.RunInSerializableTx(ctx, func(tx *sql.Tx) error {
        // ... your transaction logic
        return nil
    })
    if err == nil {
        break
    }
    if isSerializationFailure(err) {
        continue // retry
    }
    return err // real error, don't retry
}
```

### Advisory Locks

Application-level locks jo PostgreSQL manage karta hai:

```sql
-- Lock by a numeric key (e.g., user ID)
SELECT pg_advisory_lock(12345);
-- ... do exclusive work for key 12345 ...
SELECT pg_advisory_unlock(12345);

-- Try lock (non-blocking):
SELECT pg_try_advisory_lock(12345);  -- returns true/false immediately
```

**Use cases:**
- Job scheduler: ensure only one worker processes a specific job
- Migration: ensure only one server runs migrations at a time
- Rate limiting: coarse-grained coordination

**Advantage over application-level locks:** Automatically released on disconnect, managed by database (no distributed lock manager needed for single-database setups).

---

## Day 43–44: Redis Internals

### Single-Threaded Event Loop — Speed ka Secret

**"Redis single-threaded hai toh fast kaise?"** — Yeh common confusion hai.

```
Redis speed ka reason single-threaded HONA hai, not DESPITE it:

1. No lock contention: Koi mutex nahi, koi race condition nahi
2. No context switching: CPU ek hi thread pe focused
3. Everything in memory: RAM access ~100ns vs disk ~10ms (100,000x faster!)
4. Efficient data structures: Optimized C implementations
5. epoll/kqueue: Non-blocking I/O, thousands of connections ek thread pe
6. Simple operations: Most commands O(1) ya O(log N)

Typical Redis: 100,000+ operations per second on single core

Bottleneck network hai, CPU nahi (mostly).
```

**Redis 6.0+ threading:** I/O threads add hue hain for reading/writing to sockets. Command execution still single-threaded hai. Network I/O ka parallelism, not data access ka.

### Data Structures — Internal Implementations

#### String
```redis
SET user:123:name "Ashutosh"     -- raw bytes
SET counter 42                    -- integer encoding (memory efficient)
INCR counter                      -- atomic increment (no read-modify-write race)
```
Internally: SDS (Simple Dynamic String) — length tracked, binary-safe, O(1) length.

#### Hash
```redis
HSET user:123 name "Ashutosh" age 25 email "ash@example.com"
HGET user:123 name    → "Ashutosh"
HGETALL user:123      → all fields
```

**Internal encoding switch:**
- **Chhota hash (< 128 entries, values < 64 bytes):** `listpack` — compact, sequential memory, O(N) per operation but cache-friendly aur memory efficient
- **Bada hash:** `hashtable` — O(1) lookups, more memory overhead

#### Sorted Set (ZSet) — The Power Structure

```redis
ZADD leaderboard 1000 "player:1"
ZADD leaderboard 2500 "player:2"  
ZADD leaderboard 1800 "player:3"

ZRANGEBYSCORE leaderboard 1000 2000    → ["player:1", "player:3"]
ZRANK leaderboard "player:2"           → 2 (0-indexed, highest)
ZREVRANGE leaderboard 0 9              → top 10 players
```

**Internal structure: Skiplist + Hashtable**

```
Skip List (sorted by score):
Level 3:  [HEAD] ──────────────────────────── [2500]
Level 2:  [HEAD] ────────── [1800] ────────── [2500]
Level 1:  [HEAD] ── [1000] ── [1800] ── [2500]

+ Hashtable: member → score (for O(1) ZSCORE lookups)
```

**Skiplist:** Probabilistic data structure. O(log N) insert, delete, search. Range queries naturally supported (linked list pe traverse karo).

**Kyun skiplist aur balanced tree (like Red-Black tree) nahi?**
- Simpler implementation
- Range queries naturally efficient (just walk the list)
- Concurrent-friendly (Redis single-threaded hai toh matter nahi karta, but design mein useful)

**Use cases for Sorted Sets:**
- Leaderboards (score-based ranking)
- Rate limiting (timestamp as score, ZRANGEBYSCORE for window)
- Priority queues (priority as score)
- Time-series data (timestamp as score)

### Persistence — RDB vs AOF

```
RDB (Redis Database Backup):
  - Point-in-time snapshot of entire dataset
  - fork() karke child process dump karta hai (copy-on-write)
  - Compact file, fast loading
  ⚠️ Data loss: last snapshot ke baad ka data lost on crash
  
  Config: save 900 1      # 900 seconds mein 1 change → snapshot
          save 300 10     # 300 seconds mein 10 changes → snapshot

AOF (Append-Only File):
  - Every write operation log hoti hai
  - Options: always (fsync every write), everysec, no
  - Larger file, slower loading (replay needed)
  ✅ Minimal data loss (at most 1 second with everysec)
  
  Config: appendonly yes
          appendfsync everysec

Hybrid (Redis 4.0+):
  RDB + AOF combined → RDB for base + AOF for recent changes
  Best of both worlds. Production mein yeh use karo.
```

**Kab kya:**
- Pure cache (data loss okay): No persistence
- Important data lekin not critical: RDB
- Minimal data loss needed: AOF everysec
- Production recommended: Hybrid (RDB + AOF)

### Eviction Policies

Jab Redis `maxmemory` hit karta hai, purana data hataana padta hai:

```
noeviction:     New writes reject hongi (error). Reads still work.
                Use: jab data loss unacceptable ho

allkeys-lru:    Least Recently Used key evict karo (any key)
                Use: general cache. MOST COMMON.

volatile-lru:   LRU, but sirf TTL set keys mein se
                Use: mix of cache (TTL) + permanent data (no TTL)

allkeys-lfu:    Least Frequently Used (Redis 4.0+)
                Use: better than LRU for skewed access patterns

volatile-ttl:   Soonest expiring key pehle
                Use: jab TTL-based expiry natural hai

allkeys-random: Random eviction
                Use: uniform access pattern
```

**Rule:** Agar Redis sirf cache hai → `allkeys-lru` ya `allkeys-lfu`. Agar mix hai → `volatile-*` variants.

### Redis Cluster

```
Total hash slots: 16,384

Node A: slots 0-5460
Node B: slots 5461-10922
Node C: slots 10923-16383

Key → slot: CRC16(key) mod 16384

"user:123" → CRC16("user:123") mod 16384 → slot 7321 → Node B
"order:456" → CRC16("order:456") mod 16384 → slot 2104 → Node A
```

**Multi-key operations restriction:**
```redis
# ❌ CROSSSLOT error — keys on different nodes
MGET user:123 order:456

# ✅ Hash tags — force same slot
MGET {user:123}:name {user:123}:email
# Both go to same slot: CRC16("user:123") mod 16384
```

### WAIT Command — Synchronous Replication

```redis
SET important:data "critical_value"
WAIT 2 5000
# Wait for at least 2 replicas to acknowledge within 5000ms
# Returns number of replicas that acknowledged
# If returns < 2, data might not be on enough replicas
```

**Use case:** Financial transactions ya critical writes jahan data loss unacceptable hai. Normally Redis replication async hai — WAIT isko synchronous bana deta hai selective writes ke liye.

---

## Day 45–46: CAP Theorem — Real Understanding

### CAP Kya Hai Actually?

```
C = Consistency:    Every read receives the most recent write (ya error)
A = Availability:   Every request receives a non-error response (may be stale)
P = Partition Tolerance: System works despite network partition between nodes

The theorem: During a network partition, you MUST choose C or A.
             You CANNOT have both.
             P is not optional — partitions WILL happen in distributed systems.
```

**Partition kya hai?**
```
Normal:     Node A ←──── network ────→ Node B
            (messages flow freely)

Partition:  Node A ←── ✂️ BROKEN ✂️ ──→ Node B
            (messages can't get through)
```

Jab partition ho jaaye:
- **CP choice:** Node B requests reject karta hai (ya read-only mode). "Main sure nahi hoon ki latest data hai, toh galat answer dene se accha error de deta hoon."
- **AP choice:** Node B apne local data se answer karta hai (stale ho sakta hai). "Purana answer bhi answer hai, error se better."

### Real Systems ka Classification

```
CP Systems (consistency prefer karte hain):
  ┌─────────────┬───────────────────────────────────────┐
  │ etcd         │ Raft consensus. Majority needed for    │
  │              │ reads/writes. Minority nodes refuse.    │
  ├─────────────┼───────────────────────────────────────┤
  │ ZooKeeper    │ ZAB protocol. Leader-based.            │
  │              │ No leader = no writes.                  │
  ├─────────────┼───────────────────────────────────────┤
  │ HBase        │ Strong consistency for rows.            │
  │              │ Region server down = that data unavail. │
  └─────────────┴───────────────────────────────────────┘

AP Systems (availability prefer karte hain):
  ┌─────────────┬───────────────────────────────────────┐
  │ Cassandra    │ Tunable consistency (quorum possible). │
  │              │ Default: eventually consistent.         │
  ├─────────────┼───────────────────────────────────────┤
  │ CouchDB      │ Multi-master replication.              │
  │              │ Conflicts resolved later.               │
  ├─────────────┼───────────────────────────────────────┤
  │ DynamoDB     │ Eventually consistent by default.       │
  │              │ Strong consistency optional per read.   │
  └─────────────┴───────────────────────────────────────┘
```

### PACELC — CAP se Zyada Nuanced

```
PACELC = if Partition → A or C, Else → Latency or Consistency

During partition:     Choose Availability or Consistency
During normal ops:    Choose Latency or Consistency

Examples:
  Cassandra:  PA/EL  → Available during partition, Low latency normally
  MongoDB:    PC/EC  → Consistent during partition, Consistent normally  
  DynamoDB:   PA/EL  (default) → Available, Low latency
              PC/EC  (strong consistency reads) → Consistent, Higher latency
```

**Kyun important hai?** CAP sirf partition ke time ki baat karta hai. Lekin partition rare hoti hai. PACELC normal operation ke tradeoffs bhi cover karta hai — aur wahi zyada matter karta hai practically.

### Consistency Models — Weakest to Strongest

```
Eventual Consistency (weakest):
  "Writes will propagate... eventually. No ordering guarantee."
  
  Write X=1 to Node A
  Read X from Node B → might return old value for some time
  Eventually → Node B will see X=1
  
  ⚠️ "Eventually" could be milliseconds or hours
  ⚠️ No guarantee on ORDER of updates seen

Causal Consistency:
  "If A caused B, everyone sees A before B."
  
  User posts message → then edits it
  Everyone sees post before edit (causal order preserved)
  But unrelated events might be seen in different order by different nodes

Sequential Consistency:
  "All nodes see operations in SAME order.
   But that order may not match real-time wall clock."
  
  All nodes agree: X=1 happened before Y=2
  But maybe Y=2 actually happened first in real time

Linearizability (strongest):
  "All operations appear to happen atomically at some point
   between their invocation and response.
   Real-time ordering respected."
  
  If client A writes X=1 and gets OK,
  then client B reads X after A's OK → MUST see X=1 (or later value)
  
  Most expensive. Requires coordination (consensus protocol).
```

**Practical decisions:**
```
Shopping cart:        Eventual consistency OK (merge conflicts, user retries)
Bank account:         Linearizability required (can't show wrong balance)
Social media likes:   Eventual consistency (approximate count OK)
Inventory count:      At least causal (prevent overselling)
Leader election:      Linearizability (exactly one leader)
Analytics counters:   Eventual consistency (approximate is fine)
```

### "Eventual Consistency" ≠ "Eventually Correct"

```
Common misconception: "Data thoda late dikhega, but eventually sahi ho jayega"

Reality:
  - Without conflict resolution, two concurrent writes can CONFLICT forever
  - Last-write-wins can silently DROP writes
  - Read-your-own-writes not guaranteed (user writes, refreshes, sees old data)
  - No ordering means derived data can be inconsistent
  
Example:
  User updates profile name on Node A: name = "Ashutosh Kumar"
  User updates profile name on Node B: name = "Ashutosh K"
  
  With LWW (Last Write Wins): one update silently lost
  With CRDTs: merge possible but domain-dependent
  With manual resolution: application must handle conflicts
```

---

## Day 47–48: Horizontal Scaling Strategies

### Read Replicas

```
          Writes                    Reads
            ↓                    ↙   ↓   ↘
       ┌─────────┐        ┌──────┐ ┌──────┐ ┌──────┐
       │ Primary │───WAL──►│Rep 1 │ │Rep 2 │ │Rep 3 │
       │  (RW)   │  stream │(RO)  │ │(RO)  │ │(RO)  │
       └─────────┘        └──────┘ └──────┘ └──────┘
                              ↑
                         Replication lag!
                         (async, typically ms-seconds)
```

**Replication lag ka problem:**

```
User writes: POST /api/profile   {name: "New Name"}  → goes to PRIMARY
User reads:  GET  /api/profile                        → goes to REPLICA
                                                      → returns OLD name! 😱

Kyun? Write primary pe hua, replica pe abhi WAL apply nahi hua.
```

**Solutions:**

1. **Read-your-own-writes:** User ne write kiya? Next read primary se karo.
```go
func getProfile(ctx context.Context, userID string) (*Profile, error) {
    if recentlyWritten(ctx, userID) {  // check cookie/session flag
        return primaryDB.GetProfile(ctx, userID)  // read from primary
    }
    return replicaDB.GetProfile(ctx, userID)  // read from replica
}
```

2. **Monotonic reads:** Ek user ke saare reads same replica se karo (sticky routing).

3. **Causal consistency:** Write ke baad replica ka LSN (Log Sequence Number) check karo. Replica caught up nahi hai toh primary se padho.

### Sharding Strategies

#### Range Sharding
```
Shard 1: user_id 1 - 1,000,000
Shard 2: user_id 1,000,001 - 2,000,000
Shard 3: user_id 2,000,001 - 3,000,000

✅ Advantages:
  - Range queries easy: "SELECT * WHERE user_id BETWEEN 500 AND 1000" → Shard 1
  - Sequential scan within shard efficient

❌ Disadvantages:
  - Hotspot: new users sab last shard pe jaate hain (monotonic IDs)
  - Uneven distribution over time
```

#### Hash Sharding
```
shard = hash(user_id) % num_shards

user_id=123 → hash=7832 → 7832 % 4 = 0 → Shard 0
user_id=456 → hash=2341 → 2341 % 4 = 1 → Shard 1

✅ Advantages:
  - Even distribution (good hash = uniform spread)
  - No hotspot on sequential IDs

❌ Disadvantages:
  - Range queries impossible (WHERE user_id BETWEEN 100 AND 200 → all shards!)
  - Resharding nightmare: num_shards change → almost ALL keys move
```

#### Directory Sharding
```
Lookup service: "user_id 123 → Shard 2"
                "user_id 456 → Shard 1"

✅ Flexible: any mapping, easy to move individual users
❌ Lookup service is SPOF (single point of failure)
❌ Extra network hop for every query
```

### Hotspot Problem

```
Scenario: Virat Kohli tweets → 50 million fans read his profile
          
user_id = "virat" → hash → Shard 3
Shard 3: 💀 10,000x more traffic than other shards

Solutions:

1. Key expansion:
   Instead of shard("virat"), use shard("virat_" + random(0,9))
   Traffic spread across 10 shards
   ⚠️ Reads need scatter-gather from 10 shards

2. Hot shard caching:
   CDN/Redis cache in front of hot shard
   Most reads served from cache

3. Micro-sharding:
   Split hot shard into smaller shards
   Automated detection + splitting
```

### Resharding — The Operational Nightmare

```
Current: 4 shards
Need:    8 shards (traffic doubled)

Problem: hash(key) % 4 ≠ hash(key) % 8
         Almost EVERY key needs to move!

Steps:
1. Create new shards
2. Double-write: write to both old and new shard
3. Backfill: copy existing data to new shards
4. Verify: checksums, row counts
5. Switch reads to new shards
6. Stop double-writes
7. Decommission old shards

Duration: Days to weeks for large datasets
Risk: Data inconsistency, missed writes, downtime
```

### Consistent Hashing

**Problem:** Regular `hash % N` mein N change hone pe sab kuch move hota hai.

**Solution:** Consistent hashing — sirf 1/N keys move hoti hain.

```
Imagine a circle (0 to 2^32):

        Node A (position 1000)
       /
  ────●───────────────●──── Node B (position 5000)
  |                        |
  |                        |
  ────●───────────────●────
       \
        Node C (position 9000)

Key ka hash = position on circle
Key goes to NEXT node clockwise

key1 (hash=3000) → Node B (next clockwise after 3000)
key2 (hash=7000) → Node C
key3 (hash=500)  → Node A

Add Node D at position 7500:
  Only keys between 5000-7500 move from Node C to Node D
  Everything else stays! 🎉
```

**Virtual nodes:** Ek physical node → multiple positions on circle. Better distribution.

```
Node A: positions 1000, 4000, 8500 (3 virtual nodes)
Node B: positions 2000, 5000, 9500
Node C: positions 3000, 7000, 6500

More virtual nodes = more even distribution
```

---

## Day 49–50: Kafka Deep Dive

### Log-Structured Storage

**Kafka = distributed, append-only, immutable log.**

```
Topic: "orders"
Partition 0: [msg0] [msg1] [msg2] [msg3] [msg4] [msg5] ...
                                                    ↑
                                              newest message
                                              (append-only, can't modify old messages)

Retention:
  - By time: keep messages for 7 days (default)
  - By size: keep up to 1TB per partition
  - Compacted: keep latest value per key (forever)
  
  Expired messages deleted in background (segment deletion)
```

**Immutability kyun powerful hai:**
- No locks needed for reads (concurrent readers safe)
- Sequential I/O (disk pe fastest access pattern)
- Replay possible (rewind consumer offset)
- Multiple consumers independently read same data

### Partitions — Parallelism ka Unit

```
Topic: "orders" with 4 partitions

Partition 0: [order-1] [order-5] [order-9]  ...
Partition 1: [order-2] [order-6] [order-10] ...
Partition 2: [order-3] [order-7] [order-11] ...
Partition 3: [order-4] [order-8] [order-12] ...

Key-based partitioning:
  partition = hash(key) % num_partitions
  
  All orders for user_123 → same partition → ORDERED within that user
  Orders across users → different partitions → no ordering guarantee
```

**Ordering guarantee:** Kafka sirf **within a partition** order guarantee karta hai. Cross-partition ordering nahi hai.

**Rule:** Jis entity ki ordering chahiye, uski key same rakho:
- User events ordered chahiye? → user_id as key
- Order events ordered chahiye? → order_id as key

### Consumer Groups

```
Topic: "orders" (4 partitions)

Consumer Group "order-processor":
  Consumer A: reads Partition 0, 1
  Consumer B: reads Partition 2, 3
  
  → Parallel processing! Each event processed exactly once (within this group)

Consumer Group "analytics":
  Consumer X: reads Partition 0, 1, 2, 3
  
  → Independent! Same data, different processing

Rules:
  - 1 partition = max 1 consumer (within a group)
  - More consumers than partitions = idle consumers
  - Want more parallelism? Add more partitions (but can't decrease later easily)
```

```
4 partitions, 2 consumers:     P0,P1 → C1  |  P2,P3 → C2    ✅ Good
4 partitions, 4 consumers:     P0→C1 | P1→C2 | P2→C3 | P3→C4  ✅ Max parallel
4 partitions, 6 consumers:     P0→C1 | P1→C2 | P2→C3 | P3→C4 | C5,C6 idle  ⚠️ Waste
```

### Offset Management

```
Partition 0: [0] [1] [2] [3] [4] [5] [6] [7] [8]
                              ↑                 ↑
                        committed offset    latest offset
                        (consumer ne yahan          
                         tak process kiya)

Auto-commit (default):
  Consumer periodically commits offset
  ⚠️ Crash between process and commit → message processed but not committed
     → On restart: re-processed (DUPLICATE!)
  ⚠️ Commit before process complete → committed but not processed
     → On restart: message LOST!

Manual commit:
  1. Read message
  2. Process message  
  3. Commit offset     ← sirf process hone ke BAAD commit karo
  
  Still at-least-once: crash between 2 and 3 → re-process on restart
  But NO message loss.
```

### Delivery Semantics

```
At-most-once:
  Commit offset BEFORE processing
  If crash during processing → message lost
  Use when: analytics, non-critical metrics
  
At-least-once:
  Commit offset AFTER processing
  If crash after processing but before commit → duplicate
  Use when: most systems (with idempotent consumers)
  
Exactly-once:
  Kafka transactions (idempotent producer + transactional consumer)
  Producer: each message has a sequence number, broker deduplicates
  Consumer: read-process-commit in one atomic transaction
  ⚠️ Only within Kafka ecosystem (Kafka → Kafka)
  ⚠️ For Kafka → external system: need idempotent writes at destination
```

### Idempotent Consumer — The Practical Pattern

```go
func processEvent(ctx context.Context, event Event) error {
    // 1. Check if already processed
    processed, err := redis.Exists(ctx, "processed:"+event.ID).Result()
    if err != nil {
        return err
    }
    if processed {
        log.Info("duplicate event, skipping", "id", event.ID)
        return nil  // idempotent — same result
    }
    
    // 2. Process the event
    err = handleOrder(ctx, event)
    if err != nil {
        return err  // don't mark as processed, will retry
    }
    
    // 3. Mark as processed (with TTL matching Kafka retention)
    redis.Set(ctx, "processed:"+event.ID, "1", 7*24*time.Hour)
    
    return nil
}
```

### Compacted Topics

```
Normal topic (time-based retention):
  [key=A, val=1] [key=B, val=2] [key=A, val=3] [key=C, val=4]
  After retention: ALL deleted

Compacted topic:
  Before compaction:
  [key=A, val=1] [key=B, val=2] [key=A, val=3] [key=C, val=4]
  
  After compaction:
  [key=A, val=3] [key=B, val=2] [key=C, val=4]
  (only LATEST value per key kept)

Use cases:
  - User profile changes → latest profile always available
  - Config changes → current config
  - Materialized views → replay to rebuild current state
```

### Kafka vs RabbitMQ

| Feature | Kafka | RabbitMQ |
|---------|-------|----------|
| Model | Distributed log | Message queue |
| After consumption | Message stays (retention) | Message deleted |
| Replay | ✅ Yes (reset offset) | ❌ No |
| Ordering | Within partition | Within queue |
| Routing | Simple (topic/partition) | Complex (exchanges, routing keys) |
| Throughput | Very high (sequential I/O) | Lower (more features) |
| Use case | Event streaming, log aggregation | Task queues, RPC, complex routing |

**Rule of thumb:**
- Events/logs/streaming → Kafka
- Task queues/RPC/complex routing → RabbitMQ

---

## Day 51–52: Event-Driven Architecture

### Outbox Pattern — The Reliable Event Publisher

**Problem:** DB write aur event publish atomic nahi hai:

```
// ❌ BROKEN — dual write problem
func CreateOrder(ctx context.Context, order Order) error {
    err := db.Insert(ctx, order)           // Step 1: DB write
    if err != nil { return err }
    
    err = kafka.Publish(ctx, "order-created", order)  // Step 2: Kafka publish
    if err != nil {
        // DB mein order hai, Kafka mein nahi
        // Inconsistent state! 😱
        // Rollback DB? What if that fails too?
    }
    return nil
}
```

**Solution — Outbox pattern:**

```
// ✅ CORRECT — single transaction
func CreateOrder(ctx context.Context, order Order) error {
    return db.RunInTx(ctx, func(tx *sql.Tx) error {
        // Both in SAME transaction — atomic!
        err := tx.Insert("orders", order)
        if err != nil { return err }
        
        err = tx.Insert("outbox", OutboxEvent{
            ID:        uuid.New(),
            Topic:     "order-created",
            Payload:   marshal(order),
            Published: false,
        })
        return err
    })
    // Either BOTH succeed or NEITHER does
}

// Separate process: Outbox Publisher (polls or uses CDC)
func OutboxPublisher() {
    for {
        events := db.Query("SELECT * FROM outbox WHERE published = false ORDER BY id LIMIT 100")
        for _, e := range events {
            kafka.Publish(e.Topic, e.Payload)
            db.Update("UPDATE outbox SET published = true WHERE id = ?", e.ID)
        }
        sleep(100ms)
    }
}
```

**CDC (Change Data Capture)** alternative: Debezium jaisi tool outbox table ke changes directly WAL se read karke Kafka mein bhejti hai. Polling se better — lower latency, less DB load.

### Saga Pattern — Distributed Transactions Without 2PC

**Problem:** Order create karna = payment + inventory + shipping. Teen alag services. Ek transaction mein nahi kar sakte (different databases).

**2PC (Two-Phase Commit):** All services prepare → coordinator asks all to commit. **Problems:** Coordinator down = everything blocked. Slow. Not practical at scale.

**Saga:** Local transactions ka chain + compensating actions for rollback.

#### Choreography (event-driven, decentralized)

```
Order Service                Payment Service              Inventory Service
     │                            │                             │
     │── order-created ──────────►│                             │
     │                            │── payment-authorized ──────►│
     │                            │                             │── inventory-reserved ──►
     │                            │                             │
     │                      (if payment fails)                  │
     │◄── payment-failed ────────│                             │
     │                            │                             │
     │── order-cancelled          │                             │
```

**Compensation:** Agar step 3 fail ho jaye (inventory nahi hai):
```
inventory-reservation-failed event →
  Payment Service: refund payment (compensating action) →
  Order Service: cancel order (compensating action)
```

#### Orchestration (centralized coordinator)

```
                    Saga Orchestrator
                   /       |         \
           Step 1: /   Step 2: |   Step 3: \
    Payment Service  Inventory Svc  Shipping Svc
    
    Orchestrator:
      1. Call Payment.Authorize() → success
      2. Call Inventory.Reserve() → success
      3. Call Shipping.Create()   → FAILED!
      4. Call Inventory.Release() (compensate)
      5. Call Payment.Refund()    (compensate)
      6. Mark saga as failed
```

**Choreography vs Orchestration:**
- **Choreography:** Simple, decoupled, but hard to track overall flow. Good for 2-3 step sagas.
- **Orchestration:** Central visibility, easier debugging, but orchestrator is coupling point. Good for complex sagas.

### Event Sourcing

**Traditional:** Store current state. History lost.
```
users table:  {id: 1, name: "Ashutosh", balance: 500}
(How did balance reach 500? 🤷)
```

**Event Sourcing:** Store events. State derived by replay.
```
events table:
  {type: "account-opened", data: {balance: 0}, timestamp: T1}
  {type: "deposit",        data: {amount: 1000}, timestamp: T2}
  {type: "withdrawal",     data: {amount: 300}, timestamp: T3}
  {type: "withdrawal",     data: {amount: 200}, timestamp: T4}

Current state = replay all events:
  0 + 1000 - 300 - 200 = 500 ✅

Full audit trail! Can rebuild state at any point in time.
```

**Advantages:**
- Complete audit trail
- Time travel (state at any past moment)
- Different read models from same events
- Event replay for bug fixing

**Disadvantages:**
- Complexity (event versioning, schema evolution)
- Performance (replaying millions of events = slow → need snapshots)
- Eventually consistent read models
- Hard to query ("show me all users with balance > 1000" requires projection)

### CQRS — Command Query Responsibility Segregation

```
Traditional:
  Same model for reads and writes
  ┌──────────────────┐
  │  Users Table     │ ← INSERT/UPDATE (write)
  │  (normalized)    │ ← SELECT with JOINs (read, slow!)
  └──────────────────┘

CQRS:
  Separate models for reads and writes
  
  Write side (Command):          Read side (Query):
  ┌──────────────────┐           ┌──────────────────────┐
  │  Normalized       │──events──►│  Denormalized view    │
  │  (PostgreSQL)     │           │  (Redis/Elasticsearch)│
  │  Source of truth  │           │  Optimized for reads  │
  └──────────────────┘           └──────────────────────┘
```

**Kab use karein:**
- Read aur write patterns drastically different hain
- Read side ko heavy denormalization chahiye
- Different scale needs (100x more reads than writes)

**Kab NAI use karein:**
- Simple CRUD app
- Strong consistency chahiye between write and read
- Team small hai (operational complexity high hai)

### Dead Letter Queues (DLQ)

```
Main Queue: [msg1] [msg2] [msg3] [msg4]

Consumer processes msg1 → ✅ success
Consumer processes msg2 → ❌ fail (retry 1)
Consumer processes msg2 → ❌ fail (retry 2)  
Consumer processes msg2 → ❌ fail (retry 3)
                          ↓
                    Dead Letter Queue: [msg2]
                    (investigate later, don't block main queue)

Consumer processes msg3 → ✅ success (not blocked by msg2!)
```

**DLQ handling:**
1. Alert on DLQ depth
2. Manual investigation
3. Fix the bug
4. Replay from DLQ back to main queue

---

## Day 53–54: Raft Consensus

### Kyun Consensus Difficult Hai?

```
Distributed system mein 3 problems:
1. Network partition: nodes ek dusre se baat nahi kar paa rahe
2. Message delays: message 1ms mein bhi aa sakta hai, 10s mein bhi
3. Node failures: koi bhi node kisi bhi waqt crash ho sakta hai

Challenge: In sab ke bawajood, cluster ek value pe AGREE kare.
```

### Raft Roles

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   FOLLOWER   │     │   CANDIDATE  │     │    LEADER    │
│              │     │              │     │              │
│ - Passive    │     │ - Requesting │     │ - Accepts    │
│ - Responds   │     │   votes      │     │   writes     │
│   to RPCs    │     │ - Temporary  │     │ - Replicates │
│ - Votes      │     │   state      │     │   log        │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                     │                     │
       │ election timeout    │ wins majority       │ sends heartbeats
       │ (no heartbeat      │ votes                │ to maintain
       │  from leader)      │                      │ leadership
       └─────────►──────────┘──────────►───────────┘
```

### Leader Election

```
Normal operation:
  Leader sends heartbeats every 150ms
  Followers reset their election timer on each heartbeat
  Everything peaceful ✌️

Leader dies:
  
  Time ────────────────────────────────────────────►
  
  Follower A: timer=300ms  .......... TIMEOUT! → becomes CANDIDATE
  Follower B: timer=450ms  .............. (hasn't timed out yet)
  Follower C: timer=500ms  ................ (hasn't timed out yet)
  
  Candidate A: "Vote for me! Term 2!"
  Follower B: "OK, here's my vote" ✓
  Follower C: "OK, here's my vote" ✓
  
  Candidate A: 3 votes out of 3 (majority!) → becomes LEADER
  Leader A: starts sending heartbeats
```

**Randomized timeouts (150-300ms):** Har follower ka alag timeout. Isse split votes rare hote hain — usually ek hi node pehle timeout hota hai aur leader ban jaata hai.

**Split vote scenario:**
```
A times out → Candidate (term 2), votes for self
B times out → Candidate (term 2), votes for self
C: gets two vote requests → votes for whoever asked first (say A)

A: 2 votes (self + C). Majority in 3-node cluster? Yes! → LEADER
B: 1 vote (self only). Not majority. → back to FOLLOWER
```

### Log Replication

```
Client: "SET x = 5"
           ↓
Leader receives write
           ↓
Leader appends to own log: [term=2, index=3, cmd="SET x=5"]
           ↓
Leader sends AppendEntries RPC to all followers
           ↓
┌──────────────────────────────────────────────────────┐
│ Leader log:    [1:SET a=1] [2:SET b=2] [3:SET x=5]  │
│ Follower A:    [1:SET a=1] [2:SET b=2] [3:SET x=5]  │ ACK ✓
│ Follower B:    [1:SET a=1] [2:SET b=2] [3:SET x=5]  │ ACK ✓
└──────────────────────────────────────────────────────┘
           ↓
Majority (3/3) have entry → COMMITTED
           ↓
Leader applies to state machine: x = 5
Leader responds to client: "OK"
           ↓
Next heartbeat: tells followers "commit index = 3"
Followers apply: x = 5
```

### Committed vs Applied

```
Committed: Majority of nodes have the log entry stored
           → Entry will NEVER be lost (even if leader crashes)
           → Safety guarantee

Applied:   Entry executed on the state machine
           → State actually changed
           → Happens AFTER commit

Timeline:
  Leader appends → sends to followers → majority ACK → COMMITTED
  → leader applies → tells followers to apply → APPLIED
```

### Split-Brain Prevention

```
3-node cluster: Majority = 2

Partition:
  [Node A, Node B]  |  [Node C]
  
  Left side (2 nodes): Can elect a leader (2 ≥ majority)
  Right side (1 node): CANNOT elect a leader (1 < majority)
  
  → At most ONE leader at any time!

5-node cluster: Majority = 3

Partition:
  [A, B]  |  [C, D, E]
  
  Left (2): Cannot elect (2 < 3)
  Right (3): Can elect ✓
  
  → Still only ONE leader!
```

**Kyun possible nahi hai 2 leaders?** Kyunki dono ko majority chahiye. Do disjoint groups mein majority overlap MUST karta hai (pigeonhole principle). Agar A ko majority mili, toh B ko same majority nahi mil sakti — kam se kam ek node overlap karega, aur woh node sirf ek ko vote dega.

### Failure Tolerance

```
Nodes    Majority    Can tolerate failures
  3         2              1
  5         3              2
  7         4              3
  2N+1    N+1              N
```

**Kyun odd number of nodes?**
```
4 nodes, majority = 3, tolerates 1 failure
5 nodes, majority = 3, tolerates 2 failures

4 → 5 mein ek node add kiya, failure tolerance +1 hua.
5 → 6 mein ek node add kiya, majority = 4, tolerates 2 still!
  → No improvement! Sirf odd numbers pe benefit milta hai.
```

### Real Systems Using Raft

| System | Raft ka Use |
|--------|------------|
| **etcd** | Kubernetes ka brain. Cluster state store karta hai. |
| **CockroachDB** | Har data range (64MB) ka apna Raft group. Distributed SQL. |
| **Consul** | Service discovery + KV store. Raft for consistency. |
| **TiKV** | TiDB ka storage engine. Multi-Raft (one group per region). |

---

## Day 55: Distributed Database Survey

### CockroachDB

```
Architecture:
  SQL Layer → Distribution Layer (Raft per range) → Storage (Pebble/RocksDB)

Key concepts:
  - Data 64MB ranges mein divided
  - Har range ka apna Raft group (3-5 replicas)
  - Distributed SQL: JOINs across ranges
  - MVCC for transactions
  - Serializable isolation by default!

Use when:
  ✅ Need ACID transactions across regions
  ✅ Want SQL compatibility (PostgreSQL wire protocol)
  ✅ Multi-region deployment with strong consistency
  
Don't use when:
  ❌ Single region, simple queries (PostgreSQL simpler)
  ❌ Need extreme write throughput (Raft overhead)
  ❌ Budget tight (operational complexity)
```

### DynamoDB

```
Architecture:
  Fully managed by AWS. Partition key → partition → storage nodes (Paxos-based)

Key concepts:
  - Partition key: determines data placement. CHOOSE CAREFULLY.
  - Sort key: ordering within partition. Range queries within partition.
  - Eventually consistent reads (default, cheaper, faster)
  - Strongly consistent reads (optional, 2x cost, slightly slower)
  - Single-digit millisecond latency at any scale
  - On-demand or provisioned capacity

Use when:
  ✅ Known access patterns (key-value or key-sorted-range)
  ✅ Need extreme scale with managed ops
  ✅ AWS ecosystem
  
Don't use when:
  ❌ Ad-hoc queries needed (no JOINs, limited filtering)
  ❌ Multi-region strong consistency needed
  ❌ Complex transactions across partitions
```

**DynamoDB single-table design:** Ek table mein multiple entity types (users, orders, products) store karo using clever partition key + sort key combinations. Reduces tables but increases cognitive complexity.

### Cassandra / ScyllaDB

```
Architecture:
  Leaderless. All nodes equal. Consistent hashing. Quorum reads/writes.

Key concepts:
  - No leader: any node accepts reads/writes
  - Replication factor (RF): kitne nodes pe data copy hai
  - Consistency level per query:
    ONE:    1 node responds → fast but stale
    QUORUM: majority responds → balanced
    ALL:    all nodes respond → strong but slow and fragile
  
  R + W > N → strong consistency possible
  Example: RF=3, read QUORUM (2), write QUORUM (2) → 2+2 > 3 → consistent

Use when:
  ✅ Massive write throughput needed
  ✅ Time-series data, logs, IoT
  ✅ Multi-datacenter (built-in DC replication)
  
Don't use when:
  ❌ Need transactions
  ❌ Need JOINs or complex queries
  ❌ Small dataset (overkill)
```

**ScyllaDB:** Cassandra ka C++ rewrite (original Cassandra Java mein hai). Same API, same data model, 10x better performance, no JVM GC pauses. Discord ne Cassandra se ScyllaDB pe migrate kiya at 1 trillion messages.

### Google Spanner

```
Architecture:
  Distributed SQL. Paxos for consensus. TrueTime for external consistency.

TrueTime: GPS receivers + atomic clocks in every datacenter
  → Tight clock synchronization (<7ms uncertainty)
  → Can order transactions globally without coordination
  → "If T1 committed before T2 started, T1's changes visible to T2"

Key concepts:
  - External consistency: strongest consistency model possible
  - Globally distributed: data across continents with consistency
  - SQL support with ACID transactions

Use when:
  ✅ Global financial system needing strict consistency
  ✅ Google Cloud ecosystem
  ✅ Can afford it (expensive)
  
Don't use when:
  ❌ Single region (overkill)
  ❌ Not on Google Cloud
  ❌ Cost sensitive
```

### Decision Matrix

```
Need                          → Choose
─────────────────────────────────────────────────
SQL + ACID + multi-region     → CockroachDB or Spanner
Key-value at scale + managed  → DynamoDB
Massive writes + time-series  → Cassandra/ScyllaDB
SQL + single region           → PostgreSQL (don't overcomplicate!)
Global consistency + $$       → Spanner
```

---

## Projects Quick Reference

### Project 1: High-Throughput Write Service with Kafka

**Architecture:**
```
Order API → PostgreSQL (order + outbox table, same txn)
                                    ↓
                           Outbox Publisher (polls outbox)
                                    ↓
                              Kafka topic
                                    ↓
                        Consumer (idempotent, Redis dedup)
                                    ↓
                           Dead Letter Queue (failed msgs)
```
**Test:** Consumer kill karo mid-processing, restart karo, verify zero duplicates + zero losses.

### Project 2: Distributed Rate Limiter

**Lua script for atomicity:**
```lua
-- Token bucket in Redis (atomic via EVAL)
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = redis.call('ZCARD', key)
if count < limit then
    redis.call('ZADD', key, now, now .. math.random())
    redis.call('EXPIRE', key, window)
    return 1  -- allowed
end
return 0  -- rate limited
```

### Project 3: Read/Write Split + Query Analysis

**Key deliverable:** Before/after EXPLAIN ANALYZE showing 10x improvement from covering index. Replication lag monitoring with alerts at >500ms.

---

## Real-World Company Examples

| Company | Kya kiya | Lesson |
|---------|----------|--------|
| **Uber** | Schemaless (MySQL-backed NoSQL, append-only rows) | Immutable append model = natural for event replay aur multi-region replication |
| **Discord** | Cassandra → ScyllaDB at 1 trillion messages | Same data model, different runtime = 10x less infra. JVM GC pauses eliminated. |
| **Stripe** | Idempotency keys on every payment API | Outbox pattern at API layer. Duplicate request = same response, no re-execution. |
| **LinkedIn** | Kafka invented for internal messaging | Event log as primary system of record, not afterthought. Any view derivable by replay. |

---

## Phase 3 Mastery Checklist

- [ ] PostgreSQL query plan padh sako aur bottleneck identify kar sako
- [ ] MVCC, WAL, vacuum, bloat explain kar sako with examples
- [ ] Index choose karo query patterns ke basis pe — partial, covering, composite
- [ ] Transaction isolation anomalies — dirty read, phantom, write skew — demonstrate kar sako
- [ ] Redis safely use karo as cache/coordination, primary DB ki tarah nahi
- [ ] Idempotent Kafka consumers design aur implement kar sako
- [ ] CAP, PACELC, consistency models explain karo without buzzwords
- [ ] Raft consensus — leader election, log replication, split-brain prevention
- [ ] Sharding strategies — range vs hash vs directory, hotspot handling
- [ ] Outbox pattern aur Saga pattern implement kar sako
- [ ] Distributed database choose karo use-case ke basis pe with reasoning

---

## Resources

- *Designing Data-Intensive Applications* — Martin Kleppmann (ESSENTIAL. Har page padho.)
- *Database Internals* — Alex Petrov (storage engines deep dive)
- Use The Index, Luke — use-the-index-luke.com (free, Postgres-focused)
- Aphyr's Jepsen analyses — jepsen.io (real distributed system failure stories)
- *Kafka: The Definitive Guide* — Narkhede, Shapira, Palino
- PostgreSQL docs — particularly on MVCC, EXPLAIN, indexes
- Raft paper — "In Search of an Understandable Consensus Algorithm" (Diego Ongaro)
- `man 7 tcp` — still relevant for understanding DB connection behavior
