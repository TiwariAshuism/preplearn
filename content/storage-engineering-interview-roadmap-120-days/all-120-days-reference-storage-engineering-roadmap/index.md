---
source: notion
title: "🗓️ All 120 Days Reference — Storage Engineering Roadmap"
slug: "all-120-days-reference-storage-engineering-roadmap"
notionId: "381da883-bddd-81d2-8ace-c0e10c76df82"
notionRootId: "380da883bddd81e1abc7c118d4e018d9"
parent: "storage-engineering-interview-roadmap-120-days"
children: []
order: 0
icon: "🗓️"
cover: null
---
> Every day has a specific deliverable. Not 'read about X' but 'implement/explain/run Y.' The three checkboxes in the tracker: **Read or derived** + **Code written** + **Can explain without notes** — all three must be ticked before marking a day Done.

---


## Phase 1 — Go for Infrastructure (Days 1–15)


| Day | Topic                                          | Daily Milestone                                                                                                |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Go types, interfaces, error handling           | Implement `BlockStore` interface + `FileBlockStore`. Wrap every error with context.                            |
| 2   | Structs, embedding, value vs pointer receivers | `CachedBlockStore` embedding `BaseStore`. Understand why pointer receivers for mutation.                       |
| 3   | Slices, maps, sync.Pool for buffer reuse       | Benchmark: new alloc per read vs sync.Pool. Show GC pressure difference with `GODEBUG=gctrace=1`.              |
| 4   | Goroutines, channels, select, semaphores       | Fan-out parallel read: 100 files, 16 concurrent goroutines. Time it vs sequential.                             |
| 5   | Context and cancellation                       | `writeToReplicas` with context timeout. Show partial writes cancelled correctly.                               |
| 6   | Pipeline pattern                               | 3-stage pipeline: validate → compress → write. Buffered channels between stages.                               |
| 7   | errgroup and structured concurrency            | Replicate block to 3 nodes with `errgroup`. First error cancels remaining.                                     |
| 8   | sync.RWMutex + atomic counters                 | `BlockIndex` with RWMutex. `IOMetrics` with [atomic.Int](http://atomic.int/)64. Benchmark: Mutex vs RWMutex.   |
| 9   | O_DIRECT and aligned I/O                       | Open file with `O_DIRECT`. 4096-byte aligned buffer. Write 10,000 blocks. Verify no page cache.                |
| 10  | io.Reader/Writer, bufio, streaming             | Stream 1GB file in 64KB chunks. Batch small writes with bufio.Writer + Flush + fsync.                          |
| 11  | pprof: CPU + heap profiles                     | Run high-throughput write loop. Profile CPU. Find hot function. Profile heap. Find top allocator.              |
| 12  | Benchmarks + benchmem                          | `BenchmarkBlockWrite` with `-benchmem`. Find allocations per op. Eliminate top one.                            |
| 13  | Go scheduler: GOMAXPROCS, goroutine leaks      | Create a goroutine leak (channel send, no receiver). Detect with goroutine dump. Fix.                          |
| 14  | sync.Pool + GC pressure                        | Buffer pool for 64KB I/O buffers. Before/after GC stats. Measure throughput improvement.                       |
| 15  | **Phase 1 Capstone**                           | **High-throughput file ingestor: HTTP → validate → compress → batch → O_DIRECT write. >100MB/s. pprof clean.** |


---


## Phase 2 — Linux Internals & OS (Days 16–30)


| Day | Topic                                     | Daily Milestone                                                                                               |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 16  | Virtual memory, page tables, TLB          | Draw: process address space layout. Explain VPN→PFN translation. Explain TLB miss cost.                       |
| 17  | mmap for storage: page faults, MAP_SHARED | mmap a 1GB file. Write via pointer. msync(MS_SYNC). Verify data on disk with hexdump.                         |
| 18  | Huge pages, madvise, MADV_HUGEPAGE        | Enable THP for a 2GB mmap region. Compare TLB miss rate: small vs huge pages via perf stat.                   |
| 19  | VFS layer: inode, dentry, file structs    | Draw VFS call path for open(). Answer: what does an inode contain? What doesn't it?                           |
| 20  | Page cache: read, write, writeback        | `cat /proc/meminfo`: identify Cached, Dirty, Writeback. Write 1GB, watch Dirty grow, fsync, watch clear.      |
| 21  | fsync, fdatasync, O_SYNC, O_DSYNC         | Measure: write 1GB in 4KB chunks with no sync vs fdatasync vs fsync. Compare throughput.                      |
| 22  | Block layer: bio, I/O scheduler, blk-mq   | `cat /sys/block/nvme0n1/queue/scheduler`. Change scheduler. Measure fio IOPS difference.                      |
| 23  | iptables for storage networking           | Allow iSCSI (3260) from one subnet, deny all others. Allow NFS (2049). Verify with nmap.                      |
| 24  | strace: trace I/O syscalls                | strace -e trace=pread64,pwrite64,fsync -T -tt on a storage process. Explain every syscall.                    |
| 25  | lsof, /proc/PID/io, /proc/diskstats       | `cat /proc/PID/io` before/after a 1GB write. Explain: rchar vs read_bytes difference.                         |
| 26  | perf stat: hardware counters              | `perf stat -p PID sleep 10` on your Go storage daemon. Interpret: IPC, cache-misses, branch-misses.           |
| 27  | perf record: CPU flame graph              | `perf record -g` on your storage daemon. `perf report`. Identify top 3 functions by CPU time.                 |
| 28  | BPF tools: biolatency, biosnoop           | Run `biolatency -D 10` while running fio. Interpret the latency histogram. Find outlier I/Os.                 |
| 29  | dmesg, SMART, disk error handling         | Check SMART for NVMe: `nvme smart-log`. Parse dmesg for I/O errors. Write: what would you alert on?           |
| 30  | **Phase 2 Capstone**                      | **Go I/O profiler: O_DIRECT sequential + random RW, fsync timing, /proc/PID/io before/after, iostat during.** |


---


## Phase 3 — Storage Fundamentals (Days 31–45)


| Day | Topic                                  | Daily Milestone                                                                                                   |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 31  | Block vs File vs Object storage        | Write a comparison table: protocol, namespace, POSIX, shareability, latency, use case. 3 real examples each.      |
| 32  | IOPS, throughput, latency relationship | Derive: if device is 1M IOPS at 4KB, what is throughput? If throughput is 7GB/s at 128KB, what IOPS?              |
| 33  | Queue depth and its effect             | fio: same workload at QD=1, 4, 16, 32, 64. Plot IOPS vs QD. Explain the saturation point.                         |
| 34  | fio: sequential throughput             | seq-read 128K, seq-write 128K. Record: BW, IOPS, p50/p99 latency. Explain each field.                             |
| 35  | fio: random IOPS                       | rand-read 4K, rand-write 4K at QD=32. Compare to sequential. Explain the difference.                              |
| 36  | fio: mixed and latency                 | 70/30 mixed at QD=32. Then QD=1 latency test. Record p99, p99.9, p99.99. Explain tail latency.                    |
| 37  | NFS: server setup and tuning           | Configure NFS server. Mount with nfsvers=4.1, rsize/wsize=1M, hard. Run fio over NFS. Compare to local.           |
| 38  | NFS internals: sync vs async export    | Re-export with async. Run fio. Compare throughput. Explain the data loss risk. When would you use async?          |
| 39  | iSCSI: target + initiator setup        | Configure targetcli. Connect with iscsiadm. lsblk shows new device. Format + mount. Run fio.                      |
| 40  | NVMe/TCP: target + client              | nvmet + nvme-tcp kernel modules. Expose NVMe namespace. Connect client. Compare latency to iSCSI.                 |
| 41  | RDMA concepts: QP, WR, CQ, MR          | Explain: one-sided vs two-sided RDMA. Why does RDMA achieve lower latency than iSCSI?                             |
| 42  | Replication: 3x model                  | Draw: 3-node replication write path. Calculate: storage overhead, read IOPS benefit, recovery cost.               |
| 43  | Erasure coding: RS(6,3)                | Draw: 6 data + 3 parity. Calculate: storage overhead vs 3x replication. When to use each?                         |
| 44  | Erasure coding: reconstruction         | Explain: if 2 nodes fail in RS(6,3), how is data recovered? How many I/Os does reconstruction require?            |
| 45  | **Phase 3 Capstone**                   | **fio benchmark suite script. Run all 6 workloads. Write interpretation report. 3 follow-up questions answered.** |


---


## Phase 4 — Distributed Storage Systems (Days 46–60)


| Day | Topic                                      | Daily Milestone                                                                                                    |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 46  | CAP theorem                                | 3 examples: CP system, AP system, why P is non-negotiable. Design choice for a metadata store.                     |
| 47  | Consistency spectrum                       | Linearizability vs sequential vs causal vs eventual. Give a storage example of each.                               |
| 48  | Raft: leader election                      | Walk through: follower timeout → candidate → RequestVote → majority → leader. Draw it.                             |
| 49  | Raft: log replication and commitment       | Walk through: client write → AppendEntries → majority ACK → commit. Explain: what is committed?                    |
| 50  | Raft in Go (hashicorp/raft)                | Implement a Raft-backed key-value store. 3 nodes on [localhost](http://localhost/). Write survives killing 1 node. |
| 51  | GFS architecture                           | Draw: master + chunkservers + clients. Explain: why is master not in the data path?                                |
| 52  | GFS: chunk size, write path                | Explain: why 64MB chunks? Walk through the GFS write/append path step by step.                                     |
| 53  | Dynamo: consistent hashing + virtual nodes | Draw a consistent hash ring with 3 nodes + 9 virtual nodes. Show key placement.                                    |
| 54  | Dynamo: sloppy quorum + hinted handoff     | With N=3, W=2, R=2: explain quorum overlap. What is hinted handoff? When does it trigger?                          |
| 55  | Dynamo: vector clocks + anti-entropy       | Explain vector clock conflict detection. Merkle tree for anti-entropy. When do you need this?                      |
| 56  | Ceph: RADOS, MON, OSD, MDS                 | Draw Ceph component diagram. Explain: why does CRUSH not need a central lookup table?                              |
| 57  | Ceph: CRUSH and placement groups           | What is a PG? How does CRUSH map object → PG → OSD list? What happens when an OSD fails?                           |
| 58  | Metadata management at scale               | Compare: GFS master (in-RAM) vs etcd (Raft) vs Dynamo-style (sharded). When to use each?                           |
| 59  | Object store metadata scaling              | At 1 billion objects, metadata = how many GB? How does MinIO solve this? How does S3 likely solve it?              |
| 60  | **Phase 4 Capstone**                       | **3-node Go object store: consistent hash, 3x replication, PUT/GET/DELETE/LIST. Kill 1 node → still works.**       |


---


## Phase 5 — Kubernetes Storage (Days 61–75)


| Day | Topic                                                | Daily Milestone                                                                                            |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 61  | PV and PVC: static provisioning                      | Create a PV. Create a PVC. Pod mounts it. Write a file. Delete Pod. Recreate Pod. File persists.           |
| 62  | StorageClass and dynamic provisioning                | Deploy NFS provisioner. Create StorageClass. PVC auto-provisions. No manual PV creation.                   |
| 63  | AccessModes: RWO, RWX, ROX, RWOP                     | Try to mount an RWO PVC on 2 nodes simultaneously. Observe failure. Switch to NFS (RWX). Observe success.  |
| 64  | VolumeBindingMode: Immediate vs WaitForFirstConsumer | Deploy a pod with Immediate SC. See PV provisioned before pod scheduled. Switch to WFFC. Compare.          |
| 65  | CSI architecture: controller vs node plugin          | Draw: external-provisioner → CSI controller → storage API. kubelet → CSI node plugin → mount.              |
| 66  | CSI: CreateVolume and DeleteVolume                   | Implement CreateVolume (idempotent). DeleteVolume (idempotent). Test with csi-sanity.                      |
| 67  | CSI: NodeStageVolume and NodePublishVolume           | Implement NodeStage (format + mount to staging). NodePublish (bind mount to pod). Test with a real pod.    |
| 68  | CSI: RBAC and service accounts                       | Write ClusterRole with exact verbs needed. No over-privileged wildcards. Verify with `kubectl auth can-i`. |
| 69  | NFS with Kubernetes                                  | nfs-subdir-external-provisioner. StorageClass. PVC. Pod writes. Verify on NFS server.                      |
| 70  | iSCSI with Kubernetes                                | Static iSCSI PV. PVC. Pod. Write data. Check that SCSI device appears on node.                             |
| 71  | VolumeSnapshots                                      | VolumeSnapshotClass. Take snapshot. Delete data. Restore PVC from snapshot. Verify data restored.          |
| 72  | PVC cloning                                          | Clone a PVC with dataSource. Write to original. Clone. Verify clone has original's data.                   |
| 73  | Debug: PVC stuck in Pending                          | Simulate 5 different causes: no matching PV, provisioner down, wrong SC, WFFC with no pod, quota exceeded. |
| 74  | mountPropagation: Bidirectional                      | Explain why CSI node plugin needs Bidirectional. Show: without it, pod can't see the mount.                |
| 75  | **Phase 5 Capstone**                                 | **Hostpath CSI driver in Go. Helm chart. kind cluster. PVC bound. Snapshot. Restore. csi-sanity passes.**  |


---


## Phase 6 — C++ Systems Programming (Days 76–90)


| Day | Topic                                            | Daily Milestone                                                                                                 |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 76  | RAII: FileHandle class                           | Implement FileHandle with constructor (open), destructor (close), pread/pwrite/fsync. Exception safe.           |
| 77  | Rule of Five                                     | Add: copy-delete, move-constructor, move-assignment. Verify with AddressSanitizer (`-fsanitize=address`).       |
| 78  | RAII: LockGuard, ScopedTimer                     | Implement scoped mutex lock. Scoped timer that logs duration. Use in a storage function.                        |
| 79  | unique_ptr: sole ownership                       | FileHandle → unique_ptr wrapping. Transfer ownership via std::move. Verify no double-close.                     |
| 80  | shared_ptr: shared ownership                     | Config object shared across 3 storage threads. Explain: when does reference count drop to 0?                    |
| 81  | Buffer pool with unique_ptr + aligned alloc      | BufferPool using posix_memalign for O_DIRECT alignment. Acquire/release via unique_ptr deleter.                 |
| 82  | Move semantics: value categories                 | WriteRequest with move-only semantics. Pipeline: enqueue via std::move. Verify no copies via counter.           |
| 83  | Perfect forwarding                               | submitWrite template with `std::forward`. Verify lvalue and rvalue both work correctly.                         |
| 84  | std::string_view + zero-copy parsing             | Parse NFS mount options string using string_view. No heap allocation. Benchmark vs std::string.                 |
| 85  | std::mutex, std::unique_lock, condition_variable | WAL with batch flusher thread. append() notifies. waitForDurable() waits on CV. fsync on flush.                 |
| 86  | std::atomic and memory ordering                  | IOMetrics with atomic counters. Explain: relaxed vs acquire/release vs seq_cst for each counter.                |
| 87  | std::shared_mutex for read-heavy metadata        | BlockIndex with shared_mutex. 8 reader threads + 1 writer thread. ThreadSanitizer (`-fsanitize=thread`): clean. |
| 88  | Lock-free queue for I/O requests                 | Implement a single-producer single-consumer lock-free ring buffer for I/O requests.                             |
| 89  | AddressSanitizer + Valgrind                      | Introduce a use-after-free bug. Find with ASan. Introduce a memory leak. Find with Valgrind. Fix both.          |
| 90  | **Phase 6 Capstone**                             | **C++ buffer pool manager: LRU eviction, pin/unpin, dirty tracking, concurrent access. ASan + TSan clean.**     |


---


## Phase 7 — Performance Engineering (Days 91–105)


| Day | Topic                                      | Daily Milestone                                                                                                  |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 91  | USE method: CPU                            | Apply USE to CPU: top, mpstat, perf stat. Identify utilization, saturation, errors on a loaded system.           |
| 92  | USE method: memory                         | Apply USE to memory: free, vmstat, /proc/meminfo. Identify swap usage, OOM events, cache behavior.               |
| 93  | USE method: storage device                 | Apply USE to NVMe: iostat -x. Identify %util, r_await, aqu-sz, errors. Run fio simultaneously.                   |
| 94  | USE method: network                        | Apply USE to network: sar -n DEV, ip -s link, netstat -s. Find retransmits and packet drops.                     |
| 95  | fio: interpreting every output field       | Run fio --output-format=json. Write a Python parser that prints: IOPS, BW, p50/p99/p999 for each job.            |
| 96  | fio: diagnosing low throughput             | Simulate: CPU bottleneck, low QD, small block size. fio shows each. Explain the diagnosis.                       |
| 97  | fio: diagnosing high latency               | Simulate: device saturation, high queue depth. fio shows latency increase. Explain queuing theory.               |
| 98  | pprof: CPU profile in Go storage service   | Load test your Phase 1 service. 30s CPU profile. Find the top function. Optimize it. Measure improvement.        |
| 99  | pprof: heap profile and allocation hotspot | Heap profile. Find top allocator. Add sync.Pool. Re-profile. Show allocation rate drop.                          |
| 100 | pprof: goroutine leak detection            | Introduce goroutine leak (channel send, no receiver). Watch goroutine count grow. Find with dump. Fix.           |
| 101 | pprof: mutex contention profile            | Add unnecessary global Mutex. Find with mutex profile. Fix with RWMutex + sharding. Measure IOPS gain.           |
| 102 | iostat deep dive                           | `iostat -x 1` during fio. Interpret: %util, aqu-sz, r_await, wrqm/s. Explain each during the run.                |
| 103 | vmstat + sar for system-level view         | vmstat 1: explain wa%, si, so, cs. sar -d: compare to iostat. When would you use sar over iostat?                |
| 104 | perf and BPF tools for storage             | `perf record -e block:block_rq_complete` during fio. Parse latencies. Compare to fio's own latency stats.        |
| 105 | **Phase 7 Capstone**                       | **Performance audit report: baseline → profile → find bottleneck → fix → measure improvement. 2-page write-up.** |


---


## Phase 8 — System Design & Interview Prep (Days 106–120)


| Day | Topic                                          | Daily Milestone                                                                                           |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 106 | Design: distributed object store (Part 1)      | Design metadata service: sharding strategy, consistency model, failure handling. Write it out.            |
| 107 | Design: distributed object store (Part 2)      | Design data placement: consistent hashing, replication vs EC decision, read/write paths. Draw diagrams.   |
| 108 | Design: distributed object store (Part 3)      | Design fault tolerance: node failure detection, re-replication, priority ordering, multi-DC.              |
| 109 | Design: backup system (Part 1)                 | Design deduplication: content-defined chunking, SHA-256 index, dedup ratio estimation at 1PB scale.       |
| 110 | Design: backup system (Part 2)                 | Design incremental-forever + synthetic full + recovery (instant restore vs full restore).                 |
| 111 | Design: CSI driver for custom backend          | Design all 8 CSI operations. Focus on idempotency. Draw topology-aware provisioning flow.                 |
| 112 | Design: distributed WAL (Write-Ahead Log)      | Design a shared WAL service: ordering guarantees, group commit, checkpointing, recovery.                  |
| 113 | Debugging story 1: write and practice          | Write STAR-format story: I/O latency spike. Practice saying it aloud in under 5 minutes.                  |
| 114 | Debugging story 2: write and practice          | Write STAR-format story: memory/goroutine leak. Practice saying it aloud in under 5 minutes.              |
| 115 | Mock interview 1: system design (45 min)       | "Design a distributed NAS for 10,000 clients." Record yourself. Review. Note gaps.                        |
| 116 | Mock interview 2: Linux/storage depth (30 min) | "What happens when a K8s pod writes to an NFS-backed PVC?" Trace every layer.                             |
| 117 | Mock interview 3: Go concurrency (30 min)      | Implement a token bucket rate limiter in Go (N ops/sec, burst support). Explain design choices.           |
| 118 | Mock interview 4: C++ debugging (20 min)       | Given buggy C++ code with use-after-free: find with ASan, fix with unique_ptr. Explain the pattern.       |
| 119 | Final checklist review                         | Go through all 18 checklist items. For any marked incomplete: spend 2h on it today.                       |
| 120 | **Full capstone dry run**                      | **Do a 90-min mock: 45 min system design + 30 min technical depth + 15 min behavioral. Record + review.** |

