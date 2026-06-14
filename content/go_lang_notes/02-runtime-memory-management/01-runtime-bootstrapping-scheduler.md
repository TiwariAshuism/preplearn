# 01 — Go Runtime Bootstrapping & Scheduler
> Go program kaise start hota hai aur goroutines kaise manage hoti hain

---

## Runtime Kya Hai?

Go runtime = **invisible engine** jo har Go program ke saath compiled hota hai. Ye manage karta hai:

```
┌──────────────────────────────────┐
│         Go Runtime               │
├──────────────────────────────────┤
│  • Goroutine Scheduling          │
│  • Memory Allocation + GC        │
│  • Stack Management              │
│  • OS Thread Management          │
│  • Signal Handling               │
│  • Network Poller                │
│  • Channel Operations            │
│  • Panic/Recover                 │
└──────────────────────────────────┘
```

Source: `src/runtime/` directory

---

## GMP Model — Core Scheduler Architecture

Go scheduler **3 entities** pe based hai:

```
┌─────┐     ┌─────┐     ┌─────┐
│  G  │     │  M  │     │  P  │
│     │     │     │     │     │
│Goro-│     │OS   │     │Proc-│
│utine│     │Thread│    │essor│
└─────┘     └─────┘     └─────┘
```

### G (Goroutine)
```go
// Har goroutine ek `g` struct hai
type g struct {
    stack       stack   // goroutine ka stack
    stackguard0 uintptr // stack overflow check
    m           *m      // current M jo run kar raha hai
    sched       gobuf   // scheduling state (SP, PC, etc.)
    atomicstatus uint32 // goroutine status
    goid        int64   // goroutine ID
    // ... bahut aur fields
}

// Goroutine states:
// _Gidle     → newly allocated, not yet initialized
// _Grunnable → run queue mein, ready to run
// _Grunning  → currently executing on an M
// _Gsyscall  → system call mein blocked
// _Gwaiting  → channel/mutex pe waiting
// _Gdead     → finished, can be reused
```

### M (Machine = OS Thread)
```go
type m struct {
    g0          *g      // scheduler stack goroutine
    curg        *g      // currently running goroutine
    p           *p      // attached P (nil if not executing Go code)
    nextp       *p      // next P to associate with
    spinning    bool    // looking for work?
    // ...
}
```

### P (Processor)
```go
type p struct {
    id          int32
    status      uint32  // _Pidle, _Prunning, _Psyscall, _Pgcstop, _Pdead
    runqhead    uint32  // local run queue head
    runqtail    uint32  // local run queue tail
    runq        [256]guintptr // local run queue (fixed size!)
    runnext     guintptr      // next G to run (priority)
    mcache      *mcache       // per-P memory cache
    // ...
}
```

---

## Scheduling Flow

```
┌────────────────────────────────────────────────┐
│               Global Run Queue                  │
│  [G4] [G5] [G6] [G7] ...                       │
└─────────────────┬──────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌────────┐  ┌────────┐  ┌────────┐
│   P0   │  │   P1   │  │   P2   │
│Local Q │  │Local Q │  │Local Q │
│[G1][G2]│  │[G3]    │  │        │
└───┬────┘  └───┬────┘  └───┬────┘
    │           │           │
    ▼           ▼           ▼
┌────────┐  ┌────────┐  ┌────────┐
│   M0   │  │   M1   │  │   M2   │
│(Thread)│  │(Thread)│  │(Thread)│
└────────┘  └────────┘  └────────┘
```

### Schedule Loop (simplified):
```
schedule() {
    1. Check local run queue → got G? Run it!
    2. Check global run queue → got G? Run it!
    3. Check network poller → got G? Run it!
    4. Try WORK STEALING from other P's queue → got G? Run it!
    5. Nothing found → park the M (sleep)
}
```

### GOMAXPROCS
```go
import "runtime"

// P ki count set karo (default = CPU cores)
runtime.GOMAXPROCS(4)  // 4 Ps → max 4 goroutines parallel

// Current value check karo
n := runtime.GOMAXPROCS(0)  // 0 = don't change, just return current
fmt.Println("GOMAXPROCS:", n)
```

---

## Work Stealing

```
P0: [G1, G2, G3, G4]     P1: []  (empty!)
              │                    │
              │    STEAL!          │
              │◄───────────────────│
              │                    │
P0: [G1, G2]              P1: [G3, G4]  (half le liya!)
```

- Jab ek P idle ho jaata hai, dusre P ki queue se **half goroutines chura** leta hai
- Ye ensures load balancing across all CPUs

