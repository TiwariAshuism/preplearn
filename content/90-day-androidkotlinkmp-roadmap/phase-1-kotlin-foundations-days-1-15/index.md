---
source: notion
title: "Phase 1 — Kotlin Foundations (Days 1–15)"
slug: "phase-1-kotlin-foundations-days-1-15"
notionId: "35ada883-bddd-8161-98f0-efa913764167"
notionRootId: "35ada883bddd81d9ab0ef4abfbd4114b"
parent: "90-day-androidkotlinkmp-roadmap"
children: []
order: 4
icon: "☁️"
cover: null
---
> **Core insight:** Kotlin is not Java with nicer syntax. Its type system, null safety, coroutine model, and extension functions are fundamentally different tools. Engineers who treat Kotlin as Java write fragile, verbose code. Engineers who learn Kotlin on its own terms write code that is correct by construction.

---


## 🧠 Why this phase exists


Every Android and KMP concept in phases 2–5 runs on Kotlin. Coroutines power the async model. Extension functions enable clean APIs. Sealed classes enforce exhaustive state handling. Data classes eliminate boilerplate. If you skip this phase and jump to Android, you’ll fight the language instead of the problem.


---


## 📚 Topics in order


### Day 1–2 — Kotlin type system and null safety

- Nullable vs non-nullable types: `String` vs `String?`. The `?` is a compiler-enforced contract.
- Safe call operator: `user?.address?.city` — short-circuits to null on any null in the chain.
- Elvis operator: `user?.name ?: "Anonymous"` — provide a default when null.
- Non-null assertion: `user!!.name` — throws `NullPointerException` at runtime if null. Use only when you have absolute certainty and have a test proving it. In practice: almost never.
- `let`, `run`, `apply`, `also`, `with` — scope functions. Each has a distinct receiver and return value:
    - `let`: receiver as `it`, returns lambda result. Use for null checks: `user?.let { doSomething(it) }`
    - `apply`: receiver as `this`, returns the receiver. Use for object initialisation.
    - `also`: receiver as `it`, returns the receiver. Use for side effects (logging).
    - `run`: receiver as `this`, returns lambda result. Use for computed initialisation blocks.
- `lateinit var` vs `by lazy`: `lateinit` for var fields initialised later (throws if accessed before init). `by lazy` for val fields computed once on first access (thread-safe by default with `LazyThreadSafetyMode.SYNCHRONIZED`).

### Day 3–4 — Kotlin functions and extension functions

- Default parameters: `fun greet(name: String, greeting: String = "Hello")`. Eliminates overloaded functions.
- Named arguments: `greet(name = "Ashu", greeting = "Hey")`. Self-documenting call sites.
- Single-expression functions: `fun double(x: Int) = x * 2`. Compiler infers the return type.
- Extension functions: add functions to existing classes without modifying them or inheriting.

    ```kotlin
    fun String.isValidEmail(): Boolean = this.contains("@") && this.contains(".")
    val valid = "user@example.com".isValidEmail() // true
    ```

- Extension functions are resolved statically (at compile time), not dynamically. They cannot override virtual methods.
- Infix functions: `1 to "one"`. `to` is an infix extension on `Any`. Use for DSLs and readable test assertions.
- Operator overloading: `data class Point(val x: Int, val y: Int) { operator fun plus(other: Point) = Point(x + other.x, y + other.y) }`
- Higher-order functions: functions that take functions as parameters or return functions. The foundation of the Kotlin DSL pattern and coroutines.

### Day 5–6 — Kotlin classes: data, sealed, object, value

- `data class`: auto-generates `equals()`, `hashCode()`, `toString()`, `copy()`, `componentN()`. Use for immutable value holders. Never put mutable state or business logic in a data class.
- `sealed class` / `sealed interface`: a closed type hierarchy. All subclasses are known at compile time. The compiler enforces exhaustive `when` expressions — no `else` needed. Use for: UI state, domain events, result types.

    ```kotlin
    sealed interface UiState {
      data object Loading : UiState
      data class Success(val data: List<Item>) : UiState
      data class Error(val message: String) : UiState
    }
    // Compiler enforces all cases are handled:
    when (state) {
      is UiState.Loading -> showSpinner()
      is UiState.Success -> showData(state.data)
      is UiState.Error -> showError(state.message)
    }
    ```

- `object`: singleton. `companion object`: static-like members on a class. `data object`: singleton with proper `toString()` and `equals()`.
- `value class` (formerly inline class): wraps a single value with zero runtime overhead. Use to add type safety to primitives: `value class UserId(val id: String)` prevents `userId` and `orderId` from being interchangeable.
- `enum class`: ordered, named set of constants. Can have properties and methods.

### Day 7–8 — Generics, variance, and type system advanced

- Generics: `class Box<T>(val value: T)`. Type parameter is erased at runtime (JVM type erasure).
- Variance: how generic types relate when their type parameters are subtype-related.
    - **Covariance** (`out T`): a `Producer<Dog>` IS-A `Producer<Animal>`. You can only READ from it. `List<out T>` in Kotlin.
    - **Contravariance** (`in T`): a `Consumer<Animal>` IS-A `Consumer<Dog>`. You can only WRITE to it.
    - **Invariance** (default): `MutableList<Dog>` is NOT a `MutableList<Animal>`. Neither read nor write variance.
