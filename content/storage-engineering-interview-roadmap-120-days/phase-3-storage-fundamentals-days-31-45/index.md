---
source: notion
title: "Phase 3 — Storage Fundamentals (Days 31–45)"
slug: "phase-3-storage-fundamentals-days-31-45"
notionId: "380da883-bddd-81df-9bd6-ef4e36f194ce"
notionRootId: "380da883bddd81e1abc7c118d4e018d9"
parent: "storage-engineering-interview-roadmap-120-days"
children: []
order: 5
icon: "💾"
cover: null
---
> **Core insight:** Storage interviews at Pure Storage, Cohesity, Rubrik, NetApp, MinIO, and Portworx are fundamentally about answering one question: "Do you understand what happens between when an application calls write() and when that data is safe on persistent media?" This phase gives you a comprehensive answer.

---


## Day 31-33 — Block vs File vs Object Storage


### The three storage models


**Block storage:** raw, addressable blocks. No filesystem concept at this level.

- Examples: AWS EBS, iSCSI LUNs, NVMe namespaces, SAN volumes
- Access: read/write at block offsets. The OS or application manages a filesystem on top.
- Use cases: databases (PostgreSQL, MySQL), VMs (hypervisor stores VM disk as a block device)
- Performance: lowest latency. No metadata overhead. Direct hardware access.
- Limitation: not shareable between hosts (unless clustered block store like SANs with SCSI reservations)

**File storage:** hierarchical namespace with files and directories.

- Examples: NFS, SMB/CIFS, NFSv4, Samba, AWS EFS, Azure Files, Qumulo, VAST Data
- Access: POSIX API (open, read, write, stat, mkdir, readdir)
- Use cases: shared home directories, code repositories, media workflows, HPC scratch
- Performance: adds metadata overhead vs block. Network latency for remote filesystems.
- Advantage: shareable by many clients simultaneously. Human-readable namespace.

**Object storage:** flat namespace of objects with a unique key. No hierarchy (prefix tricks mimic it).

- Examples: AWS S3, GCS, Azure Blob, MinIO, Ceph RadosGW, Cloudflare R2
- Access: HTTP API (PUT, GET, DELETE, LIST). Not POSIX.
- Use cases: backup, archive, ML training data, media storage, data lakes
- Performance: high throughput for large objects. High latency for small random I/O.
- Advantage: virtually unlimited scale, built-in metadata, HTTP accessible, cheap at scale

```javascript
Comparison table:

             Block          File           Object
Protocol     iSCSI/NVMe     NFS/SMB        S3/HTTP
Namespace    flat (offset)  hierarchical   flat (key)
POSIX        yes (raw)      yes            no
Shareable    limited        yes            yes (per object)
Latency      lowest         medium         higher
Scale        limited        medium         unlimited
Use case     DB/VM          shared files   backup/ML
Consistency  strong         strong         eventual (S3)
```


---


## Day 34-36 — IOPS, Throughput, and Latency


### The three performance dimensions


```javascript
IOPS (Input/Output Operations Per Second)
  - Number of I/O operations completed per second
  - Critical for: random workloads, transactional databases, VMs
  - Example: PostgreSQL doing 10,000 random 8KB reads/second = 10K IOPS
  - NVMe SSD: 1M+ random 4K IOPS
  - SATA SSD: 100K random 4K IOPS
  - HDD: 150-200 random 4K IOPS (seek time dominated)

Throughput (Bandwidth) - MB/s or GB/s
  - Amount of data transferred per second
  - Critical for: sequential workloads, streaming, backup, bulk copy
  - Example: copying a 10GB backup file at 500 MB/s
  - NVMe SSD: 7 GB/s sequential read (PCIe 4.0 x4)
  - 10GbE NFS: ~1.25 GB/s (network limited)
  - SATA SSD: 500 MB/s sequential

Latency - microseconds (µs) or milliseconds (ms)
  - Time from I/O request submission to completion
  - Critical for: databases, real-time applications, low-latency trading
  - NVMe SSD local: ~100 µs (0.1ms)
  - NVMe/TCP over 25GbE: ~200-400 µs
  - NVMe/RoCE (RDMA): ~50-100 µs
  - iSCSI over 10GbE: ~500 µs - 2ms
  - NFS over 10GbE: ~1-5ms
  - HDD: 5-10ms (seek + rotational latency)

The relationship:
  Throughput = IOPS × I/O size
  IOPS = Throughput / I/O size
  Example: 1M IOPS × 4KB = 4 GB/s throughput
  Example: 10 GB/s / 128KB = ~78K IOPS

Queue depth (QD): how many I/Os are submitted concurrently
  QD=1: one I/O at a time (latency sensitive)
  QD=32: 32 I/Os in flight (throughput optimized)
  NVMe: benefits from high QD (32-128)
  HDD: benefits from QD 32+ (elevator algorithm merges seeks)
```


