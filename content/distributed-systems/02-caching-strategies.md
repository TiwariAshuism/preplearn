# 02 — Caching Strategies (50M Users, Multi-Layer)

> **Scenario:** 50M users. PostgreSQL pe directly 200K req/sec daalna matlab DB marna. Caching ke bina koi bhi large-scale system nahi chalta. Caching galat karna = stale data, inconsistency, cache stampede.

---

## Cache Layers — Bahar Se Andar Tak

```
User Request
     │
     ▼
┌─────────────┐
│ Browser/App │  Layer 0: Client-side cache (HTTP Cache-Control)
│   Cache     │  TTL: seconds-minutes
└──────┬──────┘
       │
┌──────▼──────┐
│    CDN      │  Layer 1: Edge cache (Cloudflare, CloudFront)
│   Cache     │  TTL: minutes-hours. Static + cacheable API responses.
└──────┬──────┘
       │
┌──────▼──────┐
│  API Gateway│  Layer 2: Gateway/reverse proxy cache (Nginx, Envoy)
│   Cache     │  TTL: seconds-minutes. Hot API responses.
└──────┬──────┘
       │
┌──────▼──────┐
│ Application │  Layer 3: In-process cache (local memory)
│ Local Cache │  TTL: seconds. No network hop. Fastest.
└──────┬──────┘
       │
┌──────▼──────┐
│   Redis /   │  Layer 4: Distributed cache
│  Memcached  │  TTL: minutes-hours. Shared across app servers.
└──────┬──────┘
       │
┌──────▼──────┐
│ PostgreSQL  │  Layer 5: Database
│             │  Source of truth. Slowest.
└─────────────┘
```

**50M users pe typical hit rates:**
```
CDN:              ~95% for static assets, ~40-60% for cacheable APIs
Local cache:      ~80% hit for hot config/metadata
Redis:            ~90% hit for user sessions, profiles
DB:               Only ~10-20% of total requests reach here!

Without caching:  200K req/sec → DB
With caching:     200K req/sec → 20-40K req/sec → DB
                  10x load reduction!
```

---

## Caching Patterns

### Cache-Aside (Lazy Loading) — MOST COMMON

```go
func GetUser(ctx context.Context, userID string) (*User, error) {
    // 1. Check cache first
    cached, err := redis.Get(ctx, "user:"+userID).Result()
    if err == nil {
        var user User
        json.Unmarshal([]byte(cached), &user)
        return &user, nil  // CACHE HIT ✅
    }
    
    // 2. Cache miss → read from DB
    user, err := db.GetUser(ctx, userID)
    if err != nil {
        return nil, err
    }
    
    // 3. Populate cache for next time
    data, _ := json.Marshal(user)
    redis.Set(ctx, "user:"+userID, data, 15*time.Minute)
    
    return user, nil
}
```

```
Read flow:
  App → Redis (hit?) → YES → return cached
  App → Redis (miss?) → DB → write to Redis → return

Write flow (cache invalidation):
  App → DB (write) → Redis DEL key → done
  (next read will re-populate cache)
```

**Advantages:**
- Simple to implement
- Cache sirf wahi data rakhta hai jo actually read hota hai (demand-driven)
- Cache down? App still works (slower, directly from DB)

**Disadvantages:**
- Cache miss = extra latency (DB read + cache write)
- Stale data possible (DB updated, cache not yet invalidated)
- Cache stampede risk on cold start

### Read-Through

```
App → Cache → (miss) → Cache ITSELF fetches from DB → returns to App

Difference from cache-aside:
  Cache-aside: APPLICATION fetches from DB on miss
  Read-through: CACHE LAYER fetches from DB on miss

App doesn't know about DB directly for reads.
Cache is a unified read interface.
```

**Implementation:** Usually needs a cache library/proxy that supports data loading callbacks. Less common in practice — cache-aside is simpler.

### Write-Through

```
App writes → Cache → Cache writes to DB → Both updated atomically

Write flow:
  App → Cache.Set(key, value) → Cache → DB.Insert(value)
  Both cache and DB always in sync!

Read flow:
  App → Cache.Get(key) → always fresh ✅
```

**Advantages:** Cache never stale (always in sync with DB)
**Disadvantages:** Write latency increases (every write = cache + DB). Data written but never read still takes cache space.

