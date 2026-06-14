---
source: notion
title: "📦 90-Day Android/Kotlin/KMP Roadmap"
slug: "90-day-androidkotlinkmp-roadmap"
notionId: "35ada883bddd81d9ab0ef4abfbd4114b"
notionRootId: "35ada883bddd81d9ab0ef4abfbd4114b"
parent: null
children: ["phase-5-expert-androidkmp-days-76-90","phase-4-kotlin-multiplatform-kmp-days-56-75","phase-3-architecture-and-patterns-days-36-55","phase-2-android-core-days-16-35","phase-1-kotlin-foundations-days-1-15"]
order: 3
icon: "📦"
cover: null
---
> 📦 **Frontend → Android/KMP Engineer transition.** 90 days. 5 phases. From Kotlin basics to production-grade Kotlin Multiplatform apps.

---


## 📌 How to use this template

- Work phases **in strict order** — every phase is a prerequisite for the next
- Daily ritual: study the concept → write code → break it intentionally → fix it → log one insight
- Use the **Daily Tracker** to stay accountable
- Open each **Phase page** for full breakdowns, projects, real-world references, and mistake corrections
> 💡 **The #1 rule of Android/KMP engineering:** The platform is the constraint. Understanding the Android lifecycle, the JVM memory model, and the Kotlin compiler internals is what separates engineers who fight the framework from engineers who use it correctly.

---


## 🗺️ Roadmap at a glance


| Phase                             | Days       | Focus                                            | Key Output                                 |
| --------------------------------- | ---------- | ------------------------------------------------ | ------------------------------------------ |
| Phase 1 — Kotlin Foundations      | Days 1–15  | Language internals, coroutines, type system      | Idiomatic Kotlin fluency                   |
| Phase 2 — Android Core            | Days 16–35 | Lifecycle, Jetpack, Compose, Navigation          | Production Android app skeleton            |
| Phase 3 — Architecture & Patterns | Days 36–55 | MVI, Clean Architecture, DI, testing             | Scalable, testable app architecture        |
| Phase 4 — Kotlin Multiplatform    | Days 56–75 | KMP setup, shared logic, platform APIs, CMP      | Shared business logic across Android + iOS |
| Phase 5 — Expert Android/KMP      | Days 76–90 | Performance, CI/CD, advanced Compose, production | Staff-level mobile engineering             |


---


## ⚡ The Android/KMP Engineering Decision Framework


Ask these questions in order for every feature you build:

1. **Where does this logic live?** — shared module (pure Kotlin, no platform) or platform module?
2. **Who owns the state?** — ViewModel, Repository, or UI local state?
3. **How does it survive configuration change?** — ViewModel survives rotation. Composable state does not.
4. **How does it survive process death?** — `SavedStateHandle` or persistence layer.
5. **How is it tested?** — unit test (pure Kotlin), integration test (Android), or UI test (Compose)?
6. **What is the threading model?** — which coroutine dispatcher? Is it safe to call from the main thread?

---


## 📊 My progress

- Current phase: **Phase 1**
- Current day: **Day 1 of 90**
- Apps shipped: **0**
- KMP modules built: **0**

---


## 🔖 Quick links

- ☁️ Phase 1 — Kotlin Foundations
- 📱 Phase 2 — Android Core
- 🏗️ Phase 3 — Architecture & Patterns
- 🌐 Phase 4 — Kotlin Multiplatform (KMP)
- 🧠 Phase 5 — Expert Android/KMP

---


## 💻 Tech stack this roadmap builds on


| Layer            | Technology                             |
| ---------------- | -------------------------------------- |
| Language         | Kotlin 2.x                             |
| UI (Android)     | Jetpack Compose                        |
| UI (iOS via KMP) | Compose Multiplatform                  |
| Architecture     | MVI + Clean Architecture               |
| DI               | Koin or Hilt                           |
| Async            | Kotlin Coroutines + Flow               |
| Networking       | Ktor Client (KMP)                      |
| Local DB         | SQLDelight (KMP) or Room (Android)     |
| Build            | Gradle Kotlin DSL + Convention Plugins |
| CI/CD            | GitHub Actions + Fastlane              |
| Testing          | JUnit5, Turbine, Paparazzi, XCTest     |


📅 Android/KMP Daily Tracker


## Phase 1 — Kotlin Foundations (Days 1–15)
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

## Phase 2 — Android Core (Days 16–35)
> **Core insight:** The Android lifecycle is not a bug or a legacy design — it is the constraint that every correct Android app is built around. Engineers who ignore it write apps that crash on rotation, leak memory, and drain batteries. Learn the lifecycle first. Every Jetpack library is just a tool to make lifecycle compliance easier.

---


## 🧠 Why this phase exists


You can write perfect Kotlin and still build broken Android apps if you don't understand how the OS manages your components. This phase covers the Android runtime model, Jetpack Compose as the UI layer, and the Jetpack libraries that form the standard production stack in 2025+.


---


## 📚 Topics in order


### Day 16–17 — Android lifecycle deep dive

- **Activity lifecycle:** `onCreate` → `onStart` → `onResume` → `onPause` → `onStop` → `onDestroy`. Know exactly what triggers each transition and what is safe to do in each state.
- **Configuration change:** rotation, language change, dark mode toggle — all destroy and recreate the Activity. Any data stored in the Activity is lost. This is why ViewModel exists.
- **Process death:** the OS kills your process when memory is low. The back stack is preserved (via `savedInstanceState`), but in-memory state is lost. `SavedStateHandle` in ViewModel survives process death.
- **Fragment lifecycle vs Activity lifecycle:** Fragment has its own lifecycle AND a view lifecycle. `viewLifecycleOwner` is the correct owner for UI-bound observers — not `this` (the Fragment itself).
- **`onSaveInstanceState`** **vs ViewModel:** `onSaveInstanceState` for small serialisable data (selected tab, scroll position). ViewModel for larger in-memory data (list of items, loaded state).
- **`rememberSaveable`** **in Compose:** persists Compose state across recomposition AND configuration changes. Uses the same `savedInstanceState` bundle mechanism internally.

### Day 18–19 — Jetpack ViewModel + StateFlow

- **ViewModel purpose:** survives configuration changes. Scoped to the screen, not the Activity/Fragment instance. Cleared when the user navigates away permanently.
- **`viewModelScope`****:** a `CoroutineScope` tied to the ViewModel's lifecycle. Cancelled when `onCleared()` is called. All coroutines launched here are automatically cancelled.
- **The correct ViewModel pattern:**

    ```kotlin
    class HomeViewModel(private val repo: HomeRepository) : ViewModel() {
        private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
        val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
        init { loadData() }
    
        private fun loadData() {
            viewModelScope.launch {
                _uiState.value = try {
                    HomeUiState.Success(repo.getData())
                } catch (e: Exception) {
                    HomeUiState.Error(e.message ?: "Unknown error")
                }
            }
        }
    }
    ```

- **Expose** **`StateFlow`****, not** **`MutableStateFlow`****:** UI should never be able to modify state directly. Expose read-only `StateFlow` from ViewModel.
- **`SavedStateHandle`****:** a `Map`-like object injected into ViewModel that persists across process death. Use `savedStateHandle.getStateFlow("key", default)` for reactive access.

### Day 20–22 — Jetpack Compose fundamentals

- **The recomposition model:** Compose re-executes `@Composable` functions when their inputs (state) change. Not the whole UI — only the composables whose inputs changed (smart recomposition).
- **State in Compose:**
    - `remember { }`: survives recomposition. Lost on configuration change.
    - `rememberSaveable { }`: survives recomposition AND configuration change.
    - `collectAsStateWithLifecycle()`: safely collects a `Flow`/`StateFlow` in a composable, respecting lifecycle.
- **Unidirectional Data Flow (UDF):** state flows down, events flow up. Composable receives state as parameters, emits events via lambdas. Never passes ViewModel directly into a child composable.

    ```kotlin
    @Composable
    fun HomeScreen(viewModel: HomeViewModel = viewModel()) {
        val state by viewModel.uiState.collectAsStateWithLifecycle()
        HomeContent(state = state, onRetry = viewModel::loadData)
    }
    @Composable
    fun HomeContent(state: HomeUiState, onRetry: () -> Unit) { ... }
    ```

- **Composition vs recomposition vs side effects:** `LaunchedEffect(key)` runs a coroutine when the key changes. `DisposableEffect` for cleanup. `SideEffect` for every recomposition. Know when to use each.
- **`derivedStateOf`****:** creates a derived state that only triggers recomposition when the derived value changes (not when the source changes). Use for computed values from list state.
- **Stable and unstable types:** composables with unstable parameter types always recompose. Use `@Stable` or `@Immutable` annotations, or use immutable data classes, to make recomposition skippable.

### Day 23–24 — Compose layouts, modifiers, theming

