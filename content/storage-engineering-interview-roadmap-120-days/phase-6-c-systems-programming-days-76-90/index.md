---
source: notion
title: "Phase 6 — C++ Systems Programming (Days 76–90)"
slug: "phase-6-c-systems-programming-days-76-90"
notionId: "381da883-bddd-8193-9a84-c5f8f98e056a"
notionRootId: "380da883bddd81e1abc7c118d4e018d9"
parent: "storage-engineering-interview-roadmap-120-days"
children: []
order: 3
icon: "⚙️"
cover: null
---
> **Core insight:** C++ is the primary language for storage firmware, NVMe drivers, and high-performance storage daemons at companies like Pure Storage, NetApp, and VAST Data. The interview expects you to know RAII, move semantics, smart pointers, atomics, and memory layout — and to explain WHY each matters for a storage context.

---


## Day 76-78 — RAII and resource management


```c++
// RAII: Resource Acquisition Is Initialization
// Resources acquired in constructor, released in destructor
// Guarantees no resource leaks even on exceptions

// Storage context: file handle wrapper
class FileHandle {
public:
    explicit FileHandle(const std::string& path, int flags, mode_t mode = 0)
        : fd_(::open(path.c_str(), flags, mode)) {
        if (fd_ < 0) {
            throw std::system_error(errno, std::system_category(),
                                    "open " + path);
        }
    }

    ~FileHandle() noexcept {
        if (fd_ >= 0) {
            ::close(fd_);  // ALWAYS called, even if exception thrown
        }
    }

    // Disable copy (can't have two owners of the same fd)
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;

    // Enable move
    FileHandle(FileHandle&& other) noexcept : fd_(other.fd_) {
        other.fd_ = -1;  // moved-from object no longer owns the fd
    }
    FileHandle& operator=(FileHandle&& other) noexcept {
        if (this != &other) {
            if (fd_ >= 0) ::close(fd_);
            fd_ = other.fd_;
            other.fd_ = -1;
        }
        return *this;
    }

    int fd() const { return fd_; }

    ssize_t pread(void* buf, size_t count, off_t offset) const {
        return ::pread(fd_, buf, count, offset);
    }

    ssize_t pwrite(const void* buf, size_t count, off_t offset) {
        return ::pwrite(fd_, buf, count, offset);
    }

    void fsync() {
        if (::fsync(fd_) < 0) {
            throw std::system_error(errno, std::system_category(), "fsync");
        }
    }

private:
    int fd_;
};

// Usage: no manual cleanup needed
void writeBlock(const std::string& path, uint64_t offset, const std::vector<uint8_t>& data) {
    FileHandle f(path, O_WRONLY | O_CREAT, 0644);
    if (f.pwrite(data.data(), data.size(), offset) < 0) {
        throw std::system_error(errno, std::system_category(), "pwrite");
    }
    f.fsync();
}  // FileHandle destructor closes fd here, even if exception was thrown
```


---


## Day 79-81 — Smart pointers


```c++
// unique_ptr: sole ownership. Zero overhead vs raw pointer.
std::unique_ptr<BlockStore> store = std::make_unique<NVMeBlockStore>("/dev/nvme0n1");
// store is automatically deleted when it goes out of scope

// Transfer ownership (move semantics)
std::unique_ptr<BlockStore> moved = std::move(store);
// store is now nullptr; moved owns the object

// shared_ptr: shared ownership (reference counted)
// Use when multiple objects need to share ownership
std::shared_ptr<ReplicaManager> replica = std::make_shared<ReplicaManager>(config);
std::weak_ptr<ReplicaManager> weak_ref = replica;  // doesn't increase ref count

// Use weak_ptr to break circular references
class WriteContext {
    std::shared_ptr<ReplicaManager> manager_;  // strong reference
    std::weak_ptr<WriteContext> self_;          // weak ref to self (for callbacks)
};

// Rule of thumb for storage systems:
// - unique_ptr for single-owner resources (files, buffers, connections)
// - shared_ptr for shared resources (config objects, thread pools, caches)
// - raw pointer only for non-owning observers (already managed elsewhere)
// - NEVER new/delete directly in modern C++

// Storage buffer pool with unique_ptr
class BufferPool {
public:
    using Buffer = std::unique_ptr<uint8_t[], std::function<void(uint8_t*)>>;

    Buffer acquire(size_t size) {
        std::lock_guard lock(mu_);
        if (!free_buffers_.empty() && free_buffers_.back().second >= size) {
            auto [ptr, cap] = std::move(free_buffers_.back());
            free_buffers_.pop_back();
            return Buffer(ptr.release(), [this, cap](uint8_t* p) {
                release(p, cap);
            });
        }
        // Allocate new buffer (aligned for O_DIRECT)
        uint8_t* raw = nullptr;
        posix_memalign(reinterpret_cast<void**>(&raw), 4096, size);
        return Buffer(raw, [this, size](uint8_t* p) { release(p, size); });
    }

private:
    void release(uint8_t* ptr, size_t cap) {
        std::lock_guard lock(mu_);
        free_buffers_.push_back({std::unique_ptr<uint8_t[]>(ptr), cap});
    }

    std::mutex mu_;
    std::vector<std::pair<std::unique_ptr<uint8_t[]>, size_t>> free_buffers_;
};
```