### Write-Behind (Write-Back)

```
App writes → Cache (FAST) → Background: batch flush to DB (ASYNC)

Write flow:
  App → Cache.Set(key, value) → return immediately
  Background worker (every 1s): flush dirty cache entries to DB

⚠️ DANGER: Cache mein hai but DB mein nahi. Cache crash = DATA LOSS.
```

**Use cases:** High write throughput where small data loss acceptable:
- Analytics counters
- View counts
- Rate limit counters
- Non-critical metrics

**NEVER use for:** Payments, user data, orders — anything where data loss matters.

---

## Cache Invalidation — "The Hardest Problem in CS"

### Strategy 1: TTL-Based Expiry
```
redis.Set(ctx, "user:123", data, 15*time.Minute)

After 15 min → key expires → next read = cache miss → re-fetch from DB

✅ Simple, automatic cleanup
❌ Stale data for up to TTL duration
❌ TTL too short = too many DB hits, TTL too long = too stale
```

### Strategy 2: Explicit Invalidation on Write
```go
func UpdateUser(ctx context.Context, userID string, update UserUpdate) error {
    // 1. Update DB
    err := db.UpdateUser(ctx, userID, update)
    if err != nil {
        return err
    }
    
    // 2. Invalidate cache
    redis.Del(ctx, "user:"+userID)
    // Next read will fetch fresh data from DB
    
    return nil
}
```

**⚠️ Race condition:**
```
Thread A: UPDATE DB (user name = "New")
Thread B: READ DB   (user name = "New")  
Thread B: SET cache (user name = "New")
Thread A: DEL cache                        ← Deletes Thread B's fresh cache!
Next read: Cache miss → DB → "New" → cache repopulated. OK in this case.

Worse race:
Thread A: UPDATE DB (name = "New")
Thread B: READ DB   (name = "Old")    ← read before A's write committed!
Thread A: DEL cache
Thread B: SET cache (name = "Old")    ← STALE data in cache!
```

**Fix: Delete-then-write pattern + short TTL as safety net**
```go
// Safest pattern:
func UpdateUser(ctx context.Context, userID string, update UserUpdate) error {
    // 1. Delete cache first
    redis.Del(ctx, "user:"+userID)
    
    // 2. Update DB
    err := db.UpdateUser(ctx, userID, update)
    if err != nil {
        return err
    }
    
    // 3. Delete cache again (double-delete)
    //    Catches the race where a read between step 1 and 2
    //    re-populated cache with old data
    go func() {
        time.Sleep(500 * time.Millisecond) // delay for replication lag
        redis.Del(context.Background(), "user:"+userID)
    }()
    
    return nil
}
```

### Strategy 3: Event-Based Invalidation
```
DB write → Kafka event → Cache invalidation consumer

User Service: UpdateUser() → DB → publish "user.updated" event
Cache Invalidator: consumes "user.updated" → DEL cache key

✅ Decoupled, reliable (Kafka guarantees delivery)
✅ Multiple caches can listen to same event
❌ Eventual consistency (event processing delay)
❌ More infrastructure complexity
```

### Strategy 4: Version-Based Cache Keys
```go
// Cache key includes version
key := fmt.Sprintf("user:%s:v%d", userID, user.Version)

// Update increments version
// Old cache key simply expires (TTL)
// New reads use new version key → cache miss → fresh data

✅ No explicit invalidation needed
✅ No race conditions
❌ Old versions waste cache space until TTL
❌ Need a way to know current version (often from DB)
```

---

## Cache Stampede / Thundering Herd

### Problem

```
Popular cache key "trending_posts" expires
10,000 concurrent users request it simultaneously

                    Cache MISS (key expired)
                   /     |      |      \
              Thread1 Thread2 Thread3 ... Thread10000
                 |       |      |           |
                 ▼       ▼      ▼           ▼
              DB query DB query DB query ... DB query
              
10,000 IDENTICAL queries hit DB simultaneously → DB overloaded → cascading failure
```

### Solution 1: Mutex/Lock (Single Flight)

