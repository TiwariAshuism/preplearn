---
source: notion
title: "🗃️ Storage Engineering Interview Roadmap — 120 Days"
slug: "storage-engineering-interview-roadmap-120-days"
notionId: "380da883bddd81e1abc7c118d4e018d9"
notionRootId: "380da883bddd81e1abc7c118d4e018d9"
parent: null
children: ["all-120-days-reference-storage-engineering-roadmap","phase-8-system-design-and-interview-prep-days-106-120","phase-7-performance-engineering-days-91-105","phase-6-c-systems-programming-days-76-90","phase-4-distributed-storage-systems-days-46-60","phase-3-storage-fundamentals-days-31-45","phase-2-linux-internals-and-os-days-16-30","phase-1-go-for-infrastructure-days-1-15"]
order: 0
icon: "🗃️"
cover: null
---
> **From software engineer to storage/distributed-systems engineer.** This roadmap is built specifically for roles at companies like Pure Storage, Cohesity, Rubrik, NetApp, Qumulo, VAST Data, WEKA, MinIO, Portworx, and cloud storage teams at AWS/GCP/Azure. DSA alone is not enough — these companies hire for domain depth.

---


## 📌 What makes storage company interviews different


Based on the interview guide:

> _"For candidates with 2-3+ years of experience, they commonly expect domain-specific exposure in areas like storage systems, Linux internals, distributed systems, storage protocols, Kubernetes storage, performance debugging, C++, or Go infrastructure work."_

The expected signal is:

- **Linux internals** — VFS, page cache, inode, block layer, fsync, iptables
- **Storage protocols** — NFS, iSCSI, NVMe/TCP, NVMe/RoCE, RDMA, SMB
- **Distributed storage design** — replication, erasure coding, consistency, Raft, GFS, Dynamo, Ceph
- **Kubernetes storage** — PV/PVC/StorageClass, CSI drivers, dynamic provisioning, snapshots
- **Go systems programming** — goroutines, channels, pipelines, pprof, high-throughput patterns
- **C++ systems programming** — RAII, smart pointers, move semantics, atomics, sanitizers
- **Performance debugging** — fio, iostat, perf, pprof, USE method, p99 latency, IOPS/throughput analysis

---


## 🗺️ 120-Day Roadmap at a glance


| Phase                                    | Days    | Focus                                                                       | Project                                |
| ---------------------------------------- | ------- | --------------------------------------------------------------------------- | -------------------------------------- |
| Phase 1 — Go for Infrastructure          | 1–15    | Go concurrency, I/O, pipelines, profiling                                   | High-throughput file processor in Go   |
| Phase 2 — Linux Internals & OS           | 16–30   | Virtual memory, VFS, inodes, block layer, iptables                          | Linux I/O tracer + iptables lab        |
| Phase 3 — Storage Fundamentals           | 31–45   | Block/file/object storage, IOPS/latency/throughput, storage protocols       | fio benchmark suite + protocol lab     |
| Phase 4 — Distributed Storage Systems    | 46–60   | Raft, GFS, Dynamo, Ceph, erasure coding, replication, consistency           | Mini distributed object store in Go    |
| Phase 5 — Kubernetes Storage             | 61–75   | PV/PVC/StorageClass, CSI drivers, NFS/iSCSI/SMB with K8s, Helm              | Deploy a CSI driver + Helm chart       |
| Phase 6 — C++ Systems Programming        | 76–90   | RAII, smart pointers, threads, atomics, memory layout, sanitizers           | C++ storage buffer manager             |
| Phase 7 — Performance Engineering        | 91–105  | fio, pprof, perf, iostat, strace, USE method, debugging stories             | Performance audit of a real workload   |
| Phase 8 — System Design & Interview Prep | 106–120 | Design distributed object store, backup system, CSI driver; mock interviews | Full design docs + 2 debugging stories |


---


## 🏢 Target companies by tier


| Tier                              | Companies                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| Cloud NAS / Global File Systems   | Nasuni, NetApp, Qumulo, VAST Data, WEKA, DDN, CTERA, Panzura     |
| Data Protection / Backup          | Cohesity, Rubrik, Commvault, Veeam, Druva, HYCU, Acronis         |
| Enterprise Primary Storage        | Pure Storage, Dell, HPE, IBM Storage, Hitachi Vantara, Infinidat |
| Object Storage                    | MinIO, Cloudian, Scality, Red Hat Ceph, Wasabi, Cloudflare R2    |
| Kubernetes / Cloud-Native Storage | Portworx, OpenEBS, Longhorn, Rook/Ceph, DataCore, Ondat          |
| Cloud Provider Storage Teams      | AWS S3/EBS/EFS/FSx, GCS, Azure Storage, Oracle OCI               |
| Storage Networking                | NVIDIA/Mellanox, Lightbits Labs, Excelero                        |


---


