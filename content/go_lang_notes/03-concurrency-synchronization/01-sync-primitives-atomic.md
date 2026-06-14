# 01 — Concurrency Primitives & Synchronization
> sync package, atomic operations, aur lock-free data structures

---

## Concurrency vs Parallelism

```
Concurrency = DEALING with multiple things at once (structure)
Parallelism = DOING multiple things at once (execution)

// Go gives you concurrency primitives
// Runtime gives you parallelism (via GOMAXPROCS)
```

---

## sync.Mutex — Basic Lock

```go
import "sync"

type SafeCounter struct {
    mu sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()        // lock acquire
    defer c.mu.Unlock() // ALWAYS defer Unlock!
    c.count++
}

func (c *SafeCounter) Get() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}
```

### Mutex Internals
```
Mutex states:
  - Unlocked  (state = 0)
  - Locked    (state bit 0 = 1)
  - Woken     (state bit 1 = 1) 
  - Starving  (state bit 2 = 1)

Two modes:
┌─────────────┐
│  Normal Mode │ → Goroutines spin briefly, then queue
│              │   New arrivals can "steal" lock (fast path)
└──────┬──────┘
       │ (if waiter waited > 1ms)
       ▼
┌─────────────┐
│ Starvation  │ → FIFO strictly enforced
│    Mode     │   No spinning, no stealing
│              │   Ensures fairness for long waiters
└─────────────┘
```

### Common Mistakes
```go
// ❌ WRONG: Copying a Mutex
func bad(mu sync.Mutex) {  // VALUE copy! Original not locked!
    mu.Lock()  // locks the COPY
}

// ✅ RIGHT: Pass by pointer
func good(mu *sync.Mutex) {
    mu.Lock()
    defer mu.Unlock()
}

// ❌ WRONG: Unlock without Lock
var mu sync.Mutex
mu.Unlock()  // PANIC: sync: unlock of unlocked mutex

// ❌ WRONG: Recursive locking (Go mutex is NOT reentrant)
mu.Lock()
mu.Lock()  // DEADLOCK! Same goroutine mein double lock
```

---

## sync.RWMutex — Reader-Writer Lock

```go
type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()         // Multiple readers allowed!
    defer c.mu.RUnlock()
    v, ok := c.data[key]
    return v, ok
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()          // Exclusive write lock
    defer c.mu.Unlock()
    c.data[key] = value
}
```

### When to use RWMutex vs Mutex?
```
Reads >>> Writes  → RWMutex (readers don't block each other)
Reads ≈ Writes    → Mutex (simpler, less overhead)
Very hot path     → Consider sync.Map or atomic instead
```

---

## sync.WaitGroup — Goroutine Coordination

```go
var wg sync.WaitGroup

for i := 0; i < 5; i++ {
    wg.Add(1)  // counter++ BEFORE goroutine start!
    go func(id int) {
        defer wg.Done()  // counter-- when done
        fmt.Printf("Worker %d done\n", id)
    }(i)
}

wg.Wait()  // Block until counter == 0
fmt.Println("All workers finished!")
```

### Common Mistakes
```go
// ❌ WRONG: Add inside goroutine
go func() {
    wg.Add(1)  // Race! Main might call Wait() before Add()
    // ...
    wg.Done()
}()

// ❌ WRONG: Negative counter
wg.Done()  // PANIC if counter goes below 0

// ❌ WRONG: Reusing WaitGroup before Wait returns
wg.Wait()
wg.Add(1)  // OK only if previous Wait() fully returned
```

---

## sync.Once — One-time Initialization

```go
var (
    instance *Database
    once     sync.Once
)

func GetDB() *Database {
    once.Do(func() {
        // Ye sirf EK BAAR chalega, chahe 100 goroutines call karein
        instance = connectToDatabase()
    })
    return instance  // subsequent calls → instant return
}
```