- `reified` type parameters: inline functions can access the actual type at runtime without reflection.

    ```kotlin
    inline fun <reified T> parseJson(json: String): T = gson.fromJson(json, T::class.java)
    ```

- Type aliases: `typealias UserId = String`. Improves readability without creating a new type (unlike `value class`).
- `Nothing` type: a function that never returns (`throw`, `TODO()`, infinite loop). Used by the compiler to infer unreachable code.

### Day 9–11 — Coroutines — the complete model

- **Why coroutines?** Threads are expensive (1MB+ stack each). Coroutines are lightweight (few KB). 100,000 coroutines on one thread is normal. 100,000 threads kills the JVM.
- **Suspend functions:** a function that can be paused and resumed without blocking a thread. Compiled to a state machine by the Kotlin compiler. The `suspend` modifier is a compile-time signal to the coroutine runtime.
- **Coroutine scope:** every coroutine lives inside a `CoroutineScope`. When the scope is cancelled, all coroutines inside are cancelled. This is structured concurrency: no coroutine can outlive its parent scope.
- **Dispatchers:**
    - `Dispatchers.Main`: Android main thread. UI operations only.
    - `Dispatchers.IO`: I/O operations (network, disk). Backed by a thread pool (default: 64 threads).
    - `Dispatchers.Default`: CPU-intensive work. Thread pool sized to CPU core count.
    - `Dispatchers.Unconfined`: runs in whatever thread called it. Rarely used directly.
- **`launch`** **vs** **`async`****:**
    - `launch`: fire-and-forget. Returns a `Job`. No result.
    - `async`: concurrent computation with a result. Returns a `Deferred<T>`. Call `.await()` to get the result.
- **`withContext`****:** switch dispatcher within a coroutine. `withContext(Dispatchers.IO) { ... }` suspends the current coroutine, runs on IO thread, resumes on original dispatcher.
- **Exception handling:** unhandled exceptions in `launch` propagate to the `CoroutineExceptionHandler` or crash the app. Use `try/catch` inside coroutines or `supervisorScope` to isolate child failures.
- **`supervisorScope`** **vs** **`coroutineScope`****:** `coroutineScope` cancels all children on any child failure. `supervisorScope` isolates failures — one child failing doesn’t cancel siblings.
- **Cancellation:** cooperative. A coroutine must check `isActive` or call a suspending function (which checks cancellation) to be cancellable. A tight CPU loop with no suspension points is NOT cancellable.

### Day 12–13 — Kotlin Flow

- **Flow vs suspend function:** a suspend function returns ONE value. A `Flow` emits MULTIPLE values over time.
- **Cold vs hot streams:** `Flow` is cold — nothing happens until a collector subscribes. `SharedFlow` and `StateFlow` are hot — they emit regardless of collectors.
- **`StateFlow`****:** a hot flow that holds the latest value. Always has a value. New collectors immediately receive the current value. Use for: UI state. The Android equivalent of RxJava `BehaviorSubject`.
- **`SharedFlow`****:** a hot flow with a configurable replay buffer. Use for: one-shot events (navigation commands, error toasts).
- **Flow operators:** `map`, `filter`, `flatMapLatest`, `debounce`, `distinctUntilChanged`, `combine`, `zip`, `stateIn`, `shareIn`.
- **`stateIn`****:** converts a cold `Flow` into a `StateFlow` within a scope. The key operator for ViewModels:

    ```kotlin
    val uiState: StateFlow<UiState> = repository.getDataFlow()
      .map { data -> UiState.Success(data) }
      .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)
    ```

- **`flatMapLatest`****:** when upstream emits, cancel the previous downstream collection and start a new one. Use for search-as-you-type: new query cancels the previous network request.
- **Flow collection in Android:** use `repeatOnLifecycle(Lifecycle.State.STARTED)` to collect flows. Never use `lifecycleScope.launch { flow.collect { } }` directly — it continues collecting when the app is in the background.

### Day 14–15 — Kotlin DSLs and advanced language features

- **Lambda with receiver:** `T.() -> Unit`. The lambda body has `this` = the receiver. Foundation of Kotlin DSLs.

    ```kotlin
    fun buildString(action: StringBuilder.() -> Unit): String {
      val sb = StringBuilder()
      sb.action()
      return sb.toString()
    }
    val result = buildString { append("Hello"); append(" World") }
    ```

- **Type-safe builders (DSL pattern):** Jetpack Compose, Gradle Kotlin DSL, Ktor routing, and `buildList { }` all use this pattern.
- **Delegated properties:** `by lazy`, `by Delegates.observable`, `by viewModels()`, `by activityViewModels()`. The `by` keyword delegates property access to another object.
- **Contracts:** compiler-level assertions about function behaviour. `contract { returns() implies (value != null) }` tells the compiler that if the function returns, the parameter was not null. Used by `require`, `check`, `requireNotNull`.
- **Kotlin 2.x new features:** K2 compiler (faster, better type inference). `context receivers` (experimental — multiple receivers). `data objects`. Stable `value classes`. Know which Kotlin version your KMP project targets.

