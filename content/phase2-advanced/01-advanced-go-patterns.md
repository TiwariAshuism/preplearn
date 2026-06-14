# 01 — Advanced Go Patterns (Production)

> **Scenario:** Production mein service slow hai. Memory badh rahi hai. 3am ka alert. pprof se diagnose karo, fix karo, ship karo. Yeh sab without yeh chapter ke nahi hoga.

---

## Go Profiling — pprof

### Types of Profiles

```
CPU Profile:    "Code kahan time spend kar raha hai?"
Heap Profile:   "Memory kahan allocate ho rahi hai?"
Goroutine:      "Kitne goroutines hain? Kahan stuck hain?"
Mutex:          "Kaunse locks contention create kar rahe hain?"
Block:          "Goroutines kahan block ho rahe hain?"
Trace:          "Full execution timeline (goroutines, GC, syscalls)"
```

### Enable pprof in Production

```go
import (
    "net/http"
    _ "net/http/pprof"  // side-effect import, registers /debug/pprof handlers
)

// SEPARATE server on separate port — never expose on public port!
go func() {
    log.Fatal(http.ListenAndServe("localhost:6060", nil))
}()

// Endpoints:
// http://localhost:6060/debug/pprof/             → index
// http://localhost:6060/debug/pprof/heap         → heap snapshot
// http://localhost:6060/debug/pprof/goroutine    → goroutine dump
// http://localhost:6060/debug/pprof/profile?seconds=30  → 30s CPU profile
```

### CPU Profiling — Flame Graph

```bash
# 30 second CPU profile capture
go tool pprof -http=:8888 http://localhost:6060/debug/pprof/profile?seconds=30

# Opens browser with flame graph
# x-axis: time (width = % CPU time spent)
# y-axis: call stack
# Wide bar at top = hotspot — fix karo yahan
```

```
Flame graph example:
  ████████████████████████  http.ServeHTTP (40% CPU)
  ██████████████           json.Marshal (25% CPU)   ← hotspot!
  ██████                   encoding/json.encode
  ████                     reflect.Value.Field

Analysis: JSON marshaling 25% CPU le raha hai.
Fix: 
  1. Protobuf/msgpack use karo (10x faster)
  2. json.RawMessage cache karo (pre-marshal hot objects)
  3. encoding/json → jsoniter (drop-in, 3x faster)
  4. Response streaming (stream large JSONs)
```

### Heap Profiling — Memory Leaks

```bash
# Heap profile
go tool pprof -http=:8888 http://localhost:6060/debug/pprof/heap

# alloc_objects: total allocations since start (cumulative)
# alloc_space:   total bytes allocated since start
# inuse_objects: currently live objects ← THIS for leaks
# inuse_space:   currently used bytes ← THIS for leaks
```

```go
// Common memory leak patterns in Go:

// ❌ LEAK 1: Goroutine leak (goroutine started, never exits)
func processRequests(requests <-chan Request) {
    for req := range requests {
        go handleRequest(req) // goroutines started but never bounded
        // If handleRequest blocks forever → goroutines pile up
    }
}
// Fix: always use context timeout + check goroutine count in monitoring

// ❌ LEAK 2: Global cache with no eviction
var cache = map[string]*BigObject{}
func getObject(key string) *BigObject {
    if v, ok := cache[key]; ok {
        return v
    }
    obj := loadFromDB(key)
    cache[key] = obj  // grows forever
    return obj
}
// Fix: use sync.Map + TTL, or use groupcache/ristretto

// ❌ LEAK 3: time.Ticker not stopped
func startPolling() {
    ticker := time.NewTicker(1 * time.Second)
    go func() {
        for range ticker.C {
            poll()
        }
        // ticker.Stop() never called if goroutine exits early
    }()
}
// Fix:
func startPolling(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Second)
    defer ticker.Stop()  // always stop!
    for {
        select {
        case <-ticker.C:
            poll()
        case <-ctx.Done():
            return
        }
    }
}
```

### Goroutine Dump — "Why Is My Service Hung?"

