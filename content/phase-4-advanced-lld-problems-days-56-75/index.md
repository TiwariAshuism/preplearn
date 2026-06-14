---
source: notion
title: "Phase 4 — Advanced LLD Problems (Days 56–75)"
slug: "phase-4-advanced-lld-problems-days-56-75"
notionId: "35ada883-bddd-8133-b9f9-fabe421eec6d"
notionRootId: "35ada883bddd813694d3fa44eb7ceee9"
parent: "90-day-lld-roadmap-low-level-system-design"
children: []
order: 1
icon: "⚙️"
cover: null
---
> **Core insight:** Phase 3 problems were toy systems. Phase 4 problems are infrastructure components that real engineers build and maintain. The design bar is higher: thread safety is not optional, extensibility must be provable, and every interface must be justifiable.

---


## 🧠 Why this phase exists


Rate limiters, caches, pub-sub systems — these are not interview puzzles. They are production infrastructure that runs inside every large tech company. Designing them correctly requires combining OOP, design patterns, concurrency, and algorithmic thinking simultaneously. This phase is where LLD meets system engineering.


---


## 💻 Problems in order


### Day 56–58 — Rate Limiter


**Requirements:**

- Limit requests per user, per IP, per endpoint
- Multiple algorithms: Token Bucket, Sliding Window Counter, Fixed Window
- Thread-safe: handle concurrent requests correctly
- Pluggable backend: in-memory for single instance, Redis-backed for distributed
- Return: is request allowed? How many remaining? Reset time?

**Entities:** `RateLimiter`, `RateLimitRule`, `RateLimitResult`, `RateLimitAlgorithm`, `StorageBackend`, `RateLimiterConfig`


**Key design decisions:**


**Algorithm as Strategy pattern:**


```javascript
interface RateLimitAlgorithm {
    RateLimitResult allowRequest(String key, RateLimitRule rule);
}
class TokenBucketAlgorithm implements RateLimitAlgorithm { ... }
class SlidingWindowCounterAlgorithm implements RateLimitAlgorithm { ... }
class FixedWindowAlgorithm implements RateLimitAlgorithm { ... }
```


`RateLimiter` depends on `RateLimitAlgorithm` interface. Swap algorithms at config time.


**Storage as Strategy pattern:**


```javascript
interface StorageBackend {
    long getCount(String key);
    void increment(String key, Duration window);
    boolean setIfAbsent(String key, long value, Duration ttl);
}
class InMemoryStorage implements StorageBackend { ... }  // ConcurrentHashMap
class RedisStorage implements StorageBackend { ... }     // Redis commands
```


**Thread safety for Token Bucket:**

- `Map<String, TokenBucket>` with `ConcurrentHashMap`.
- Each `TokenBucket` uses `AtomicLong tokens` and `AtomicLong lastRefillTime`.
- `refill()` and `consume()` must be atomic: use `synchronized` on the bucket instance or `compareAndSet` loop.

**Rule hierarchy:** `RateLimitRule` has `limit` (count) and `window` (duration). Rules are looked up in priority order: user-specific rule → endpoint rule → global default. `RateLimiterConfig` manages the rule hierarchy.


**RateLimitResult:**


```javascript
class RateLimitResult {
    boolean allowed;
    long remainingTokens;
    Instant resetTime;
    String limitedBy;  // which rule triggered
}
```


**Multi-tier limiting:** apply user rule first. If allowed, apply endpoint rule. If allowed, allow request. Each tier is a separate `allowRequest()` call with a different key pattern: `user:{userId}`, `endpoint:{path}`, `ip:{address}`.


**SOLID check:** S: algorithm computes the limit check. Config manages rules. Storage manages state. Three classes. O: new algorithm = new class, zero changes to `RateLimiter`. D: `RateLimiter` depends on interfaces only.


### Day 59–61 — In-memory Cache (LRU + LFU)


**Requirements:**

- Fixed capacity. Evict on overflow.
- LRU (Least Recently Used) eviction policy
- LFU (Least Frequently Used) eviction policy
- O(1) get and put for both
- Thread-safe
- Pluggable eviction policy

**Entities:** `Cache<K,V>`, `EvictionPolicy<K>`, `CacheEntry<K,V>`, `LRUEvictionPolicy<K>`, `LFUEvictionPolicy<K>`


**LRU implementation (O(1) get + put):**

