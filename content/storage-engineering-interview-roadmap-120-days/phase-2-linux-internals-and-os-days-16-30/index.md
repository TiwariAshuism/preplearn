---
source: notion
title: "Phase 2 — Linux Internals & OS (Days 16–30)"
slug: "phase-2-linux-internals-and-os-days-16-30"
notionId: "380da883-bddd-8186-ae12-d243d1bdfc5e"
notionRootId: "380da883bddd81e1abc7c118d4e018d9"
parent: "storage-engineering-interview-roadmap-120-days"
children: []
order: 6
icon: "🐧"
cover: null
---
> **Core insight:** Storage engineers are expected to understand the Linux kernel I/O path end-to-end. When an interviewer asks "what happens when a process calls write()?", they expect you to trace it from the syscall through VFS, the page cache, the block layer, the device driver, and back. This is not trivia — it determines how you design and debug storage systems.

---


## 📚 Day 16–18 — Virtual memory and process address space


### Day 16: Virtual memory fundamentals


**Why storage engineers need this:** memory-mapped I/O (`mmap`) is a core pattern in storage systems. Databases (PostgreSQL, RocksDB), key-value stores, and log-structured merge trees (LSMs) all use `mmap` for data files. You need to understand what happens under the hood.


```javascript
Process virtual address space (per process, 64-bit Linux):

0x00007fffffffffff  <- top of user space
  stack              <- grows downward
  ...
  mmap'd regions     <- libraries, mmap'd files, anonymous mmap
  ...
  heap               <- grows upward (brk/sbrk)
  BSS segment        <- uninitialized globals (zeroed)
  data segment       <- initialized globals
  text segment       <- code (read-only)
0x0000000000000000
```


**Page tables:** the kernel maintains a per-process page table mapping virtual page numbers (VPNs) to physical page frames. The CPU's MMU walks this table on every memory access.


**TLB (Translation Lookaside Buffer):** a hardware cache of recent VPN → PFN translations. A TLB miss forces a page table walk (expensive). Large pages (hugepages: 2MB or 1GB) dramatically reduce TLB pressure — used by databases and storage engines for large memory pools.


**Page fault:** accessing a virtual page with no page table entry triggers a page fault. The kernel's fault handler:

1. Checks if the access is valid (within a VMA)
2. If mapping a file: reads the page from disk into a free physical frame
3. Updates the page table entry
4. Returns to user code, which retries the instruction

**Minor vs major fault:** minor = page is in memory but not mapped (e.g., first access to a zeroed page). Major = page must be read from disk (I/O required). `cat /proc/PID/status | grep VmRSS` shows resident set size.


### Day 17: mmap for storage systems


```c
// mmap: map a file into virtual address space
// Reads/writes to the mapped memory automatically read/write the file
// The kernel manages page-in/page-out transparently

#include <sys/mman.h>
#include <fcntl.h>

int fd = open("/data/storage.db", O_RDWR);
struct stat st;
fstat(fd, &st);

void *data = mmap(
    NULL,               // let kernel choose address
    st.st_size,         // map entire file
    PROT_READ | PROT_WRITE,
    MAP_SHARED,         // changes visible to other processes + written to file
    fd,
    0                   // offset in file
);

// Now access data directly as memory -- no read()/write() syscalls
uint64_t *header = (uint64_t *)data;
header[0] = 0xDEADBEEF;  // writes directly to the file page

// msync: ensure dirty pages are flushed to disk
// Without this, data may be lost on crash (in-kernel page cache only)
msync(data, st.st_size, MS_SYNC);  // synchronous flush
msync(data, st.st_size, MS_ASYNC); // async flush (kernel decides when)

munmap(data, st.st_size);
close(fd);
```


**Interview question: "When should you use mmap vs read()/write()?"**

- `mmap` advantage: zero-copy random access, no syscall per read, kernel handles caching
- `mmap` disadvantage: no control over I/O timing, TLB flush cost on unmap, SIGBUS on I/O error (not a recoverable errno), hard to control which pages are resident
- Storage systems that manage their own cache (use O_DIRECT): prefer read()/write()
- Storage systems that let the kernel cache (databases like SQLite): mmap works well

### Day 18: Huge pages


```bash
# Transparent Huge Pages (THP)
cat /sys/kernel/mm/transparent_hugepage/enabled
# always [madvise] never

# Advise the kernel: this region benefits from huge pages
madvise(data, size, MADV_HUGEPAGE);

# Explicit huge pages (preallocated 2MB pages)
# Used by storage databases needing guaranteed low-latency memory
echo 1024 > /proc/sys/vm/nr_hugepages  # reserve 1024 x 2MB pages

// In C: allocate from huge page pool
void *buf = mmap(NULL, 2*1024*1024, PROT_READ|PROT_WRITE,
                 MAP_PRIVATE|MAP_ANONYMOUS|MAP_HUGETLB, -1, 0);
```


