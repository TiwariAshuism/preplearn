---
source: notion
title: "Phase 8 — System Design & Interview Prep (Days 106–120)"
slug: "phase-8-system-design-and-interview-prep-days-106-120"
notionId: "381da883-bddd-8188-a962-c66ce07d593f"
notionRootId: "380da883bddd81e1abc7c118d4e018d9"
parent: "storage-engineering-interview-roadmap-120-days"
children: []
order: 1
icon: "🎯"
cover: null
---
> **Core insight:** Storage company interviews always include a system design question. The expected depth is not "draw boxes and arrows" — it is "explain the fault tolerance model, the consistency guarantee, the metadata strategy, the failure recovery path, and the performance bottleneck." This phase prepares you to give that answer.

---


## Day 106–108 — Design: Distributed Object Store


### The question


"Design an object store like S3 that can store 1 exabyte across 10,000 nodes."


### Full design


```javascript
Components:

1. Gateway / API layer
   - HTTP API: PUT/GET/DELETE/LIST (S3-compatible)
   - Auth: verify AWS Signature V4 or similar
   - Compute: checksum (SHA256 or xxHash) on upload
   - Multipart: split large objects (>100MB) into parts, upload in parallel

2. Metadata service (the hard part)
   - Stores: bucket/key -> [node_id, offset, size, checksum, version]
   - Options:
     a) Centralized DB (PostgreSQL + Citus): simple but single-failure-domain
     b) Distributed KV (etcd): strong consistency, limited scale (~GB of metadata)
     c) Custom sharded metadata (like Dynamo): scales horizontally
   - At 1EB with 4MB average object size: 250 billion objects
   - Metadata per object: ~200 bytes -> 50 TB of metadata
   - Shard by bucket+key hash across metadata shards

3. Data placement
   - Consistent hashing ring -> determine which storage nodes hold each object
   - At 1EB on 10,000 nodes: 100 TB per node (with 3x replication: 33 TB data each)
   - Erasure coding (RS 8+4): 1.5x overhead vs 3x for replication
   - For 1EB: EC saves 500PB of capacity compared to 3x replication

4. Storage nodes
   - Each node: local filesystem (XFS with discard) or direct block device
   - Stores objects as files named by content hash (CAS: content-addressed storage)
   - Heartbeat to a cluster manager (like etcd)
   - Peer replication: write goes to primary, primary replicates to N-1 nodes

5. Fault tolerance
   - Node failure:
     Cluster manager detects via missed heartbeats (30s timeout)
     Marks node as down
     Background re-replication: read object from surviving replicas,
     write new replicas on healthy nodes
     Priority: objects with only 1 surviving replica = highest priority
   - Drive failure: smartctl monitoring, proactive replacement before failure
   - Network partition: choose CP (serve errors) or AP (serve stale data)
     For object store: AP usually preferred (serve from any healthy replica)

6. Data path:
   PUT /bucket/key:
     Gateway -> checksum data
     -> metadata service: reserve key
     -> consistent hash: choose 3 storage nodes
     -> parallel write to 3 nodes (pipeline: gateway->node1->node2->node3)
     -> all 3 ACK -> metadata service: commit (key -> nodes mapping)
     -> return 200 to client

   GET /bucket/key:
     Gateway -> metadata service: lookup key -> [node1, node2, node3]
     -> try node1 (nearest/least loaded)
     -> if node1 unavailable: try node2, node3
     -> stream data to client

7. Scalability decisions:
   - Metadata sharding: 1000 shards, each shard served by a Raft group of 3 nodes
   - Data nodes: add nodes to ring, CRUSH/consistent-hash rebalances automatically
   - Listing: maintain a sorted index per bucket (separate from object metadata)
   - Multi-region: use eventual consistency across regions (async replication)
     Within a region: strong consistency

8. Performance targets:
   - PUT: 10 GB/s aggregate (limited by gateway + network)
   - GET: 100 GB/s aggregate (10,000 nodes * 10 Gbps each)
   - Metadata: 100K operations/second (sharded across 100 metadata nodes)
   - Availability: 99.999999999% (11 nines) durability (RS 8+4 across failure domains)
```


---


## Day 109–111 — Design: Backup System (Cohesity/Rubrik style)


### The question


"Design a backup system for 1 petabyte of enterprise data."