### Variants (Go 1.21+)
```go
// OnceFunc — wraps a function
initDB := sync.OnceFunc(func() {
    db = connectToDatabase()
})
initDB()  // first call: connects
initDB()  // subsequent: no-op

// OnceValue — returns a value
getDB := sync.OnceValue(func() *Database {
    return connectToDatabase()
})
db := getDB()  // first: connects and returns
db2 := getDB() // subsequent: returns cached value

// OnceValues — returns value + error
getDB2 := sync.OnceValues(func() (*Database, error) {
    return connectToDatabase()
})
db, err := getDB2()
```

---

## sync.Cond — Condition Variable

```go
type Queue struct {
    mu    sync.Mutex
    cond  *sync.Cond
    items []int
}

func NewQueue() *Queue {
    q := &Queue{}
    q.cond = sync.NewCond(&q.mu)
    return q
}

func (q *Queue) Push(item int) {
    q.mu.Lock()
    q.items = append(q.items, item)
    q.mu.Unlock()
    q.cond.Signal()  // Wake ONE waiting goroutine
}

func (q *Queue) Pop() int {
    q.mu.Lock()
    defer q.mu.Unlock()
    
    for len(q.items) == 0 {
        q.cond.Wait()  // Release lock + sleep + re-acquire lock
    }
    
    item := q.items[0]
    q.items = q.items[1:]
    return item
}

// q.cond.Signal()    → wake ONE waiter
// q.cond.Broadcast() → wake ALL waiters
```

---

## sync.Map — Concurrent Map

```go
var m sync.Map

// Store
m.Store("key1", "value1")

// Load
value, ok := m.Load("key1")
if ok {
    fmt.Println(value.(string))
}

// LoadOrStore — get existing OR store new
actual, loaded := m.LoadOrStore("key2", "default")
// loaded = true → key existed, actual = existing value
// loaded = false → key didn't exist, stored "default"

// Delete
m.Delete("key1")

// Range — iterate over all entries
m.Range(func(key, value any) bool {
    fmt.Printf("%v: %v\n", key, value)
    return true  // continue iteration
})

// LoadAndDelete (Go 1.15+)
value, loaded = m.LoadAndDelete("key2")

// Swap (Go 1.20+)
previous, loaded := m.Swap("key1", "new-value")

// CompareAndSwap (Go 1.20+)
swapped := m.CompareAndSwap("key1", "old-value", "new-value")

// CompareAndDelete (Go 1.20+)
deleted := m.CompareAndDelete("key1", "expected-value")
```

### When to use sync.Map?
```
✅ Use sync.Map when:
  - Keys are stable (written once, read many times)
  - Multiple goroutines read/write disjoint sets of keys
  - You need range iteration to be lock-free

❌ Don't use sync.Map when:
  - You need all operations to be consistent
  - Simple Mutex + map[K]V works fine
  - You know all keys upfront
```

---

## sync.Pool — Object Reuse

```go
var bufPool = sync.Pool{
    New: func() any {
        return new(bytes.Buffer)
    },
}

func processRequest() {
    buf := bufPool.Get().(*bytes.Buffer)  // Get from pool (or create new)
    defer func() {
        buf.Reset()
        bufPool.Put(buf)  // Return to pool for reuse
    }()
    
    buf.WriteString("processing...")
    // ... use buf ...
}
```

### Pool Internals
```
Each P has a local pool:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    P0 Pool   │  │    P1 Pool   │  │    P2 Pool   │
│ private: buf │  │ private: buf │  │ private: nil │
│ shared: [...]│  │ shared: [...]│  │ shared: [...]│
└──────────────┘  └──────────────┘  └──────────────┘

Get() flow:
1. Check P's private → fast (no locking)
2. Pop from P's shared queue → lock-free dequeue
3. Steal from other P's shared queue → lock-free
4. Call New() function → slowest path

// Pool is cleared every GC cycle!
// Don't use for things that MUST persist
```

---

## sync/atomic — Atomic Operations

### Type-Safe Wrappers (Go 1.19+)
```go
import "sync/atomic"

// Atomic integers
var counter atomic.Int64
counter.Store(0)
counter.Add(1)            // atomic increment
current := counter.Load() // atomic read
counter.CompareAndSwap(1, 2) // CAS

// Atomic bool
var ready atomic.Bool
ready.Store(true)
if ready.Load() {
    fmt.Println("Ready!")
}

// Atomic pointer
var config atomic.Pointer[Config]
config.Store(&Config{Port: 8080})
cfg := config.Load()

// Atomic value (any type, but must be consistent)
var value atomic.Value
value.Store("hello")
s := value.Load().(string)
```