## 📈 My progress

- **Current phase:** Phase 1
- **Current day:** Day 1 of 120
- **Projects shipped:** 0 / 8
- **Papers read:** 0
- **Mock interviews done:** 0

---


## 🔖 Phase pages

- 🐹 Phase 1 — Go for Infrastructure (Days 1–15)
- 🐧 Phase 2 — Linux Internals & OS (Days 16–30)
- 💾 Phase 3 — Storage Fundamentals (Days 31–45)
- 🌐 Phase 4 — Distributed Storage Systems (Days 46–60)
- ⎈️ Phase 5 — Kubernetes Storage (Days 61–75)
- ⚙️ Phase 6 — C++ Systems Programming (Days 76–90)
- ⚡ Phase 7 — Performance Engineering (Days 91–105)
- 🎯 Phase 8 — System Design & Interview Prep (Days 106–120)

---


## 📘 Core reading list (from your guide)


| Domain              | Resource                                                                                                                                                                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS Foundations      | [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) — chapters on Virtual Memory, File Systems, I/O                                                                                                                                                                            |
| Go Concurrency      | [Go Pipelines](https://go.dev/blog/pipelines), [Effective Go](https://go.dev/doc/effective_go), [Go Memory Model](https://go.dev/ref/mem)                                                                                                                                   |
| Go Performance      | [Go pprof](https://go.dev/blog/pprof), [Go GC Guide](https://go.dev/doc/gc-guide), [Go Diagnostics](https://go.dev/doc/diagnostics)                                                                                                                                         |
| Go Real World       | [Processing 1M transactions — Part 1](https://blog.karoko.dev/processing-1-million-transactions-in-under-a-second-using-go-part-1-98c9079375ac)  • [Part 2](https://blog.karoko.dev/processing-1-million-transactions-in-under-a-second-using-go-part-2-c075800fe7a4)       |
| Storage Performance | [IOPS, Throughput, Latency Explained](https://simplyblock.io/blog/iops-throughput-latency-explained/), [Art of Storage Performance Optimization](https://simplyblock.io/blog/art-of-storage-performance-optimization/)                                                      |
| Storage Protocols   | [NVMe/TCP vs NVMe/RoCE](https://simplyblock.io/blog/nvme-tcp-vs-nvme-roce/), [What is RDMA?](https://simplyblock.io/glossary/what-is-rdma/)                                                                                                                                 |
| Erasure Coding      | [What is Erasure Coding?](https://simplyblock.io/blog/what-is-erasure-coding-a-shield-against-data-loss/)                                                                                                                                                                   |
| Distributed Storage | [GFS Paper](https://research.google/pubs/the-google-file-system/), [Dynamo Paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), [Raft Paper](https://raft.github.io/raft.pdf), [Ceph Architecture](https://docs.ceph.com/en/latest/architecture/) |
| Kubernetes Storage  | [PersistentVolumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/), [CSI Spec](https://github.com/container-storage-interface/spec/blob/master/spec.md), [StorageClasses](https://kubernetes.io/docs/concepts/storage/storage-classes/)                   |
| K8s NAS             | [NFS/SMB/iSCSI with K8s](https://oneuptime.com/blog/post/2025-12-15-how-to-use-nas-storage-with-kubernetes/view)                                                                                                                                                            |
| Linux               | [Linux VFS docs](https://docs.kernel.org/filesystems/vfs.html), [Linux Block docs](https://docs.kernel.org/block/index.html), [man7](https://man7.org/linux/man-pages/)                                                                                                     |
| Performance         | [Brendan Gregg Linux Perf](https://www.brendangregg.com/linuxperf.html), [USE Method](https://www.brendangregg.com/usemethod.html), [fio docs](https://fio.readthedocs.io/en/latest/fio_doc.html)                                                                           |
| C++                 | [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines), [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html), [ThreadSanitizer](https://clang.llvm.org/docs/ThreadSanitizer.html)                                             |


---


## ✅ Final prep checklist (from the guide)

- [ ] Explain block vs file vs object storage with examples
- [ ] Explain IOPS, throughput, latency, p99, queue depth
- [ ] Explain Linux page cache, inode, VFS, and fsync()
- [ ] Compare NFS, iSCSI, NVMe/TCP, NVMe/RoCE, S3
- [ ] Design a distributed object store
- [ ] Explain replication vs erasure coding
- [ ] Debug a PVC stuck in Pending
- [ ] Explain CSI controller vs node plugin
- [ ] Build one Go concurrency project and profile it
- [ ] Build one C++ systems project with RAII, buffers, and sanitizer runs
- [ ] Explain C++ ownership, move semantics, atomics, and memory-layout tradeoffs
- [ ] Run fio and explain the results
- [ ] Prepare two real debugging stories from past work/projects
- [ ] Prepare one storage architecture deep dive for interviews

📅 Daily Tracker