```javascript
Key requirements:
  - RPO (Recovery Point Objective): how much data loss is acceptable? (1 hour? 1 day?)
  - RTO (Recovery Time Objective): how fast can we restore? (1 hour? 1 day?)
  - Retention: how long to keep backups? (30 days, 1 year, 7 years for compliance)
  - Source: VMs, databases, file servers, SaaS (O365, Salesforce)

Core techniques:

1. Incremental-forever backup:
   - Day 0: full backup (copy everything)
   - Day 1+: only copy CHANGED blocks (changed-block tracking / CBT)
   - Synthetic full: construct a point-in-time full backup from latest full + all incrementals
   - Benefit: dramatically reduces backup window and storage

2. Deduplication (dedup):
   - Break data into variable-length chunks (content-defined chunking)
   - Hash each chunk (SHA-256 or BLAKE3)
   - If hash already in dedup store: don't store the chunk again (only a reference)
   - Typical dedup ratio: 10-50x for backup workloads (many similar VMs)
   - Dedup store: a global index of hash -> storage location
     This index is a bottleneck: must fit in RAM or have fast SSD-backed access

3. Compression:
   - Applied after dedup (on unique chunks only)
   - zstd or lz4 for speed, zstd level 3+ for ratio
   - Typical compression ratio: 2-4x after dedup
   - Combined: 20-200x effective reduction vs raw data

4. Architecture:
   Source agents (collect data, compute CBT)
     |
   Backup proxies (stream data, deduplicate, compress)
     |
   Dedup store (flash-backed chunk index + HDD/object chunk storage)
     |
   Catalog (metadata: which files are in which backup, when, where)
     |
   Object storage tier (for long-term retention: S3, GCS, Azure Blob)

5. Recovery:
   - File-level restore: catalog lookup -> find chunk IDs -> reassemble from dedup store
   - VM restore (instant): mount backup as a live datastore, VM boots from backup storage
     while data is hydrated to production storage in background
   - Database restore: application-consistent snapshot + WAL replay to point-in-time

6. Data integrity:
   - All chunks have checksums (stored in catalog)
   - Daily scrubbing: re-read chunks, verify checksums, repair if needed (like Ceph scrub)
   - Erasure coding of chunk storage for durability

7. Multi-site / disaster recovery:
   - Async replication of backups to secondary site or cloud
   - CloudArchive tier: age old backups to object storage automatically
```


---


## Day 112–113 — Design: CSI Driver for a custom storage backend


### The question


"Your company has a distributed storage system. Design a Kubernetes CSI driver for it."


```javascript
Design decisions:

1. Volume lifecycle:
   CreateVolume:
     - Call storage API to provision a volume (allocate space, return volume ID)
     - Volume type parameters from StorageClass (size, replication factor, EC policy)
     - Return VolumeID + optional topology constraints

   ControllerPublishVolume (attach):
     - Register node as an allowed initiator for this volume
     - For block: configure iSCSI or NVMe-oF access from that node's IQN/NQN
     - Return connection info (target IP, IQN, LUN) as volume context

   NodeStageVolume (format and mount to staging dir):
     - Runs on the node after attach
     - For iSCSI: run iscsiadm to connect and create /dev/sdX
     - Format filesystem if new volume (mkfs.ext4 or mkfs.xfs)
     - Mount to staging path (e.g., /var/lib/kubelet/plugins/<driver>/volumes/<id>)

   NodePublishVolume (bind mount to pod dir):
     - Bind mount from staging dir to pod's volume path
     - Handle ReadOnly flag

2. Snapshot support:
   CreateSnapshot:
     - Call storage API to create a point-in-time snapshot
     - Return SnapshotID and creation time
   DeleteSnapshot: call storage API to delete
   CreateVolumeFromSnapshot: create new volume populated from snapshot data

3. Volume expansion:
   ControllerExpandVolume: call storage API to resize the volume
   NodeExpandVolume: expand the filesystem on the node (resize2fs / xfs_growfs)

4. Topology:
   - If storage nodes are rack-aware, expose topology labels
   - Driver reports: topology.storage.io/rack=rack-3
   - StorageClass uses: allowedTopologies to pin volumes to specific racks
   - WaitForFirstConsumer: Kubernetes schedules Pod, driver sees Pod's node topology,
     provisions volume on storage nodes in the same rack

5. Error handling (critical for CSI drivers):
   - IDEMPOTENCY: every operation must be safe to retry
     CreateVolume with same name but volume exists -> return existing volume
     NodePublishVolume when already mounted -> return success
     DeleteVolume when volume doesn't exist -> return success
   - Graceful degradation: if storage API is unreachable,
     return UNAVAILABLE, not INTERNAL (kubelet will retry)

6. Testing:
   - kubernetes-csi/csi-sanity: official CSI conformance test suite
   - Run sanity tests against your driver before any cluster testing
   - Integration tests: create PVC, mount, write data, unmount, verify data
   - Chaos: kill the controller plugin mid-operation, verify idempotency
```


---


## Day 114–117 — Debugging stories: prepare 2 real narratives


### Story structure (STAR format for storage)


```javascript
Situation:  What was the system? What was the production impact?
Task:       What were you responsible for?
Action:     What did you investigate, step by step? What tools? What did you find?
Result:     What was the fix? What was the measured improvement?
```


### Story 1 template: I/O latency spike