- `HashMap<K, Node>` for O(1) lookup.
- `DoublyLinkedList` maintaining access order. Head = most recently used. Tail = LRU victim.
- On `get(key)`: move node to head. O(1) with direct node reference from map.
- On `put(key, value)`: add to head. If capacity exceeded, remove tail node AND remove from map.
- On eviction: remove tail. O(1).

**LFU implementation (O(1) get + put):**

- `HashMap<K, Node>` for O(1) lookup.
- `HashMap<Integer, DoublyLinkedList>` mapping frequency → list of nodes at that frequency.
- `minFrequency` variable tracks the eviction target.
- On `get(key)`: increment node’s frequency. Move from `freqMap[freq]` to `freqMap[freq+1]`. If `freqMap[minFrequency]` is now empty, increment `minFrequency`.
- On eviction: remove tail of `freqMap[minFrequency]`. O(1).

**Eviction as Strategy:**


```javascript
interface EvictionPolicy<K> {
    void onAccess(K key);
    void onInsert(K key);
    K evict();
}
class LRUEvictionPolicy<K> implements EvictionPolicy<K> { ... }
class LFUEvictionPolicy<K> implements EvictionPolicy<K> { ... }
```


`Cache` is injected with `EvictionPolicy`. Adding TTL-based eviction = new `TTLEvictionPolicy`, zero changes to `Cache`.


**Thread safety:** `ReadWriteLock`. `get()` acquires read lock (multiple concurrent readers). `put()` acquires write lock (exclusive). This maximises read throughput under concurrent access.


**Cache decorator for TTL:** wrap the base `Cache` in a `TTLCache` decorator that checks expiry on `get()` and runs a background cleanup thread. Decorator pattern.


**SOLID check:** O: adding `ARCEvictionPolicy` (Adaptive Replacement Cache) = new class, zero changes to `Cache`. S: `Cache` manages storage. `EvictionPolicy` manages eviction order. Two separate responsibilities.


### Day 62–64 — Pub-Sub Message System


**Requirements:**

- Topics: create, delete
- Publishers: publish messages to a topic
- Subscribers: subscribe to a topic, receive messages
- Multiple subscribers per topic (fan-out)
- Subscriber types: synchronous (in-process) and async (background thread)
- Message retention: keep N last messages per topic
- At-least-once delivery: retry if subscriber fails

**Entities:** `MessageBroker`, `Topic`, `Message`, `Publisher`, `Subscriber`, `SubscriberGroup`, `MessageQueue`, `DeliveryWorker`


**Key design decisions:**


**Observer pattern as the core:**


```javascript
interface Subscriber {
    String getId();
    void onMessage(Message message);
}
class SyncSubscriber implements Subscriber { ... }   // calls handler inline
class AsyncSubscriber implements Subscriber { ... }  // puts message on internal queue
```


**Topic structure:**


```javascript
class Topic {
    String name;
    List<Subscriber> subscribers;           // thread-safe: CopyOnWriteArrayList
    Deque<Message> messageLog;             // bounded, last N messages
    
    void publish(Message msg) {
        messageLog.addLast(msg);
        for (Subscriber s : subscribers) s.onMessage(msg);
    }
    void subscribe(Subscriber s) { subscribers.add(s); }
}
```


**Async delivery with retry:**

- `AsyncSubscriber` has a bounded `BlockingQueue<Message>`.
- A `DeliveryWorker` thread drains the queue and calls the handler.
- On handler exception: exponential backoff retry up to N times, then dead letter queue.
- Dead letter queue: a special `Topic` named `{originalTopic}.dlq`.

**Message retention:** `ArrayDeque<Message>` with max size. On overflow: evict oldest. Allows late-joining subscribers to replay recent messages.


**Message schema:**


```javascript
class Message {
    String id;          // UUID for deduplication
    String topic;
    byte[] payload;
    Instant timestamp;
    Map<String, String> headers;
}
```


**SOLID check:** S: `Topic` manages subscriptions and fan-out. `DeliveryWorker` manages retry logic. `MessageBroker` manages topic lifecycle. Three separate classes. O: add a `FilteredSubscriber` (only receives messages matching a predicate) = new class implementing `Subscriber`.


### Day 65–68 — Ride-sharing System (Uber LLD)


**Requirements:**

- Riders request rides. Drivers accept.
- Match nearest available driver
- Trip lifecycle: requested → matched → in-progress → completed / cancelled
- Fare calculation: base fare + per-km + per-minute + surge multiplier
- Ratings: rider rates driver, driver rates rider
- Multiple vehicle categories: Auto, Mini, Prime, Premium