```bash
# Goroutine dump
curl http://localhost:6060/debug/pprof/goroutine?debug=2

# Output shows ALL goroutines with stack traces:
# goroutine 1234 [chan receive, 5 minutes]:
#   main.(*Worker).process(...)
#   → goroutine blocked on channel read for 5 minutes → LEAK

# Count goroutines over time — should be stable, not growing
```

---

## sync Package — Production Patterns

### sync.Mutex vs sync.RWMutex

```go
// RWMutex: Multiple readers OR one writer (not both)
type UserCache struct {
    mu    sync.RWMutex
    cache map[string]*User
}

func (c *UserCache) Get(key string) (*User, bool) {
    c.mu.RLock()    // multiple concurrent readers okay
    defer c.mu.RUnlock()
    v, ok := c.cache[key]
    return v, ok
}

func (c *UserCache) Set(key string, user *User) {
    c.mu.Lock()    // exclusive write lock
    defer c.mu.Unlock()
    c.cache[key] = user
}

// When to use RWMutex: reads >> writes (90% read, 10% write)
// When to use Mutex: writes frequent, or critical section short
```

### sync.Once — Lazy Initialization

```go
type DB struct {
    once   sync.Once
    client *sql.DB
}

func (d *DB) getClient() *sql.DB {
    d.once.Do(func() {
        // Executed EXACTLY once, even with concurrent callers
        var err error
        d.client, err = sql.Open("postgres", dsn)
        if err != nil {
            panic(err)
        }
    })
    return d.client
}
// All concurrent calls wait for first to finish, then all get same client.
// No double initialization, no race condition.
```

### sync.Pool — Reduce GC Pressure

```go
// Problem: Allocating buffers per request = GC pressure
// Solution: Pool for reuse

var bufPool = sync.Pool{
    New: func() interface{} {
        return &bytes.Buffer{}
    },
}

func processRequest(data []byte) []byte {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufPool.Put(buf)  // return to pool for reuse
    }()
    
    buf.Write(data)
    // ... process
    return buf.Bytes()
}

// sync.Pool is NOT a cache. GC can clear it anytime.
// Use for: temporary objects (buffers, request objects)
// Don't use for: long-lived state, connections
```

### sync/atomic — Lock-Free Counters

```go
import "sync/atomic"

// Metrics counter — lock-free, very fast
type Metrics struct {
    requests atomic.Int64
    errors   atomic.Int64
    latencyNs atomic.Int64
}

func (m *Metrics) RecordRequest(latency time.Duration, err error) {
    m.requests.Add(1)
    m.latencyNs.Add(int64(latency))
    if err != nil {
        m.errors.Add(1)
    }
}

func (m *Metrics) ErrorRate() float64 {
    req := m.requests.Load()
    if req == 0 {
        return 0
    }
    return float64(m.errors.Load()) / float64(req)
}

// atomic operations are CPU instructions (LOCK XADD)
// No goroutine scheduling, no mutex overhead
// Use for: simple counters, flags, state machines
```

---

## Generics (Go 1.18+)

### When to Use Generics

```go
// ❌ Before generics: interface{} with type assertions everywhere
func Map(slice []interface{}, fn func(interface{}) interface{}) []interface{} {
    result := make([]interface{}, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}
// Caller: Map(users, func(v interface{}) interface{} { return v.(*User).Name })
// Ugly, no compile-time safety

// ✅ With generics
func Map[T, R any](slice []T, fn func(T) R) []R {
    result := make([]R, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}
// Caller: Map(users, func(u *User) string { return u.Name })
// Type-safe, readable
```

### Type Constraints

```go
// Constraint: numeric types only
type Number interface {
    ~int | ~int64 | ~float64
}

func Sum[T Number](values []T) T {
    var total T
    for _, v := range values {
        total += v
    }
    return total
}

// Use in data structures
type Set[T comparable] struct {
    items map[T]struct{}
}

func (s *Set[T]) Add(item T) {
    if s.items == nil {
        s.items = make(map[T]struct{})
    }
    s.items[item] = struct{}{}
}

func (s *Set[T]) Contains(item T) bool {
    _, ok := s.items[item]
    return ok
}
```

### Production Generics — Result Type

