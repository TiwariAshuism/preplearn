---
source: notion
title: "Phase 4 — Distributed Storage Systems (Days 46–60)"
slug: "phase-4-distributed-storage-systems-days-46-60"
notionId: "380da883-bddd-81dc-beba-e478d4ee4cbb"
notionRootId: "380da883bddd81e1abc7c118d4e018d9"
parent: "storage-engineering-interview-roadmap-120-days"
children: []
order: 4
icon: "🌐"
cover: null
---
> **Core insight:** Every distributed storage system makes the same fundamental trade-offs: consistency vs availability, replication vs erasure coding, leader-based vs leaderless coordination, centralised vs decentralised metadata. Knowing why GFS, Dynamo, and Ceph made the choices they did is what separates engineers who can implement from engineers who can design.

---


## Day 46-48 — Consistency models and CAP theorem


### CAP theorem


```javascript
CAP: in a distributed system with network partitions,
you can guarantee at most 2 of 3:
  C: Consistency    - every read returns the most recent write (or error)
  A: Availability   - every request receives a response (never an error)
  P: Partition tolerance - system continues despite network splits

In practice: P is non-negotiable (networks DO partition)
So the real choice is: CP vs AP

  CP systems (sacrifice availability on partition):
    Examples: ZooKeeper, etcd, Ceph with strict quorum
    Behaviour: returns error rather than stale data during partition
    Use case: metadata stores, lock services, configuration

  AP systems (sacrifice consistency on partition):
    Examples: Cassandra, DynamoDB (eventually consistent), Ceph radosgw (S3)
    Behaviour: returns potentially stale data rather than erroring
    Use case: shopping carts, social feeds, object storage (S3-like)
```


### Consistency spectrum


```javascript
Strong consistency (linearizability)
  - Reads always see the most recent write
  - As if all operations happen on a single machine
  - Example: etcd, ZooKeeper
  - Cost: high latency (must coordinate with all replicas before returning)

Sequential consistency
  - All operations appear in a global total order
  - Each process's operations appear in order they were issued
  - Weaker than linearizability (global order can lag real time)

Causal consistency
  - Operations that are causally related appear in causal order
  - Concurrent operations can appear in any order
  - Example: session consistency in distributed databases

Eventual consistency
  - Given no new writes, all replicas will eventually agree
  - Reads may return stale data
  - Example: DNS, S3, Cassandra (default)
  - Benefit: very high availability and low latency
```


---


## Day 49-51 — Raft consensus algorithm


```javascript
Raft solves: how do N nodes agree on a sequence of log entries?
Used by: etcd (Kubernetes backing store), CockroachDB, TiKV, Consul

Raft roles:
  Leader: receives all client requests, replicates to followers
  Follower: passive, replicates leader's log
  Candidate: campaigning to become leader (during election)

Key properties:
  - At most one leader per term
  - Leader must have all committed entries before winning election
  - Entry is committed when majority have it in their log

Write path:
  1. Client sends write to leader
  2. Leader appends entry to its log (not yet committed)
  3. Leader sends AppendEntries RPCs to all followers in parallel
  4. Followers append to their logs, respond ACK
  5. When majority (n/2 + 1) ACK, leader commits the entry
  6. Leader applies to state machine, responds to client
  7. Next AppendEntries tells followers the entry is committed
  8. Followers apply to their state machines

Leader election:
  1. Follower times out waiting for heartbeat (election timeout: 150-300ms)
  2. Follower increments term, votes for itself, sends RequestVote RPCs
  3. If candidate receives votes from majority, it becomes leader
  4. New leader immediately sends heartbeats to prevent new elections

Why Raft over Paxos:
  Raft was designed to be understandable
  Strong leader (all writes go through leader) simplifies reasoning
  Leader election, log replication, and safety each have clear rules

In storage context:
  etcd uses Raft to store Kubernetes state (PVCs, StorageClasses, etc.)
  Ceph's RADOS uses PAXOS for monitor quorum
  Many distributed storage systems use Raft for metadata consensus
```


```go
// Go: how a Raft-based metadata store might expose a consistent Get
type MetadataStore struct {
    raft *raft.Raft  // etcd's or hashicorp's Raft implementation
    fsm  *StorageFSM
}

func (m *MetadataStore) GetBlockLocation(ctx context.Context, blockID string) (*Location, error) {
    // Linearizable read: must go through Raft leader to get consistent result
    // This ensures we see all writes that happened before this read
    future := m.raft.VerifyLeader()
    if err := future.Error(); err != nil {
        return nil, fmt.Errorf("not leader, try another node: %w", err)
    }
    return m.fsm.getBlockLocation(blockID)
}

func (m *MetadataStore) SetBlockLocation(ctx context.Context, blockID string, loc *Location) error {
    data, _ := proto.Marshal(&SetLocationCommand{BlockID: blockID, Location: loc})
    future := m.raft.Apply(data, 5*time.Second)
    if err := future.Error(); err != nil {
        return fmt.Errorf("raft apply failed: %w", err)
    }
    return nil
}
```


