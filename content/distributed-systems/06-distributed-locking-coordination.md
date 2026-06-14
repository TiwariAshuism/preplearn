# 06 — Distributed Locking & Coordination (50M Users)

> **Scenario:** Multiple instances of same service chal rahi hain. Ek shared resource pe sirf EK instance kaam kare — yeh kaise ensure karein? Payment double charge na ho, cron job duplicate na chale.

---

## Why Distributed Locks?

```
Single server:  sync.Mutex → done
Multiple servers: sync.Mutex sirf local process mein kaam karta hai

Problem examples:
  1. Payment: 2 servers simultaneously charge same order → double payment
  2. Inventory: 2 servers read "5 items left", both decrement → oversold
  3. Cron: scheduled job runs on ALL 10 instances → 10x emails sent
  4. Migration: data migration should run on exactly 1 instance
```

---

## Redis Distributed Lock (Single Node)

### Simple SETNX

```go
func AcquireLock(ctx context.Context, rdb *redis.Client, key string, ttl time.Duration) (string, error) {
    // Unique value = fencing token (proves ownership)
    lockValue := uuid.New().String()
    
    // SET key value NX EX ttl
    // NX = only set if not exists (atomic)
    // EX = auto-expire after ttl (prevents deadlock if holder crashes)
    ok, err := rdb.SetNX(ctx, "lock:"+key, lockValue, ttl).Result()
    if err != nil {
        return "", err
    }
    if !ok {
        return "", ErrLockNotAcquired
    }
    return lockValue, nil
}

func ReleaseLock(ctx context.Context, rdb *redis.Client, key, lockValue string) error {
    // Lua script: only delete if value matches (prevent releasing someone else's lock)
    script := `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        else
            return 0
        end
    `
    result, err := rdb.Eval(ctx, script, []string{"lock:" + key}, lockValue).Int64()
    if err != nil {
        return err
    }
    if result == 0 {
        return ErrLockNotOwned
    }
    return nil
}
```

### Why Lua Script for Release?

```
Without Lua (RACE CONDITION):
  Server A: GET lock → value matches mine ✅
  --- Network delay / GC pause ---
  Lock expires. Server B acquires lock.
  Server A: DEL lock → DELETES SERVER B's LOCK! ❌

With Lua: GET + compare + DEL is atomic on Redis server.
```

---

## Redlock — Multi-Node Redis Lock

### Problem with Single Redis

```
Redis master dies after accepting SET (lock acquired).
Replica promotes to master but didn't replicate the SET yet.
Another client acquires SAME lock on new master.
Two clients think they hold the lock → DATA CORRUPTION.
```

### Redlock Algorithm (Martin Kleppmann vs Antirez debate)

```
5 independent Redis masters (no replication between them).

To acquire lock:
  1. Get current time (T1)
  2. Try SET NX on ALL 5 Redis instances with same key+value+TTL
  3. Lock acquired if:
     - Majority (≥3) instances accepted the SET
     - Total time to acquire < TTL  
  4. Effective TTL = original TTL - time spent acquiring
  5. If failed → release lock on ALL instances

To release: DEL on ALL 5 instances
```

### ⚠️ Redlock Controversy

```
Martin Kleppmann's argument:
  "Redlock is fundamentally broken for correctness."
  
  Problem: Process pause (GC, page fault) AFTER acquiring lock
  
  Client A: Acquires Redlock (TTL=10s)
  Client A: Long GC pause (15 seconds)
  Lock expires on all Redis nodes
  Client B: Acquires same lock
  Client A: GC finishes, thinks it still has lock
  Client A: Writes to DB → CONFLICT with Client B
  
  Solution needed: Fencing tokens
```

---

## Fencing Tokens

```
Every lock acquisition returns an incrementing token.

Lock acquire #1 → fencing_token = 33
Lock acquire #2 → fencing_token = 34

Client sends fencing token WITH every write to storage.
Storage rejects writes with OLD tokens.

  Client A: lock acquired, token=33
  Client A: GC pause... lock expires
  Client B: lock acquired, token=34
  Client B: writes to DB with token=34 ✅ (DB records: last_token=34)
  Client A: resumes, writes to DB with token=33
  DB: "33 < 34, reject!" ✅ SAFE
```

```go
// Fencing token with lock
type FencedLock struct {
    Token int64
    Owner string
}

// Storage checks token before write
func (s *Storage) Write(ctx context.Context, key string, value []byte, fencingToken int64) error {
    // Atomic compare-and-write
    result := s.db.ExecContext(ctx,
        `UPDATE resources SET value = $1, fencing_token = $2 
         WHERE key = $3 AND fencing_token < $2`,
        value, fencingToken, key,
    )
    if result.RowsAffected() == 0 {
        return ErrStaleFencingToken
    }
    return nil
}
```

---

## ZooKeeper — Purpose-Built Coordination

### ZooKeeper Basics

```
ZooKeeper = distributed coordination service
  - Consistent (linearizable reads/writes)
  - Uses ZAB consensus (similar to Raft)
  - Data model: hierarchical znodes (like filesystem)
  - Ephemeral znodes: auto-delete when session ends
  - Sequential znodes: auto-incrementing suffix
  - Watches: get notified when znode changes

Used by: Kafka (older versions), HBase, Hadoop, Solr
```

### ZooKeeper Lock Recipe