---

## Stack Management

### Growable Stacks
```go
// Goroutine stack initially CHHOTA hota hai (~2-8 KB)
// Jab stack full hone wala hai → runtime BIGGER stack allocate karta hai

// Flow:
// 1. Function call pe stack space check
// 2. Agar space kam hai → morestack() call
// 3. New bigger stack allocate
// 4. Old stack copy to new stack
// 5. Old stack free

// Stack sizes:
// Initial:   2 KB - 8 KB (platform dependent)
// Maximum:   1 GB (default, configurable)
```

### Stack Types
```
┌────────────────────────────────┐
│  User Stack (goroutine)        │  ← Go code runs here
├────────────────────────────────┤
│  System Stack (g0)             │  ← Runtime code (scheduler, GC)
├────────────────────────────────┤
│  Signal Stack (gsignal)        │  ← Signal handlers
└────────────────────────────────┘
```

### //go:nosplit Directive
```go
//go:nosplit
func criticalFunc() {
    // Ye function stack growth trigger NAHI karega
    // Runtime code mein use hota hai
    // Stack overflow ho sakta hai agar stack full hai!
}
```

---

## Bootstrapping — Program Startup Sequence

```
1. OS loads binary
   ↓
2. _rt0_amd64_linux (assembly entry point)
   ↓
3. runtime.rt0_go()
   ↓
4. Initialize TLS (Thread Local Storage)
   ↓
5. runtime.osinit() → detect CPU count
   ↓
6. runtime.schedinit() → initialize scheduler, memory, GC
   ↓
7. runtime.newproc(runtime.main) → create main goroutine
   ↓
8. runtime.mstart() → start M0
   ↓
9. runtime.main()
   ├── init runtime packages
   ├── start GC goroutine
   ├── run init() functions (all packages)
   └── call main.main() ← YOUR CODE STARTS HERE!
```

---

## Error Handling — Runtime Level

### Panic vs Throw vs Fatal

| Type | Recoverable? | Example |
|------|-------------|---------|
| `panic()` | YES (with `recover()`) | `panic("oops")` |
| `throw()` | NO — process terminates | Internal runtime errors |
| `fatal()` | NO — process terminates | Data races detected |

```go
// Recoverable panic
func safeDivide(a, b int) (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered: %v", r)
        }
    }()
    return a / b, nil
}

// Runtime throws (you can't catch these):
// - concurrent map read/write
// - stack overflow
// - out of memory
```

---

## Synchronization Primitives (Runtime Level)

Runtime apne internal primitives use karta hai (ye `sync` package se alag hain!):

| Primitive | Purpose |
|-----------|---------|
| `mutex` | Mutual exclusion (runtime internal) |
| `rwmutex` | Read-write lock (runtime internal) |
| `note` | One-shot notification (sleep/wakeup) |
| `gopark()` | Park goroutine (make it wait) |
| `goready()` | Unpark goroutine (wake it up) |

```go
// gopark example (internal use):
// Channel pe receive karte waqt goroutine park hoti hai
// Jab sender data bhejta hai → goready() se unpark hoti hai
```

---

## User Arenas (Experimental)

```go
// Manual memory management for specific workloads
// src/runtime/arena.go

// Benefits:
// - Bulk allocation and freeing
// - Reduced GC overhead
// - Better data locality

// Flow:
// 1. arena_newArena() → create arena
// 2. arena_arena_New() → allocate in arena
// 3. arena_arena_Free() → free entire arena at once

// Safety: freed memory faults on access (no use-after-free)
```

---

## Hashing & Equality — Internal

```go
// src/runtime/alg.go

// Runtime needs hash functions for:
// - Map implementations
// - Garbage collection
// - Interface comparisons

// Hash functions exist for:
// - Primitive types (int, float, etc.)
// - Strings
// - Interfaces
// - Complex types (struct, array)
```

---

## Key Runtime Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `GOMAXPROCS` | Number of P's | CPU cores |
| `GOGC` | GC target percentage | 100 |
| `GOMEMLIMIT` | Soft memory limit | unlimited |
| `GODEBUG` | Runtime debug settings | "" |
| `GOTRACEBACK` | Stack trace detail on crash | "single" |

```bash
# Examples:
GOMAXPROCS=4 ./myapp
GOGC=50 ./myapp           # More aggressive GC
GOMEMLIMIT=1GiB ./myapp   # Soft memory limit
GODEBUG=gctrace=1 ./myapp # GC trace output
GOTRACEBACK=all ./myapp    # Full stack traces on crash
```