```go
import "golang.org/x/sync/singleflight"

var group singleflight.Group

func GetTrendingPosts(ctx context.Context) ([]Post, error) {
    // Check cache
    cached, err := redis.Get(ctx, "trending_posts").Result()
    if err == nil {
        return unmarshal(cached), nil
    }
    
    // singleflight: 10,000 concurrent calls → only 1 DB query
    // Others wait for the result
    result, err, _ := group.Do("trending_posts", func() (interface{}, error) {
        posts, err := db.GetTrendingPosts(ctx)
        if err != nil {
            return nil, err
        }
        // Populate cache
        redis.Set(ctx, "trending_posts", marshal(posts), 5*time.Minute)
        return posts, nil
    })
    
    return result.([]Post), err
}
```

**`singleflight`:** Same key ke concurrent calls mein sirf PEHLA call execute hota hai. Baaki sab wait karte hain aur same result milta hai. **Go backend mein MUST USE pattern.**

### Solution 2: Early Expiry / Background Refresh

```go
// Cache with soft TTL + hard TTL
type CacheEntry struct {
    Data      []byte
    SoftTTL   time.Time  // refresh after this (background)
    HardTTL   time.Time  // actually expire after this
}

func GetPosts(ctx context.Context) ([]Post, error) {
    entry := cache.Get("trending_posts")
    
    if entry != nil && time.Now().Before(entry.HardTTL) {
        // Still valid
        if time.Now().After(entry.SoftTTL) {
            // Soft expired → trigger background refresh
            // Current request gets stale-but-valid data
            go refreshCache("trending_posts")
        }
        return unmarshal(entry.Data), nil
    }
    
    // Hard expired → must fetch
    return fetchAndCache(ctx)
}

// Example:
// SoftTTL = 4 minutes, HardTTL = 5 minutes
// At 4 min: background refresh starts, users still get cached data
// At 4 min 2 sec: fresh data in cache
// Users NEVER see a cache miss for hot keys!
```

### Solution 3: Probabilistic Early Expiration (XFetch)

```
Instead of everyone refreshing at exact TTL:
  Each request has a small probability of refreshing BEFORE TTL

  remaining_ttl = key.TTL()
  if random() < (1.0 / remaining_ttl_seconds) {
      // I'll refresh it
      refreshCache(key)
  }
  
Result: As TTL approaches, probability increases
        Statistically, exactly 1 request refreshes before expiry
        No stampede!
```

---

## In-Process Cache — Zero Network Latency

```go
import "github.com/dgraph-io/ristretto"

// Ristretto: high-performance concurrent cache
cache, _ := ristretto.NewCache(&ristretto.Config{
    NumCounters: 1e7,     // 10M keys to track frequency
    MaxCost:     1 << 30, // 1GB max memory
    BufferItems: 64,
})

// Set with cost (memory estimate)
cache.Set("user:123", user, int64(unsafe.Sizeof(user)))

// Get
value, found := cache.Get("user:123")
if found {
    user := value.(*User)
    // ZERO network hop. ~50ns access time.
}
```

**Problem:** Har app server ka apna local cache hai. Ek server pe invalidation hua, dusre pe nahi.

```
Server A cache: user:123 = {name: "Old"}
Server B cache: user:123 = {name: "Old"}

User updates name to "New" → hits Server A
Server A: DB update + local cache invalidate ✅
Server B: still has old cache ❌ 

User's next request hits Server B → sees "Old" name 😱
```

**Solutions:**
1. **Very short TTL (5-30 seconds):** Accept brief staleness
2. **Pub/Sub invalidation:** Redis pub/sub ya Kafka event → all servers invalidate
3. **Two-tier cache:** Local cache (5s TTL) → Redis (15 min TTL) → DB

```go
func GetUser(ctx context.Context, id string) (*User, error) {
    // Tier 1: Local cache (50ns)
    if user, ok := localCache.Get("user:" + id); ok {
        return user.(*User), nil
    }
    
    // Tier 2: Redis (0.5ms)
    if data, err := redis.Get(ctx, "user:"+id).Result(); err == nil {
        user := unmarshal(data)
        localCache.Set("user:"+id, user, 10*time.Second) // short local TTL
        return user, nil
    }
    
    // Tier 3: DB (5-50ms)
    user, err := db.GetUser(ctx, id)
    if err != nil {
        return nil, err
    }
    redis.Set(ctx, "user:"+id, marshal(user), 15*time.Minute)
    localCache.Set("user:"+id, user, 10*time.Second)
    return user, nil
}
```