---


## 🔨 Projects


### Project 1 — Null-safe data pipeline


**Scenario:** Parse a JSON API response with optional fields. Transform it through 5 mapping steps. Handle nulls at each step without a single `!!` or `NullPointerException`.


**Deliverable:** A pure Kotlin (no Android) program that: parses a raw `Map<String, Any?>`, maps to domain models using safe calls and `let`, applies 3 transformation steps using `map`/`filter`/`flatMap` on lists, and produces a `Result<List<DomainModel>>` with no uncaught exceptions. Zero `!!` operators. All null cases handled explicitly.


### Project 2 — Coroutine concurrency exercise


**Deliverable:** A Kotlin program that: (1) launches 3 concurrent `async` calls (simulate network requests with `delay()`), (2) uses `awaitAll()` to collect all results, (3) implements timeout with `withTimeout()`, (4) handles cancellation correctly by closing a resource in a `finally` block, (5) demonstrates `supervisorScope` — show that one failing child doesn’t cancel the others. Write a test using `runTest` from `kotlinx-coroutines-test`.


### Project 3 — Type-safe event bus using sealed classes + Flow


**Deliverable:** A `EventBus` class backed by `SharedFlow`. Events are a `sealed interface` with 5 subtypes. Emitters call `EventBus.emit(event)`. Collectors use `EventBus.events.filterIsInstance<SpecificEvent>().collect { }`. Demonstrate: (1) type-safe emission and collection, (2) no event is lost when buffer is full (configure `replay`), (3) the bus survives scope cancellation and re-subscription.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Using** **`!!`** **(non-null assertion) everywhere to silence the compiler.**


Every `!!` is a deferred `NullPointerException`. Engineers from Java backgrounds use it to make the IDE stop complaining. In production, `!!` crashes users’ apps.


**✅ Correct approach:** Treat `!!` as a code smell requiring justification. Use `?.let { }` for conditional execution. Use `?: return` or `?: throw IllegalStateException("reason")` for early exit. Use `requireNotNull()` with a message for fail-fast validation at boundaries.


### Mistake 2


**❌ Using** **`GlobalScope`** **for coroutines.**


`GlobalScope` coroutines are not tied to any lifecycle. They survive Activity destruction, screen rotation, and process-level events. They are memory leaks with a nicer name.


**✅ Correct approach:** Always use a scoped coroutine scope: `viewModelScope` in ViewModels (cancelled when ViewModel is cleared), `lifecycleScope` in Activities/Fragments (cancelled on destroy), or an explicitly managed `CoroutineScope(SupervisorJob() + Dispatchers.IO)` in repositories.


### Mistake 3


**❌ Collecting** **`Flow`** **in a coroutine without** **`repeatOnLifecycle`****.**


```kotlin
// WRONG - collects in background, drains battery, causes bugs
lifecycleScope.launch { viewModel.state.collect { render(it) } }

// CORRECT - pauses when app is backgrounded
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.state.collect { render(it) }
    }
}
```


**✅ Correct approach:** Always wrap UI flow collection in `repeatOnLifecycle(STARTED)`. In Compose, use `collectAsStateWithLifecycle()` from the `lifecycle-runtime-compose` library — it handles this automatically.


### Mistake 4


**❌ Putting business logic inside a data class.**


Data classes are value holders. They should be inert — no network calls, no database operations, no business rules. A data class with 15 methods is a God object in disguise.


**✅ Correct approach:** Data classes hold data. Domain classes (regular classes) hold behaviour. Use extension functions to add utility operations to data classes that don’t fit in a domain class.


---


## 🏢 How real companies use Kotlin


**Google — Kotlin-first Android:** Since 2019, all new Android framework APIs are Kotlin-first. Jetpack Compose is Kotlin-only. Room, ViewModel, WorkManager all have Kotlin coroutine APIs as the primary interface. Java is secondary.


**Cashapp (Block) — Kotlin everywhere:** Cashapp migrated their entire Android codebase to Kotlin and then introduced KMP. Their open-source libraries (SQLDelight, Turbine, Molecule) are built on Kotlin coroutines and are KMP-ready. Their Kotlin usage shaped the KMP ecosystem.


**JetBrains — Kotlin compiler internals:** The K2 compiler (Kotlin 2.0+) rewrites the frontend for 2x compilation speed. Understanding that Kotlin compiles to JVM bytecode, JS, and native LLVM IR simultaneously is what makes KMP possible. One language, three compilation backends.


---


## 📖 Resources

- Kotlin official documentation: [kotlinlang.org/docs](http://kotlinlang.org/docs) (the primary source, excellent quality)
- _Kotlin in Action_ — Jemerov & Isakova (deep language coverage, 2nd edition covers coroutines)
- Roman Elizarov’s coroutines articles (Medium/@elizarov) — written by the coroutines library author
- Kotlin Playground: [play.kotlinlang.org](http://play.kotlinlang.org/) — run Kotlin without setup
- kotlinx.coroutines GitHub: read the source and tests for the deepest understanding
