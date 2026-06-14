# 03 — Type System, Reflection ABI & Profiling
> Types runtime pe kaise represent hoti hain + Profiling tools

---

## Type System — Internal Representation

Har Go type runtime pe ek `abi.Type` struct se represent hoti hai:

```go
// src/internal/abi/type.go
type Type struct {
    Size_       uintptr   // type ka size in bytes
    PtrBytes    uintptr   // prefix bytes with pointers (for GC)
    Hash        uint32    // type hash (for maps, type switches)
    TFlag       TFlag     // extra type info flags
    Align_      uint8     // alignment
    FieldAlign_ uint8     // field alignment
    Kind_       Kind      // bool, int, string, struct, etc.
    Equal       func(unsafe.Pointer, unsafe.Pointer) bool
    GCData      *byte     // GC pointer bitmap
    Str         NameOff   // string representation
    PtrToThis   TypeOff   // pointer to this type
}
```

### Type Kind Enum
```go
const (
    Bool Kind = 1 + iota
    Int
    Int8
    Int16
    Int32
    Int64
    Uint
    Uint8
    Uint16
    Uint32
    Uint64
    Uintptr
    Float32
    Float64
    Complex64
    Complex128
    Array
    Chan
    Func
    Interface
    Map
    Pointer
    Slice
    String
    Struct
    UnsafePointer
)
```

---

## Specialized Type Structs

```go
// Array
type ArrayType struct {
    Type
    Elem  *Type   // element type
    Slice *Type   // slice type for this array
    Len   uintptr // length
}

// Channel
type ChanType struct {
    Type
    Elem *Type  // element type
    Dir  ChanDir // SendDir, RecvDir, BothDir
}

// Map
type MapType struct {
    Type
    Key    *Type
    Elem   *Type
    Bucket *Type  // internal bucket type
    Hasher func(unsafe.Pointer, uintptr) uintptr
    // ... flags for GC, sizing
}

// Struct
type StructType struct {
    Type
    PkgPath Name
    Fields  []StructField
}

// Func
type FuncType struct {
    Type
    InCount  uint16   // parameter count
    OutCount uint16   // result count (top bit = variadic flag)
}
```

---

## Interface Representation

### Empty Interface (`interface{}` / `any`)
```go
// src/internal/abi/iface.go
type EmptyInterface struct {
    Type *Type          // type descriptor
    Data unsafe.Pointer // actual value
}

// Example:
var x interface{} = 42
// Internally:
// EmptyInterface{
//     Type: *intType,    // points to int's Type descriptor
//     Data: &42,         // points to the value
// }
```

### Non-Empty Interface
```go
type NonEmptyInterface struct {
    Itab *ITab           // interface table
    Data unsafe.Pointer  // actual value
}

type ITab struct {
    Inter *InterfaceType  // interface type descriptor
    Type  *Type           // concrete type descriptor
    Hash  uint32          // copy of Type.Hash (fast type switch)
    Fun   [1]uintptr      // method table (variable size)
}
```

### Interface Method Dispatch — Visual
```
io.Writer interface
    ↓
┌──────────────────────────┐
│          ITab            │
├──────────────────────────┤
│ Inter → *InterfaceType   │ → io.Writer descriptor
│ Type  → *Type            │ → *os.File descriptor
│ Hash  → uint32           │ → fast comparison
│ Fun[0]→ (*os.File).Write │ → direct function pointer!
└──────────────────────────┘

// Type assertion:
// var w io.Writer = f
// f2 := w.(*os.File)  → checks ITab.Type == *os.File type
```

---

## Interface/Type Switch Caching

```go
// src/internal/abi/switch.go
type InterfaceSwitchCache struct {
    Mask    uintptr             // hash mask
    Entries [1]InterfaceSwitchCacheEntry
}

// Type switch results cached for performance:
switch v := x.(type) {
case int:       // first hit → slow path (lookup)
    // ...       // subsequent → cache hit (fast!)
case string:
    // ...
}
```

---

## CPU Feature Detection

```go
// src/internal/cpu/cpu.go

// Program startup pe CPU features detect hoti hain:
// X86:  SSE2, SSE3, SSSE3, SSE41, SSE42, AVX, AVX2, BMI1, BMI2, ERMS, ADX, ...
// ARM64: AES, PMULL, SHA1, SHA2, SHA512, CRC32, ATOMICS, ASIMD, ...
// PPC64: DARN, SCV, POWER8, POWER9, ...

// Usage in Go runtime:
// - Crypto packages use AES-NI instructions if available
// - String operations use SIMD if available
// - Hash functions use hardware acceleration

// Override with GODEBUG:
GODEBUG=cpu.avx2=off ./myapp     // disable AVX2
GODEBUG=cpu.all=off ./myapp      // disable ALL CPU features

// Cache Line Padding — prevent false sharing
type CacheLinePad struct {
    _ [CacheLinePadSize]byte  // typically 64 bytes
}
// Used between frequently accessed fields in concurrent structs
```

---

## Runtime Profiling — pprof

### CPU Profiling
```go
import "runtime/pprof"

// File-based CPU profile
f, _ := os.Create("cpu.prof")
pprof.StartCPUProfile(f)
defer pprof.StopCPUProfile()

// ... your code runs here ...
```

### Heap Profiling
```go
// Snapshot of memory allocation
f, _ := os.Create("heap.prof")
pprof.WriteHeapProfile(f)
f.Close()
```