---


## Day 82-84 — Move semantics and value categories


```c++
// Move semantics: transfer resources without copying
// Critical for storage: moving large buffers, file handles, connections

// Without move: expensive copy of entire buffer
std::vector<uint8_t> data(64 * 1024 * 1024);  // 64MB buffer
std::vector<uint8_t> copy = data;               // COPIES 64MB -- terrible

// With move: constant-time, no data copying
std::vector<uint8_t> moved = std::move(data);  // transfers internal pointer
// data is now empty; moved owns the 64MB

// Perfect forwarding in storage pipelines
template<typename Buffer>
void submitWrite(Buffer&& buf, uint64_t offset) {
    // Forward preserving value category (lvalue/rvalue)
    io_queue_.push(WriteRequest{std::forward<Buffer>(buf), offset});
}

// Move-only types for expressing unique ownership
class WriteRequest {
public:
    WriteRequest(std::vector<uint8_t> data, uint64_t offset, Callback cb)
        : data_(std::move(data)),      // move into member
          offset_(offset),
          callback_(std::move(cb)) {}

    // Non-copyable: one WriteRequest, one owner
    WriteRequest(const WriteRequest&) = delete;
    WriteRequest& operator=(const WriteRequest&) = delete;

    // Movable: can be transferred through queues
    WriteRequest(WriteRequest&&) = default;
    WriteRequest& operator=(WriteRequest&&) = default;

private:
    std::vector<uint8_t> data_;
    uint64_t offset_;
    std::function<void(std::error_code)> callback_;
};
```


---


## Day 85-87 — Concurrency: threads, mutexes, atomics, condition variables


```c++
// Thread-safe write-ahead log for storage
class WriteAheadLog {
public:
    struct LogEntry {
        uint64_t lsn;        // log sequence number
        uint64_t block_id;
        std::vector<uint8_t> data;
        std::chrono::steady_clock::time_point timestamp;
    };

    uint64_t append(uint64_t block_id, std::vector<uint8_t> data) {
        std::unique_lock lock(mu_);
        uint64_t lsn = next_lsn_++;
        entries_.push_back(LogEntry{lsn, block_id, std::move(data),
                                     std::chrono::steady_clock::now()});
        lock.unlock();
        cv_.notify_one();    // wake up flusher thread
        return lsn;
    }

    void waitForDurable(uint64_t lsn) {
        std::unique_lock lock(mu_);
        cv_.wait(lock, [this, lsn] { return durable_lsn_ >= lsn; });
    }

    void flushLoop() {  // runs in background thread
        while (!shutdown_) {
            std::unique_lock lock(mu_);
            cv_.wait_for(lock, std::chrono::milliseconds(10),
                [this] { return !entries_.empty(); });

            auto to_flush = std::move(entries_);
            uint64_t max_lsn = to_flush.empty() ? 0 : to_flush.back().lsn;
            lock.unlock();

            if (!to_flush.empty()) {
                writeToFile(to_flush);   // batch write
                fsync(log_fd_.fd());     // ensure durability

                std::unique_lock lk(mu_);
                durable_lsn_ = max_lsn;
                cv_.notify_all();        // wake up all waiters
            }
        }
    }

private:
    std::mutex mu_;
    std::condition_variable cv_;
    std::vector<LogEntry> entries_;
    uint64_t next_lsn_{0};
    uint64_t durable_lsn_{0};
    std::atomic<bool> shutdown_{false};
    FileHandle log_fd_;
};

// Atomics: lock-free operations for hot paths
struct IOMetrics {
    std::atomic<uint64_t> read_ops{0};
    std::atomic<uint64_t> write_ops{0};
    std::atomic<uint64_t> bytes_read{0};
    std::atomic<uint64_t> bytes_written{0};

    // fetch_add: atomically add and return old value
    // memory_order_relaxed: no synchronization needed for counters
    void recordRead(uint64_t bytes) {
        read_ops.fetch_add(1, std::memory_order_relaxed);
        bytes_read.fetch_add(bytes, std::memory_order_relaxed);
    }
};
```