```
To acquire lock on resource "orders":

1. Create ephemeral sequential znode:
   /locks/orders/lock-0000000001  (my node)

2. Get all children of /locks/orders/:
   lock-0000000001  ← mine
   lock-0000000002
   lock-0000000003

3. Am I the LOWEST numbered? 
   YES → I have the lock ✅
   NO  → Set watch on the node JUST before me
         Wait for notification

4. Node before me deleted → re-check if I'm lowest now

Release: Delete my ephemeral znode (or session timeout auto-deletes)
```

```
Why sequential + ephemeral?
  Sequential: Fair ordering (FIFO lock)
  Ephemeral: If holder crashes, session expires → znode auto-deleted → next waiter gets lock
  
  No deadlocks! No manual cleanup! Built-in fencing via znode version.
```

### ZooKeeper vs Redis for Locks

```
ZooKeeper:
  ✅ Consensus-based (CP system) — correct by design
  ✅ Ephemeral znodes = automatic deadlock recovery
  ✅ Sequential = fair lock ordering
  ✅ Watches = efficient waiting (no polling)
  ❌ Slower (consensus overhead)
  ❌ More complex to operate
  ❌ Heavier (JVM-based, needs dedicated cluster)

Redis (single/Redlock):
  ✅ Fast (~1ms acquire)
  ✅ Simple to operate
  ✅ Already in your stack (caching)
  ❌ Not consensus-based (correctness caveats)
  ❌ TTL-based expiry = clock dependency
  ❌ Redlock debate (may not be safe for critical paths)

Recommendation:
  Payment/financial: ZooKeeper or etcd (correctness matters)
  Idempotency/dedup: Redis lock (good enough, fast)
  Cron dedup: Redis lock with TTL (simple, effective)
```

---

## etcd — Modern Alternative to ZooKeeper

```
etcd = distributed key-value store using Raft consensus
Used by Kubernetes for all cluster state.

Lock via etcd lease:
  1. Create lease (TTL)
  2. PUT key with lease attached
  3. If key created → lock acquired
  4. Keep-alive to extend lease
  5. Stop keep-alive or crash → lease expires → lock released

Simpler than ZooKeeper, Go-native, Raft-based.
Kubernetes clusters already have etcd running.
```

---

## Leader Election

### Problem

```
Scheduler service: 3 replicas for HA.
But only ONE should execute scheduled jobs.
Others = standby (take over if leader dies).
```

### Leader Election with etcd/K8s

```go
import "k8s.io/client-go/tools/leaderelection"

leaderelection.RunOrDie(ctx, leaderelection.LeaderElectionConfig{
    Lock: &resourcelock.LeaseLock{
        LeaseMeta: metav1.ObjectMeta{
            Name:      "scheduler-leader",
            Namespace: "default",
        },
        Client: kubeClient.CoordinationV1(),
        LockConfig: resourcelock.ResourceLockConfig{
            Identity: hostname, // unique per instance
        },
    },
    LeaseDuration: 15 * time.Second,
    RenewDeadline: 10 * time.Second,
    RetryPeriod:   2 * time.Second,
    Callbacks: leaderelection.LeaderCallbacks{
        OnStartedLeading: func(ctx context.Context) {
            // I am the leader — start doing work
            runScheduler(ctx)
        },
        OnStoppedLeading: func() {
            // Lost leadership — stop work, become standby
            logger.Info("lost leader election")
        },
        OnNewLeader: func(identity string) {
            logger.Info("new leader elected", zap.String("leader", identity))
        },
    },
})
```

---

## Distributed Cron / Scheduled Jobs

### Problem

```
"Every day 2am pe stale sessions cleanup karo"
10 instances of the service → 10 cleanup jobs run simultaneously?

Solutions:
1. Leader election: sirf leader runs cron
2. Distributed lock: lock acquire karo, first one wins, others skip
3. Dedicated scheduler service (1 instance with HA failover)
```

### Simple Distributed Cron with Redis Lock

```go
func RunDistributedCron(ctx context.Context, rdb *redis.Client) {
    ticker := time.NewTicker(1 * time.Hour)
    for {
        select {
        case <-ticker.C:
            lockValue, err := AcquireLock(ctx, rdb, "cron:cleanup-sessions", 30*time.Minute)
            if err != nil {
                // Another instance got the lock, skip
                continue
            }
            
            // I got the lock — do the work
            cleanupStaleSessions(ctx)
            
            ReleaseLock(ctx, rdb, "cron:cleanup-sessions", lockValue)
            
        case <-ctx.Done():
            return
        }
    }
}
```

---

## Production Recommendations — 50M Users

```
Use case → Solution:

Idempotency (prevent double processing):
  → Redis SETNX with request ID, TTL = processing window
  
Inventory/stock management:
  → Database row-level locks (SELECT FOR UPDATE)
  → OR optimistic locking (version column)
  
Payment processing:
  → etcd/ZooKeeper locks with fencing tokens
  → Idempotency key stored in DB (permanent record)
  
Cron job deduplication:
  → Redis lock with TTL slightly > job duration
  
Leader election:
  → Kubernetes Lease API (if on K8s)
  → etcd lease (if not on K8s)
  
Rate limiting counters:
  → Redis INCR with EXPIRE (atomic counter)

General rules:
  ✅ Always set TTL on locks (prevent deadlocks)
  ✅ Use fencing tokens for critical paths
  ✅ Prefer database-level guarantees over distributed locks when possible
  ✅ Make operations idempotent — then locks become optimization, not correctness
  ❌ Don't hold locks for long durations (> 30s suspicious)
  ❌ Don't nest distributed locks (deadlock risk)
```
