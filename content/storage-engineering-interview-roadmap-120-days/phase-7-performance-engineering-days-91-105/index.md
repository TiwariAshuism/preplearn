---
source: notion
title: "Phase 7 — Performance Engineering (Days 91–105)"
slug: "phase-7-performance-engineering-days-91-105"
notionId: "381da883-bddd-8175-9789-f96c16e55b90"
notionRootId: "380da883bddd81e1abc7c118d4e018d9"
parent: "storage-engineering-interview-roadmap-120-days"
children: []
order: 2
icon: "⚡"
cover: null
---
> **Core insight:** The ability to debug a performance problem from first principles — without guessing — is the most valuable skill at a storage company. The USE method (Utilization, Saturation, Errors) gives you a systematic framework. Brendan Gregg's Linux perf tools give you the instruments. This phase combines both.

---


## Day 91–93 — The USE Method for storage systems


```javascript
USE Method: for every resource, check:
  U = Utilization   (how busy is the resource, 0-100%)
  S = Saturation    (is there a queue building up?)
  E = Errors        (are there error events?)

Storage resources to check:

1. CPU
   U: top, mpstat -> %usr + %sys (for storage daemon)
   S: load average > num_cpus -> runnable queue saturated
   E: mcelog (hardware errors)

2. Memory
   U: free -h -> used / total
   S: vmstat -> si, so > 0 (swap in/out = memory saturated)
   E: dmesg | grep -i 'oom\|out of memory'

3. Storage device (NVMe/HDD)
   U: iostat -x -> %util (100% = fully utilized, but not necessarily saturated)
   S: iostat -x -> avgqu-sz (average queue size > 1 = saturation for HDD)
   E: dmesg | grep -i 'error\|failed\|reset'
      smartctl -a /dev/nvme0n1 (SMART errors)

4. Network (for NFS/iSCSI/NVMe-oF)
   U: sar -n DEV -> rxkB/s, txkB/s vs link speed
   S: netstat -s -> retransmissions, dropped packets
   E: ip -s link -> errors, dropped
      ethtool -S eth0 -> rx_missed_errors

5. File descriptor limits
   U: /proc/sys/fs/file-nr -> current / max
   S: (no saturation concept)
   E: dmesg | grep 'Too many open files'
      /proc/PID/limits -> Max open files
```


---


## Day 94–97 — fio deep dive: interpreting results


```bash
# Run a comprehensive benchmark and interpret every output field
fio --name=deep-dive \
    --rw=randrw --rwmixread=70 \
    --bs=4k --size=16G \
    --numjobs=4 --iodepth=32 \
    --direct=1 --ioengine=libaio \
    --filename=/dev/nvme0n1 \
    --runtime=60 --time_based \
    --group_reporting

# Sample output and what each field means:
# read: IOPS=245k, BW=957MiB/s (1004MB/s)
#   - IOPS: 245,000 random read operations per second
#   - BW: 957 MiB/s throughput (4096 * 245000 / 1048576)

# lat (nsec): min=2085, max=8492k, avg=56785.23, stdev=48234.12
#   - min: best case (cold path, cache hit?)
#   - max: worst case (may be outlier/GC pause/thermal throttle)
#   - avg: mean latency -- often misleading for storage!
#   - stdev: high stdev = inconsistent latency = jitter problem

# lat (nsec): 50.00th=[ 47360], 75.00th=[ 59648]
#             90.00th=[ 77824], 95.00th=[ 94208]
#             99.00th=[139264], 99.50th=[165888]
#             99.90th=[223232], 99.95th=[272384]
#             99.99th=[612352]
#   - p50 = median = 47us: half of all I/Os complete in 47us
#   - p99 = 139us: 1 in 100 I/Os takes 139us
#   - p99.99 = 612us: 1 in 10,000 I/Os takes 612us
#   - For databases: p99.9 is usually the SLA target

# cpu: usr=8.45%, sys=22.34%, ctx=1842445/sec, majf=0, minf=0
#   - sys% high: kernel overhead for I/O processing (normal for NVMe at high IOPS)
#   - ctx: context switches per second
#   - majf: major faults (should be 0 with direct=1)

# IO depths: 1=0.1%, 2=0.1%, 4=0.1%, 8=0.2%, 16=0.4%, 32=100%
#   - This shows the actual queue depth distribution
#   - 100% at depth=32 means device is always saturated with 32 in-flight I/Os

# Diagnosing performance problems from fio output:

# Problem: throughput lower than expected
# Check 1: is iodepth=1? -> too few in-flight I/Os, device underutilized
# Check 2: is numjobs too low? -> not enough parallelism
# Check 3: is bs too small? -> IOPS-bound, not throughput-bound
# Check 4: is CPU at 100%? -> software bottleneck, not storage
# Check 5: are there many retries? -> device errors causing retransmissions

# Problem: latency too high
# Check 1: queue depth too high -> queuing delay dominates actual device latency
#   At QD=1, latency = device latency
#   At QD=32, latency = device latency + queue wait time
# Check 2: mixed read/write on HDD -> head seeks cause latency spikes
# Check 3: %util too high -> device saturated, all I/Os waiting
# Check 4: is fsync() being called? -> each fsync adds ~device latency

# Latency percentiles explained for interview:
# "Why do we care about p99.9 rather than average?"
# If 1 in 1000 requests is slow and you serve 1M req/s,
# that's 1000 slow requests per second.
# With a microservice calling 10 backends, each at p99.9,
# P(at least one slow) = 1 - (1-0.001)^10 = ~1% of all requests see a slow response
# = tail latency amplification
```