- **Layout composables:** `Column`, `Row`, `Box` (Z-axis stacking), `LazyColumn`, `LazyRow`, `LazyVerticalGrid`.
- **Modifier chain:** order matters. `Modifier.padding(16.dp).clickable { }` adds padding first, then clickable area includes padding. `Modifier.clickable { }.padding(16.dp)` — only the content area is clickable.
- **`LazyColumn`** **keys:** always provide a `key` in `items(list, key = { it.id })`. Without keys, Compose can't track item identity during list changes, causing animation glitches and state loss.
- **Material 3 theming:** `MaterialTheme` provides `colorScheme`, `typography`, `shapes`. Define a custom theme once. Access via `MaterialTheme.colorScheme.primary`, etc. Never hardcode colours.
- **Dynamic colour (Material You):** `dynamicColorScheme()` on Android 12+. Provide a fallback scheme for older versions.
- **Custom** **`Layout`** **composable:** when `Column`/`Row`/`Box` are insufficient. `Layout` gives you full control over measurement and placement.

### Day 25–26 — Navigation Component (Compose)

- **NavController + NavHost:** `rememberNavController()` creates the controller. `NavHost` defines the navigation graph.
- **Type-safe navigation (Navigation 2.8+):** define routes as `@Serializable` data classes. No string routes. No manual argument parsing.

    ```kotlin
    @Serializable data class ProductDetail(val productId: String)
    
    NavHost(navController, startDestination = Home) {
        composable<Home> { HomeScreen(onProductClick = { navController.navigate(ProductDetail(it)) }) }
        composable<ProductDetail> { backStackEntry ->
            val args = backStackEntry.toRoute<ProductDetail>()
            ProductDetailScreen(productId = args.productId)
        }
    }
    ```

- **ViewModel scoped to NavBackStackEntry:** `viewModel()` inside a composable scoped to that screen. Use `navController.getBackStackEntry(route)` to scope a ViewModel to a nested graph (e.g., shared ViewModel across a checkout flow).
- **Deep links:** `deepLinks = listOf(navDeepLink<ProductDetail>(basePath = "https://app.com/product"))`. Handle both web and app-internal deep links.
- **Back stack manipulation:** `popUpTo`, `launchSingleTop`, `saveState/restoreState` for bottom navigation patterns.

### Day 27–28 — Room database

- **Room components:** `@Entity` (table), `@Dao` (queries), `@Database` (database holder).
- **Suspend DAO functions:** Room auto-runs suspend functions on a background thread. No `withContext(IO)` needed.
- **Flow-returning queries:** `@Query("...") fun getAll(): Flow<List<Item>>`. Room emits a new value whenever the underlying table changes. Combine with `stateIn` in ViewModel.
- **`@Transaction`****:** use for queries that join multiple tables. Prevents inconsistent reads.
- **Migration:** `Migration(fromVersion, toVersion)` with SQL. `fallbackToDestructiveMigration()` for dev only — never in production.
- **Type converters:** `@TypeConverter` for custom types (e.g., `List<String>` ↔ `String` JSON, `Instant` ↔ `Long`).
- **Room vs SQLDelight:** Room is Android-only. SQLDelight is KMP-compatible and generates type-safe Kotlin from SQL. In a KMP project, prefer SQLDelight.

### Day 29–30 — Retrofit + OkHttp / Ktor (Android)

- **Retrofit:** type-safe HTTP client for Android. `@GET`, `@POST`, `@Query`, `@Body` annotations. Suspend function support: `suspend fun getUser(id: String): User`.
- **OkHttp interceptors:** add auth headers, logging, retry logic as an interceptor chain. `HttpLoggingInterceptor` for debug builds only (never in release — leaks PII).
- **Kotlinx Serialization:** Kotlin-native JSON serialisation. KMP-compatible. Use over Gson/Moshi in new projects.

    ```kotlin
    @Serializable data class UserDto(val id: String, val name: String)
    ```

- **Ktor Client (preferred for KMP):** multiplatform HTTP client. Same API on Android and iOS. Use in the shared module in KMP projects.
- **Error handling:** wrap API calls in `Result<T>`. Never let network exceptions propagate to the ViewModel uncaught.

    ```kotlin
    suspend fun getUser(id: String): Result<User> = runCatching { apiService.getUser(id).toDomain() }
    ```


### Day 31–32 — WorkManager + background processing

- **WorkManager:** guaranteed background execution. Persists across app restarts and device reboots. Use for: sync operations, upload queues, periodic cleanup.
- **`Worker`** **vs** **`CoroutineWorker`****:** use `CoroutineWorker` — it runs the work in a coroutine on `Dispatchers.IO` and handles cancellation correctly.
- **Constraints:** `Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()`. Work only executes when constraints are met.
- **`OneTimeWorkRequest`** **vs** **`PeriodicWorkRequest`****:** one-time for triggered tasks, periodic for scheduled recurring work (minimum interval: 15 minutes).
- **Chaining:** `WorkManager.getInstance().beginWith(workA).then(workB).then(workC).enqueue()`. Output of A is input to B via `Data`.
- **When NOT to use WorkManager:** for immediate foreground work, use coroutines. For real-time messaging, use FCM. WorkManager is for deferrable, guaranteed-execution tasks.

### Day 33–35 — DataStore + app architecture wiring

- **DataStore vs SharedPreferences:** DataStore uses coroutines and `Flow`. No blocking reads. No `apply()` vs `commit()` confusion. Crash-safe. Always prefer DataStore in new code.
- **Preferences DataStore:** key-value store with `Preferences` API. Typed keys (`intPreferencesKey`, `stringPreferencesKey`).
- **Proto DataStore:** stores typed objects defined in Protocol Buffers. Type-safe, schema-versioned. Preferred for complex preference structures.
- **Reading:**

    ```kotlin
    val themeFlow: Flow<Theme> = dataStore.data.map { prefs -> prefs[THEME_KEY] ?: Theme.SYSTEM }
    ```

- **Writing:** `dataStore.edit { prefs -> prefs[THEME_KEY] = Theme.DARK }` — runs in a coroutine, atomic.
- **Wiring it all together:** by Day 35, build a complete mini-app: DataStore for settings, Room for local data, Retrofit/Ktor for network, ViewModel + StateFlow for state, Compose UI, Navigation. All pieces connected end-to-end.

---


## 🔨 Projects


### Project 1 — News reader app (all Jetpack components)


**Stack:** Kotlin, Jetpack Compose, ViewModel, Room, Retrofit, Navigation, DataStore


Features: browse news articles (fetched from a public API), offline caching in Room, save articles as favourites (Room), theme preference (DataStore), article detail screen with shared-element-style transition. Navigation graph with 3 screens. ViewModel per screen. `StateFlow` for all state. Zero direct API calls from composables.


**Deliverable:** App survives rotation without re-fetching. App works offline using cached data. Theme preference persists across process death.


### Project 2 — Compose animation showcase


**Deliverable:** A single-screen app demonstrating: `AnimatedVisibility`, `animateContentSize`, `Crossfade`, `AnimatedContent`, custom `animate*AsState` for a list item expand/collapse interaction, and a `Canvas`-based custom loading indicator. Each animation is triggered by state changes, not imperative calls.


### Project 3 — Background sync with WorkManager


**Scenario:** Sync local Room data with a remote API every hour when connected to WiFi.


**Deliverable:** `PeriodicWorkRequest` with `NetworkType.UNMETERED` constraint. `CoroutineWorker` that fetches from API, diffs against Room data, and inserts only changed records. Retry logic with exponential backoff. Work status observed in the UI via `WorkManager.getWorkInfoByIdFlow()` displayed as a sync indicator.


---


## ⚠️ Common mistakes


### Mistake 1


**✗ Passing ViewModel instances into child composables.**


Child composables become tightly coupled to the ViewModel. They can't be previewed, can't be reused in other screens, and can't be tested in isolation.


**✓ Correct approach:** ViewModel is instantiated only at the screen-level composable (the root of the screen). It extracts state and event handlers. These are passed as plain parameters to all child composables. Children are pure functions of their inputs.


### Mistake 2


**✗ Using** **`remember`** **when you need** **`rememberSaveable`****.**


A user fills in a form, rotates the screen, and all input is lost. `remember` only survives recomposition. Configuration changes destroy and recreate the composition.


**✓ Correct approach:** Use `rememberSaveable` for any UI state the user has interacted with: text field contents, selected tab, scroll position. Use `remember` only for derived or re-computable state.


### Mistake 3


**✗ Reading from Room on the main thread.**


Room throws `IllegalStateException: Cannot access database on the main thread` by default. Engineers sometimes call `.allowMainThreadQueries()` to silence the error. This causes ANRs.


**✓ Correct approach:** Always use suspend DAO functions (Room runs them on IO automatically) or Flow-returning queries (collected in viewModelScope on IO). Never call `allowMainThreadQueries()` except in tests.


### Mistake 4