### HTTP-based Profiling (Production-ready)
```go
import _ "net/http/pprof"

go func() {
    http.ListenAndServe("localhost:6060", nil)
}()

// Now access:
// http://localhost:6060/debug/pprof/
// http://localhost:6060/debug/pprof/heap
// http://localhost:6060/debug/pprof/goroutine
// http://localhost:6060/debug/pprof/profile?seconds=30
```

### Analyze with `go tool pprof`
```bash
# CPU profile analyze karo
go tool pprof cpu.prof
# (pprof) top          → top CPU consumers
# (pprof) web          → browser mein graph
# (pprof) list funcName → source code annotated

# Live server se profile lo
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Heap profile
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine profile
go tool pprof http://localhost:6060/debug/pprof/goroutine
```

### Profile Types Summary

| Profile | What it measures | When to use |
|---------|-----------------|-------------|
| CPU | Function CPU time | Slow computation |
| Heap | Memory allocations | High memory usage |
| Goroutine | Active goroutines | Goroutine leaks |
| Block | Blocking on sync primitives | Contention issues |
| Mutex | Mutex contention | Lock bottlenecks |
| Threadcreate | OS thread creation | Thread leaks |

### Labeling Profiles
```go
import "runtime/pprof"

// Labels add context to profiles
ctx := pprof.WithLabels(context.Background(), pprof.Labels(
    "endpoint", "/api/users",
    "user_id", "12345",
))
pprof.SetGoroutineLabels(ctx)

// Now CPU profile will show which endpoint is slow!
```

---

## Runtime Tracing — go tool trace

```go
import "runtime/trace"

// File-based trace
f, _ := os.Create("trace.out")
trace.Start(f)
defer trace.Stop()
```

```bash
# Trace analyze karo (opens in browser!)
go tool trace trace.out
```

### User-Defined Annotations
```go
import "runtime/trace"

func handleRequest(ctx context.Context) {
    // Task = high-level operation (spans goroutines)
    ctx, task := trace.NewTask(ctx, "handleRequest")
    defer task.End()
    
    // Region = specific time interval in ONE goroutine
    trace.WithRegion(ctx, "database-query", func() {
        // ... DB query ...
    })
    
    // Log message in trace
    trace.Log(ctx, "user", "processed request for user 123")
}
```

### Flight Recorder (Go 1.23+)
```go
import "runtime/trace"

// Continuous rolling trace buffer
fr := &trace.FlightRecorder{}
fr.Start()

// ... program runs ...

// On error, capture recent trace data
if err != nil {
    f, _ := os.Create("crash-trace.out")
    fr.WriteTo(f)
    f.Close()
}
```

---

## Race Detector

```bash
# Build with race detection
go build -race .
go test -race ./...
go run -race main.go
```

```go
// Race detector catch karega:
var counter int

go func() { counter++ }()  // goroutine 1 writes
go func() { counter++ }()  // goroutine 2 writes — RACE!

// Output:
// WARNING: DATA RACE
// Write at 0x00c0000a4010 by goroutine 7:
//   main.main.func1()
// Previous write at 0x00c0000a4010 by goroutine 8:
//   main.main.func2()
```

> **Note:** Race detector ~10x slower, 5-10x more memory. Use in testing, NOT production!

---

## Sanitizer Integration

```bash
# AddressSanitizer (use-after-free, buffer overflow)
CGO_ENABLED=1 go build -asan .

# MemorySanitizer (uninitialized memory reads)
CGO_ENABLED=1 go build -msan .

# Ye sirf CGO code ke saath kaam karte hain
# Pure Go code ke liye race detector use karo
```

---

## runtime/debug Package

```go
import "runtime/debug"

// Stack trace
debug.PrintStack()  // print to stderr

// GC control
debug.SetGCPercent(50)       // GOGC=50
debug.SetMemoryLimit(1<<30)  // 1 GiB limit
debug.FreeOSMemory()         // return memory to OS

// GC stats
var stats debug.GCStats
debug.ReadGCStats(&stats)
fmt.Println("Last GC:", stats.LastGC)
fmt.Println("Num GC:", stats.NumGC)
fmt.Println("Pause Total:", stats.PauseTotal)

// Build info
info, ok := debug.ReadBuildInfo()
if ok {
    fmt.Println("Go version:", info.GoVersion)
    fmt.Println("Module:", info.Main.Path)
    for _, dep := range info.Deps {
        fmt.Printf("  %s@%s\n", dep.Path, dep.Version)
    }
    for _, s := range info.Settings {
        fmt.Printf("  %s=%s\n", s.Key, s.Value)
    }
}

// Crash output to file
debug.SetCrashOutput(f, debug.CrashOptions{})

// Max stack size per goroutine (default: 1 GB)
debug.SetMaxStack(512 << 20)  // 512 MB

// Max OS threads (default: 10000)
debug.SetMaxThreads(5000)

// Panic on memory fault
debug.SetPanicOnFault(true)  // useful with mmap
```

---

## Experimental: Secret Management (Go tip)

```go
// GOEXPERIMENT=runtimesecret
import "runtime/secret"

// Sensitive data auto-erase after use
secret.Do(func() {
    key := loadEncryptionKey()
    encrypt(data, key)
    // After secret.Do returns:
    // - All stack/registers zeroed
    // - All heap allocations from inside zeroed
    // - key is GONE from memory!
})

// Check if currently in secret mode
if secret.Enabled() {
    // sensitive code path
}
```