---


## Day 98–101 — pprof for production Go storage services


```go
// Pattern: always run pprof server in production Go storage daemons
// It costs <1% CPU overhead and saves hours of debugging

import (
    "net/http"
    _ "net/http/pprof"
    "runtime"
)

func startPProfServer() {
    // Set mutex + block profiling rates
    runtime.SetMutexProfileFraction(1)   // profile mutex contention
    runtime.SetBlockProfileRate(1)         // profile goroutine blocking
    go http.ListenAndServe(":6060", nil)
}

// 1. CPU profile: find what code consumes CPU
// Scenario: storage daemon is using 90% CPU but throughput is low
// -> CPU profile will show WHERE the CPU time is spent
curl -o cpu.prof http://localhost:6060/debug/pprof/profile?seconds=30
go tool pprof -http=:8080 cpu.prof
// Look for: unexpected JSON marshaling, string conversions, map operations

// 2. Heap profile: find what is using memory
// Scenario: storage daemon grows to 8GB RSS over 24h and is OOM killed
curl -o heap.prof http://localhost:6060/debug/pprof/heap
go tool pprof -http=:8080 heap.prof
// Look for: large slices, cached items never evicted, goroutine closures
// pprof flags: -alloc_space (total allocated) vs -inuse_space (currently held)

// 3. Goroutine dump: find goroutine leaks
// Scenario: memory grows over time but heap profile shows little heap usage
// -> goroutines piling up, each holding stack memory
curl http://localhost:6060/debug/pprof/goroutine?debug=2
// Look for: goroutines blocked on channel send/receive with no consumer
// goroutines in same function repeatedly = leak

// 4. Mutex profile: find lock contention
// Scenario: storage service handles only 50K IOPS but you expected 500K
// -> CPU is not maxed, disk is not maxed, but throughput is low
// -> contention: goroutines waiting for a lock
curl -o mutex.prof http://localhost:6060/debug/pprof/mutex
go tool pprof -http=:8080 mutex.prof
// Look for: sync.Mutex.Lock calls with high cumulative wait time
// Fix: reduce lock scope, use sync.Map for read-heavy maps, shard the mutex

// 5. Block profile: find goroutines blocked on channel/select/syscall
curl -o block.prof http://localhost:6060/debug/pprof/block
go tool pprof -http=:8080 block.prof

// Real scenario from a storage service:
// pprof shows 60% of CPU time in runtime.mallocgc
// -> excessive allocations -> GC pressure
// Fix: use sync.Pool for 64KB buffers
// Result: CPU drops from 90% to 30%, throughput doubles
```


---


## Day 102–103 — iostat, vmstat, sar: system-level I/O diagnosis