```javascript
Situation:
  "Our storage daemon was serving 200K IOPS at 1ms p99 latency.
  At 2am, on-call alert fired: p99 latency jumped to 50ms. No code change."

Investigation (what you actually ran):
  1. iostat -x 1 nvme0n1
     -> %util=100%, r_await jumped from 0.5ms to 25ms
     -> Write IOPS dropped to near zero
     -> High read IOPS = something was doing a large sequential read

  2. lsof | grep /dev/nvme0n1 | sort -k1
     -> Found: backup process opened the device at 1:58am

  3. iotop -o
     -> backup_daemon consuming 90% of I/O bandwidth

  4. Root cause: nightly backup cron job started without I/O throttling
     Backup doing 1GB/s sequential reads -> saturating the device
     -> All other writes queuing behind backup reads

Fix:
  Added ionice -c 3 to backup cron (idle I/O class)
  -> backup gets I/O only when device is otherwise idle
  Production latency immediately returned to normal

Result:
  p99 latency back to 1ms
  Backup still completes (in 4 hours instead of 2)
  Added monitoring: alert if backup I/O rate exceeds 20% of device bandwidth
```


### Story 2 template: Memory leak in Go storage service


```javascript
Situation:
  "Go storage gateway restarted with OOM every 6-8 hours in production.
  RSS growing from 500MB to 8GB over the period."

Investigation:
  1. kubectl logs --previous storage-gateway | grep OOM
     -> Confirmed: OOM kill

  2. Heap profile at normal time (500MB RSS)
     vs heap profile when growing (3GB RSS)
     -> Heap only 400MB in both cases. Not a heap leak.

  3. Goroutine dump:
     Normal: 450 goroutines
     After 4h: 15,000 goroutines
     -> Goroutine leak!

  4. Goroutine dump shows thousands of goroutines in:
     "main.(*WriteContext).waitForReplica (write_context.go:84)"
     -> They're all blocked on a channel receive

  5. Code review of write_context.go:
     On a write timeout, the function returned early WITHOUT closing
     the replication result channel.
     -> Replica goroutines blocked trying to send on a channel with no receiver.
     -> Each write timeout left 3 goroutines (one per replica) permanently leaked.
     -> At 100 req/s with 0.1% timeout rate: 3 leaks/s = 10,800 leaked/hour

Fix:
  context.WithTimeout propagated to all replica goroutines
  ctx.Done() check in each goroutine's blocking select
  Deferred channel close on write completion (success OR failure)

Result:
  Goroutine count stable at ~450 regardless of uptime
  OOM eliminated
  Added metric: gauge of goroutine count, alert if > 2000
```


---


## Day 118–120 — Mock interviews and final checklist


### Do a full mock for each:


**Mock 1: System Design (45 min)**


Q: "Design a distributed NAS (Network Attached Storage) system for 10,000 concurrent clients."

- Cover: protocol (NFS/SMB), consistency model, namespace, metadata service, caching, failover, replication.

**Mock 2: Linux/Storage depth (30 min)**


Q: "Walk me through what happens when a Kubernetes pod writes a file to a PVC backed by NFS."

- Cover: container write -> kernel VFS -> NFS client -> TCP/UDP -> NFS server -> VFS -> ext4 -> page cache -> disk.

**Mock 3: Go concurrency (30 min)**


Q: "Implement a rate limiter that allows N operations per second, with burst support."

- Implement: token bucket algorithm with goroutines and channels.

**Mock 4: C++ debugging (20 min)**


Q: "This C++ code has a use-after-free bug. Find it."

- Practice with AddressSanitizer and smart pointer refactoring.

---


## Final checklist from the guide

- [ ] Explain block vs file vs object storage with real examples
- [ ] Explain IOPS, throughput, latency, p99, queue depth
- [ ] Explain Linux page cache, inode, VFS, and fsync()
- [ ] Compare NFS, iSCSI, NVMe/TCP, NVMe/RoCE with latency numbers
- [ ] Design a distributed object store (full depth: placement, fault tolerance, metadata)
- [ ] Explain replication vs erasure coding with numbers
- [ ] Debug a PVC stuck in Pending (5 causes memorized)
- [ ] Explain CSI controller vs node plugin with YAML examples
- [ ] Implement one Go concurrency project with pprof profiling
- [ ] Implement one C++ systems project with RAII and sanitizer runs
- [ ] Explain RAII, move semantics, atomics, memory order
- [ ] Run fio and explain every output field
- [ ] Apply USE method to a storage performance problem
- [ ] Prepare two real debugging stories (STAR format, specific tools used)
- [ ] Prepare one storage architecture deep dive for interviews
- [ ] Know Raft consensus: leader election, log replication, commitment
- [ ] Know GFS, Dynamo, Ceph at architecture level
- [ ] Know consistent hashing with virtual nodes