**Entities:** `RideRequest`, `Trip`, `Driver`, `Rider`, `Vehicle`, `Location`, `FareCalculator`, `FareStrategy`, `MatchingService`, `TripStateMachine`, `RatingService`


**Key design decisions:**


**Vehicle category as Strategy for fare:**


```javascript
interface FareStrategy {
    double calculate(double distanceKm, long durationSeconds, double surgeMultiplier);
}
class AutoFareStrategy implements FareStrategy { ... }    // lowest base
class PremiumFareStrategy implements FareStrategy { ... } // highest base
```


`Trip` holds its `FareStrategy`. Adding a new vehicle type = new strategy, zero changes to `Trip`.


**Trip state machine:**


```javascript
interface TripState {
    void onDriverAssigned(Trip trip);
    void onDriverArrived(Trip trip);
    void onTripStart(Trip trip);
    void onTripEnd(Trip trip);
    void onCancel(Trip trip);
}
// States: RequestedState, MatchedState, InProgressState, CompletedState, CancelledState
```


Each state handles only the valid transitions. Invalid transitions no-op or throw a domain exception.


**Matching service:**


```javascript
interface MatchingStrategy {
    Optional<Driver> match(Location riderLocation, VehicleCategory category, List<Driver> availableDrivers);
}
class NearestDriverStrategy implements MatchingStrategy { ... }  // Haversine distance
class SurgeAwareStrategy implements MatchingStrategy { ... }     // factors surge pricing
```


**Location model:**


```javascript
class Location {
    double latitude;
    double longitude;
    Instant timestamp;
    
    double distanceTo(Location other) { // Haversine formula }
}
```


**Driver availability:** `Driver` has `DriverStatus` enum: `AVAILABLE`, `ON_TRIP`, `OFFLINE`. `MatchingService` only considers `AVAILABLE` drivers. Update is atomic: `driver.setStatus(AVAILABLE)` must be thread-safe.


**Rating system:** Separate `RatingService`. `Trip` holds `tripId`. After completion, `RatingService.rateDriver(tripId, rating)` and `RatingService.rateRider(tripId, rating)`. Driver and Rider maintain `averageRating` computed from all ratings. Decoupled from `Trip` via Observer: `TripCompletedEvent` triggers rating prompt.


### Day 69–71 — Payment Wallet System (Paytm / Google Pay LLD)


**Requirements:**

- User wallet with balance
- Add money (bank transfer, card)
- Send money to another user
- Pay merchant
- Transaction history
- Refunds
- Concurrent transfers: no double-spend, no race condition

**Entities:** `Wallet`, `User`, `Transaction`, `TransactionLedger`, `PaymentGateway`, `TransactionType`, `WalletService`, `FraudDetectionService`


**Key design decisions:**


**Ledger-based balance:**

- Never store `balance` as a mutable field. Balance = `SUM(credits) - SUM(debits)` over all transactions.
- `Transaction` is immutable and append-only. Every credit and debit is a row.
- `Wallet.getBalance()` = `ledger.sumByWalletId(walletId)`.
- Why: full audit trail, no balance inconsistency, refunds are new credit transactions.

**Concurrent transfer (the hard part):**

- Transfer from A to B must: debit A and credit B atomically. Partial execution (debit A, fail to credit B) = money disappears.
- Solution 1 (single-machine): `synchronized` on both wallets in a deterministic order (by walletId) to prevent deadlock.

    ```java
    Wallet first = a.id < b.id ? a : b;
    Wallet second = a.id < b.id ? b : a;
    synchronized(first) { synchronized(second) { executeTransfer(a, b, amount); } }
    ```

- Solution 2 (production): database transaction with `SELECT FOR UPDATE` on both wallet rows. DB handles the locking.
- Solution 3 (distributed): saga pattern. Debit A (step 1) → Credit B (step 2). Compensate with credit A if step 2 fails.

**Payment gateway as Adapter:**


```javascript
interface PaymentGateway {
    PaymentResult charge(String instrumentId, Amount amount);
    RefundResult refund(String transactionId, Amount amount);
}
class StripeGatewayAdapter implements PaymentGateway { ... }
class RazorpayGatewayAdapter implements PaymentGateway { ... }
```


Swap payment processor = swap adapter. Zero changes to `WalletService`.