---


## Day 88-90 — Phase 6 Capstone: C++ Storage Buffer Manager


**Project: Implement a buffer pool manager (core component of any storage engine)**


```c++
// A buffer pool manages a fixed number of in-memory page frames
// Pages are read from disk on demand, evicted when memory is full (LRU/Clock)
// This is the same data structure at the core of PostgreSQL, RocksDB, Ceph

class BufferPoolManager {
public:
    struct Page {
        uint64_t page_id{INVALID_PAGE_ID};
        std::array<uint8_t, PAGE_SIZE> data;
        std::atomic<int> pin_count{0};
        std::atomic<bool> dirty{false};
        std::shared_mutex latch;  // readers hold shared, writers hold exclusive
    };

    static constexpr size_t PAGE_SIZE = 4096;
    static constexpr uint64_t INVALID_PAGE_ID = UINT64_MAX;

    explicit BufferPoolManager(size_t pool_size, std::string disk_path);

    // FetchPage: read page into buffer pool, return reference
    // Pin the page (pin_count++) so it's not evicted while in use
    Page* fetchPage(uint64_t page_id);

    // UnpinPage: allow eviction when pin_count drops to 0
    void unpinPage(uint64_t page_id, bool is_dirty);

    // FlushPage: write dirty page to disk
    void flushPage(uint64_t page_id);

    // NewPage: allocate a new page
    uint64_t newPage();

private:
    Page* evict();  // LRU eviction
    void readFromDisk(uint64_t page_id, Page* frame);
    void writeToDisk(const Page& frame);

    std::vector<Page> frames_;              // the buffer pool frames
    std::unordered_map<uint64_t, size_t> page_table_;  // page_id -> frame index
    std::list<size_t> lru_list_;            // LRU eviction list
    std::mutex pool_mutex_;                 // protects page_table + lru_list
    FileHandle disk_file_;
};
```


**Requirements:**

1. Compile and run with AddressSanitizer (`-fsanitize=address`) and ThreadSanitizer (`-fsanitize=thread`) — both must show zero errors
2. Benchmark: measure throughput (pages/second) for random and sequential page access
3. Demonstrate: buffer pool full, eviction triggers, dirty page flushed to disk before eviction
4. Concurrent access: 16 threads reading/writing different pages — no data races

---


## Interview questions

1. **"What is RAII? Why is it important in storage code?"** Resource leaks (file descriptors, locks, memory) in long-running storage daemons cause failures that are hard to reproduce. RAII makes cleanup automatic and exception-safe.
2. **"Explain the Rule of Five."** If you define any of: destructor, copy constructor, copy assignment, move constructor, move assignment — you should define all five. Storage types that own resources typically delete copy and define move.
3. **"When would you use std::unique_ptr vs std::shared_ptr vs a raw pointer?"** unique_ptr: sole ownership (file handles, buffers). shared_ptr: shared ownership (config, cache entries). Raw pointer: non-owning observer (passed by pointer but not owning).
4. **"What is a data race? How do you detect one?"** Concurrent access to a shared variable where at least one access is a write, without synchronization. Detected with ThreadSanitizer (`-fsanitize=thread`). Prevented with mutexes, atomics, or immutable data.
5. **"Explain memory_order_relaxed vs memory_order_acquire/release."** relaxed: atomic op but no ordering constraints (safe for independent counters). acquire: reads see all writes that happened before the corresponding release. release: writes are visible to the corresponding acquire. Essential for lock-free data structures.