---

## CDN Caching — The First Line of Defense

### Cache-Control Headers

```
# Static assets (CSS, JS, images) — long cache
Cache-Control: public, max-age=31536000, immutable
# 1 year. File name includes hash (app.a1b2c3.js). Content change = new filename.

# API responses — short cache  
Cache-Control: public, max-age=60, stale-while-revalidate=300
# Fresh for 60s. After 60s, serve stale while revalidating in background for up to 300s.

# Private data — no CDN cache
Cache-Control: private, no-store
# User-specific data. CDN must NOT cache.

# API list endpoints — conditional caching
Cache-Control: public, max-age=0, must-revalidate
ETag: "abc123"
# CDN always checks with origin. If ETag matches → 304 Not Modified (no body transfer).
```

### Vary Header — Same URL, Different Content

```
GET /api/feed
Accept-Language: en    → English feed
Accept-Language: hi    → Hindi feed

Response:
Vary: Accept-Language
# CDN caches separate versions per Accept-Language value

⚠️ Vary: Cookie → DO NOT DO THIS
   Every user has different cookies → cache useless (1 entry per user)
```

### Cache Purge at Scale

```
Jab content update ho:

1. Tag-based purge (Cloudflare Surrogate-Key):
   Response header: Surrogate-Key: user-123 profile-page
   Purge: "Delete all cache entries tagged user-123"
   → All pages showing user-123's data purged

2. Prefix purge:
   Purge: /api/users/123/*
   → All cached responses under this path purged

3. Full purge:
   ⚠️ AVOID. Kills cache hit ratio. Thundering herd on origin.
```

---

## Redis Cache — Production Patterns

### Connection Pooling

```go
rdb := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{
        "redis-1:6379", "redis-2:6379", "redis-3:6379",
    },
    PoolSize:     100,           // connections per node
    MinIdleConns: 20,            // keep warm
    DialTimeout:  5 * time.Second,
    ReadTimeout:  3 * time.Second,
    WriteTimeout: 3 * time.Second,
    
    // Retry on MOVED/ASK (cluster resharding)
    MaxRedirects: 3,
})
```

### Pipeline — Batch Operations

```go
// ❌ SLOW — 10 sequential round trips
for _, id := range userIDs {
    redis.Get(ctx, "user:"+id)  // each = 0.5ms network RTT
}
// Total: 10 × 0.5ms = 5ms

// ✅ FAST — 1 round trip for all
pipe := redis.Pipeline()
cmds := make([]*redis.StringCmd, len(userIDs))
for i, id := range userIDs {
    cmds[i] = pipe.Get(ctx, "user:"+id)
}
pipe.Exec(ctx)
// Total: 1 × 0.5ms = 0.5ms (10x faster!)
```

### Cache Warming

```go
// Server startup pe hot data pre-load karo
func warmCache(ctx context.Context) {
    // Top 1000 users by activity
    users, _ := db.GetTopUsers(ctx, 1000)
    
    pipe := redis.Pipeline()
    for _, u := range users {
        pipe.Set(ctx, "user:"+u.ID, marshal(u), 15*time.Minute)
    }
    pipe.Exec(ctx)
    
    log.Printf("cache warmed with %d users", len(users))
}
```

---

## Numbers to Remember

```
Cache access latency:
  L1 CPU cache:     ~1ns
  Local in-process:  ~50ns
  Redis (same AZ):   ~0.5ms
  Redis (cross-AZ):  ~1-2ms
  DB (simple query):  ~5-20ms
  DB (complex query):  ~50-500ms
  CDN edge (cache hit): ~5-20ms (from user perspective)

Cache hit ratio targets (50M users):
  CDN static:       > 95%
  CDN API:          > 40% (cacheable endpoints)
  Redis:            > 85%
  Local cache:      > 70% (hot data)
  
  Overall: < 20% of requests should reach DB

Memory planning (Redis):
  50M users × 1KB avg per cached user = ~50GB
  Redis cluster: 6 nodes × 16GB = 96GB total (50% utilization target)
  Eviction policy: allkeys-lfu
```
