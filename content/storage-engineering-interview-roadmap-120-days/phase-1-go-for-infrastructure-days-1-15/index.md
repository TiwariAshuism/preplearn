---
source: notion
title: "Phase 1 — Go for Infrastructure (Days 1–15)"
slug: "phase-1-go-for-infrastructure-days-1-15"
notionId: "380da883-bddd-8150-8436-e88907c83001"
notionRootId: "380da883bddd81e1abc7c118d4e018d9"
parent: "storage-engineering-interview-roadmap-120-days"
children: []
order: 7
icon: "🐹"
cover: null
---
> **Core insight:** Go is the dominant language for cloud infrastructure. Kubernetes, Docker, containerd, etcd, Prometheus, MinIO, and most CSI drivers are written in Go. Mastering Go concurrency patterns and performance profiling is not optional for storage engineering roles — it is the primary signal these companies test.

---


## 📚 Day 1–3 — Go fundamentals refresher


### Day 1: Types, interfaces, and error handling


```go
// Error handling in Go is explicit. No exceptions.
// Storage code must handle errors at every I/O boundary.
func readBlock(path string, offset int64, size int) ([]byte, error) {
    f, err := os.Open(path)
    if err != nil {
        return nil, fmt.Errorf("readBlock: open %s: %w", path, err)
    }
    defer f.Close()

    buf := make([]byte, size)
    n, err := f.ReadAt(buf, offset)
    if err != nil && err != io.EOF {
        return nil, fmt.Errorf("readBlock: read at %d: %w", offset, err)
    }
    return buf[:n], nil
}

// Interfaces: the key to testable infrastructure code
type BlockStore interface {
    Read(blockID uint64) ([]byte, error)
    Write(blockID uint64, data []byte) error
    Delete(blockID uint64) error
    Flush() error
}
```


### Day 2: Structs, embedding, and value vs pointer semantics


```go
// Embedding: prefer composition over inheritance
type BaseStore struct {
    mu   sync.RWMutex
    path string
}

func (b *BaseStore) Lock()   { b.mu.Lock() }
func (b *BaseStore) Unlock() { b.mu.Unlock() }

type CachedBlockStore struct {
    BaseStore                     // embedded: inherits Lock/Unlock
    cache map[uint64][]byte
    backend BlockStore
}

// Rule: if a method modifies state, use pointer receiver
// If it only reads, value receiver works but pointer is safer for large structs
func (c *CachedBlockStore) Read(blockID uint64) ([]byte, error) {
    c.mu.RLock()
    if data, ok := c.cache[blockID]; ok {
        c.mu.RUnlock()
        return data, nil
    }
    c.mu.RUnlock()
    return c.backend.Read(blockID)
}
```


### Day 3: Slices, maps, and memory layout


```go
// Slices are a 3-word struct: pointer, length, capacity
// Critical for storage: understanding buffer reuse patterns

// WRONG: creates a new allocation per chunk (terrible for high-throughput storage)
for i := 0; i < numChunks; i++ {
    chunk := make([]byte, chunkSize)  // new allocation every iteration
    readChunk(chunk)
}

// RIGHT: pre-allocate a pool of buffers
var bufPool = sync.Pool{
    New: func() interface{} { return make([]byte, 64*1024) }, // 64KB buffers
}

for i := 0; i < numChunks; i++ {
    buf := bufPool.Get().([]byte)
    n, err := readChunk(buf)
    process(buf[:n])
    bufPool.Put(buf) // return to pool, no GC pressure
}

// Map internals: hash map with linked-list buckets
// Concurrent access requires sync.Map or RWMutex
// For storage metadata: prefer sync.Map for read-heavy access patterns
var blockIndex sync.Map
blockIndex.Store(blockID, &BlockMetadata{offset: 4096, size: 512})
if val, ok := blockIndex.Load(blockID); ok {
    meta := val.(*BlockMetadata)
}
```


---


## 📚 Day 4–8 — Go concurrency for storage systems


### Day 4: Goroutines, channels, select


```go
// Goroutines are extremely lightweight (~2KB stack, grows dynamically)
// A storage server can handle thousands of concurrent I/O requests

// Fan-out pattern: distribute work across workers
func parallelRead(paths []string, results chan<- ReadResult) {
    var wg sync.WaitGroup
    sem := make(chan struct{}, 16) // limit to 16 concurrent disk reads

    for _, path := range paths {
        wg.Add(1)
        go func(p string) {
            defer wg.Done()
            sem <- struct{}{}        // acquire semaphore
            defer func() { <-sem }() // release semaphore

            data, err := os.ReadFile(p)
            results <- ReadResult{Path: p, Data: data, Err: err}
        }(path)
    }

    go func() {
        wg.Wait()
        close(results)
    }()
}

// Select: multiplex channels with timeout
func readWithTimeout(store BlockStore, id uint64, timeout time.Duration) ([]byte, error) {
    ch := make(chan []byte, 1)
    errCh := make(chan error, 1)

    go func() {
        data, err := store.Read(id)
        if err != nil {
            errCh <- err
        } else {
            ch <- data
        }
    }()

    select {
    case data := <-ch:
        return data, nil
    case err := <-errCh:
        return nil, err
    case <-time.After(timeout):
        return nil, fmt.Errorf("read block %d: timeout after %v", id, timeout)
    }
}
```


