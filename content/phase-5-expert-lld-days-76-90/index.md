---
source: notion
title: "Phase 5 — Expert LLD (Days 76–90)"
slug: "phase-5-expert-lld-days-76-90"
notionId: "35ada883-bddd-819e-a912-c7f1d9860381"
notionRootId: "35ada883bddd813694d3fa44eb7ceee9"
parent: "90-day-lld-roadmap-low-level-system-design"
children: []
order: 0
icon: "🧠"
cover: null
---
> **Core insight:** At the expert level, LLD is no longer about passing an interview. It’s about the designs you create today being maintainable by someone else 2 years from now, at 10x the current load, by a team that wasn’t there when you wrote it. That standard changes everything about how you design.

---


## 🧠 Why this phase exists


Phases 1–4 taught you to design correctly. This phase teaches you to design for change, for teams, for time, and under the constraints of concurrent execution at production scale. These are the skills that separate a senior engineer from a staff engineer in code and design reviews.


---


## 📚 Topics in order


### Day 76–77 — Concurrency patterns in LLD


**The concurrency problem in LLD:** most LLD designs work perfectly single-threaded. At 1,000 concurrent requests, they corrupt state, deadlock, or starve threads. Concurrency is a first-class design concern, not an afterthought.


**Monitor pattern:**

- A class that encapsulates its own synchronisation. All public methods are `synchronized`. The object is its own lock.
- Use when: the class has multiple methods that must be mutually exclusive.
- Problem: coarse-grained locking reduces concurrency. One thread in any method blocks all others.
- Example: `BankAccount` with `synchronized deposit()`, `synchronized withdraw()`, `synchronized getBalance()`.

**Read-Write Lock pattern:**

- Multiple readers can run concurrently. Writers need exclusive access.
- Java: `ReentrantReadWriteLock`. Acquire `readLock()` for reads, `writeLock()` for writes.
- Use when: reads are frequent, writes are rare. Cache `get()` uses read lock. Cache `put()` uses write lock.
- Go: `sync.RWMutex`. `RLock()`/`RUnlock()` for reads. `Lock()`/`Unlock()` for writes.

**Immutable object pattern:**

- An object whose state cannot change after construction is inherently thread-safe. No synchronisation needed.
- Design for immutability: `final` fields (Java), all-caps naming convention, no setters, defensive copies in constructor.
- Use for: value objects (`Money`, `Location`, `Message`), configuration objects, event payloads.
- Cost: creating new objects instead of mutating. For small objects, this is negligible. For large objects, use copy-on-write.

**Producer-Consumer pattern:**

- Producer threads generate work items. Consumer threads process them. `BlockingQueue` decouples them.
- `LinkedBlockingQueue` with capacity bound: producer blocks when queue is full (backpressure). Consumer blocks when queue is empty.
- Use for: `AsyncSubscriber` in pub-sub, job queues, event processing pipelines.
- Thread pool sizing: I/O-bound consumers: `threads = CPU_cores × (1 + wait_time / compute_time)`. CPU-bound: `threads = CPU_cores`.

**Thread pool pattern:**

- Reuse a fixed number of threads instead of creating/destroying per task. Avoids thread creation overhead.
- Java: `ExecutorService`, `ThreadPoolExecutor` with `corePoolSize`, `maxPoolSize`, `workQueue`, `RejectionPolicy`.
- Go: worker pool of goroutines reading from a channel. Bounded concurrency without a framework.
- Rejection policies when queue is full: `AbortPolicy` (throw), `CallerRunsPolicy` (caller executes the task — natural backpressure), `DiscardPolicy` (silently drop), `DiscardOldestPolicy`.

**Future/Promise pattern:**

- Represent the result of an async computation. Caller gets a `Future<T>` immediately. Blocks on `future.get()` only when the result is needed.
- Java: `CompletableFuture` chains async operations. `thenApply()`, `thenCompose()`, `allOf()`.
- Go: return a channel. Caller reads from channel when ready.
- Use for: parallel I/O operations, async service calls, parallel data processing.

### Day 78–79 — Designing for testability


**The testability constraint:** if a class is hard to unit test, it’s badly designed. Hard to test = too many dependencies, too much responsibility, or too much global state.