---


## 📚 Day 19–23 — VFS, inodes, and the kernel file system layer


### Day 19: VFS (Virtual File System)


**What VFS does:** provides a uniform API (`open`, `read`, `write`, `stat`) across all file system implementations (ext4, XFS, btrfs, NFS, tmpfs, procfs). Each filesystem implements VFS operations.


```javascript
User space:  open("/data/file.txt", O_RDONLY)
                |
 Syscall:     sys_openat()      <- syscall table entry
                |
 VFS layer:   do_filp_open()
              path_lookup()    <- resolves path to dentry/inode
              vfs_open()
                |
 FS layer:    ext4_file_open()  <- filesystem-specific handler
                |
 Block layer: submit_bio()      <- I/O request
                |
 Driver:      NVMe/SCSI/virtio driver
```


**Key VFS data structures:**


```c
// inode: one per file, stores metadata (NOT filename or location)
struct inode {
    umode_t         i_mode;       // permissions (rwxrwxrwx + type bits)
    uid_t           i_uid;        // owner
    gid_t           i_gid;
    loff_t          i_size;       // file size in bytes
    struct timespec i_atime;      // access time
    struct timespec i_mtime;      // modification time
    struct timespec i_ctime;      // inode change time
    blkcnt_t        i_blocks;     // 512B blocks allocated
    unsigned long   i_ino;        // inode number (unique per filesystem)
    struct super_block *i_sb;     // which filesystem this belongs to
    const struct inode_operations *i_op;  // fs-specific ops
    const struct file_operations  *i_fop; // file ops (read, write, ioctl)
    struct address_space *i_mapping;      // page cache for this file
};

// dentry: directory entry, maps a name to an inode
struct dentry {
    struct qstr         d_name;   // the filename component ("file.txt")
    struct inode       *d_inode;  // the inode this name points to
    struct dentry      *d_parent; // parent directory dentry
    struct hlist_node   d_alias;  // links to other dentries for same inode (hardlinks)
};

// file: per-open-file-descriptor state
struct file {
    struct path     f_path;       // dentry + vfsmount
    struct inode   *f_inode;
    loff_t          f_pos;        // current file position (seek pointer)
    unsigned int    f_flags;      // O_RDONLY, O_WRONLY, O_RDWR, etc.
    const struct file_operations *f_op;
};
```


**Key interview point:** `ls -i` shows inode numbers. Hardlinks: two dentries pointing to the same inode. Deleting a file: decrements `i_nlink`; inode is freed when `i_nlink == 0` AND no open file descriptors.


### Day 20: The page cache


**The page cache is the center of Linux I/O performance.** Almost all file I/O goes through it.


```javascript
read() call:
  1. VFS checks page cache (address_space associated with inode)
  2. Cache HIT: copy data from page to user buffer. Done. No disk I/O.
  3. Cache MISS: allocate a new page, submit bio to read page from disk
                 When bio completes, mark page uptodate, copy to user buffer

write() call:
  1. Write data to page cache (mark page dirty)
  2. Return immediately (write() returns WITHOUT hitting disk!)
  3. Kernel writeback thread (pdflush/kworker) flushes dirty pages
     - triggered by: dirty ratio threshold, timeout (30s default), or fsync()
```


```bash
# Inspect page cache state
cat /proc/meminfo | grep -E 'Cached|Dirty|Writeback'

# Free page cache (testing: measure cold-cache performance)
echo 3 > /proc/sys/vm/drop_caches

# Show which files are in page cache (needs pcstat tool or fincore)
python3 -c "
import os
path = '/data/large-file.bin'
with open(path) as f:
    import mmap
    m = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
    print(f'File mapped: {len(m)} bytes')
"

# vm.dirty_ratio: % of total RAM that can be dirty before writes block
# vm.dirty_background_ratio: % that triggers background writeback
cat /proc/sys/vm/dirty_ratio          # default 20 (20% of RAM)
cat /proc/sys/vm/dirty_background_ratio  # default 10
```


### Day 21: fsync() and data durability


**Critical for storage engineering interviews:**