**Fraud detection as Chain of Responsibility:**


```javascript
interface FraudCheck {
    FraudResult check(Transaction tx, FraudCheck next);
}
// Chain: VelocityCheck → AmountThresholdCheck → GeolocationCheck → AllowAll
```


Adding a new fraud check = new class added to the chain. Zero changes to existing checks.


### Day 72–75 — Design review: all 5 advanced systems

- Day 72: Rate Limiter. Can you add a new algorithm (Leaky Bucket) with zero changes to `RateLimiter`? Prove it.
- Day 73: Cache. What happens if you need to add TTL support? Which class changes?
- Day 74: Pub-Sub + Ride-sharing. Name every pattern. Justify each one. Can any be removed without losing extensibility?
- Day 75: Wallet system. Self-timed 45-min mock. Design a Stock Trading System (buy/sell orders, portfolio, order matching). No notes.

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Designing concurrent data structures as an afterthought.**


A rate limiter that uses `HashMap` instead of `ConcurrentHashMap` will corrupt its state under concurrent load. Thread safety is a first-class design requirement, not a refactor.


**✅ Correct approach:** In the requirements phase, ask: what is the peak concurrency? Identify every shared mutable resource. Choose the correct concurrent data structure: `ConcurrentHashMap`, `AtomicLong`, `CopyOnWriteArrayList`, `BlockingQueue`. Never add locks as an afterthought.


### Mistake 2


**❌ Putting transaction logic inside the** **`Wallet`** **entity.**


`wallet.transfer(otherWallet, amount)` means `Wallet` knows about other wallets, the ledger, the payment gateway, and fraud detection. God class.


**✅ Correct approach:** `WalletService.transfer(fromWalletId, toWalletId, amount)` orchestrates the flow. `Wallet` is a pure domain entity: knows its ID and exposes `getBalance()`. The service handles the coordination across multiple domain objects.


### Mistake 3


**❌ Ignoring failure modes in the pub-sub delivery path.**


If `subscriber.onMessage()` throws, the exception propagates up, other subscribers in the list don’t receive the message, and the message is lost.


**✅ Correct approach:** Wrap each `subscriber.onMessage()` call in try-catch. Catch and log the exception. Continue delivering to remaining subscribers. Failed delivery triggers retry logic in `DeliveryWorker`. Messages that exhaust retries go to DLQ. Each subscriber’s failure is isolated.


### Mistake 4


**❌ Using primitives for money (****`double`** **or** **`float`****).**


`0.1 + 0.2 = 0.30000000000000004` in IEEE 754 floating point. For financial calculations, this causes incorrect balances and rounding errors.


**✅ Correct approach:** Use `BigDecimal` in Java (never `double` for money). Use `int` or `long` in cents/paise (avoid decimals entirely). Define a `Money` value object: `Money(BigDecimal amount, Currency currency)`. All arithmetic goes through `Money.add()`, `Money.subtract()` — never raw arithmetic.


---


## 🏢 How real companies designed these systems


**Stripe — Ledger-based accounting:** Stripe’s internal accounting system is append-only. Every financial event (charge, refund, dispute, payout) is an immutable ledger entry. Balance is always computed from the ledger, never stored as a mutable field. This gives them a complete audit trail and makes reconciliation deterministic.


**Redis (LRU implementation):** Redis’s LRU is approximate, not exact. Instead of tracking full access order (expensive), they sample 5 random keys from the keyspace and evict the one with the oldest access time. This gives 95%+ accuracy at 1/N the cost. The lesson: perfect LRU is O(1) per operation but complex. Approximate LRU is simpler and close enough for caching.


**Uber — Ride matching as a service:** Driver matching is not a method on `Trip`. It’s a separate `MatchingService` that runs independently, continuously updating a spatial index of driver positions. When a ride request comes in, the service queries the index. This separation — matching as a standalone service with its own algorithm — allows them to swap matching algorithms (nearest, ETA-based, revenue-optimised) without touching trip logic.


---


## 📖 Resources

- _Java Concurrency in Practice_ — Goetz (essential for concurrent LLD problems)
- LeetCode 146 (LRU Cache) — implement before designing the full cache system
- LeetCode 460 (LFU Cache) — implement before the LFU design section
- _Effective Java_ — Items 78–84 on concurrency
- Go sync package documentation — `sync.Mutex`, `sync.RWMutex`, `sync.Map`, `atomic`