**Dependency injection and mocking:**

- Inject every external dependency (DB, cache, external API, clock) via constructor.
- In tests: inject mocks. `OrderService(MockOrderRepository, MockEmailSender, MockClock)`.
- The clock as a dependency: `Clock.systemUTC()` vs injected `Clock`. With injection, you can test time-sensitive logic (TTL expiry, rate limit windows) without sleeping.

**Testing state machines:**

- Test every valid transition. Test every invalid transition (ensure they no-op or throw consistently).
- Inject the state machine with a `MockStateTransitionListener` to verify transitions were called.
- Parameterised tests: one test method, N (startState, event, expectedEndState) inputs.

**Testing concurrency:**

- `CountDownLatch`: synchronise N threads to start simultaneously. Test for race conditions.
- `CyclicBarrier`: all threads wait until all are ready, then proceed together. Amplifies race conditions.
- Repeat concurrent tests N=1000 times. A race condition that occurs 1-in-100 times will be caught.
- Use `java.util.concurrent.atomic` counters to verify exact execution counts under concurrency.

**The test pyramid for LLD:**

- Unit tests (70%): each class in isolation with mocked dependencies. Fast. No I/O.
- Integration tests (20%): a few classes wired together. May use an in-memory DB.
- End-to-end tests (10%): full flow from entry point to final state. Slowest. Fewest.
- A class without unit tests is an untested design claim. Every public method should have a test.

**Interface-based design = testable design:** if your class depends on interfaces, you can always inject a test double. If it depends on concrete classes, you’re coupled to real I/O in tests.


### Day 80–81 — Refactoring legacy code to clean LLD


**The refactoring context:** in a real job, you rarely design greenfield. You inherit a codebase with God classes, no interfaces, static methods everywhere, and tests written after bugs were found. This phase teaches you to systematically improve it.


**Characterisation tests (first step):**

- Before refactoring, write tests that capture the current behaviour — even if the behaviour is wrong.
- These tests prevent you from accidentally changing behaviour during refactoring.
- Rule: never refactor code without a characterisation test suite.

**Strangler Fig pattern:**

- Gradually replace a component by building the new version alongside the old one. Route a small percentage of traffic to the new component. Increase over time. Retire the old.
- In LLD: extract an interface from the old class. Write a new implementation. Feature-flag which one is used.
- Applies to: replacing a God class with focused classes, swapping an algorithm, changing a data structure.

**Extract Interface refactoring:**

- Take a concrete class. Identify the methods its callers use. Extract those into an interface. Replace direct dependencies on the class with the interface.
- Now: you can inject a mock in tests. You can add a second implementation. The caller is decoupled.

**Break the dependency chain:**

- A calls B calls C calls D: if D is a database, A is coupled to the database. You can’t test A without a database.
- Fix: inject D as an interface into C. Inject C as an interface into B. Inject B as an interface into A. Now A has zero knowledge of the database.

**The God class decomposition strategy:**

1. List all methods in the God class.
2. Group methods by the actor that causes them to change (SRP grouping).
3. Extract each group into a focused class with its own interface.
4. Inject the focused classes into a thin orchestrator that replaces the God class.
5. Verify with characterisation tests that behaviour is unchanged.

### Day 82–83 — LLD code review methodology


**The staff engineer’s code review checklist for LLD:**


**Responsibility:**

- Does each class have a single, clearly nameable responsibility?
- Can you describe what each class does without the word ‘and’?
- Are there any classes named `Manager`, `Helper`, `Utility`, `Handler`? (smell)

**Extensibility:**

- If the most likely next requirement arrived tomorrow, how many files would change?
- Are the change-prone parts hidden behind interfaces?
- Is there a switch/if-else statement that will grow with every new type? (Should be a Factory + polymorphism)

**Dependencies:**

- Does any business logic class depend on a concrete infrastructure class (DB, HTTP client)? (DIP violation)
- Is there a `new ConcreteClass()` inside a business class? (DIP violation)
- Are there circular dependencies between packages? (design problem)

**Concurrency:**

- Is every shared mutable resource protected? (ConcurrentHashMap, synchronized, atomic)
- Are locks acquired in a consistent order? (deadlock prevention)
- Is there any blocking I/O on a thread that should be non-blocking?