**✗ Using** **`viewLifecycleOwner`** **incorrectly in Fragments.**


Using `this` (the Fragment) as the lifecycle owner for view-bound observers causes the observer to persist after the view is destroyed but before the Fragment is destroyed. This is a common memory leak.


**✓ Correct approach:** For view-bound operations (collecting flows for UI, observing LiveData for rendering), always use `viewLifecycleOwner`. In Compose-only apps with Navigation Compose, Fragments are largely eliminated — this issue goes away.


---


## 🏢 How real companies use Android Jetpack


**Google — Compose adoption:** Google's own apps (Maps, Photos, Gmail) are migrating to Compose. The Maps Compose library wraps the Maps SDK in composable functions. Google's architecture guidance ("Now in Android" sample) is the canonical reference for production Jetpack usage.


**Airbnb — Compose migration strategy:** Airbnb migrated their massive codebase incrementally using `ComposeView` in XML layouts and `AndroidView` in Compose. They published detailed findings on recomposition performance that led to improvements in the Compose compiler.


**Spotify — ViewModel architecture:** Spotify's Android architecture uses ViewModel + StateFlow with a single `UiState` data class per screen. Each user action is a sealed `UiEvent`. The ViewModel is the single source of truth for the screen. Their architecture influenced the "Unidirectional Data Flow" guidance Google now recommends officially.


---


## 📖 Resources