### Day 5: Context and cancellation


```go
// Context is how you cancel in-flight storage operations
// Critical: when a client disconnects, all backend I/O for that request should stop

func (s *StorageServer) HandleWrite(ctx context.Context, req *WriteRequest) error {
    // Check context before each expensive operation
    if err := ctx.Err(); err != nil {
        return fmt.Errorf("write cancelled: %w", err)
    }

    // Pass context to all downstream calls
    if err := s.validateChecksum(ctx, req.Data); err != nil {
        return err
    }
    if err := s.writeToReplicas(ctx, req); err != nil {
        return err
    }
    return s.updateIndex(ctx, req.BlockID, req.Offset)
}

// Timeout for individual operations
func (s *StorageServer) writeToReplicas(ctx context.Context, req *WriteRequest) error {
    // Each replica write gets a per-operation timeout, nested in the request context
    replicaCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    var g errgroup.Group
    for _, replica := range s.replicas {
        r := replica
        g.Go(func() error {
            return r.Write(replicaCtx, req.BlockID, req.Data)
        })
    }
    return g.Wait()  // returns first error, cancels remaining via context
}
```


### Day 6: Pipelines for high-throughput processing


```go
// Pipeline pattern: connect stages with channels
// Each stage reads from input, transforms, writes to output
// Key pattern from the "1M transactions" blog post

func ingestPipeline(ctx context.Context, source <-chan []byte) <-chan WriteResult {
    // Stage 1: validate checksums
    validated := make(chan ValidatedBlock, 256)
    go func() {
        defer close(validated)
        for raw := range source {
            if b, err := validateBlock(raw); err == nil {
                select {
                case validated <- b:
                case <-ctx.Done():
                    return
                }
            }
        }
    }()

    // Stage 2: compress
    compressed := make(chan CompressedBlock, 256)
    go func() {
        defer close(compressed)
        for b := range validated {
            select {
            case compressed <- compress(b):
            case <-ctx.Done():
                return
            }
        }
    }()

    // Stage 3: write to disk (fan-out to multiple workers)
    results := make(chan WriteResult, 256)
    const numWriters = 8
    var wg sync.WaitGroup
    for i := 0; i < numWriters; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for b := range compressed {
                offset, err := writeToDisk(b)
                results <- WriteResult{BlockID: b.ID, Offset: offset, Err: err}
            }
        }()
    }
    go func() { wg.Wait(); close(results) }()

    return results
}
```


### Day 7: sync primitives for storage metadata


```go
// RWMutex: most storage metadata is read-heavy
// Write locks (writes/deletes) are rare; read locks (lookups) are frequent
type BlockIndex struct {
    mu     sync.RWMutex
    blocks map[uint64]*BlockMeta
}

func (idx *BlockIndex) Get(id uint64) (*BlockMeta, bool) {
    idx.mu.RLock()    // allows concurrent readers
    defer idx.mu.RUnlock()
    m, ok := idx.blocks[id]
    return m, ok
}

func (idx *BlockIndex) Set(id uint64, meta *BlockMeta) {
    idx.mu.Lock()     // exclusive write lock
    defer idx.mu.Unlock()
    idx.blocks[id] = meta
}

// atomic: for simple counters (IOPS counter, in-flight request count)
type Metrics struct {
    readOps    atomic.Int64
    writeOps   atomic.Int64
    bytesRead  atomic.Int64
    bytesWritten atomic.Int64
}

func (m *Metrics) RecordRead(bytes int64) {
    m.readOps.Add(1)
    m.bytesRead.Add(bytes)
}
```


### Day 8: errgroup and structured concurrency


```go
import "golang.org/x/sync/errgroup"

// errgroup: run concurrent operations, collect first error, cancel all on error
func replicateBlock(ctx context.Context, block []byte, replicas []ReplicaClient) error {
    g, ctx := errgroup.WithContext(ctx)  // ctx cancels all goroutines if one fails

    for _, r := range replicas {
        r := r
        g.Go(func() error {
            return r.WriteBlock(ctx, block)
        })
    }

    // Wait blocks until all goroutines complete OR one returns an error
    return g.Wait()
}
```


---


## 📚 Day 9–12 — Go I/O for storage


### Day 9: Direct I/O and O_DIRECT


```go
// O_DIRECT: bypass the kernel page cache
// Used in storage systems that manage their own cache (databases, SAN software)
// Critical interview topic: why would you use O_DIRECT?

const O_DIRECT = syscall.O_DIRECT  // Linux-specific

func openDirect(path string) (*os.File, error) {
    fd, err := syscall.Open(path,
        syscall.O_RDWR|syscall.O_CREAT|O_DIRECT,
        0644)
    if err != nil {
        return nil, err
    }
    return os.NewFile(uintptr(fd), path), nil
}

// O_DIRECT requirement: I/O must be aligned to block size (usually 512B or 4096B)
// Buffer address, offset, and length must all be aligned
const alignment = 4096

func alignedBuffer(size int) []byte {
    // Allocate extra space to ensure alignment
    buf := make([]byte, size+alignment)
    offset := alignment - int(uintptr(unsafe.Pointer(&buf[0]))%alignment)
    if offset == alignment {
        offset = 0
    }
    return buf[offset : offset+size]
}
```