```c
// write() puts data in page cache -- survives process crash, NOT power failure
write(fd, data, size);

// fsync(): flush page cache to DURABLE STORAGE
// Blocks until:
//   1. All dirty pages for this file are written to disk
//   2. Drive's write cache is flushed (FUA or flush command sent to drive)
fsync(fd);  // guarantees durability

// fdatasync(): like fsync but skips inode metadata update (atime, mtime)
// Faster when you only care about data durability, not metadata
fdatasync(fd);

// O_SYNC: every write() is automatically synced before returning
int fd = open(path, O_WRONLY | O_SYNC);

// O_DSYNC: sync data but not metadata (like fdatasync per write)
int fd = open(path, O_WRONLY | O_DSYNC);

// The durability hierarchy (fastest to slowest, weakest to strongest):
// write()              -> in page cache only
// write() + msync(ASYNC) -> background flush started
// write() + msync(SYNC)  -> guaranteed in OS buffer
// write() + fdatasync()  -> data on durable storage
// write() + fsync()      -> data + metadata on durable storage
// write() with O_DIRECT  -> bypasses page cache (you handle caching)
// write() with O_DSYNC   -> each write is data-synced
```


**Interview question: "Explain how PostgreSQL ensures durability."**

- WAL (Write-Ahead Log): every change is written to WAL first
- `fsync()` called on WAL segment before transaction is committed
- Data pages can be flushed lazily (checkpoint process)
- On crash: replay WAL from last checkpoint to reconstruct consistent state

### Day 22: The block layer


```javascript
VFS / filesystem
     |
 Block layer
  - bio (block I/O) structures: the unit of block I/O
  - I/O scheduler: reorders/merges bios for efficiency
    - deadline: for HDDs (prioritize reads, prevent starvation)
    - mq-deadline: multi-queue variant (NVMe)
    - none: NVMe SSDs (already fast, no reordering needed)
  - blk-mq (multi-queue): parallel submission to multiple hardware queues
     |
Device driver (NVMe, SCSI, virtio-blk)
     |
Physical device (NVMe SSD, HDD, SAN LUN)
```


```bash
# Check I/O scheduler per device
cat /sys/block/sda/queue/scheduler
cat /sys/block/nvme0n1/queue/scheduler

# Change scheduler
echo mq-deadline > /sys/block/sda/queue/scheduler

# Queue depth: how many I/Os can be submitted concurrently
cat /sys/block/nvme0n1/queue/nr_requests

# Sector size: physical block size of the device
cat /sys/block/nvme0n1/queue/physical_block_size
cat /sys/block/nvme0n1/queue/logical_block_size

# iostat: monitor block layer in real time
iostat -x -d 1 nvme0n1
# Key columns: r/s, w/s (IOPS), rkB/s, wkB/s (throughput)
#              await (avg latency ms), %util (saturation)
```


### Day 23: iptables and network plumbing (storage networking context)


```bash
# iptables processes packets through chains:
# PREROUTING -> (FORWARD | INPUT) -> POSTROUTING
# PREROUTING -> routing decision -> INPUT (if for local) or FORWARD (if route)

# Storage context: firewall rules for iSCSI initiator/target
# Allow iSCSI target (port 3260) from specific initiator subnet
iptables -A INPUT -p tcp --dport 3260 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 3260 -j DROP  # deny all others

# Allow NFS (port 2049)
iptables -A INPUT -p tcp --dport 2049 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p udp --dport 2049 -s 10.0.0.0/8 -j ACCEPT

# View rules with packet/byte counters
iptables -L -v -n

# Conntrack: stateful tracking of connections
# NFS and iSCSI need ESTABLISHED,RELATED to be allowed
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# ip route: for RDMA/RoCE routing
ip route add 192.168.2.0/24 via 192.168.1.1 dev eth1

# Network namespaces: used by Kubernetes for pod isolation
ip netns list
ip netns exec pod-ns-xyz ip addr
```


---


## 📚 Day 24–28 — Linux tracing and debugging tools


### Day 24: strace — trace syscalls


```bash
# Trace all syscalls of a storage process
strace -p <PID>

# Filter to I/O-related syscalls only
strace -e trace=read,write,open,close,fsync,pread64,pwrite64 -p <PID>

# Trace with timestamps and duration
strace -T -tt -e trace=read,write mycommand
# -T: show time spent in each syscall
# -tt: show absolute timestamp

# Count syscall frequency
strace -c mycommand
# Output: shows calls, errors, time per syscall type
# Typical for a write-heavy storage process:
# pwrite64: most frequent, most time
# fsync: occasional, high latency
# brk: heap expansion

# Trace a process + all children
strace -f mycommand
```


### Day 25: lsof, /proc, and kernel interfaces