- Now in Android sample: [github.com/android/nowinandroid](http://github.com/android/nowinandroid) (Google's reference architecture)
- Android Developer docs: [developer.android.com/jetpack](http://developer.android.com/jetpack) (primary reference)
- Philipp Lackner YouTube channel (best Compose + Android tutorials)
- _Jetpack Compose Internals_ — Jorge Castillo (deep Compose runtime internals)
- Android Compose samples: [github.com/android/compose-samples](http://github.com/android/compose-samples)

## Phase 3 — Architecture & Patterns (Days 36–55)
> **Core insight:** Architecture is not about following a pattern because it has a cool name. It is about answering one question: when requirement X changes tomorrow, which files change? A good architecture isolates change. MVI + Clean Architecture is the production answer to that question for Android in 2025.

---


## 🧠 Why this phase exists


Phase 2 gave you all the Android building blocks. This phase teaches you how to assemble them into a system that scales to 100 screens, 10 engineers, and 3 years of requirements changes without becoming unmaintainable. Every pattern here is driven by a real pain point, not theory.


---


## 📚 Topics in order


### Day 36–37 — Clean Architecture for Android

- **The three layers:**
    - **Domain layer:** pure Kotlin. No Android imports. No framework dependencies. Contains: `UseCase` classes, domain models, repository interfaces. This layer is 100% unit-testable with no Android emulator.
    - **Data layer:** implements the repository interfaces defined in domain. Contains: `RepositoryImpl`, `RemoteDataSource` (Ktor/Retrofit), `LocalDataSource` (Room/SQLDelight), DTOs, mappers.
    - **Presentation layer:** Android-specific. Contains: `ViewModel`, `UiState`, `UiEvent`, Composables. Depends on domain use cases only.
- **Dependency rule:** dependencies point inward only. Presentation → Domain ➐ Data. The domain layer knows nothing about Android, Room, or Ktor. The data layer knows nothing about ViewModels or Compose.
- **Module structure:**

    ```javascript
    :domain          — pure Kotlin module
    :data            — Android library module  
    :presentation    — Android library module
    :app             — thin wiring module (DI setup, Application class)
    ```

- **UseCase (Interactor):** single-responsibility. One use case = one business operation.

    ```kotlin
    class GetUserProfileUseCase(private val userRepo: UserRepository) {
        suspend operator fun invoke(userId: String): Result<UserProfile> =
            userRepo.getUserProfile(userId)
    }
    ```


    The `operator fun invoke` allows calling it as `getUserProfile(id)` — reads like a function call, not an object method call.

- **Domain model vs DTO vs UI model:** three separate model layers.
    - DTO: JSON shape from the API (can change with API versioning)
    - Domain model: business entity (stable, only changes with business rules)
    - UI model: optimised for rendering (flattened, formatted strings, display flags)
    - Mappers: `UserDto.toDomain()`, `UserProfile.toUiModel()`. Never skip a layer to save boilerplate.

### Day 38–40 — MVI architecture pattern

- **Why MVI over MVVM:** MVVM with `MutableStateFlow` per field creates scattered, inconsistent state. MVI enforces a single immutable `UiState` object. The UI is always a pure function of the state. Impossible states are impossible.
- **MVI contracts:**

    ```kotlin
    // One sealed interface per screen for each contract
    data class HomeUiState(
        val isLoading: Boolean = false,
        val items: List<Item> = emptyList(),
        val error: String? = null
    )
    
    sealed interface HomeUiIntent {        // user actions
        data object Refresh : HomeUiIntent
        data class Search(val query: String) : HomeUiIntent
        data class ItemClick(val id: String) : HomeUiIntent
    }
    
    sealed interface HomeUiEffect {        // one-shot side effects
        data class NavigateTo(val route: String) : HomeUiEffect
        data class ShowSnackbar(val message: String) : HomeUiEffect
    }
    ```

- **ViewModel in MVI:**

    ```kotlin
    class HomeViewModel(private val getItems: GetItemsUseCase) : ViewModel() {
        private val _state = MutableStateFlow(HomeUiState())
        val state: StateFlow<HomeUiState> = _state.asStateFlow()
    
        private val _effects = Channel<HomeUiEffect>(Channel.BUFFERED)
        val effects: Flow<HomeUiEffect> = _effects.receiveAsFlow()
    
        fun processIntent(intent: HomeUiIntent) {
            when (intent) {
                HomeUiIntent.Refresh -> loadItems()
                is HomeUiIntent.Search -> search(intent.query)
                is HomeUiIntent.ItemClick -> navigate(intent.id)
            }
        }
    
        private fun loadItems() {
            viewModelScope.launch {
                _state.update { it.copy(isLoading = true) }
                getItems().fold(
                    onSuccess = { items -> _state.update { it.copy(isLoading = false, items = items) } },
                    onFailure = { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
                )
            }
        }
    }
    ```

- **`Channel`** **for one-shot effects:** `StateFlow` replays the last value — bad for one-shot events (navigation fires twice after rotation). `Channel` with `receiveAsFlow()` delivers each event exactly once.
- **State vs Effect decision rule:** if the UI needs to reflect it persistently (loading spinner, list content, error message) — it’s state. If it’s a one-time action (navigate, show toast, vibrate) — it’s an effect.

### Day 41–42 — Dependency Injection — Koin vs Hilt


**Hilt (Google, compile-time DI):**

- Annotation-based. `@HiltViewModel`, `@Inject`, `@Module`, `@Provides`, `@Binds`.
- Compile-time validation: if a dependency is missing, the build fails. No runtime crashes.
- Android-aware scopes: `@Singleton`, `@ActivityScoped`, `@ViewModelScoped`.
- Boilerplate-heavy but IDE-friendly. Best choice for large teams.

```kotlin
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getItems: GetItemsUseCase
) : ViewModel()
```


**Koin (Kotlin, runtime DI):**

- DSL-based. `module { single { } factory { } viewModel { } }`.
- No code generation, no annotation processing. Faster build times.
- Runtime validation: missing dependencies fail at startup (or on first use if lazy).
- KMP-compatible: `koin-core` works in shared modules. Best for KMP projects.

```kotlin
val appModule = module {
    single<UserRepository> { UserRepositoryImpl(get(), get()) }
    factory { GetItemsUseCase(get()) }
    viewModel { HomeViewModel(get()) }
}
```


**Decision:** Hilt for Android-only apps at scale. Koin for KMP projects (Koin supports shared modules natively). Never mix both in one project.


### Day 43–44 — Repository pattern + offline-first architecture

- **Repository as the single source of truth:** the ViewModel never decides where data comes from. It calls the repository. The repository decides: serve from cache, fetch from network, or both.
- **Offline-first strategy:**

    ```kotlin
    fun getItems(): Flow<Result<List<Item>>> = flow {
        // 1. Emit cached data immediately
        val cached = localDataSource.getItems()
        if (cached.isNotEmpty()) emit(Result.success(cached.map { it.toDomain() }))
    
        // 2. Fetch from network
        try {
            val fresh = remoteDataSource.getItems()
            localDataSource.saveItems(fresh)       // update cache
            emit(Result.success(fresh.map { it.toDomain() }))
        } catch (e: IOException) {
            if (cached.isEmpty()) emit(Result.failure(e))  // only fail if no cache
        }
    }
    ```

- **Cache invalidation strategy:** TTL (timestamp in Room entity), explicit refresh trigger (pull-to-refresh), or event-driven (WebSocket update invalidates specific keys).
- **Pagination with Paging 3:**
    - `PagingSource`: defines how to load a page. `load(params)` returns `LoadResult.Page`.
    - `Pager`: creates a `PagingData` flow from a `PagingSource`.
    - `RemoteMediator`: coordinates network + local cache for paged data. Loads from network into Room, Room is the source of truth.
    - In Compose: `collectAsLazyPagingItems()` + `LazyColumn` with `items(lazyPagingItems)`.

### Day 45–47 — Testing strategy for Android


**The testing pyramid for Android:**

- **Unit tests (70%):** domain layer, ViewModel, use cases, mappers. Pure Kotlin, no Android. Run in milliseconds on the JVM. JUnit5 + MockK + Turbine.
- **Integration tests (20%):** repository with a real in-memory Room database. DAO tests. Run on JVM with Robolectric or on a real device/emulator.
- **UI/E2E tests (10%):** Compose UI tests. Full app flows. Run on device/emulator. Slowest.

**Testing a ViewModel with Turbine:**


```kotlin
@Test
fun `load items emits loading then success`() = runTest {
    val fakeRepo = FakeItemRepository(items = listOf(item1, item2))
    val vm = HomeViewModel(GetItemsUseCase(fakeRepo))

    vm.state.test {
        assertEquals(HomeUiState(isLoading = true), awaitItem())
        assertEquals(HomeUiState(items = listOf(item1, item2)), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}
```


**MockK over Mockito for Kotlin:**

- `mockk<UserRepository>()` creates a mock. `every { repo.getUser(any()) } returns user` stubs it. `coEvery` for suspend functions. `verify { }` for assertion.
- `spyk` for partial mocks (spy). `relaxed = true` for mocks that auto-stub all methods.

**Fake over Mock:** for repositories, prefer writing a `FakeRepository` that stores data in a list. Fakes are more readable, easier to set up complex scenarios, and closer to real behaviour than mocks.


**Testing Compose UI:**


```kotlin
@Test
fun homeScreen_showsItems_whenStateIsSuccess() {
    composeTestRule.setContent {
        HomeContent(state = HomeUiState(items = listOf(item1)), onRetry = {})
    }
    composeTestRule.onNodeWithText(item1.title).assertIsDisplayed()
}
```


**`TestDispatcher`** **and** **`runTest`****:** always use `UnconfinedTestDispatcher` or `StandardTestDispatcher` to control coroutine execution in tests. `runTest` automatically advances virtual time, so `delay(1000)` in tests completes instantly.


### Day 48–50 — Modularisation strategy


**Why modularise:**

- Faster incremental builds (only changed modules recompile)
- Enforced architecture boundaries (module cannot access what it doesn’t depend on)
- Feature teams own feature modules
- Parallel development without merge conflicts

**Module types:**

- `:core:domain` — pure Kotlin, shared domain models + interfaces
- `:core:data` — repository implementations, Room, Ktor
- `:core:ui` — shared Compose components, theme, design system
- `:core:common` — utilities, extensions, constants
- `:feature:home` — feature module (ViewModel + Composables for home screen)
- `:feature:profile` — feature module
- `:app` — thin wiring: DI setup, MainActivity, top-level NavHost

**Convention plugins (Gradle Kotlin DSL):**


Instead of duplicating build config in every `build.gradle.kts`, write convention plugins:


```kotlin
// build-logic/src/main/kotlin/AndroidFeatureConventionPlugin.kt
class AndroidFeatureConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) {
        with(target) {
            apply("com.android.library")
            apply("org.jetbrains.kotlin.android")
            // apply standard dependencies, lint rules, test config
        }
    }
}
```


Apply with `plugins { id("convention.android.feature") }` in each feature module. Now in Android sample is the reference for this.


### Day 51–55 — Advanced Compose patterns


**Composition Local:**

- `CompositionLocal` provides values implicitly through the composition tree. Use for: theming, navigation controller, analytics.
- `staticCompositionLocalOf { }` for values that rarely change. `compositionLocalOf { }` for values that change (triggers recomposition of all consumers when changed).
- Don’t use for dependency injection of business logic — that’s what Hilt/Koin is for.

**Custom** **`Modifier`** **extensions:**


```kotlin
fun Modifier.shimmerEffect(): Modifier = composed {
    val transition = rememberInfiniteTransition()
    val alpha by transition.animateFloat(0.2f, 0.9f, infiniteRepeatable(tween(1000)))
    this.background(MaterialTheme.colorScheme.onSurface.copy(alpha = alpha))
}
```


**Shared element transitions (Compose 1.7+):**

- `SharedTransitionLayout` + `Modifier.sharedElement()` for hero animations between screens.
- The navigation library integrates with shared element transitions via `SharedTransitionScope`.

**Compose stability and performance:**

- Use the Compose compiler metrics (`-P plugin:...`) to identify unstable classes causing unnecessary recomposition.
- `@Immutable` on data classes used as Compose parameters prevents recomposition when the reference hasn’t changed.
- `remember(key)` to memoise expensive computations. `derivedStateOf` to derive state without over-triggering recomposition.

---


## 🔨 Projects


### Project 1 — Full MVI + Clean Architecture app


**Stack:** Kotlin, Compose, Hilt or Koin, Room, Ktor, Navigation, MVI


Build a task management app with 4 features: task list (with offline-first), task detail, create task, settings (theme preference via DataStore). Strict Clean Architecture: `:domain`, `:data`, `:feature:tasks`, `:feature:settings`, `:app` modules. Every screen has `UiState`, `UiIntent`, `UiEffect` sealed classes. 80% unit test coverage on ViewModel and use case layers. Zero direct framework imports in `:domain`.


**Deliverable:** Running app with offline support. All ViewModel tests pass with Turbine. Architecture boundary violations fail the build (use module dependencies to enforce).


### Project 2 — Paging 3 + RemoteMediator


**Scenario:** A "GitHub repositories" browser with infinite scroll.


**Deliverable:** `GithubPagingSource` fetching from GitHub API. `GithubRemoteMediator` caching pages in Room. `Pager` combining both. `LazyColumn` with `collectAsLazyPagingItems()`. Load state handling: show skeleton on initial load, show footer spinner on append, show error with retry on failure. All with zero direct API calls from the composable.


### Project 3 — Screenshot testing with Paparazzi


**Deliverable:** Add Paparazzi screenshot tests for 5 key composables in your app. Test each in 3 states: loading, success, error. Test in light and dark mode. Add a GitHub Actions job that runs screenshot tests on every PR and blocks merge on visual regressions.


---


## ⚠️ Common mistakes


### Mistake 1


**✗ Using** **`MutableStateFlow`** **for one-shot UI effects (navigation, toasts).**


`StateFlow` holds and replays its last value. After rotation, the user gets navigated to the detail screen again because the navigation event was replayed.


**✓ Correct approach:** Use `Channel<UiEffect>` with `receiveAsFlow()` for one-shot effects. Each event is consumed exactly once. Collect in the composable inside `LaunchedEffect(Unit)`.


### Mistake 2


**✗ Injecting** **`Context`** **into domain layer use cases.**


The domain layer must be pure Kotlin with no Android dependencies. `Context` in use cases means the domain layer knows about Android internals, making it impossible to test without Android.


**✓ Correct approach:** If a use case needs a resource (string, file path), inject an interface (`ResourceProvider`) that the data layer implements using `Context`. The domain layer depends on the interface, not `Context` directly.


### Mistake 3


**✗ Writing one giant feature module instead of modularising.**


As the app grows, one module means: slow builds (entire app recompiles on any change), no architecture enforcement, and merge conflicts across all features.


**✓ Correct approach:** Start with modularisation from day one using the convention plugin pattern. Each feature is a module. Each module has a clear public API (`internal` modifier hides implementation details). Module boundaries enforce Clean Architecture for free.


### Mistake 4


**✗ Testing implementation details instead of behaviour.**


`verify { repo.getUser(id) }` tests that the repository was called — an implementation detail. If you refactor to cache first, the test breaks even though the behaviour is correct.


**✓ Correct approach:** Test observable behaviour: what state does the ViewModel emit? Does the UI show the correct content? Use fakes over mocks. Assert on `StateFlow` emissions via Turbine. The test survives refactoring as long as behaviour is preserved.


---


## 🏢 How real companies architect Android apps


**Google — Now in Android:** Google’s reference architecture uses exactly the modularisation strategy described here: `:core:*` modules for shared infrastructure, `:feature:*` modules for each feature, convention plugins for consistent build config. Open source at [github.com/android/nowinandroid](http://github.com/android/nowinandroid). Study this codebase.


**Spotify — Single UiState per screen:** Spotify’s Android team documented their migration from multiple `LiveData` fields per screen to a single `UiState` data class. Result: eliminated an entire category of bug (inconsistent state where `isLoading = true` and `error != null` simultaneously).


**Bumble — MVI at scale:** Bumble’s mobile team adopted MVI across their Android and iOS apps. Their key insight: MVI’s unidirectional data flow makes state bugs reproducible and fixable because any state can be reconstructed from the intent history.


---


## 📖 Resources

- Now in Android: [github.com/android/nowinandroid](http://github.com/android/nowinandroid) (study the module structure + convention plugins)
- _Android Development with Kotlin_ — Griffiths & Griffiths
- Kotlin Coroutines + Flow: Philipp Lackner YouTube series
- Turbine: [github.com/cashapp/turbine](http://github.com/cashapp/turbine) (Flow testing library)
- Paparazzi: [github.com/cashapp/paparazzi](http://github.com/cashapp/paparazzi) (screenshot testing without a device)

## Phase 4 — Kotlin Multiplatform — KMP (Days 56–75)
> **Core insight:** KMP is not "write once, run anywhere." It is "share logic, own the platform." The business rules, data fetching, and state management live in Kotlin in a shared module. The UI and platform-specific APIs stay native. This distinction is the entire mental model of KMP.

---


## 🧠 Why this phase exists


Kotlin Multiplatform is the most significant shift in mobile engineering since Swift. It lets your existing Kotlin code run on iOS, web, and desktop without a cross-platform UI compromise. This phase takes your Android Kotlin skills and extends them to a shared module that powers both Android and iOS.


---


## 📚 Topics in order


### Day 56–57 — KMP project structure and build setup


**KMP source sets:**


```javascript
shared/
  src/
    commonMain/kotlin/    ← shared business logic (runs on all targets)
    commonTest/kotlin/    ← shared tests (run on all targets)
    androidMain/kotlin/   ← Android-specific implementations
    iosMain/kotlin/       ← iOS-specific implementations
    desktopMain/kotlin/   ← Desktop-specific (optional)
```


**`build.gradle.kts`** **for a KMP shared module:**


```kotlin
kotlin {
    androidTarget { compilations.all { kotlinOptions.jvmTarget = "17" } }
    iosX64(); iosArm64(); iosSimulatorArm64()

    sourceSets {
        commonMain.dependencies {
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.ktor.client.core)
            implementation(libs.sqldelight.runtime)
            implementation(libs.koin.core)
        }
        androidMain.dependencies {
            implementation(libs.ktor.client.okhttp)
            implementation(libs.sqldelight.android.driver)
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
            implementation(libs.sqldelight.native.driver)
        }
    }
}
```


**What goes in** **`commonMain`****:** anything that is pure Kotlin with no platform API calls.

- Domain models, use cases, repository interfaces
- Ktor HTTP client logic (Ktor is KMP-native)
- SQLDelight queries (SQLDelight generates KMP-compatible code)
- Business logic, validators, mappers
- Coroutines + Flow-based state management

**What stays platform-specific:**

- UI (unless using Compose Multiplatform)
- Camera, GPS, biometrics, push notifications
- Platform-specific DB drivers (OkHttp on Android, Darwin on iOS)
- File system access, Keychain/Keystore

### Day 58―59 — `expect` / `actual` mechanism


**The problem it solves:** your shared module needs to use a platform-specific API (e.g., the current timestamp, UUID generation, platform name) but `commonMain` can’t import Android or iOS APIs.


**`expect`** **/** **`actual`** **pattern:**


```kotlin
// commonMain — declare the contract
expect class Platform() {
    val name: String
}

expect fun randomUUID(): String

expect fun currentTimeMillis(): Long
```


```kotlin
// androidMain — provide the Android implementation
actual class Platform actual constructor() {
    actual val name: String = "Android ${android.os.Build.VERSION.SDK_INT}"
}
actual fun randomUUID(): String = java.util.UUID.randomUUID().toString()
actual fun currentTimeMillis(): Long = System.currentTimeMillis()
```


```kotlin
// iosMain — provide the iOS implementation
actual class Platform actual constructor() {
    actual val name: String = UIDevice.currentDevice.systemName() + " " + UIDevice.currentDevice.systemVersion
}
actual fun randomUUID(): String = NSUUID().UUIDString()
actual fun currentTimeMillis(): Long = (NSDate().timeIntervalSince1970 * 1000).toLong()
```


**When to use** **`expect`****/****`actual`****:**

- Platform-specific system APIs (time, UUID, platform name)
- DB drivers (each platform needs a different SQLDelight driver)
- HTTP engines (OkHttp vs Darwin)
- Cryptography (Android Keystore vs iOS Keychain)

**When NOT to use:** don’t use `expect`/`actual` for business logic. If you find yourself writing the same logic twice in both `actual` implementations, it should be in `commonMain`.


### Day 60–61 — Ktor Client in KMP (shared networking)


**Ktor is the standard KMP HTTP client.** Same API on Android and iOS. Engine is injected per platform.


```kotlin
// commonMain
class ApiClient(private val httpClient: HttpClient) {
    suspend fun getUsers(): List<UserDto> =
        httpClient.get("https://api.example.com/users").body()
}

fun createHttpClient(engine: HttpClientEngine): HttpClient = HttpClient(engine) {
    install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) }
    install(Logging) { level = LogLevel.HEADERS }
    defaultRequest { header("Authorization", "Bearer ${getToken()}") }
}
```


```kotlin
// androidMain
val client = createHttpClient(OkHttp.create())
// iosMain
val client = createHttpClient(Darwin.create())
```


**Ktor plugins:**

- `ContentNegotiation`: JSON serialisation with `kotlinx.serialization`
- `Auth`: Bearer token, Basic auth, automatic token refresh
- `Logging`: request/response logging (use `LogLevel.NONE` in production)
- `HttpTimeout`: connect, request, and socket timeouts
- `HttpRequestRetry`: automatic retry with backoff

**Error handling with Ktor:**


```kotlin
suspend fun getUser(id: String): Result<User> = runCatching {
    httpClient.get("/users/$id") {
        parameter("fields", "id,name,email")
    }.body<UserDto>().toDomain()
}.mapFailure { e ->
    when (e) {
        is ClientRequestException -> when (e.response.status) {
            HttpStatusCode.NotFound -> UserNotFoundError(id)
            HttpStatusCode.Unauthorized -> UnauthorisedError
            else -> NetworkError(e.message)
        }
        is IOException -> NoConnectionError
        else -> UnknownError(e)
    }
}
```


### Day 62–64 — SQLDelight in KMP (shared local database)


**Why SQLDelight over Room for KMP:** Room is Android-only. SQLDelight generates type-safe Kotlin from SQL and works on Android, iOS, desktop, and JS.


**Setup:**


```kotlin
// build.gradle.kts
sqldelight {
    databases {
        create("AppDatabase") {
            packageName.set("com.example.db")
        }
    }
}
```


**Define schema in** **`.sq`** **files:**


```sql
-- commonMain/sqldelight/com/example/db/User.sq
CREATE TABLE User (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    createdAt INTEGER NOT NULL
);

getAllUsers:
SELECT * FROM User ORDER BY createdAt DESC;

getUserById:
SELECT * FROM User WHERE id = ?;

insertOrReplaceUser:
INSERT OR REPLACE INTO User(id, name, email, createdAt)
VALUES (?, ?, ?, ?);

deleteUser:
DELETE FROM User WHERE id = ?;
```


SQLDelight generates: `UserQueries` class with typed functions matching your SQL. `getAllUsers()` returns `Query<User>` which maps to a Flow.


**Platform-specific driver injection (via** **`expect`****/****`actual`****):**


```kotlin
// commonMain
expect fun createDatabaseDriver(context: Any?): SqlDriver

// androidMain
actual fun createDatabaseDriver(context: Any?): SqlDriver =
    AndroidSqliteDriver(AppDatabase.Schema, context as Context, "app.db")

// iosMain  
actual fun createDatabaseDriver(context: Any?): SqlDriver =
    NativeSqliteDriver(AppDatabase.Schema, "app.db")
```


**Flow integration:**


```kotlin
fun getAllUsersFlow(): Flow<List<User>> =
    userQueries.getAllUsers().asFlow().mapToList(Dispatchers.IO)
```


### Day 65–67 — Shared ViewModel / Presentation layer for KMP


**Option A — Shared ViewModel with KMP-ViewModel library:**


```kotlin
// commonMain using KMP-ViewModel (github.com/rickclephas/KMP-NativeCoroutines)
class UserListViewModel : KMPViewModel() {
    private val _state = MutableStateFlow(UserListState())
    val state: StateFlow<UserListState> = _state.asStateFlow()

    fun loadUsers() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            getUsersUseCase().fold(
                onSuccess = { _state.update { s -> s.copy(isLoading = false, users = it) } },
                onFailure = { _state.update { s -> s.copy(isLoading = false, error = it.message) } }
            )
        }
    }
}
```

- Android: use directly as a standard ViewModel (KMP-ViewModel extends AndroidX ViewModel on Android)
- iOS: access via Swift using KMP-NativeCoroutines wrappers that convert `StateFlow` to Swift `AsyncStream`

**Option B — Shared UseCase only, platform ViewModels:**

- `commonMain`: domain layer + use cases + repository interfaces
- `androidMain`: Android ViewModel that calls use cases
- `iosMain`/Swift: iOS ViewModel (ObservableObject) that calls the same use cases
- More boilerplate, but full platform-native feel for iOS developers

**Which to choose:**

- Small team, Kotlin-first: Option A (shared ViewModel reduces duplication by 60%)
- Dedicated iOS team, native feel priority: Option B (iOS devs write Swift ViewModels)
- Most KMP projects at scale use a hybrid: shared use cases + platform ViewModels

### Day 68–70 — Compose Multiplatform (CMP)


**CMP = Jetpack Compose for all platforms.** The same Compose code runs on Android, iOS, desktop (JVM), and web (Wasm). JetBrains maintains CMP; Google maintains Jetpack Compose for Android.


**What is stable (2025):**

- Android: stable and production-ready
- iOS: beta (production-ready for most use cases)
- Desktop (JVM): stable
- Web (Wasm): alpha

**CMP project structure:**


```javascript
composeApp/
  src/
    commonMain/   ← all Compose UI code goes here
    androidMain/  ← Android entry point (MainActivity)
    iosMain/      ← iOS entry point (MainViewController)
shared/
  src/
    commonMain/   ← business logic (no UI)
```


**What works in** **`commonMain`** **Compose:**

- All layout composables: `Column`, `Row`, `Box`, `LazyColumn`
- Material 3 components (via `compose-material3` for CMP)
- Animations, modifiers, theming
- Navigation: Compose Navigation or Voyager (KMP-native navigator)

**What still needs** **`expect`****/****`actual`****:**

- Image loading (`Coil` for Android, `Kamel` for KMP)
- File picker, camera, maps
- Platform-specific permission handling

**Voyager — KMP-native navigation:**


```kotlin
// commonMain — navigation is fully shared
class HomeScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        HomeContent(onNavigate = { navigator.push(DetailScreen(it)) })
    }
}
```


### Day 71–75 — KMP-specific patterns and interoperability


**Coroutine-Swift interoperability:**

- `StateFlow` in Kotlin does not expose well to Swift natively.
- **SKIE** (Swift Kotlin Interface Enhancer): generates Swift-idiomatic wrappers automatically. `StateFlow` → `AsyncSequence`. Sealed classes → Swift enums. The best solution in 2025.
- **KMP-NativeCoroutines**: an alternative that generates `AsyncStream` wrappers.

**Handling iOS main thread:**

- iOS requires UI updates on the main thread. Kotlin/Native coroutines run on a background thread by default.
- Use `@MainActor` equivalent via `Dispatchers.Main` in shared code.
- With SKIE: thread safety is handled transparently.

**Shared** **`Result`** **type:**


Avoid `kotlin.Result` in KMP public APIs exposed to Swift (boxing issues). Use a custom sealed class:


```kotlin
sealed class DataResult<out T> {
    data class Success<T>(val data: T) : DataResult<T>()
    data class Error(val message: String, val cause: Throwable? = null) : DataResult<Nothing>()
    data object Loading : DataResult<Nothing>()
}
```


This maps cleanly to a Swift enum via SKIE.


**KMP module as a CocoaPod / SPM package:**

- Gradle produces an XCFramework for iOS consumption.
- Integrate via CocoaPods: `kotlin { cocoapods { ... } }` in `build.gradle.kts`.
- Or Swift Package Manager (SPM): increasingly supported, preferred for new projects.

**Shared Analytics/Logging:**

- `Napier`: KMP logging library. `Napier.d("message")` in shared code. Each platform prints to Logcat / NSLog.
- Analytics events: define events as sealed classes in `commonMain`. Platform-specific `AnalyticsTracker` implementations call Firebase (Android) or Firebase iOS SDK.

---


## 🔨 Projects


### Project 1 — KMP shared module with full data layer


**Stack:** KMP, Ktor, SQLDelight, Koin, kotlinx.serialization


Build a shared `:shared` module with: `UserRepository` interface in domain, `UserRepositoryImpl` using Ktor for network + SQLDelight for cache in data, Koin DI module in shared, `expect`/`actual` for DB driver and `currentTimeMillis`. Wire to existing Android app from Phase 3. All existing Android tests still pass. Add identical unit tests for the shared module that run on both JVM and iOS simulator.


**Deliverable:** `./gradlew shared:testIosSimulatorArm64` and `./gradlew shared:testDebugUnitTest` both pass. Zero duplicated business logic.


### Project 2 — Compose Multiplatform app (Android + iOS)


**Stack:** CMP, Voyager navigation, Koin, shared `:shared` module


Build a weather app. Shared module: Ktor weather API client, domain models, use cases. Compose UI in `composeApp/commonMain`: home screen (current weather + 7-day forecast), location search screen. Navigation via Voyager. Android entry point in `androidMain`. iOS entry point in `iosMain` (SwiftUI wrapper calling `MainViewController()`). Theme is identical on both platforms.


**Deliverable:** One codebase. Two apps. Same UI. Runs on Android emulator and iOS simulator.


### Project 3 — SKIE + Swift integration


**Deliverable:** Take a shared ViewModel from Project 1. Expose its `StateFlow` to Swift using SKIE. In Swift: collect the `AsyncSequence` in an `ObservableObject`. Display the state in a pure SwiftUI view (no Compose). Demonstrate that the Swift ViewModel is < 30 lines because all logic is in Kotlin.


---


## ⚠️ Common mistakes


### Mistake 1


**✗ Putting Android-specific code in** **`commonMain`****.**


Importing `android.content.Context` in `commonMain` causes a compilation failure on iOS. Engineers from Android-only backgrounds do this instinctively.


**✓ Correct approach:** If you’re tempted to import an Android class in `commonMain`, you need an `expect`/`actual` abstraction. Define an interface or `expect fun` in `commonMain`. Implement with Android APIs in `androidMain`.


### Mistake 2


**✗ Using Room in the shared module.**


Room is an Android-only library. `@Entity`, `@Dao`, `@Database` annotations don’t exist in `commonMain`.


**✓ Correct approach:** SQLDelight for KMP shared modules. If migrating an existing Android app, Room stays in `:feature` Android modules. New shared data layer uses SQLDelight. Both can coexist during migration.


### Mistake 3


**✗ Sharing everything including platform-specific UI behaviour.**


Sharing the touch haptic feedback, the iOS swipe-back gesture, and the Android back button handling in `commonMain` creates platform-uncanny valley: the app feels wrong on both platforms.


**✓ Correct approach:** Share logic, own the platform experience. Business rules, data fetching, and state management are shared. Navigation gestures, platform conventions, and OS-specific interactions stay native. CMP for UI code that is truly identical; native UI for platform-feel interactions.


### Mistake 4


**✗ Ignoring Kotlin/Native memory model for iOS.**


Kotlin/Native (the iOS target) had a strict memory model requiring objects to be “frozen” before sharing between threads. This caused confusing `InvalidMutabilityException` crashes.


**✓ Correct approach:** Kotlin 1.7.20+ uses the new memory model by default — the old model is gone. But: avoid global mutable state in `commonMain`. Use `@ThreadLocal` for thread-local state when needed. Ensure all shared objects are immutable or managed by the coroutine dispatcher.


---


## 🏢 How real companies use KMP


**Netflix — KMP for shared business logic:** Netflix uses KMP to share their A/B testing framework, feature flag evaluation, and analytics logic across Android and iOS. Same experiment logic, same results, one Kotlin codebase. Their iOS team consumes the Kotlin module as an XCFramework.


**Touchlab — KMP consulting reference:** Touchlab (the leading KMP consulting firm) documented that teams sharing 60–70% of their code with KMP reduced mobile team size by 30% without sacrificing native UX. They maintain SKIE and several KMP open-source libraries.


**JetBrains — Fleet IDE:** JetBrains’ Fleet code editor uses Compose Multiplatform for its UI on all platforms: macOS, Windows, Linux. The entire UI codebase is shared Kotlin/Compose. This is the largest production CMP deployment and the proof that CMP can power professional-grade desktop apps.


---


## 📖 Resources

- KMP official docs: [kotlinlang.org/docs/multiplatform.html](http://kotlinlang.org/docs/multiplatform.html)
- KMP Wizard (project generator): [kmp.jetbrains.com](http://kmp.jetbrains.com/)
- SKIE: [github.com/touchlab/SKIE](http://github.com/touchlab/SKIE) (Swift interop, essential for iOS-facing KMP)
- SQLDelight: [sqldelight.github.io/sqldelight](http://sqldelight.github.io/sqldelight)
- Compose Multiplatform: [jb.gg/compose-multiplatform](http://jb.gg/compose-multiplatform)
- Touchlab KMP resources: [touchlab.co/kotlin-multiplatform](http://touchlab.co/kotlin-multiplatform)
- KMP samples: [github.com/JetBrains/compose-multiplatform-ios-android-template](http://github.com/JetBrains/compose-multiplatform-ios-android-template)

## Phase 5 — Expert Android/KMP (Days 76–90)
> **Core insight:** At the expert level, the job is not writing features — it is building the systems that let other engineers write features safely, quickly, and correctly. Performance budgets, CI pipelines, build systems, and code quality automation are the infrastructure that multiplies team velocity.

---


## 🧠 Why this phase exists


Phases 1–4 made you a capable Android/KMP engineer. This phase makes you the engineer other teams rely on: the one who owns performance, tooling, CI/CD, and the architectural decisions that affect the whole codebase. These are the staff-level Android skills.


---


## 📚 Topics in order


### Day 76–77 — Android performance profiling


**Android Profiler tools:**

- **CPU Profiler:** record method traces or sample-based profiles. Identify: slow `onDraw()` calls, main thread blocking, unnecessary work during scroll.
- **Memory Profiler:** heap dumps, allocation tracking, leak detection. Find: bitmaps not recycled, activities retained after close, coroutine scope leaks.
- **Network Profiler:** request timing, payload sizes, failed requests.
- **Layout Inspector:** inspect the live Compose composition tree. Find unnecessary recompositions with the recomposition count overlay.

**Compose performance profiling:**

- Enable recomposition count overlay: `enableRecompositionHighlighting()` in debug builds.
- Compose compiler metrics: add `-P plugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=...` to compiler args. Produces reports on unstable classes, skippable vs non-skippable composables.
- `LazyColumn` performance: always use `key { }`. Use `contentType { }` for mixed lists. Avoid creating lambdas inside `items { }` — use `remember`d callbacks.

**Common Android performance issues:**

- **Main thread IO:** `StrictMode.enableDefaults()` in debug builds detects this. Crashes with `StrictMode` policy violations.
- **Overdraw:** use the GPU overdraw visualiser in developer options. Each additional overdraw layer wastes fill rate.
- **Object allocation in hot paths:** avoid allocating objects inside `onDraw()`, inside composable functions that recompose frequently, or inside tight loops.
- **Bitmap recycling:** `Glide`/`Coil` handle this automatically. Custom image loading must explicitly recycle `Bitmap` objects or use `BitmapPool`.

**Memory leak detection:**

- **LeakCanary:** add to debug builds. Automatically detects activity, fragment, and ViewModel leaks. Zero configuration.
- Common leak patterns: anonymous inner class holding an Activity reference, `Handler` with a posted `Runnable` referencing a destroyed Activity, static reference to a Context.

### Day 78–79 — Advanced Gradle and build optimisation


**Gradle build speed:**

- **Configuration cache:** `org.gradle.configuration-cache=true` in `gradle.properties`. Caches the build configuration phase. Significant speedup on large projects.
- **Build cache:** `org.gradle.caching=true`. Caches task outputs. Shared build cache in CI eliminates redundant work across machines.
- **Parallel execution:** `org.gradle.parallel=true`. Modules with no inter-dependency build simultaneously.
- **`--daemon`****:** long-lived Gradle daemon reuses JVM warm state. Default in Android Studio, explicit in CI.

**Dependency management:**

- **Version catalogs (****`libs.versions.toml`****):** centralises all dependency versions. All modules reference `libs.ktor.client.core` instead of hardcoded version strings. Single place to upgrade.
- **Dependency locking:** `dependencyLocking { lockAllConfigurations() }`. Pins transitive dependency versions. Prevents silent upgrades breaking builds.
- **Detecting unused dependencies:** `./gradlew dependencyInsight` + `gradle-dependency-analysis` plugin. Remove unused dependencies to reduce APK size and build time.

**APK/AAB size reduction:**

- **R8/ProGuard:** enable in release builds. R8 removes unused classes (shrinking), obfuscates names (obfuscation), and optimises bytecode.
- **`android:extractNativeLibs="false"`****:** prevents ABI extraction, reducing install size.
- **`resConfigs`****:** `resConfigs("en", "xxhdpi")` strips unused language/density resources in debug builds.
- **App Bundles (AAB):** upload AAB to Play Store. Google Play serves per-device split APKs. 15–20% smaller downloads.

### Day 80–81 — CI/CD for Android and KMP


**GitHub Actions pipeline structure:**


```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'zulu' }
      - uses: gradle/actions/setup-gradle@v3
      - run: ./gradlew testDebugUnitTest  # unit tests
      - run: ./gradlew shared:testDebugUnitTest  # KMP shared tests
      - run: ./gradlew lintDebug  # lint
      - run: ./gradlew detekt  # static analysis

  screenshot-test:
    runs-on: ubuntu-latest
    steps:
      - run: ./gradlew verifyPaparazziDebug  # screenshot regression tests

  build:
    needs: [test, screenshot-test]
    runs-on: ubuntu-latest
    steps:
      - run: ./gradlew assembleRelease
      - uses: actions/upload-artifact@v4
        with: { name: apk, path: app/build/outputs/apk/release/ }
```


**Fastlane for Android:**


```ruby
# fastlane/Fastfile
lane :deploy_internal do
  gradle(task: "bundle", build_type: "Release", properties: { "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"] })
  upload_to_play_store(track: "internal", aab: "app/build/outputs/bundle/release/app-release.aab")
end
```


**Secrets management in CI:**

- Store keystore as a base64-encoded GitHub Secret.
- Decode in CI: `echo $KEYSTORE_BASE64 | base64 --decode > keystore.jks`.
- Never commit keystore files or signing configs with passwords to git.

**KMP iOS CI on GitHub Actions:**

- iOS builds require macOS runners (`runs-on: macos-latest`). These are 10x more expensive than Ubuntu runners.
- **Strategy:** run unit tests (JVM target) on Ubuntu. Run iOS simulator tests on macOS only when needed (e.g., on `main` branch merges, not every PR).
- `./gradlew shared:iosSimulatorArm64Test` for shared module iOS tests.

### Day 82–83 — Code quality automation


**Detekt — Kotlin static analysis:**


```kotlin
// detekt.yml
style:
  MagicNumber:
    active: true
    ignoreNumbers: ['-1', '0', '1', '2']
complexity:
  ComplexMethod:
    threshold: 15
performance:
  ArrayPrimitive:
    active: true
```


Run in CI. Block merges on new violations. Gradually fix existing violations with a `baseline.xml` that suppresses existing issues.


**Ktlint — Kotlin formatting:**

- `./gradlew ktlintCheck` in CI. `./gradlew ktlintFormat` locally.
- Enforce consistent formatting across all contributors. No formatting debates in code review.

**ArchUnit for Android (via custom Gradle task):**


Enforce architecture rules as tests:


```kotlin
@Test
fun `domain layer must not depend on Android`() {
    val classes = ClassFileImporter().importPackages("com.example.domain")
    noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAPackage("android..")
        .check(classes)
}
```


**Danger — automated PR checks:**

- Comment on PRs: “This PR increases APK size by 2MB.” “Test coverage decreased from 82% to 79%.”
- Blocks merge if coverage drops below threshold.
- Runs as part of CI via `bundle exec danger`.

### Day 84–85 — App security and production hardening


**Certificate pinning:**


```kotlin
val certificatePinner = CertificatePinner.Builder()
    .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .build()
val okHttpClient = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```


Prevents MITM attacks by validating the server’s certificate against a known hash. Pin 2 certificates (current + backup) to survive certificate rotation.


**Root/jailbreak detection:**

- `RootBeer` library detects root indicators on Android.
- Not foolproof (advanced root hiders exist), but stops 99% of casual tampering.
- Decision: block rooted devices (banking apps) or warn and log (most apps).

**Sensitive data storage:**

- Never store passwords, tokens, or PII in `SharedPreferences` (unencrypted).
- Use `EncryptedSharedPreferences` (Jetpack Security) or `DataStore` with the `encrypted` extension.
- Tokens: store in Android Keystore-backed `EncryptedSharedPreferences`. Keys never leave the secure enclave.

**Network security config:**


```xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false"> <!-- No HTTP, HTTPS only -->
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" /> <!-- Charles Proxy in debug only -->
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```


**Obfuscation:** R8 obfuscates class and method names in release builds. Add `proguard-rules.pro` to keep: serialisation classes, reflection-based code, JNI entry points. Never ship a release build without obfuscation for security-sensitive apps.


### Day 86–87 — Advanced Compose: custom rendering and animations


**`Canvas`** **API for custom drawing:**


```kotlin
@Composable
fun CircularProgressIndicator(progress: Float, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(48.dp)) {
        val strokeWidth = 4.dp.toPx()
        drawCircle(color = Color.LightGray, style = Stroke(strokeWidth))
        drawArc(
            color = Color.Blue,
            startAngle = -90f,
            sweepAngle = 360f * progress,
            useCenter = false,
            style = Stroke(strokeWidth, cap = StrokeCap.Round)
        )
    }
}
```


**`Animatable`** **for physics-based animation:**


```kotlin
val offsetX = remember { Animatable(0f) }
LaunchedEffect(isVisible) {
    if (isVisible) offsetX.animateTo(0f, spring(dampingRatio = Spring.DampingRatioMediumBouncy))
    else offsetX.animateTo(-300f, tween(300, easing = FastOutLinearInEasing))
}
```


**`Modifier.pointerInput`** **for custom gestures:**


```kotlin
Modifier.pointerInput(Unit) {
    detectDragGestures(
        onDragStart = { /* start */ },
        onDrag = { change, dragAmount -> /* update position */ },
        onDragEnd = { /* snap or settle */ }
    )
}
```


**Compose** **`@Preview`** **at scale:**

- `@PreviewParameter` with a `PreviewParameterProvider` to preview a composable in multiple states without duplicating `@Preview` annotations.
- `@PreviewScreenSizes`, `@PreviewFontScales`, `@PreviewDynamicColors` for systematic coverage.
- Paparazzi renders previews as screenshots in unit tests — no device required.

### Day 88–90 — Staff-level review + portfolio


**Day 88 — Architecture review:**


Conduct a formal review of your Phase 3 app:

- Draw the current module dependency graph. Are there any cycles?
- Run the Compose compiler metrics report. How many composables are skippable? Which are not? Why?
- Run LeakCanary through the main user flows. Any leaks?
- Measure cold start time with Android Profiler. What is the time-to-first-frame? What is the bottleneck?
- Identify the 3 things you would change with more time and document why.

**Day 89 — KMP portfolio project:**


Complete your Compose Multiplatform weather app from Phase 4 with:

- Full CI/CD pipeline (GitHub Actions): unit tests on Ubuntu, Paparazzi screenshot tests, build AAB, upload to Play Store internal track.
- Detekt + Ktlint enforced in CI.
- LeakCanary in debug build. `StrictMode` in debug build.
- R8 fully configured for release.
- Certificate pinning on the API client.
- README documenting architecture decisions, module structure, and how to run on both Android and iOS.

**Day 90 — Engineering portfolio document:**


Write a 1-page summary for each of your 5 major projects from this roadmap:

1. Kotlin coroutines event bus (Phase 1)
2. News reader app (Phase 2)
3. MVI + Clean Architecture task manager (Phase 3)
4. KMP shared module + CMP weather app (Phase 4)
5. Production-hardened app with full CI/CD (Phase 5)

For each: problem statement, architecture decisions with tradeoffs, KMP/Android-specific challenges solved, what you’d do differently, and a link to the GitHub repository.


---


## 🔨 Projects


### Project 1 — Performance audit and optimisation


**Scenario:** Take your Phase 3 app. Measure before. Optimise. Measure after.


**Deliverable:** (1) Baseline measurements: cold start time, `LazyColumn` scroll frame rate (target: 60fps stable), memory usage on the main screen. (2) Enable Compose compiler metrics. Fix all non-skippable composables in the hot path. (3) Profile the cold start path. Defer non-critical initialisation with `App Startup` library. (4) After measurements: document % improvement for each metric. Target: cold start < 800ms, zero jank on scroll, no memory leaks.


### Project 2 — Full CI/CD pipeline for KMP project


**Deliverable:** GitHub Actions pipeline with: (a) PR checks: unit tests (JVM + iOS simulator), Detekt, Ktlint, Paparazzi screenshot tests, (b) merge-to-main: build release AAB, sign, upload to Play Store internal track via Fastlane, (c) automated version bump via semantic-release or a custom Gradle task, (d) Slack notification on deploy success/failure. All secrets managed via GitHub Secrets. Zero manual steps to ship.


### Project 3 — Complete KMP production app


**Stack:** CMP, Voyager, Koin, Ktor, SQLDelight, SKIE, GitHub Actions


Build and ship: a production-quality KMP app (your choice of domain) with: identical UI on Android and iOS via CMP, shared business logic via shared module, full offline support with SQLDelight, SKIE for Swift interop, security hardening (certificate pinning, encrypted storage, no plaintext traffic), full CI/CD pipeline, screenshots in App Store and Play Store descriptions, and a public GitHub repository with a comprehensive README.


**This is your flagship portfolio project.**


---


## ⚠️ Common mistakes


### Mistake 1


**✗ Ignoring build performance until the codebase is large.**


A monolithic module that takes 4 minutes to build doesn’t happen overnight. It grows one class at a time. By the time the pain is obvious, the refactoring cost is enormous.


**✓ Correct approach:** Enforce modularisation from day one with convention plugins. Enable configuration cache and build cache from the first commit. Measure build time on every PR with `./gradlew --profile`. Fix regressions before they compound.


### Mistake 2


**✗ Shipping a debug-configuration app to production.**


Debug builds have: logging enabled (PII in Logcat), `HttpLoggingInterceptor` at `BODY` level (full request/response logged), `debuggable=true` (allows attaching a debugger remotely), `StrictMode` enabled (crashes on strict policy violations), LeakCanary (adds overhead).


**✓ Correct approach:** Use `BuildConfig.DEBUG` to gate all debug-only code. Every debug tool (LeakCanary, Stetho, HttpLoggingInterceptor) is wrapped in `if (BuildConfig.DEBUG)` or added only to `debugImplementation`. Never ship a build without testing it in `release` variant first.


### Mistake 3


**✗ No certificate pinning in security-sensitive apps.**


Without certificate pinning, a compromised CA or a MITM proxy can intercept all HTTPS traffic. This is a critical security vulnerability in banking, health, and payment apps.


**✓ Correct approach:** Pin certificates in OkHttp (Android) and Ktor (KMP). Pin two certificates: the current one and a backup for rotation. Set up monitoring for certificate expiry. Test pinning in a Charles Proxy environment to verify it blocks interception.


### Mistake 4


**✗ Manual version bumps and manual Play Store uploads.**


Manual processes mean: human error (shipping the wrong build), no audit trail, releases blocked when the responsible person is unavailable, and inconsistent versioning.


**✓ Correct approach:** Automate everything. Version codes are derived from the CI build number (`versionCode = System.getenv("BUILD_NUMBER")?.toInt() ?: 1`). Fastlane handles signing and upload. `git tag` triggers the release pipeline. No human touches the release process.


---


## 🏢 How real companies do expert-level Android/KMP


**Square (Block) — Build engineering:** Square's Android team maintains a sophisticated Gradle build system with custom plugins for every convention. Their open-source `radiography` (view hierarchy inspection) and `leakcanary` (memory leak detection) came directly from internal tools. Build tooling is a first-class engineering discipline.


**Bumble — KMP + SKIE in production:** Bumble’s mobile platform team adopted KMP with SKIE to expose Kotlin flows to Swift as `AsyncSequence`. Their iOS developers write idiomatic Swift that calls shared Kotlin logic. The teams measured 40% reduction in mobile feature development time after the migration.


**Grab — Security at scale:** Grab (Southeast Asia’s super-app) implements certificate pinning, root detection, and runtime application self-protection (RASP) across their Android app. Their security engineering team publishes guidelines on preventing common Android vulnerabilities that are referenced throughout the industry.


---


## 🏆 You’ve completed the 90-day Android/Kotlin/KMP roadmap


After 90 days you should be able to:

- Write idiomatic Kotlin with coroutines, Flow, and the full type system
- Build production Android apps with MVI + Clean Architecture + Jetpack Compose
- Design and implement KMP shared modules consumed by both Android and iOS
- Build Compose Multiplatform apps with identical UI across platforms
- Own a complete CI/CD pipeline from commit to Play Store
- Profile, optimise, and harden Android apps for production
- Conduct staff-level architecture reviews on Android codebases

**What’s next:**

- Contribute to KMP open-source (SQLDelight, Ktor, Koin, SKIE)
- Study the Now in Android sample in depth: every decision is documented
- Take on KMP architecture ownership at work: define the shared module boundaries
- Pair this roadmap with the backend roadmap: full-stack Kotlin (KMP frontend + Ktor backend)

---


## 📖 Resources

- Android Performance Patterns: [youtube.com/c/AndroidDevelopers](http://youtube.com/c/AndroidDevelopers)
- _Android App Development_ — Professional Android (Reto Meier)
- LeakCanary: [square.github.io/leakcanary](http://square.github.io/leakcanary)
- SKIE docs: [skie.touchlab.co](http://skie.touchlab.co/)
- Gradle docs: [docs.gradle.org](http://docs.gradle.org/) (configuration cache, build cache)
- Fastlane: [fastlane.tools](http://fastlane.tools/) (the standard for mobile CI/CD)
- _Effective Kotlin_ — Marcin Moskala (advanced idiomatic Kotlin)