---


## Day 52-54 — GFS, Dynamo, and Ceph architectures


### GFS (Google File System) — 2003 paper


```javascript
Design goals:
  - Commodity hardware (failures are the norm, not the exception)
  - Large files (GBs to TBs), large streaming reads
  - Append-heavy workloads (map output, logs)
  - High throughput over low latency

Architecture:
  Master (single, replicated): metadata only
    - File namespace (directory tree)
    - File -> chunk mapping
    - Chunk -> chunkserver mapping
    - NOT data path (data never flows through master)

  ChunkServers (100s to 1000s): store chunk replicas
    - Chunks: 64MB fixed size (large to reduce master load)
    - Each chunk replicated 3x on different chunkservers

Read path:
  1. Client asks master: "which chunkservers hold chunk N of file X?"
  2. Master responds with chunkserver list
  3. Client caches this, reads directly from nearest chunkserver
  (master NOT in data path)

Write/Append path:
  1. Client asks master for mutation lease holder
  2. Master grants lease to one replica (primary)
  3. Client pushes data to all replicas (pipeline: A->B->C)
  4. Client sends write request to primary
  5. Primary assigns serial numbers to mutations, applies, forwards to secondaries
  6. When all secondaries ack, primary acks client

Key insights for interviews:
  - Single master works at Google scale due to aggressive caching
  - 64MB chunks = fewer master operations, but poor for small files
  - Append semantics relaxed: GFS allows duplicate records near chunk boundaries
  - Inspired HDFS (Hadoop Distributed File System)
```


### Dynamo (Amazon DynamoDB's predecessor) — 2007 paper


```javascript
Design goals:
  - Always-writable (AP over CP)
  - High availability over consistency
  - Eventually consistent (conflict resolution required)

Key techniques:
  Consistent hashing:
    - Nodes placed on a ring by hash of their ID
    - Keys assigned to nearest node clockwise
    - Adding/removing nodes only affects neighbors (minimal data movement)
    - Virtual nodes: each physical node = 150+ virtual positions on ring
      (ensures even load distribution even with heterogeneous hardware)

  Vector clocks:
    - Track causality: [NodeA:3, NodeB:1] means NodeA has seen 3 events
    - Detect conflicts: if neither clock dominates, there's a conflict
    - Resolution: last-write-wins (LWW) or application-level merge

  Sloppy quorum:
    - N=3, W=2, R=2 (typical Dynamo config)
    - Write succeeds when W of the N preference-list nodes ACK
    - Read succeeds when R nodes respond (take the latest version)
    - R + W > N guarantees overlap: at least one node has the latest version
    - Hinted handoff: if a node is down, temporarily route to another,
      hint that data needs to be delivered when original node recovers

  Anti-entropy with Merkle trees:
    - Each node maintains a Merkle tree of its key range
    - Gossip: nodes periodically exchange tree roots
    - If roots differ, traverse the tree to find differing subtrees
    - Only sync the different parts (efficient repair)
```


### Ceph architecture


```javascript
Ceph: unified distributed storage (block + file + object)
Used by: OpenStack, Kubernetes (RBD + CephFS CSI drivers), many HPC centers

Components:
  RADOS: Reliable Autonomic Distributed Object Store
    - The foundation. All other Ceph services are built on RADOS.
    - Data stored as objects in RADOS, not files or blocks

  MON (Monitor): maintain cluster map (authoritative state)
    - Uses Paxos consensus (odd number, usually 3 or 5)
    - OSD map: which OSDs exist, their state (up/down/in/out)
    - CRUSH map: placement algorithm
    - No client data flows through MONs

  OSD (Object Storage Daemon): one per disk/device
    - Stores objects on local filesystem (BlueStore: xfs+rocksdb+block device)
    - Handles replication/EC to other OSDs directly (peer-to-peer)
    - Heartbeats to detect failures
    - PGs (Placement Groups): groups of objects, unit of replication/scrubbing

  MDS (Metadata Server): for CephFS only
    - Manages filesystem namespace, directory inodes
    - Data still goes to OSDs via RADOS

  RGW (RADOS Gateway): S3/Swift-compatible object API
    - Translates S3 operations into RADOS object operations

CRUSH algorithm (Controlled Replication Under Scalable Hashing):
  - Deterministic placement: given object ID + cluster map -> OSD list
  - No central lookup table needed
  - Client computes placement itself (vs GFS: client asks master)
  - Failure domains: can specify rules like "spread across racks/DCs"

Read/Write path (block - RBD):
  1. Client computes PG = hash(object_name) % num_PGs
  2. Client looks up PG in OSD map to find primary OSD
  3. Client sends I/O to primary OSD
  4. Primary replicates to replica OSDs (parallel)
  5. When all ACK, primary ACKs client
```