```bash
# lsof: list open files
lsof -p <PID>              # all files opened by process
lsof /dev/nvme0n1          # who has this device open
lsof -i :3260              # who has iSCSI port open
lsof +D /data/storage      # all open files under /data/storage

# /proc filesystem: runtime kernel state
cat /proc/<PID>/maps        # virtual address space layout
cat /proc/<PID>/status      # VmRSS (resident), VmSwap, Threads, FDSize
cat /proc/<PID>/io          # rchar, wchar, read_bytes, write_bytes (I/O accounting)
cat /proc/<PID>/net/tcp     # open TCP connections
ls /proc/<PID>/fd/          # file descriptors (symbolic links to actual files)
cat /proc/diskstats         # per-device I/O stats (basis for iostat)
cat /proc/meminfo           # system memory breakdown

# /sys/block: block device settings and stats
cat /sys/block/nvme0n1/stat  # reads, read merges, sectors read, read time (ms), ...

# dmesg: kernel ring buffer
dmesg -w                    # follow new messages
dmesg | grep -i 'nvme\|ata\|scsi\|error'
```


### Day 26-28: perf — Linux performance tool


```bash
# CPU profiling: find hot functions in a storage daemon
perf record -g -p <PID> sleep 30  # sample for 30 seconds
perf report --sort=dso,sym         # flame-graph-ready output

# perf stat: hardware counter summary
perf stat -p <PID> sleep 10
# Shows: instructions, cycles, IPC, cache-misses, branch-misses
# For storage: watch for:
#   Low IPC (< 1.0): memory bound or I/O waiting
#   High LLC cache misses: working set doesn't fit in L3 cache

# perf trace: like strace but lower overhead
perf trace -p <PID> sleep 5

# Block I/O latency distribution (histogram)
perf record -e block:block_rq_complete -a sleep 5
perf script | awk '{print $5}' | sort -n  # latencies

# Or use BPF-based biolatency (from BCC tools)
biolatency -D 10  # histogram of I/O latency over 10 seconds
biosnoop          # per-I/O latency with process name and block number
```


---


## 📚 Day 29–30 — Phase 2 Capstone Project: Linux I/O Tracer


**Project: Build a Go service that profiles its own I/O path and reports kernel-level stats**


```javascript
Cmd: io-profiler
  - Opens a file with O_DIRECT and O_SYNC for maximum control
  - Writes 10,000 x 4KB blocks sequentially
  - Writes 10,000 x 4KB blocks randomly
  - Reads back all blocks, verifying checksums
  - Calls fsync() and measures duration
  - Reports:
      - Bytes written / read
      - IOPS (sequential and random)
      - Throughput (MB/s)
      - Average and p99 latency per operation
      - /proc/<PID>/io counters before and after
```


**Additionally (manual lab):**

1. Run strace on your io-profiler and explain every pwrite64/pread64/fsync call
2. Compare: run with O_DIRECT vs without. Explain the difference in throughput using your page cache knowledge.
3. Run `iostat -x 1` while the profiler runs. Identify: IOPS, throughput, %util, await. Explain what each column means.
4. Answer in writing: "A storage daemon's write latency suddenly jumped from 1ms to 50ms. Walk me through your debugging process using the Linux tools you know."

---


## ⚠️ Common interview questions from the guide

1. **"What happens when a process calls write() on Linux?"** — syscall → VFS → page cache (marks page dirty) → returns to user space. Kernel writeback thread flushes dirty pages later. Data is NOT on disk until fsync() or writeback.
2. **"Explain the difference between fsync(), fdatasync(), and O_SYNC."** — fsync: flush data + inode metadata. fdatasync: flush data only (no inode update). O_SYNC: each write() waits for data sync before returning.
3. **"What is the page cache and why does it matter for storage performance?"** — the page cache is kernel memory holding copies of file data. Reads served from cache are orders of magnitude faster than disk reads. Write coalescing (many small writes merged into one large I/O) dramatically improves throughput.
4. **"What is an inode? What does it contain? What doesn't it contain?"** — inode contains: permissions, owner, size, timestamps, block pointers (or extent tree). Does NOT contain: filename (that's in the dentry/directory), file data (that's in data blocks or page cache).
5. **"How does a hardlink differ from a symlink?"** — hardlink: two dentries pointing to the same inode. Survives deletion of original. Can't cross filesystems. Symlink: a file whose content is a path. Breaks if target is deleted. Can cross filesystems.
6. **"Why would you use O_DIRECT?"** — to bypass the kernel page cache and take full control of caching in user space. Used by databases (PostgreSQL, MySQL with innodb_flush_method=O_DIRECT) and storage engines that have their own buffer pool. Trades kernel cache management for predictable latency and cache control.