### fio: the industry standard storage benchmark


```bash
# Sequential read throughput (128KB blocks, single thread)
fio --name=seq-read --rw=read --bs=128k --size=4G \
    --numjobs=1 --iodepth=32 \
    --direct=1 --ioengine=libaio \
    --filename=/dev/nvme0n1 \
    --output-format=json

# Random 4K read IOPS (database simulation)
fio --name=rand-read-iops --rw=randread --bs=4k --size=4G \
    --numjobs=4 --iodepth=32 \
    --direct=1 --ioengine=libaio \
    --filename=/dev/nvme0n1

# Mixed read/write workload (70% read, 30% write)
fio --name=mixed-rw --rw=randrw --rwmixread=70 --bs=4k \
    --size=4G --numjobs=4 --iodepth=32 \
    --direct=1 --ioengine=libaio \
    --filename=/dev/nvme0n1

# Latency test (QD=1, small block)
fio --name=latency --rw=randread --bs=4k --size=4G \
    --numjobs=1 --iodepth=1 \
    --direct=1 --ioengine=libaio \
    --filename=/dev/nvme0n1 \
    --percentile_list=50,90,95,99,99.9,99.99

# Key output metrics to read:
# read: IOPS=xxx, BW=xxxMiB/s
# lat (nsec): min=xxx, max=xxx, avg=xxx, stdev=xxx
# lat (nsec): 50th=xxx, 99th=xxx, 99.9th=xxx
```


---


## Day 37-40 — Storage Protocols: NFS, iSCSI, NVMe/TCP, NVMe/RoCE, RDMA


### NFS (Network File System)


```bash
# NFS v3 vs v4 vs v4.1 vs v4.2
# v3: stateless, UDP or TCP, no native security
# v4: stateful, compound operations, Kerberos auth, single TCP port (2049)
# v4.1: pNFS (parallel NFS - client accesses storage nodes directly)
# v4.2: server-side copy, sparse files, space_used attribute

# Server: export configuration
cat /etc/exports
# /data/nfs 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)
# Options:
# rw: read-write
# sync: fsync before responding (data safe, but slower)
# async: respond before fsync (faster, risk of data loss on crash)
# no_root_squash: root on client = root on server (dangerous)
# root_squash: root on client = nobody on server (safer)

exportfs -ra  # reload /etc/exports
showmount -e  # show current exports

# Client: mount
mount -t nfs -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600 \
    192.168.1.10:/data/nfs /mnt/nfs

# Performance tuning options:
# rsize/wsize: read/write buffer size (max 1MB for NFSv4)
# hard: retry forever on server failure (vs soft: fail after timeout)
# async mount option: NOT the same as server async!
#   async on client = don't sync locally before sending

# Check NFS stats
nfsstat -c  # client statistics
nfsstat -s  # server statistics
nfsiostat 1 # per-mount I/O statistics
```


### iSCSI (internet Small Computer Systems Interface)


```bash
# iSCSI: SCSI commands over TCP/IP
# Initiator (client) connects to Target (server) and sees a block device
# Target presents LUNs (Logical Units = block volumes)

# Key terms:
# IQN: iSCSI Qualified Name (unique identifier)
# Format: iqn.YYYY-MM.reverse-domain:unique-name
# Example: iqn.2024-01.com.minio:storage-node-1

# Server (target) setup with targetcli
targetcli
/backstores/block create name=lun1 dev=/dev/sdb
/iscsi create iqn.2024-01.com.example:target1
/iscsi/iqn.2024-01.com.example:target1/tpg1/luns create /backstores/block/lun1
/iscsi/iqn.2024-01.com.example:target1/tpg1/portals create 0.0.0.0 3260

# Client (initiator) setup
apt-get install open-iscsi
iscsiadm -m discovery -t st -p 192.168.1.10  # discover targets
iscsiadm -m node --login                       # connect to all targets
lsblk  # new block device appears (e.g., /dev/sdb)

# Performance characteristics:
# Over 10GbE: ~800MB/s throughput, ~100K IOPS for 4K random
# Latency: 0.5-2ms (TCP overhead)
# Benefits from Jumbo frames (MTU 9000) for throughput
```


### NVMe/TCP and NVMe/RoCE (RDMA)