```go
// Result[T] — explicit error handling without panics
type Result[T any] struct {
    value T
    err   error
}

func OK[T any](value T) Result[T]      { return Result[T]{value: value} }
func Err[T any](err error) Result[T]   { return Result[T]{err: err} }

func (r Result[T]) Unwrap() (T, error) { return r.value, r.err }
func (r Result[T]) IsOK() bool          { return r.err == nil }

// Use case: when you need to pass results through channels
resultCh := make(chan Result[*User], 1)
go func() {
    user, err := fetchUser(ctx, id)
    if err != nil {
        resultCh <- Err[*User](err)
        return
    }
    resultCh <- OK(user)
}()
```

---

## Memory Optimization

### Struct Field Ordering (Alignment)

```go
// ❌ Padded struct (wastes memory)
type BadStruct struct {
    flag  bool    // 1 byte + 7 bytes padding
    count int64   // 8 bytes
    name  bool    // 1 byte + 7 bytes padding
    // Total: 24 bytes
}

// ✅ Aligned struct (no waste)
type GoodStruct struct {
    count int64   // 8 bytes
    flag  bool    // 1 byte
    name  bool    // 1 byte + 6 bytes padding
    // Total: 16 bytes (33% smaller!)
}

// Rule: Largest fields first, smallest last
// At 50M users × millions of objects = significant savings
```

### Avoid Unnecessary Allocations

```go
// ❌ String concatenation in loop = many allocations
func buildQuery(ids []string) string {
    query := ""
    for _, id := range ids {
        query += "'" + id + "',"  // new allocation each iteration
    }
    return query
}

// ✅ strings.Builder = single allocation
func buildQuery(ids []string) string {
    var sb strings.Builder
    sb.Grow(len(ids) * 10)  // pre-allocate approximate size
    for i, id := range ids {
        if i > 0 {
            sb.WriteByte(',')
        }
        sb.WriteByte('\'')
        sb.WriteString(id)
        sb.WriteByte('\'')
    }
    return sb.String()
}

// ❌ Slice appending without pre-allocation
func processAll(items []Item) []Result {
    var results []Result
    for _, item := range items {
        results = append(results, process(item))
        // repeated reallocations: 0→1→2→4→8→16...
    }
    return results
}

// ✅ Pre-allocate
func processAll(items []Item) []Result {
    results := make([]Result, 0, len(items))  // capacity known upfront
    for _, item := range items {
        results = append(results, process(item))
    }
    return results
}
```

---

## singleflight — Deduplicating Concurrent Requests

```go
import "golang.org/x/sync/singleflight"

var sfGroup singleflight.Group

func GetUser(ctx context.Context, userID string) (*User, error) {
    // 1000 concurrent requests for same userID?
    // Only ONE DB call happens. Others wait and get same result.
    result, err, shared := sfGroup.Do("user:"+userID, func() (interface{}, error) {
        return db.GetUser(ctx, userID)
    })
    
    if shared {
        metrics.CacheSingleflightHit.Inc()
    }
    
    if err != nil {
        return nil, err
    }
    return result.(*User), nil
}

// Use case: cache stampede prevention, expensive DB queries
// Goes perfectly with: Redis cache-aside pattern
// 1000 concurrent misses → 1 DB call → all 1000 get same result
```

---

## errgroup — Concurrent Operations with Error Handling

```go
import "golang.org/x/sync/errgroup"

func GetUserDashboard(ctx context.Context, userID string) (*Dashboard, error) {
    g, ctx := errgroup.WithContext(ctx)
    
    var user *User
    var orders []Order
    var notifications []Notification
    
    // Run all 3 concurrently
    g.Go(func() error {
        var err error
        user, err = userService.Get(ctx, userID)
        return err
    })
    
    g.Go(func() error {
        var err error
        orders, err = orderService.GetRecent(ctx, userID, 10)
        return err
    })
    
    g.Go(func() error {
        var err error
        notifications, err = notifService.GetUnread(ctx, userID)
        return err
    })
    
    // Wait for all. If ANY fails, ctx is cancelled → others stop.
    if err := g.Wait(); err != nil {
        return nil, err
    }
    
    return &Dashboard{User: user, Orders: orders, Notifications: notifications}, nil
}
// Serial: 3 × 50ms = 150ms
// Parallel: max(50ms, 50ms, 50ms) = 50ms ← 3x faster
```