### Old-style Atomic Functions
```go
// Still available, but type-safe wrappers preferred
var x int64
atomic.AddInt64(&x, 1)
atomic.LoadInt64(&x)
atomic.StoreInt64(&x, 42)
atomic.CompareAndSwapInt64(&x, 42, 100)
atomic.SwapInt64(&x, 200)
```

### Atomic Operations Comparison

| Operation | Purpose | Example |
|-----------|---------|---------|
| `Load` | Read atomically | `v := counter.Load()` |
| `Store` | Write atomically | `counter.Store(42)` |
| `Add` | Increment/decrement | `counter.Add(1)` |
| `Swap` | Set new, get old | `old := counter.Swap(0)` |
| `CompareAndSwap` | Conditional update | `counter.CompareAndSwap(old, new)` |
| `And` | Bitwise AND | `flags.And(^mask)` |
| `Or` | Bitwise OR | `flags.Or(mask)` |

### Common Pattern: Atomic Config Reload
```go
type ServerConfig struct {
    Port    int
    Timeout time.Duration
}

var currentConfig atomic.Pointer[ServerConfig]

func init() {
    currentConfig.Store(&ServerConfig{Port: 8080, Timeout: 30 * time.Second})
}

// Reader (hot path — no lock!)
func handleRequest() {
    cfg := currentConfig.Load()
    // use cfg.Port, cfg.Timeout
}

// Writer (cold path)
func reloadConfig() {
    newCfg := loadConfigFromFile()
    currentConfig.Store(newCfg)
    // All new readers immediately see new config
    // Old readers still using old config (safe, immutable)
}
```

---

## Lock-Free Data Structures (Internal)

### poolDequeue — Single-Producer, Multi-Consumer Queue
```
// Used internally by sync.Pool
// Ring buffer with atomic head/tail
// Owner (producer): pushHead, popHead  — no locking!
// Stealers (consumers): popTail — lock-free CAS

┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │  ← ring buffer
└───┴───┴───┴───┴───┴───┴───┴───┘
  ↑ tail                head ↑

// Owner pushes at head, pops at head (stack-like)
// Stealers pop at tail (queue-like)
```

### poolChain — Dynamically Growing Queue
```
// Linked list of poolDequeue
// When current dequeue is full → allocate new (2x size)

poolDequeue(8) → poolDequeue(16) → poolDequeue(32) → ...
     ↑ tail                              head ↑
```

---

## Semaphore (Runtime Internal)

```go
// Used by Mutex, RWMutex, WaitGroup, Cond internally
// Not exported to users!

// runtime_Semacquire(s *uint32)  → wait/block
// runtime_Semrelease(s *uint32)  → signal/wake

// Ye treap (tree + heap) data structure use karta hai
// Goroutines ko park/unpark karta hai efficiently
```

---

## Best Practices — Concurrency

```go
// 1. Prefer channels for communication
ch := make(chan Result, 10)
go func() { ch <- doWork() }()
result := <-ch

// 2. Prefer sync primitives for shared state
var mu sync.Mutex
mu.Lock()
defer mu.Unlock()

// 3. Use atomic for simple counters/flags
var counter atomic.Int64
counter.Add(1)

// 4. Use sync.Pool for high-allocation hot paths
buf := pool.Get().(*Buffer)
defer pool.Put(buf)

// 5. Use sync.Once for lazy initialization
once.Do(initialize)

// 6. Detect races in tests
// go test -race ./...

// 7. Don't mix channels and mutexes for same data
// Pick ONE approach and stick with it
```

---

## Performance Comparison

```
Operation           Time (approx)
─────────────────────────────────
mutex lock/unlock       ~25ns
rwmutex rlock/runlock   ~25ns  (uncontended)
atomic load             ~1ns
atomic add              ~5ns
atomic CAS              ~5ns
channel send/recv       ~50-100ns
sync.Pool get/put       ~10-20ns
```