```bash
# NVMe/TCP: NVMe commands over TCP (kernel 5.0+)
# Low latency: ~200-400µs (better than iSCSI because optimized protocol)
# No special hardware needed (just fast Ethernet)

# Server: expose NVMe device via TCP
modprobe nvmet
modprobe nvmet-tcp

mkdir /sys/kernel/config/nvmet/subsystems/testnqn
echo 1 > /sys/kernel/config/nvmet/subsystems/testnqn/attr_allow_any_host
mkdir /sys/kernel/config/nvmet/subsystems/testnqn/namespaces/1
echo /dev/nvme0n1 > /sys/kernel/config/nvmet/subsystems/testnqn/namespaces/1/device_path
echo 1 > /sys/kernel/config/nvmet/subsystems/testnqn/namespaces/1/enable

mkdir /sys/kernel/config/nvmet/ports/1
echo 192.168.1.10 > /sys/kernel/config/nvmet/ports/1/addr_traddr
echo tcp > /sys/kernel/config/nvmet/ports/1/addr_trtype
echo 4420 > /sys/kernel/config/nvmet/ports/1/addr_trsvcid
ln -s /sys/kernel/config/nvmet/subsystems/testnqn /sys/kernel/config/nvmet/ports/1/subsystems/

# Client: connect
modprobe nvme-tcp
nvme discover -t tcp -a 192.168.1.10 -s 4420
nvme connect -t tcp -a 192.168.1.10 -s 4420 -n testnqn
nvme list  # see the connected namespace

# RDMA (Remote Direct Memory Access):
# Key benefit: bypasses OS TCP/IP stack entirely
# Data moves from remote memory to local memory WITHOUT CPU involvement
# This is why NVMe/RoCE achieves 50-100µs latency (vs 500µs+ for iSCSI)

# RoCE (RDMA over Converged Ethernet):
# Layer 2: requires Priority Flow Control (PFC) to prevent packet drops
# RoCEv2: Layer 3 routable (uses UDP)
# Hardware: Mellanox/NVIDIA ConnectX, Chelsio, Broadcom bnxt

# RDMA verbs (programming model):
# QP (Queue Pair): a send queue + receive queue, the RDMA communication endpoint
# WR (Work Request): what you submit to a QP
# CQ (Completion Queue): where completions land
# MR (Memory Region): memory registered for RDMA (pinned, not swappable)
# Send/Recv: two-sided (both sides involved)
# RDMA Write/Read: one-sided (source can write/read remote memory directly)

cat /proc/net/dev        # check NIC statistics
ibstat                   # check InfiniBand/RoCE adapter status
perfquery                # InfiniBand performance counters
ethtool -S eth1 | grep -i rdma  # RoCE stats per NIC
```


---


## Day 41-43 — Replication vs Erasure Coding


### Replication


```javascript
Simple replication: store N full copies of the data

3x replication example:
  Original data: [Block A] [Block B] [Block C]
  Node 1: [A] [B] [C]      (primary)
  Node 2: [A] [B] [C]      (replica 1)
  Node 3: [A] [B] [C]      (replica 2)

Fault tolerance: survive loss of (N-1) nodes
  3x = survive loss of 2 nodes, still have 1 copy

Storage overhead: N times the original size
  3x replication = 3x storage cost

Read performance: can serve reads from any replica (3x read IOPS)
Write performance: must write to all N replicas (slower than single write)
Recovery: after a node failure, copy the full data back (expensive for large data)
```


### Erasure Coding


```javascript
Erasure coding: split data into k data chunks + m parity chunks (k+m = n total)
Can recover from loss of any m chunks out of k+m

RS(6,3) example -- 6 data + 3 parity:
  Original 6GB file split into 6 x 1GB data chunks:
  [D1][D2][D3][D4][D5][D6] -> math produces -> [P1][P2][P3]

  Store across 9 nodes: D1 D2 D3 D4 D5 D6 P1 P2 P3
  Any 6 of the 9 chunks can reconstruct the full file
  Tolerates loss of any 3 nodes

Storage overhead: (k+m)/k times the original
  RS(6,3): 9/6 = 1.5x  (vs 3x for 3x replication)
  RS(12,4): 16/12 = 1.33x
  Massive storage savings at large scale!

Trade-offs vs replication:
  Pro: lower storage overhead (1.3-1.5x vs 2-3x)
  Con: higher CPU cost (encoding/decoding math)
  Con: read amplification for reconstruction (must read k chunks to serve any chunk)
  Con: higher latency (must gather k chunks even for a read)
  Pro: better fault tolerance per storage unit at large scale

Use cases:
  Replication: latency-sensitive workloads, small data sets, warm data
  Erasure coding: large-scale object stores, cold/archive storage, backup
  Examples: Ceph RBD uses replication for block, Ceph RADOS uses EC for object
            S3 uses EC internally, HDFS moved from replication to EC for cold data

Reed-Solomon math (conceptual):
  Treat each chunk as a polynomial coefficient
  Compute parity as evaluations of the polynomial at extra points
  Reconstruction = polynomial interpolation from any k points
```