```bash
# iostat: the primary tool for disk I/O analysis
iostat -x -d 1 nvme0n1

# Output columns explained:
# Device    r/s      w/s      rkB/s    wkB/s    rrqm/s  wrqm/s
# nvme0n1   150000   50000    600000   200000   0.0     0.0

# r/s, w/s:         read/write IOPS
# rkB/s, wkB/s:     read/write throughput in KB/s
# rrqm/s, wrqm/s:   I/O requests merged (HDD: high merge = sequential workload)

# Device    %rrqm   %wrqm   r_await  w_await  aqu-sz   %util
# nvme0n1   0.0     0.0     0.15     0.22     32.10    98.50

# r_await, w_await: average latency (ms) for read/write operations
# aqu-sz:  average queue size -- critical metric!
#   aqu-sz < 1: device underutilized (opportunity to increase parallelism)
#   aqu-sz > 1: requests queuing up (may indicate saturation or just NVMe at depth)
# %util:   % of time device was busy (NOT the same as saturated!)
#   NVMe: %util can be 100% but aqu-sz=32 is normal (device is fast, just parallel)
#   HDD: %util > 80% -> likely saturated (seeks dominate, no parallelism benefit)

# vmstat: system-wide memory and CPU
vmstat 1
# Key columns:
# si, so: swap in/out (pages/s) -- if > 0, memory is a problem
# bi, bo: blocks in/out (512B blocks/s) -- disk I/O summary
# wa:     CPU % waiting for I/O -- high wa = storage bottleneck
# cs:     context switches/s

# sar: historical performance data (if sysstat installed)
sar -n DEV 1 10    # network interface stats every 1s for 10 iterations
sar -d 1 10        # disk device stats
sar -u 1 10        # CPU stats
sar -B 1 10        # paging stats

# Diagnosing "slow I/O" complaint:
watch -n1 'iostat -x nvme0n1 | tail -4'
# 1. Check r_await/w_await: > 5ms for NVMe = problem
# 2. Check %util: 100% but low IOPS = queue depth too low (increase parallelism)
# 3. Check aqu-sz: > 64 for NVMe = too many in flight (back-pressure needed)
# 4. Check wrqm/s > 0: good for HDDs (kernel merging writes = sequential pattern)
# 5. Compare rkB/s to device spec: if 500 MB/s device only doing 100MB/s -> investigate
```


---


## Day 104–105 — Phase 7 Capstone: Performance Audit


**Project: Full performance audit of the Go storage service from Phase 1**


```javascript
Deliverable: a written "Performance Investigation Report"

Step 1: Baseline measurement
  - fio benchmark on the underlying disk: sequential + random IOPS + latency
  - Run your Phase 1 Go service under load (wrk or hey HTTP load generator)
  - Record: RPS, p50/p99/p999 latency, CPU%, memory RSS

Step 2: Profile under load
  - CPU profile (30s): identify top 3 hot functions
  - Heap profile: identify top 3 allocation sites
  - Goroutine dump: count goroutines, look for blocked ones

Step 3: Introduce a deliberate bug and find it
  - Add a global sync.Mutex protecting every read (even read-only operations)
  - Observe: throughput drops significantly
  - Find it with mutex profile
  - Fix: use sync.RWMutex for reads
  - Measure improvement

Step 4: Buffer allocation optimization
  - Profile shows lots of allocs in hot path
  - Add sync.Pool for I/O buffers
  - Measure: GC pauses (GODEBUG=gctrace=1) and throughput improvement

Step 5: Write the report (1-2 pages)
  - What was the bottleneck?
  - How did you find it?
  - What was the fix?
  - What was the measured improvement?
  - What would you investigate next?

This report format is exactly what you would use in a technical screen:
"Tell me about a performance problem you investigated and fixed."
```


---


## Interview questions

1. **"A storage daemon's write latency went from 1ms to 50ms at 3am. How do you debug it?"** USE method: check CPU utilization (top/mpstat), disk saturation (iostat), memory pressure (vmstat), network errors (ip -s link). Then: check application logs for errors. Check dmesg for disk errors. Profile with pprof if the process is Go. Check if a cron job or backup started at 3am.
2. **"What does %util=100% in iostat mean? Is the disk saturated?"** Not necessarily. %util means the device was busy 100% of the time in the measurement interval. For NVMe, a device can be 100% busy AND handle all I/Os at normal latency if the queue depth is well-matched. Saturation is better indicated by r_await/w_await increasing beyond baseline, or aqu-sz growing unboundedly.
3. **"How would you diagnose a Go service with growing memory but no obvious heap growth?"** Goroutine leak: `curl /debug/pprof/goroutine?debug=2` — count goroutines over time. Each goroutine holds 2-8KB stack minimum. If goroutine count grows unboundedly, you have a leak. Find the goroutine function from the dump and trace where it's created without a corresponding teardown.
4. **"What is the difference between average latency and p99 latency?"** Average smooths over outliers and can be dominated by the fast majority. P99 tells you what the slowest 1% of requests experience. For storage systems serving databases, a single slow I/O can cause a transaction to time out. P99.9 and P99.99 matter for high-QPS services where tail latency amplification turns rare slow I/Os into common user-visible slowness.