---


## Day 55-57 — Metadata management in distributed storage


```javascript
Metadata in a distributed object store:
  - Object ID -> storage location mapping
  - Access control (who can read/write)
  - Versioning (S3 versioning, snapshots)
  - Lifecycle policies (transition to cold tier, expiry)
  - Multipart upload state

Metadata storage options:

1. Centralized (GFS master, HDFS NameNode):
   Pro: simple, consistent
   Con: single point of failure, throughput bottleneck at scale
   Mitigation: in-memory, aggressive caching, HA with standby

2. Distributed KV store (etcd, RocksDB cluster):
   Pro: horizontally scalable
   Con: must ensure consistency for namespace operations
   Example: MinIO uses etcd for distributed lock coordination

3. Consistent hashing with replication (Dynamo-style):
   Pro: no single bottleneck
   Con: eventually consistent metadata can cause inconsistency

Metadata scaling challenge:
  At 1 billion objects: metadata itself becomes a storage challenge
  HDFS NameNode: stores all metadata in RAM (128 GB = ~150M files)
  Solution: HDFS Federation (multiple NameNodes, each owns a namespace volume)
  S3: uses proprietary distributed metadata system (not public)
  MinIO: stores metadata as JSON headers in the same object (co-located)

Listing scalability:
  LIST /bucket/prefix is a notoriously expensive operation
  S3 LIST: scans a sorted B-tree, returns max 1000 objects per call
  Ceph RadosGW: maintains a bucket index in separate RADOS object
  MinIO: uses BloomFilter-based indexing for fast listing
```


---


## Day 58-60 — Phase 4 Capstone: Mini Distributed Object Store in Go


**Project: Build a simplified distributed object store**


```javascript
Architecture:

  cmd/
    metadata-server/   <- Raft-based (use hashicorp/raft)
    storage-node/      <- stores actual objects on disk
    gateway/           <- S3-compatible HTTP API

  pkg/
    consistent-hash/   <- virtual nodes, key placement
    raft-fsm/          <- state machine: object_id -> [node_ids]
    replication/       <- 3x replication to storage nodes
    erasure/           <- RS(4,2) encoding with klauspost/reedsolomon
    api/               <- HTTP handlers: PUT, GET, DELETE, LIST
```


**Required features:**


```go
// 1. PUT object with 3x replication
func (g *Gateway) PutObject(w http.ResponseWriter, r *http.Request) {
    bucketName, objectKey := parsePath(r.URL.Path)
    data, _ := io.ReadAll(r.Body)

    // Hash to find 3 storage nodes via consistent hashing
    nodes := g.ring.GetN(objectKey, 3)

    // Replicate to all 3 nodes
    g, ctx := errgroup.WithContext(r.Context())
    for _, node := range nodes {
        n := node
        g.Go(func() error { return n.Store(ctx, objectKey, data) })
    }
    if err := g.Wait(); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    // Update metadata via Raft
    g.metadata.SetObjectLocation(objectKey, nodes)
    w.WriteHeader(http.StatusOK)
}

// 2. GET object (read from any replica)
func (g *Gateway) GetObject(w http.ResponseWriter, r *http.Request) {
    objectKey := parseKey(r.URL.Path)
    nodes, err := g.metadata.GetObjectLocation(objectKey)
    if err != nil { http.Error(w, "not found", 404); return }

    // Try nodes in order until one succeeds
    for _, node := range nodes {
        if data, err := node.Retrieve(r.Context(), objectKey); err == nil {
            w.Write(data)
            return
        }
    }
    http.Error(w, "all replicas unavailable", 503)
}
```


**Deliverables:**

1. Three-node cluster on [localhost](http://localhost/) (ports 8001, 8002, 8003)
2. PUT/GET/DELETE/LIST API working
3. Kill one node -> PUTs and GETs still work (fault tolerance demo)
4. Restart killed node -> it syncs state from peers
5. Benchmark with your Go pipeline from Phase 1: measure PUT throughput (MB/s)
6. Write a 1-page design document: what would you change to support 10PB at a real company?

---


## Interview questions

1. **"Explain the CAP theorem with a storage example."**
2. **"How does Raft work? Walk me through a leader election."**
3. **"Explain consistent hashing and virtual nodes."**
4. **"Compare GFS and Ceph architectures. What problem does each solve differently?"**
5. **"Design a distributed object store for 1 exabyte of data."**
6. **"What is vector clock and when would you use it?"**
7. **"How does Ceph CRUSH algorithm work and why does it not need a central lookup table?"**
8. **"What are placement groups in Ceph?"**