### Day 10: io.Reader, io.Writer, and streaming


```go
// Storage pipelines are fundamentally about streaming large data
// io.Reader/Writer enables zero-copy streaming without loading entire files

func streamCopy(dst io.Writer, src io.Reader, bufSize int) (int64, error) {
    buf := make([]byte, bufSize)  // 64KB-4MB typical for storage
    var total int64
    for {
        n, readErr := src.Read(buf)
        if n > 0 {
            written, writeErr := dst.Write(buf[:n])
            total += int64(written)
            if writeErr != nil {
                return total, writeErr
            }
        }
        if readErr == io.EOF {
            break
        }
        if readErr != nil {
            return total, readErr
        }
    }
    return total, nil
}

// bufio.Writer: batch small writes into large ones
// Critical for performance: many small writes are catastrophic for rotational disk
func writeLog(path string, entries []LogEntry) error {
    f, _ := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
    defer f.Close()

    bw := bufio.NewWriterSize(f, 1024*1024) // 1MB write buffer
    enc := json.NewEncoder(bw)
    for _, e := range entries {
        enc.Encode(e)
    }
    if err := bw.Flush(); err != nil {
        return err
    }
    return f.Sync()  // fsync: ensure data survives power failure
}
```


---


## 📚 Day 13–15 — Go profiling and performance


```go
// pprof: the Go profiling tool. Every storage Go engineer must know this.
import (
    "net/http"
    _ "net/http/pprof"  // side-effect import: registers pprof HTTP handlers
    "runtime/pprof"
)

// Add to your server startup:
go http.ListenAndServe(":6060", nil)

// Then profile in production:
// CPU profile (30 seconds):
// curl -o cpu.prof http://localhost:6060/debug/pprof/profile?seconds=30
// go tool pprof -http=:8080 cpu.prof
//
// Heap profile:
// curl -o heap.prof http://localhost:6060/debug/pprof/heap
// go tool pprof -http=:8080 heap.prof
//
// Goroutine dump (find leaks):
// curl http://localhost:6060/debug/pprof/goroutine?debug=2

// Benchmark test: measure throughput of your block I/O path
func BenchmarkBlockWrite(b *testing.B) {
    store := newTestStore(b.TempDir())
    data := make([]byte, 4096)  // 4KB block
    rand.Read(data)

    b.SetBytes(int64(len(data)))
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        if err := store.Write(uint64(i), data); err != nil {
            b.Fatal(err)
        }
    }
}
// Run: go test -bench=. -benchmem -benchtime=10s
// Output shows: ns/op, B/op, allocs/op -> use this to find allocation hotspots
```


---


## 🔨 Phase 1 Capstone Project: High-Throughput File Processor


**Spec:** A Go service that ingests a stream of write requests, validates checksums, compresses data, batches writes to disk, and exposes Prometheus metrics.


```javascript
cmd/
  ingestor/main.go          -- HTTP server accepting write requests
pkg/
  pipeline/
    validate.go             -- checksum validation stage
    compress.go             -- snappy/zstd compression stage
    batch.go                -- batch accumulator (flush on size or timer)
    writer.go               -- O_DIRECT disk writer
  metrics/
    metrics.go              -- Prometheus counters: IOPS, throughput, latency
  store/
    block_index.go          -- sync.RWMutex-protected block metadata index
```


**Requirements:**

- Pipeline: HTTP handler -> validate -> compress -> batch (64 writes or 100ms) -> disk write
- Use `sync.Pool` for buffer reuse. Measure GC pressure with `GODEBUG=gctrace=1`
- Expose `/metrics`: requests_total, bytes_written_total, write_latency_seconds (histogram)
- Profile with pprof. Find and fix one allocation hotspot.
- Benchmark: `go test -bench=. -benchmem` showing > 100MB/s throughput on local disk
- Target: handle 10,000 concurrent requests with < 5ms p99 latency

---


## ⚠️ Common interview questions from the guide

1. **"Why do top cloud infrastructure companies use Go?"** — goroutine scheduler for high concurrency without thread-per-connection overhead; single binary deployment; fast compilation; strong standard library for networking and I/O; GC with low pause times acceptable for most storage workloads
2. **"Explain a goroutine leak you've seen or could cause."** — goroutine blocked on a channel send/receive with no consumer; goroutine waiting on a context that's never cancelled; infinite retry loop without backoff + context check
3. **"How would you process 1 million write requests per second in Go?"** — pipeline stages with buffered channels; bounded worker pools via semaphores; sync.Pool for buffer reuse; batch I/O; O_DIRECT for cache control; profile with pprof to find bottlenecks
4. **"How do you debug memory growth in a Go storage service?"** — pprof heap profile to find retained allocations; check for unbounded caches; check slice append patterns (retained underlying arrays); check sync.Pool misuse; look at GC metrics via runtime.ReadMemStats