**Testability:**

- Can each class be tested without spinning up a database, cache, or external service?
- Does each class receive its dependencies via constructor? (DI enables mocking)
- Are there static method calls to concrete classes inside business logic? (hard to mock)

**Error handling:**

- Are failure modes explicit in method signatures (checked exceptions, Result types)?
- Does every error path result in a defined system state?
- Are there silent swallowed exceptions (`catch(Exception e) {}`)?

### Day 84–85 — Advanced design: Generic frameworks and plugin systems


**Building a plugin system:**

- Core: a `PluginRegistry` that maps plugin names to `Plugin` implementations.
- Each `Plugin` implements a standard interface: `init()`, `execute(context)`, `shutdown()`.
- Loading: `ServiceLoader` in Java, or `reflect` in Go, or explicit registration.
- Ordering: plugins have `priority` or explicit `after/before` dependencies. Build a DAG, topological sort.
- Real example: Gin/Express middleware is a plugin system. Webpack loaders are a plugin system.

**Generic repository pattern:**


```java
interface Repository<T, ID> {
    Optional<T> findById(ID id);
    List<T> findAll();
    T save(T entity);
    void delete(ID id);
}
class UserRepository implements Repository<User, UUID> { ... }
class OrderRepository implements Repository<Order, UUID> { ... }
```


All CRUD operations follow the same contract. The business layer depends only on `Repository<T, ID>`. Swap SQL for NoSQL = new implementation class.


**Event system with generics:**


```java
interface EventHandler<T extends Event> {
    void handle(T event);
}
class EventBus {
    Map<Class<?>, List<EventHandler<?>>> handlers;
    <T extends Event> void subscribe(Class<T> type, EventHandler<T> handler);
    <T extends Event> void publish(T event);
}
```


Type-safe event routing. `OrderPlacedHandler implements EventHandler<OrderPlacedEvent>` is registered for exactly `OrderPlacedEvent` and nothing else.


### Day 86–88 — Designing for evolution: the 18-month test


**The 18-month test:** for every design decision, ask: “In 18 months, when this system has 10x the users and 3 new engineers who weren’t here, will this design help or hurt them?”


**Documentation as design output:**

- Every interface must have a Javadoc/GoDoc comment that specifies: what it does, what preconditions callers must meet, what postconditions the implementation guarantees, and what exceptions/errors are possible.
- Every design decision that is non-obvious must have an inline comment with the WHY (not the what).
- ADR (Architecture Decision Record): for significant design choices, write a 1-page document: context, decision, consequences, alternatives considered.

**Versioning interfaces:**

- Once an interface is used by multiple callers, it’s a contract. Breaking changes require a new interface version.
- Strategy: deprecate the old interface. Add a new interface. Migrate callers. Remove old.
- Never add methods to an existing interface without a default implementation (Java 8+) or a new interface version.

**The refactoring budget:**

- Good design accumulates less tech debt. Tech debt is the interest you pay on bad design in the form of slower feature velocity.
- Rule: 20% of every sprint is refactoring budget. Use it to apply patterns, extract interfaces, split God classes. Don’t wait for a dedicated ‘cleanup sprint’ — it never comes.

### Day 89–90 — The Staff Engineer LLD review + portfolio


**Day 89 — Staff-level design review:**


Take your Phase 3 Parking Lot design from Day 36. Conduct a formal review:

- List every SOLID principle. Is each satisfied? Produce a counterexample if not.
- Name every design pattern used. Justify each. Remove any pattern that adds complexity without adding extensibility.
- Concurrency audit: which shared resources are unprotected? What breaks at 1,000 concurrent entries?
- Testability audit: which classes can be unit-tested without a database? Which cannot? Why?
- The 18-month test: if the requirement changes from ‘hourly pricing’ to ‘dynamic pricing by demand’, how many files change?

**Day 90 — LLD portfolio:**


Document your 5 best designs as a personal reference and interview prep kit.


For each system, write:

1. One-sentence problem statement
2. Class diagram (Excalidraw or [draw.io](http://draw.io/) export)
3. Primary axis of change (the thing most likely to evolve)
4. Patterns used and why (not just names — the justification)
5. Concurrency design (which resources are shared, how they’re protected)
6. One thing you’d change with more time
7. The question this design cannot answer — what’s out of scope and why

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Designing for concurrency by adding** **`synchronized`** **to every method.**


Coarse-grained locking eliminates concurrency. All threads queue behind a single lock. A `HashMap` + `synchronized` is functionally correct but performs worse than a single-threaded program under load.


**✅ Correct approach:** Identify the minimal scope that must be atomic. Use `ConcurrentHashMap` for concurrent map access. `AtomicLong` for counters. `ReadWriteLock` for read-heavy maps. `synchronized` only for complex multi-step operations that must be atomic as a unit.


### Mistake 2


**❌ Refactoring without characterisation tests.**


You extract a God class into 4 focused classes. The behaviour changes subtly. You find out in production. Without tests that captured the before-behaviour, you can’t prove correctness.


**✅ Correct approach:** Write characterisation tests first. Run them. They all pass. Refactor. Run them again. They still pass. Now you can be confident the behaviour is preserved. This is the only safe refactoring process.


### Mistake 3


**❌ Designing the perfect system in isolation.**


The best design no one else understands is worse than a good design with clear documentation. At a team level, the maintainability of a design is measured by how quickly a new engineer can understand it.


**✅ Correct approach:** After designing a system, explain it to someone who wasn’t in the room. If they have questions about WHY a class exists or WHY a pattern was chosen, those are documentation gaps. Write ADRs for non-obvious decisions. Interface comments that explain contracts.


### Mistake 4


**❌ “We’ll clean it up later” without a mechanism to enforce it.**


“Later” is a calendar date that never arrives. Tech debt compounds. A God class grows by one more method every sprint because “there’s no time to refactor.”


**✅ Correct approach:** Budget refactoring into every sprint (the 20% rule). Use automated tools: ArchUnit (Java) to enforce architectural rules in CI. If a new dependency from business layer to infrastructure layer appears, the build fails. Architecture is enforced, not hoped for.


---


## 🏢 How real companies do this


**Google — Code review culture:** Google’s code review process explicitly checks for: SRP (can you describe this class in one sentence?), DIP (are there `new ConcreteClass()` calls in business logic?), and testability (can this be tested without I/O?). These are not suggestions — they block merges.


**Netflix — Resilience4j:** Their circuit breaker, rate limiter, bulkhead, and retry library is a textbook example of expert LLD. Each resilience pattern is a separate class implementing a `Decorator` around the protected function. They compose: `CircuitBreaker(RateLimiter(Bulkhead(targetFunction)))`. Every pattern is injectable, testable, and configurable independently.


**Airbnb — ArchUnit enforcement:** They use ArchUnit to enforce their layered architecture in CI. `domainLayer.shouldNotDependOn(infrastructureLayer)` is a test that runs on every PR. DIP violations block the build. Architecture is code.


---


## 🏆 You’ve completed the 90-day LLD roadmap


After 90 days you should be able to:

- Apply SOLID principles to any design and identify violations in any codebase
- Recognise and correctly apply all 23 GoF patterns
- Design 11 canonical LLD systems from scratch with class diagrams, sequence diagrams, and code
- Write thread-safe designs with correct concurrency primitives
- Conduct a staff-level design review: identify SOLID violations, testability gaps, concurrency risks
- Pass LLD rounds at any tier-1 product company

**What’s next:**

- Pair with the HLD roadmap — design both levels of the same system (Twitter feed: HLD architecture + LLD class design)
- Contribute to an open-source project and apply these principles in a real codebase review
- Read _Working Effectively with Legacy Code_ — Michael Feathers (the refactoring bible)
- Take on a real design review at work and write a formal critique using the Day 83 checklist

---


## 📖 Resources

- _Working Effectively with Legacy Code_ — Michael Feathers (for Phase 5 refactoring topics)
- _Java Concurrency in Practice_ — Goetz (mandatory for concurrency patterns)
- _Clean Architecture_ — Robert Martin (extends SOLID to the architecture level)
- ArchUnit: [archunit.org](http://archunit.org/) (enforce architecture rules in Java CI pipelines)
- Resilience4j source code: [github.com/resilience4j](http://github.com/resilience4j) (read it — expert LLD in production)