---


## Day 44-45 — Phase 3 Capstone: fio Benchmark Suite


**Project: Build a comprehensive storage benchmark harness**


```bash
# scripts/benchmark.sh
#!/bin/bash
# Runs a full storage characterization suite
# Usage: ./benchmark.sh /dev/nvme0n1 results/

DEVICE=$1
OUTDIR=$2
mkdir -p $OUTDIR

run_fio() {
    local name=$1; shift
    echo "Running $name..."
    fio --output-format=json "$@" > $OUTDIR/$name.json 2>&1
    # Parse and print key metrics
    python3 -c "
import json, sys
data = json.load(open('$OUTDIR/$name.json'))
job = data['jobs'][0]
read = job['read']
write = job['write']
print(f'  Read:  {read[\"iops\"]:.0f} IOPS  {read[\"bw\"] / 1024:.1f} MB/s  p99={read[\"lat_ns\"][\"percentile\"][\"99.000000\"] / 1000:.0f} µs')
if write['iops'] > 0:
    print(f'  Write: {write[\"iops\"]:.0f} IOPS  {write[\"bw\"] / 1024:.1f} MB/s  p99={write[\"lat_ns\"][\"percentile\"][\"99.000000\"] / 1000:.0f} µs')
"
}

# 1. Sequential read throughput
run_fio seq-read-throughput \
    --name=seq-read --rw=read --bs=128k --size=8G \
    --numjobs=1 --iodepth=32 --direct=1 --ioengine=libaio \
    --filename=$DEVICE

# 2. Sequential write throughput
run_fio seq-write-throughput \
    --name=seq-write --rw=write --bs=128k --size=8G \
    --numjobs=1 --iodepth=32 --direct=1 --ioengine=libaio \
    --filename=$DEVICE

# 3. Random 4K read IOPS (max)
run_fio rand-read-iops-max \
    --name=rand-read --rw=randread --bs=4k --size=8G \
    --numjobs=8 --iodepth=32 --direct=1 --ioengine=libaio \
    --filename=$DEVICE

# 4. Random 4K write IOPS (max)
run_fio rand-write-iops-max \
    --name=rand-write --rw=randwrite --bs=4k --size=8G \
    --numjobs=8 --iodepth=32 --direct=1 --ioengine=libaio \
    --filename=$DEVICE

# 5. Latency (QD=1, single-threaded)
run_fio latency-qd1 \
    --name=latency --rw=randread --bs=4k --size=8G \
    --numjobs=1 --iodepth=1 --direct=1 --ioengine=libaio \
    --filename=$DEVICE \
    --percentile_list=50,90,95,99,99.9,99.99

# 6. Mixed 70/30 read/write (database simulation)
run_fio mixed-70-30 \
    --name=mixed --rw=randrw --rwmixread=70 --bs=8k --size=8G \
    --numjobs=4 --iodepth=32 --direct=1 --ioengine=libaio \
    --filename=$DEVICE

echo "Done. Results in $OUTDIR/"
```


**Also: answer in writing:**

1. You ran these benchmarks and got 500K IOPS at QD=32 but only 80K IOPS at QD=1. Why?
2. Sequential throughput is 6 GB/s but random 4K throughput is 800 MB/s. Why?
3. A customer reports their NVMe drive achieves 1M IOPS in benchmarks but only 50K IOPS in production with their database. What are the likely causes?

---


## Interview questions from the guide

1. **"Explain the difference between block, file, and object storage with a real example of each."**
2. **"What is IOPS? How is it related to throughput and block size?"**
3. **"What is queue depth? How does it affect NVMe vs HDD performance?"**
4. **"Compare NFS and iSCSI. When would you use each?"**
5. **"What is RDMA and why does NVMe/RoCE have lower latency than iSCSI?"**
6. **"Compare erasure coding and replication. When would you choose each?"**
7. **"How would you benchmark a new storage system before production use?"**
8. **"What does p99 latency mean and why is it more important than average latency?"**
