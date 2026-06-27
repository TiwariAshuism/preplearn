---
source: notion
title: "🤖 Android Interview Prep Hub"
slug: "android-interview-prep-hub"
notionId: "38ada883bddd811cadbfeb0a79a2e71b"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: null
children: ["important-topics-checklist","kotlin-multiplatform-kmp","performance-and-memory","testing","dependency-injection-hilt","architecture-patterns","jetpack-compose","coroutines-and-kotlin-flows","android-core-concepts","kotlin-basics-and-fundamentals"]
order: 0
icon: "🤖"
cover: null
---

A comprehensive Android + Kotlin interview preparation wiki, compiled from multiple expert sources. Organized by topic and difficulty level.


---


## 📚 Table of Contents

- 🟢 Kotlin Basics & Fundamentals
- 🟡 Android Core Concepts
- 🔵 Coroutines & Kotlin Flows
- 🟣 Jetpack Compose
- 🏗️ Architecture Patterns (MVVM, Clean, MVI)
- 💉 Dependency Injection (Hilt/Dagger)
- 🧪 Testing
- ⚙️ Performance & Memory
- 🌐 Kotlin Multiplatform (KMP)
- 📋 Important Topics Checklist

---

> 💡 **How to use this wiki:**  Use the linked sub-pages below for deep-dive Q&A on each topic. Check off topics as you prepare.

---


## 🔗 Quick Links by Experience Level


| Level           | Topics                                                            |
| --------------- | ----------------------------------------------------------------- |
| 🟢 Beginner     | Kotlin Basics, Android Basics, Collections, Control Flow          |
| 🟡 Intermediate | OOP in Kotlin, Coroutines basics, MVVM, Room, Hilt basics         |
| 🔵 Advanced     | Flows, Compose internals, Clean Architecture, DI scoping, Testing |
| 🔴 Expert       | Recomposition, Structured Concurrency, KMP, DSLs, Performance     |


## 🟢 Kotlin Basics & Fundamentals

---


## 🧠 Core Language

<details>
<summary>What is Kotlin? How is it different from Java?</summary>

Kotlin is a statically typed, JVM-targeting language developed by JetBrains. Key differences from Java:

- **Null Safety**: Kotlin distinguishes nullable (`String?`) and non-nullable (`String`) types at the compiler level.
- **Conciseness**: Data classes, extension functions, and smart casts eliminate boilerplate.
- **Coroutines**: First-class async/concurrency support.
- **No checked exceptions**: Kotlin does not force you to catch exceptions.
- **Functional programming**: Lambdas, higher-order functions, and collection operators are idiomatic.
- **Interoperability**: 100% compatible with Java — you can call Java code from Kotlin and vice versa.

</details>

<details>
<summary>What is null safety in Kotlin?</summary>

Kotlin's type system distinguishes nullable from non-nullable types at compile time:


```kotlin
var a: String = "hello"   // cannot be null
var b: String? = null      // can be null
b?.length                  // safe call — returns null if b is null
b ?: "default"             // Elvis operator — fallback value
b!!.length                 // non-null assertion — throws NPE if null
```


This eliminates most NullPointerExceptions at compile time.


</details>

<details>
<summary>val vs var</summary>
- `val` = immutable reference (like Java `final`). The object itself can still be mutated.
- `var` = mutable reference, can be reassigned.

```kotlin
val x = 10       // cannot reassign x
var y = 20       // y can be reassigned
y = 30           // OK
```


</details>

<details>
<summary>What is the Elvis operator `?:`?</summary>

The Elvis operator provides a default value when an expression is null:


```kotlin
val length = name?.length ?: 0
// If name is null, length = 0; otherwise length = name.length
```


</details>

<details>
<summary>What are extension functions?</summary>

Extension functions let you add methods to existing classes without inheriting from them:


```kotlin
fun String.isPalindrome(): Boolean {
    return this == this.reversed()
}
"racecar".isPalindrome() // true
```


They're resolved statically and don't modify the original class.


</details>

<details>
<summary>What is a data class?</summary>

A data class auto-generates `equals()`, `hashCode()`, `toString()`, `copy()`, and `componentN()` functions:


```kotlin
data class User(val name: String, val age: Int)
val u1 = User("Ashu", 28)
val u2 = u1.copy(age = 29)
```


Best for immutable value objects, DTOs, and domain models.


</details>

<details>
<summary>Sealed class vs Enum class</summary>

**Enum**: Fixed set of constant instances, all of the same type.


**Sealed class**: Fixed set of subclasses, each can hold different data. Great for modeling states.


```kotlin
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
    object Loading : Result<Nothing>()
}
```


Use sealed classes when subclasses need to carry different payloads.


</details>

<details>
<summary>What is a companion object?</summary>

A companion object is a singleton tied to a class — it replaces Java's `static` members:


```kotlin
class MyClass {
    companion object {
        const val TAG = "MyClass"
        fun create() = MyClass()
    }
}
MyClass.TAG
MyClass.create()
```


</details>

<details>
<summary>Scope functions: let, apply, also, run, with</summary>

| Function | Receiver | Returns         | Common Use                      |
| -------- | -------- | --------------- | ------------------------------- |
| `let`    | `it`     | Lambda result   | Null checks, transformations    |
| `apply`  | `this`   | Receiver object | Object configuration / builder  |
| `also`   | `it`     | Receiver object | Side effects, logging           |
| `run`    | `this`   | Lambda result   | Execute block, compute result   |
| `with`   | `this`   | Lambda result   | Call multiple methods on object |


```kotlin
val user = User().apply {
    name = "Ashu"
    age = 28
}
user?.let { println(it.name) }
```


</details>


---


## 🔁 Higher-Order Functions & Lambdas

<details>
<summary>What is a higher-order function?</summary>

A function that takes a function as parameter or returns a function:


```kotlin
fun operate(x: Int, y: Int, op: (Int, Int) -> Int): Int = op(x, y)
operate(3, 4) { a, b -> a + b } // 7
```


</details>

<details>
<summary>What is an inline function?</summary>

Inline functions copy their body to the call site at compile time, eliminating lambda object allocation overhead:


```kotlin
inline fun measure(block: () -> Unit) {
    val start = System.nanoTime()
    block()
    println(System.nanoTime() - start)
}
```


Use for small functions that accept lambdas to reduce memory pressure.


</details>

<details>
<summary>Difference between inline, noinline, and crossinline</summary>
- `inline`: The entire lambda is inlined at call site.
- `noinline`: Prevents a specific lambda parameter from being inlined (when you want to store it).
- `crossinline`: Allows inlining but prevents non-local returns inside the lambda.

```kotlin
inline fun example(inlined: () -> Unit, noinline notInlined: () -> Unit) {
    inlined()       // inlined
    notInlined()    // stored as object
}
```


</details>

<details>
<summary>Lazy vs lateinit</summary>
- `lazy`: Value is computed once on first access. Thread-safe by default. Used with `val`.
- `lateinit`: Mutable `var` that will be assigned before use. Not null-safe — throws if accessed before init.

```kotlin
val config: Config by lazy { loadConfig() }
lateinit var binding: ActivityMainBinding
```


Use `lazy` for read-only computed values; `lateinit` for DI-injected or lifecycle-bound mutable references.


</details>


---


## 📚 Collections

<details>
<summary>Mutable vs Immutable collections</summary>

Kotlin separates read-only interfaces (`List`, `Set`, `Map`) from mutable ones (`MutableList`, `MutableSet`, `MutableMap`):


```kotlin
val list = listOf(1, 2, 3)           // read-only
val mutableList = mutableListOf(1, 2) // mutable
mutableList.add(3)
```


Read-only collections are not thread-safe — use `ConcurrentHashMap` or coroutine-friendly structures for shared state.


</details>

<details>
<summary>map, filter, reduce, flatMap</summary>

```kotlin
val nums = listOf(1, 2, 3, 4, 5)
nums.filter { it % 2 == 0 }     // [2, 4]
nums.map { it * 2 }              // [2, 4, 6, 8, 10]
nums.reduce { acc, it -> acc + it } // 15
listOf(listOf(1,2), listOf(3,4)).flatMap { it } // [1, 2, 3, 4]
```


`flatMap` maps each element to a collection and flattens the result into a single list.


</details>

<details>
<summary>What is the Result class in Kotlin?</summary>

`Result<T>` is a standard library class that models success or failure:


```kotlin
val result = runCatching { riskyOperation() }
result.onSuccess { println(it) }
result.onFailure { println(it.message) }
```


Great alternative to try/catch chains in functional-style code.


</details>


## 🟡 Android Core Concepts

---


## 📱 Activity & Fragment Lifecycle

<details>
<summary>Activity Lifecycle callbacks (in order)</summary>

```javascript
onCreate() → onStart() → onResume() → [RUNNING]
→ onPause() → onStop() → onDestroy()
```

- `onCreate()` — Initialize UI, bindings, ViewModel. Called once.
- `onStart()` — Activity visible but not interactive.
- `onResume()` — Activity in foreground and interactive.
- `onPause()` — Another activity comes to foreground (save lightweight state here).
- `onStop()` — Activity no longer visible (save heavier state here).
- `onDestroy()` — Activity is finishing or being destroyed by system.

</details>

<details>
<summary>Fragment Lifecycle vs Activity Lifecycle</summary>

Fragment has additional callbacks:

- `onAttach()` → `onCreate()` → `onCreateView()` → `onViewCreated()` → `onStart()` → `onResume()`
- `onPause()` → `onStop()` → `onDestroyView()` → `onDestroy()` → `onDetach()`

Key difference: `onDestroyView()` destroys the view hierarchy but the Fragment instance survives (e.g., in backstack). Always clear view references in `onDestroyView()` to avoid memory leaks.


</details>

<details>
<summary>What are Launch Modes in Android?</summary>

Defined in `AndroidManifest.xml` via `android:launchMode`:


| Mode             | Behavior                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `standard`       | New instance always created (default)                                  |
| `singleTop`      | Reuses top-of-stack instance if same; calls `onNewIntent()`            |
| `singleTask`     | Single instance per task; clears tasks above it; calls `onNewIntent()` |
| `singleInstance` | Single instance in its own task, no other activities in same task      |


</details>

<details>
<summary>What is the AndroidManifest.xml?</summary>

The manifest declares:

- App components (Activities, Services, Receivers, Providers)
- Required permissions
- Hardware/software features required
- App metadata (app ID, version, min/target SDK)
- Entry point Activity (intent-filter with MAIN + LAUNCHER)

</details>


---


## 🔄 Intents

<details>
<summary>Explicit vs Implicit Intents</summary>
- **Explicit**: Directly specifies the target component (class name).

```kotlin
startActivity(Intent(this, DetailActivity::class.java))
```

- **Implicit**: Declares an action; the system finds the matching component.

```kotlin
val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com"))
startActivity(intent)
```


</details>

<details>
<summary>How to pass data between Activities?</summary>

```kotlin
// Sending
val intent = Intent(this, DetailActivity::class.java)
intent.putExtra("USER_ID", 42)
startActivity(intent)

// Receiving
val userId = intent.getIntExtra("USER_ID", -1)
```


For complex objects, use `Parcelable` (faster on Android) or `Serializable`. Prefer `@Parcelize` annotation with the Kotlin plugin.


</details>


---


## 📼 RecyclerView

<details>
<summary>How does RecyclerView work?</summary>

RecyclerView recycles View objects using the **ViewHolder pattern**:

1. `RecyclerView.Adapter` creates `ViewHolder` objects (inflating views).
2. `onBindViewHolder()` binds data to the ViewHolder.
3. When an item scrolls off screen, its ViewHolder is put in a **RecycledViewPool**.
4. New items are bound by reusing pooled ViewHolders — avoiding costly `inflate()` calls.

Always use `DiffUtil` for efficient list updates instead of `notifyDataSetChanged()`.


</details>

<details>
<summary>What is DiffUtil?</summary>

`DiffUtil` computes the difference between two lists and dispatches minimal update operations. It runs on a background thread with `AsyncListDiffer` or `ListAdapter`:


```kotlin
class MyAdapter : ListAdapter<Item, MyViewHolder>(ItemDiffCallback()) {
    class ItemDiffCallback : DiffUtil.ItemCallback<Item>() {
        override fun areItemsTheSame(a: Item, b: Item) = a.id == b.id
        override fun areContentsTheSame(a: Item, b: Item) = a == b
    }
}
```


</details>


---


## 💾 Storage

<details>
<summary>Room Database architecture</summary>

Room is a Jetpack abstraction over SQLite with three main components:

- **Entity** (`@Entity`): Data class mapped to a DB table.
- **DAO** (`@Dao`): Interface with `@Query`, `@Insert`, `@Update`, `@Delete` methods.
- **Database** (`@Database`): Abstract class extending `RoomDatabase`, holds DAOs.

```kotlin
@Entity
data class User(@PrimaryKey val id: Int, val name: String)

@Dao
interface UserDao {
    @Query("SELECT * FROM user") fun getAll(): Flow<List<User>>
    @Insert suspend fun insert(user: User)
}
```


DAO methods can be `suspend` functions or return `Flow` for reactive updates.


</details>

<details>
<summary>Serializable vs Parcelable</summary>
- **Serializable**: Java standard, uses reflection, slower, more GC pressure.
- **Parcelable**: Android-specific, manual marshaling, ~10x faster for IPC/Intent passing.

Use `@Parcelize` from Kotlin Android Extensions to auto-generate Parcelable:


```kotlin
@Parcelize
data class User(val id: Int, val name: String) : Parcelable
```


</details>


---


## 📡 Services & Background Work

<details>
<summary>Types of Services</summary>

| Type                   | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| **Foreground Service** | Visible to user via notification; survives app backgrounding |
| **Background Service** | Limited by OS on API 26+                                     |
| **Bound Service**      | Client-server model; stops when all clients unbind           |


</details>

<details>
<summary>WorkManager vs Service vs JobScheduler</summary>
- **WorkManager**: Recommended for guaranteed deferred background work (even after reboot). Supports chaining, constraints (network, battery), and backoff.
- **Service**: Real-time work while app is running.
- **JobScheduler**: System-level API for scheduled jobs (WorkManager uses it internally on Android 6+).

For most use cases, prefer WorkManager.


</details>

<details>
<summary>Broadcast Receivers</summary>

Components that respond to system-wide broadcast announcements:

- Registered in manifest (static) or `registerReceiver()` (dynamic).
- Examples: `ACTION_BOOT_COMPLETED`, `CONNECTIVITY_CHANGE`, `BATTERY_LOW`.
- Static receivers are restricted on API 26+ for implicit broadcasts.

Always unregister dynamic receivers in `onStop()` or `onDestroy()` to prevent leaks.


</details>


---


## 🔐 Permissions

<details>
<summary>Runtime Permissions flow</summary>

```kotlin
if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
    != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this,
        arrayOf(Manifest.permission.CAMERA), REQUEST_CODE)
}

override fun onRequestPermissionsResult(code: Int, permissions: Array<String>, results: IntArray) {
    if (results[0] == PackageManager.PERMISSION_GRANTED) { /* proceed */ }
}
```


On API 30+, use `ActivityResultContracts.RequestPermission()` with the Activity Result API.


</details>


## 🔵 Coroutines & Kotlin Flows

---


## ⚡ Coroutines Fundamentals

<details>
<summary>What are Kotlin Coroutines?</summary>

Coroutines are **lightweight concurrency primitives** — suspendable computations that can be paused and resumed without blocking a thread. They're built on top of continuation-passing style (CPS) transforms at the compiler level.

- 1 thread can run thousands of coroutines.
- No new threads created for `suspend` function calls.
- The compiler transforms `suspend` functions into state machines.

</details>

<details>
<summary>launch vs async</summary>

|           | `launch`             | `async`                      |
| --------- | -------------------- | ---------------------------- |
| Returns   | `Job`                | `Deferred<T>`                |
| Purpose   | Fire-and-forget      | Compute a value concurrently |
| Result    | No result            | `.await()` to get result     |
| Exception | Propagates to parent | Surfaces on `.await()`       |


```kotlin
val job = launch { doWork() }
val deferred = async { computeValue() }
val result = deferred.await()
```


</details>

<details>
<summary>What is a suspend function?</summary>

A function marked with `suspend` can be paused and resumed. It can only be called from a coroutine or another suspend function. Under the hood, the compiler adds a `Continuation` parameter to manage the state machine.


```kotlin
suspend fun fetchUser(): User {
    return withContext(Dispatchers.IO) {
        api.getUser() // network call, doesn't block thread
    }
}
```


</details>

<details>
<summary>Coroutine Dispatchers</summary>

| Dispatcher               | Use Case                                |
| ------------------------ | --------------------------------------- |
| `Dispatchers.Main`       | UI updates, LiveData observation        |
| `Dispatchers.IO`         | Network, database, file I/O             |
| `Dispatchers.Default`    | CPU-intensive work (sorting, parsing)   |
| `Dispatchers.Unconfined` | Testing; not recommended for production |


```kotlin
withContext(Dispatchers.IO) { /* I/O work */ }
withContext(Dispatchers.Default) { /* CPU work */ }
```


</details>

<details>
<summary>What is structured concurrency?</summary>

Structured concurrency guarantees that coroutines launched in a scope are bound to that scope's lifetime:

- When a scope is cancelled, all its children are cancelled.
- A parent won't complete until all its children complete.
- Exceptions propagate upward through the hierarchy.

```kotlin
viewModelScope.launch {
    val a = async { fetchA() }
    val b = async { fetchB() }
    process(a.await(), b.await())
} // Both a and b cancelled if viewModel is cleared
```


</details>

<details>
<summary>CoroutineScope: viewModelScope, lifecycleScope, GlobalScope</summary>
- `viewModelScope`: Tied to ViewModel. Cancelled when ViewModel is cleared. Best for data loading.
- `lifecycleScope`: Tied to Activity/Fragment lifecycle. Use for UI-bound work.
- `GlobalScope`: App-lifetime scope. Avoid — leaks memory, breaks structured concurrency.

</details>

<details>
<summary>Exception handling in coroutines</summary>

```kotlin
// Option 1: try-catch inside coroutine
launch {
    try { riskyCall() }
    catch (e: Exception) { handleError(e) }
}

// Option 2: CoroutineExceptionHandler (for launch only)
val handler = CoroutineExceptionHandler { _, throwable ->
    Log.e("Error", throwable.message ?: "")
}
launch(handler) { riskyCall() }
```


`async` exceptions are NOT caught by `CoroutineExceptionHandler` — they surface on `.await()`.


</details>

<details>
<summary>SupervisorJob vs Job</summary>
- **Job**: Failure in one child cancels all siblings.
- **SupervisorJob**: Each child fails independently; siblings are not cancelled.

```kotlin
val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
scope.launch { failingTask() }   // doesn't cancel other children
scope.launch { otherTask() }     // continues running
```


ViewModelScope uses `SupervisorJob` internally.


</details>


---


## 🌊 Kotlin Flow

<details>
<summary>What is Kotlin Flow?</summary>

Flow is a cold, asynchronous stream of values built on coroutines. "Cold" means the stream doesn't start until it's collected.


```kotlin
fun getNumbers(): Flow<Int> = flow {
    for (i in 1..5) {
        delay(100)
        emit(i)
    }
}

viewModelScope.launch {
    getNumbers().collect { println(it) }
}
```


</details>

<details>
<summary>Flow vs StateFlow vs SharedFlow</summary>

|               | `Flow`              | `StateFlow` | `SharedFlow` |
| ------------- | ------------------- | ----------- | ------------ |
| Cold/Hot      | Cold                | Hot         | Hot          |
| Initial value | No                  | Required    | No           |
| Replays       | 0                   | Latest (1)  | Configurable |
| Collectors    | Independent streams | Shared      | Shared       |
| Use case      | One-shot streams    | UI state    | Events       |


```kotlin
val uiState: StateFlow<UiState> = MutableStateFlow(UiState.Loading)
val events: SharedFlow<Event> = MutableSharedFlow()
```


</details>

<details>
<summary>Flow operators: map, filter, transform, debounce, collectLatest</summary>

```kotlin
flow
    .filter { it > 2 }
    .map { it * 10 }
    .debounce(300L)        // wait 300ms of silence before emitting
    .collectLatest { value ->
        // cancels previous block if new value arrives
        expensiveOperation(value)
    }
```

- `debounce`: Useful for search-as-you-type. Waits for a pause before emitting.
- `throttleFirst`: Emits first item in a time window.
- `collectLatest`: Cancels in-progress collection if new value arrives.

</details>

<details>
<summary>Cold vs Hot Flow</summary>
- **Cold**: Each collector gets its own independent stream. Starts fresh on each `collect` call.
- **Hot**: Stream runs regardless of collectors. Multiple collectors share the same emissions.

`StateFlow` and `SharedFlow` are hot. `flow {}` builder creates cold flows.


</details>

<details>
<summary>How to handle backpressure in Flow?</summary>
- `buffer()`: Collector runs concurrently with emitter in a separate coroutine.
- `conflate()`: Drop intermediate values, always process latest.
- `collectLatest {}`: Cancel previous collection when new value arrives.

```kotlin
heavyFlow()
    .buffer(capacity = 64)
    .collect { process(it) }
```


</details>


## 🟣 Jetpack Compose

---


## 🌱 Compose Fundamentals

<details>
<summary>What is Jetpack Compose? How does it differ from XML?</summary>

Jetpack Compose is Android's modern **declarative UI toolkit**. Instead of inflating XML layouts and mutating views imperatively, you describe UI as a function of state:


| XML (Imperative)             | Compose (Declarative)       |
| ---------------------------- | --------------------------- |
| Inflate layout, find views   | Describe what UI looks like |
| Mutate views on state change | Recompose on state change   |
| Separate XML + Kotlin        | Everything in Kotlin        |
| ViewGroup hierarchy          | Composition tree            |


```kotlin
@Composable
fun Greeting(name: String) {
    Text(text = "Hello, $name!")
}
```


</details>

<details>
<summary>What is a @Composable function?</summary>

A function annotated with `@Composable` can call other composables and has access to the Compose runtime. Rules:

- Must be called from another `@Composable` function.
- Should be side-effect free (no writing to shared state directly).
- Named in PascalCase.
- Returns `Unit` typically.

</details>

<details>
<summary>What is recomposition?</summary>

When state read inside a composable changes, Compose schedules a **recomposition** — re-running only the affected composables, not the entire UI tree. This is done via the **Compose Snapshot system**.


Compose tracks which `State<T>` objects are read during composition. Only composables that read changed state are recomposed.


</details>


---


## 💡 State Management

<details>
<summary>remember vs rememberSaveable</summary>
- `remember {}`: Survives recomposition, lost on configuration change.
- `rememberSaveable {}`: Survives recomposition AND configuration changes (uses `SavedStateHandle` internally). Only works with types that are `Parcelable` or `Serializable`, or with a custom `Saver`.

```kotlin
var count by remember { mutableStateOf(0) }
var name by rememberSaveable { mutableStateOf("") }
```


</details>

<details>
<summary>mutableStateOf, derivedStateOf, snapshotFlow</summary>
- `mutableStateOf()`: Holds observable state that triggers recomposition.
- `derivedStateOf { }`: Derives computed state from other states. Only recomposes when the derived value changes.
- `snapshotFlow { }`: Converts Compose state into a Flow.

```kotlin
val scrollState = rememberLazyListState()
val showFab by remember {
    derivedStateOf { scrollState.firstVisibleItemIndex > 0 }
}
```


</details>

<details>
<summary>How to prevent unnecessary recompositions?</summary>
1. Use `derivedStateOf` for computed values.
2. Pass lambdas as stable types (`() -> Unit`) instead of re-creating them.
3. Use `key()` to help Compose identity-track composables in loops.
4. Annotate classes with `@Stable` or `@Immutable` to tell Compose they won't change.
5. Use `remember {}` to avoid recreating objects on every recompose.
6. Hoist state minimally — don't lift state higher than needed.

</details>


---


## 🎌 Side Effects

<details>
<summary>LaunchedEffect, DisposableEffect, SideEffect</summary>
- **`LaunchedEffect(key)`**: Launches a coroutine when the composable enters composition. Re-runs if `key` changes. Use for async work, navigation, one-time events.

```kotlin
LaunchedEffect(userId) {
    viewModel.loadUser(userId) // re-runs if userId changes
}
```

- **`DisposableEffect(key)`**: For effects that need cleanup (registering listeners, callbacks).

```kotlin
DisposableEffect(lifecycle) {
    lifecycle.addObserver(observer)
    onDispose { lifecycle.removeObserver(observer) }
}
```

- **`SideEffect {}`**: Runs on every successful recomposition. For synchronizing Compose state to non-Compose code.

</details>

<details>
<summary>How to integrate ViewModel with Compose?</summary>

```kotlin
@Composable
fun MyScreen(viewModel: MyViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // Use uiState to render UI
}
```


Use `collectAsStateWithLifecycle()` (Lifecycle-aware) instead of `collectAsState()` for lifecycle-safe collection.


</details>


---


## 📱 Layout & Navigation

<details>
<summary>LazyColumn performance optimization</summary>
- Always provide a stable `key` for list items to help Compose track identity:

```kotlin
LazyColumn {
    items(items, key = { it.id }) { item ->
        ItemCard(item)
    }
}
```

- Avoid creating lambdas inside `items {}` block — hoist them.
- Use `Modifier.fillParentMaxWidth()` instead of `Modifier.fillMaxWidth()` inside lazy lists.
- Avoid nesting scrollable layouts (LazyColumn inside ScrollColumn).

</details>

<details>
<summary>Scaffold, TopAppBar, BottomNavigation</summary>

```kotlin
Scaffold(
    topBar = { TopAppBar(title = { Text("My App") }) },
    bottomBar = {
        NavigationBar {
            items.forEach { item ->
                NavigationBarItem(
                    selected = currentDest == item.route,
                    onClick = { navController.navigate(item.route) },
                    icon = { Icon(item.icon, null) },
                    label = { Text(item.label) }
                )
            }
        }
    }
) { paddingValues ->
    NavHost(modifier = Modifier.padding(paddingValues), ...) { ... }
}
```


</details>

<details>
<summary>Navigation in Compose</summary>

```kotlin
val navController = rememberNavController()

NavHost(navController, startDestination = "home") {
    composable("home") { HomeScreen(navController) }
    composable("detail/{id}",
        arguments = listOf(navArgument("id") { type = NavType.IntType })
    ) { backStackEntry ->
        DetailScreen(id = backStackEntry.arguments?.getInt("id")!!)
    }
}

// Navigate:
navController.navigate("detail/42")
```


</details>

<details>
<summary>Animations in Compose</summary>
- `AnimatedVisibility`: Animate enter/exit of a composable.
- `AnimatedContent`: Animate content changes (e.g., tab transitions).
- `animate*AsState()`: Animate a single value (Float, Color, Dp).
- `updateTransition()`: Coordinate multiple animations.

```kotlin
AnimatedVisibility(
    visible = isVisible,
    enter = fadeIn() + expandVertically(),
    exit = fadeOut() + shrinkVertically()
) {
    MyContent()
}
```


</details>


## 🏗️ Architecture Patterns

---


## 🏛️ MVVM

<details>
<summary>What is MVVM and why is it the standard for Android?</summary>

**Model-View-ViewModel**:

- **Model**: Data layer — repositories, data sources, domain entities.
- **View**: UI layer — Activity/Fragment/Composable. Observes ViewModel state.
- **ViewModel**: Holds and exposes UI state. Survives configuration changes. Business logic bridge.

Android-specific benefits:

- `ViewModel` survives rotation (unlike Activity).
- `LiveData`/`StateFlow` are lifecycle-aware.
- Separation makes testing easy (ViewModel doesn't need Android context).

```javascript
View ← observes ← ViewModel ← calls → Repository → DataSource
```


</details>

<details>
<summary>What is ViewModel and why is it important?</summary>

`ViewModel` is a Jetpack component that:

- Survives configuration changes (screen rotation).
- Holds `StateFlow`/`LiveData` for UI state.
- Scoped to a lifecycle (Activity/Fragment/NavGraph).

```kotlin
class UserViewModel(private val repo: UserRepository) : ViewModel() {
    private val _uiState = MutableStateFlow<UserState>(UserState.Loading)
    val uiState: StateFlow<UserState> = _uiState

    fun loadUser(id: Int) = viewModelScope.launch {
        _uiState.value = UserState.Success(repo.getUser(id))
    }
}
```


</details>

<details>
<summary>LiveData vs StateFlow</summary>

|                 | `LiveData`         | `StateFlow`                            |
| --------------- | ------------------ | -------------------------------------- |
| Lifecycle-aware | Yes (built-in)     | Requires `collectAsStateWithLifecycle` |
| Thread-safe     | Yes (`postValue`)  | Yes (Kotlin coroutines)                |
| Transformation  | `map`, `switchMap` | Flow operators                         |
| Kotlin-first    | No                 | Yes                                    |
| Null support    | Yes                | Requires nullable type                 |


Prefer `StateFlow` for new code; it integrates better with coroutines and Compose.


</details>


---


## 🧱 Clean Architecture

<details>
<summary>What is Clean Architecture in Android?</summary>

Clean Architecture separates code into concentric layers with a strict dependency rule: **outer layers depend on inner layers, never the reverse**.


```javascript
Presentation (ViewModel, Composables)
      ↓
Domain (UseCases, Entities, Repository interfaces)
      ↓
Data (RepositoryImpl, DataSources, APIs, DB)
```

- **Domain layer**: Pure Kotlin. No Android dependencies. Holds `UseCase` classes and repository interfaces.
- **Data layer**: Implements repository interfaces. Contains Retrofit/Room.
- **Presentation layer**: ViewModels, UI components.

</details>

<details>
<summary>What is a UseCase?</summary>

A `UseCase` (also called Interactor) encapsulates a single business operation:


```kotlin
class GetUserUseCase(private val repo: UserRepository) {
    suspend operator fun invoke(id: Int): User = repo.getUser(id)
}

// In ViewModel:
val user = getUserUseCase(userId)
```


Benefits: Reusable across ViewModels, easy to test, clear single responsibility.


</details>

<details>
<summary>Repository pattern</summary>

The repository abstracts data sources behind a single interface:


```kotlin
interface UserRepository {
    suspend fun getUser(id: Int): User
}

class UserRepositoryImpl(
    private val api: UserApi,
    private val dao: UserDao
) : UserRepository {
    override suspend fun getUser(id: Int): User {
        return dao.getUser(id) ?: api.getUser(id).also { dao.insert(it) }
    }
}
```


ViewModel/UseCase only knows about the interface — not whether data comes from network or cache.


</details>

<details>
<summary>SOLID principles in Android</summary>
- **S**ingle Responsibility: Each class does one thing (ViewModel ≠ data fetcher).
- **O**pen/Closed: Extend behavior via new classes, not modifying existing ones.
- **L**iskov Substitution: Implementations can replace their interfaces without breaking behavior.
- **I**nterface Segregation: Prefer small, focused interfaces.
- **D**ependency Inversion: Depend on abstractions (interfaces), not concrete classes.

</details>


---


## 🔁 MVI

<details>
<summary>What is MVI architecture?</summary>

**Model-View-Intent**:

- **Model**: Immutable UI state.
- **View**: Renders state, emits user intents.
- **Intent**: User actions that trigger state transitions.

```kotlin
sealed class UserIntent {
    data class LoadUser(val id: Int) : UserIntent()
    object Retry : UserIntent()
}

data class UserState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val error: String? = null
)
```


MVI pairs naturally with `StateFlow` and Compose because both are state-driven. The unidirectional data flow makes state transitions predictable and easy to test.


</details>


## 💉 Dependency Injection (Hilt)

---

<details>
<summary>What is Dependency Injection?</summary>

Dependency Injection is a design pattern where objects receive their dependencies from outside rather than creating them internally:


```kotlin
// Without DI (tight coupling)
class UserViewModel {
    private val repo = UserRepositoryImpl() // creates own dependency
}

// With DI (loose coupling)
class UserViewModel(private val repo: UserRepository) // injected
```


Benefits: testability, swappable implementations, separation of concerns.


</details>

<details>
<summary>What is Hilt and how does it differ from Dagger?</summary>

Hilt is a Jetpack DI framework built on top of Dagger that reduces boilerplate:


|                     | Dagger                    | Hilt                                         |
| ------------------- | ------------------------- | -------------------------------------------- |
| Setup               | Manual components/modules | Auto-generated components                    |
| Android integration | Manual                    | Built-in for Activity/Fragment/ViewModel     |
| Scope               | Custom                    | Predefined (Singleton, ActivityScoped, etc.) |
| Learning curve      | Steep                     | Simpler                                      |


Hilt auto-generates components for standard Android classes.


</details>

<details>
<summary>Setting up Hilt</summary>

```kotlin
@HiltAndroidApp
class MyApp : Application()

@AndroidEntryPoint
class MainActivity : AppCompatActivity()

@HiltViewModel
class UserViewModel @Inject constructor(
    private val repo: UserRepository
) : ViewModel()

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideUserRepo(api: UserApi, dao: UserDao): UserRepository =
        UserRepositoryImpl(api, dao)
}
```


</details>

<details>
<summary>Hilt Scopes</summary>

| Scope Annotation   | Component            | Lifetime           |
| ------------------ | -------------------- | ------------------ |
| `@Singleton`       | `SingletonComponent` | App lifetime       |
| `@ActivityScoped`  | `ActivityComponent`  | Activity lifetime  |
| `@ViewModelScoped` | `ViewModelComponent` | ViewModel lifetime |
| `@FragmentScoped`  | `FragmentComponent`  | Fragment lifetime  |


Always scope at the minimum necessary lifetime to avoid memory leaks.


</details>

<details>
<summary>Injecting interfaces with @Binds</summary>

```kotlin
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    abstract fun bindUserRepo(impl: UserRepositoryImpl): UserRepository
}
```


`@Binds` is more efficient than `@Provides` for binding interface to implementation.


</details>

<details>
<summary>Using @Qualifier for multiple implementations</summary>

```kotlin
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class RemoteDataSource

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class LocalDataSource

// Inject specific one:
class UserRepo @Inject constructor(
    @RemoteDataSource private val remoteSource: UserDataSource,
    @LocalDataSource private val localSource: UserDataSource
)
```


</details>


## 🧪 Testing

---

<details>
<summary>Unit testing a ViewModel</summary>

```kotlin
@ExperimentalCoroutinesApi
class UserViewModelTest {
    @get:Rule
    val coroutineRule = MainDispatcherRule()

    private val mockRepo = mockk<UserRepository>()
    private lateinit var viewModel: UserViewModel

    @Before
    fun setup() {
        viewModel = UserViewModel(mockRepo)
    }

    @Test
    fun `loadUser emits success state`() = runTest {
        coEvery { mockRepo.getUser(1) } returns User(1, "Ashu")
        viewModel.loadUser(1)
        assertEquals(UserState.Success(User(1, "Ashu")), viewModel.uiState.value)
    }
}
```


</details>

<details>
<summary>MainDispatcherRule for coroutines</summary>

```kotlin
class MainDispatcherRule(
    private val dispatcher: TestCoroutineDispatcher = TestCoroutineDispatcher()
) : TestWatcher() {
    override fun starting(desc: Description) {
        Dispatchers.setMain(dispatcher)
    }
    override fun finished(desc: Description) {
        Dispatchers.resetMain()
        dispatcher.cleanupTestCoroutines()
    }
}
```


Replace `Dispatchers.Main` in tests to run coroutines synchronously.


</details>

<details>
<summary>How to test StateFlow / LiveData</summary>

```kotlin
// StateFlow
@Test
fun `state updates correctly`() = runTest {
    val values = mutableListOf<UiState>()
    val job = launch { viewModel.uiState.toList(values) }
    viewModel.loadData()
    job.cancel()
    assertEquals(UiState.Loading, values[0])
    assertTrue(values[1] is UiState.Success)
}

// LiveData (use InstantTaskExecutorRule)
@get:Rule
val liveDataRule = InstantTaskExecutorRule()
```


</details>

<details>
<summary>Mocking with MockK</summary>

```kotlin
val repo = mockk<UserRepository>()
coEvery { repo.getUser(any()) } returns User(1, "Ashu")
coVerify { repo.getUser(1) }

// Relaxed mock (doesn't fail on unstubbed calls)
val relaxedRepo = mockk<UserRepository>(relaxed = true)
```


MockK is the preferred Kotlin mocking library (over Mockito) because it's coroutine-aware.


</details>

<details>
<summary>Testing Room Database</summary>

```kotlin
@RunWith(AndroidJUnit4::class)
class UserDaoTest {
    private lateinit var db: AppDatabase
    private lateinit var dao: UserDao

    @Before
    fun setup() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).allowMainThreadQueries().build()
        dao = db.userDao()
    }

    @After
    fun tearDown() { db.close() }

    @Test
    fun insertAndRetrieve() = runTest {
        dao.insert(User(1, "Ashu"))
        val users = dao.getAll().first()
        assertEquals(1, users.size)
    }
}
```


</details>

<details>
<summary>Compose UI Testing</summary>

```kotlin
@get:Rule
val composeRule = createComposeRule()

@Test
fun myComposableTest() {
    composeRule.setContent {
        MyComposable(text = "Hello")
    }
    composeRule.onNodeWithText("Hello").assertIsDisplayed()
    composeRule.onNodeWithTag("submit_button").performClick()
    composeRule.onNodeWithText("Success").assertExists()
}
```


</details>


## ⚙️ Performance & Memory

---

<details>
<summary>How to analyze memory leaks in Android?</summary>
- **LeakCanary**: Auto-detects leaks in debug builds. Traces the reference chain.
- **Android Profiler** (Memory tab): Heap dumps, allocation tracking.
- **Common causes**:
    - Holding Activity context in long-lived objects (use Application context instead).
    - Not unregistering listeners/BroadcastReceivers.
    - Static references to views.
    - Anonymous inner classes holding outer Activity reference.
    - Not clearing ViewBinding in `onDestroyView()`.

</details>

<details>
<summary>App startup performance</summary>

Three startup states:

- **Cold start**: Process not running. Most expensive. Optimize `Application.onCreate()`.
- **Warm start**: Process alive, Activity destroyed. Re-creates Activity.
- **Hot start**: Activity in background, brought to foreground.

Optimizations:

- Defer non-critical init with `App Startup` library.
- Move heavy work off main thread.
- Use baseline profiles to pre-compile hot code paths.
- Reduce overdraw — flatten view hierarchy.

</details>

<details>
<summary>Detecting ANRs</summary>

ANR (Application Not Responding) occurs when main thread is blocked for >5 seconds (input) or >10 seconds (broadcast).


Prevention:

- Never do network/disk I/O on main thread.
- Use `Dispatchers.IO` or `Dispatchers.Default` for heavy work.
- Use `StrictMode` in debug to detect accidental main-thread I/O.

```kotlin
StrictMode.setThreadPolicy(
    StrictMode.ThreadPolicy.Builder()
        .detectDiskReads()
        .detectNetwork()
        .penaltyLog()
        .build()
)
```


</details>

<details>
<summary>Compose performance pitfalls</summary>
- **Lambda re-creation**: Lambdas created inline in `items {}` are unstable — hoist them.
- **Unstable classes**: If a class has `var` properties or mutable collections, Compose can't skip it. Annotate with `@Stable` or `@Immutable`.
- **Too much state hoisting**: Lifting state unnecessarily high causes more composables to recompose.
- **Snapshot reads in wrong scope**: Reading state in a composable that shouldn't care about it.

Use **Compose Compiler Metrics** (`-Pcompose.metrics.enabled=true`) to identify skippable vs unskippable composables.


</details>

<details>
<summary>Inline classes / value classes</summary>

```kotlin
@JvmInline
value class UserId(val id: Int)
```


At runtime, `UserId` is represented as a plain `Int` — zero overhead wrapper. Useful for type-safe IDs, units, domain primitives without boxing penalty.


</details>


## 🌐 Kotlin Multiplatform (KMP)

---

<details>
<summary>What is Kotlin Multiplatform?</summary>

KMP allows sharing Kotlin code across platforms: Android, iOS, Web, Desktop, and Server — without forcing a shared UI layer.

- **Shared module**: Pure Kotlin, no platform-specific APIs.
- **Android/iOS targets**: Platform-specific code in `androidMain` / `iosMain`.

Different from React Native/Flutter: KMP shares **logic**, not UI (unless using Compose Multiplatform for UI too).


</details>

<details>
<summary>expect / actual mechanism</summary>

`expect` declares a contract in shared code; `actual` provides the platform-specific implementation:


```kotlin
// commonMain
expect fun getCurrentTimestamp(): Long

// androidMain
actual fun getCurrentTimestamp(): Long = System.currentTimeMillis()

// iosMain
actual fun getCurrentTimestamp(): Long =
    NSDate().timeIntervalSince1970.toLong() * 1000
```


</details>

<details>
<summary>KMP limitations</summary>
- No direct access to platform APIs from shared code (must use `expect`/`actual`).
- Compose Multiplatform for iOS is still maturing.
- Gradle setup can be complex.
- Some Kotlin coroutine patterns differ between Android and iOS (iOS requires `@SharedImmutable` for shared state in older setups).
- Swift/ObjC interop has some rough edges (generics, coroutines).

</details>

<details>
<summary>What can be shared in KMP?</summary>
- Business logic / UseCases
- Data models / DTOs
- Repository interfaces and implementations (with Ktor for networking, SQLDelight for DB)
- ViewModels (with KMP-ViewModel library)
- Utility functions (date parsing, validation, formatting)

</details>


## 📋 Important Topics Checklist

Use this page to track your preparation progress. Check off topics as you feel confident.


---


## 🟢 Kotlin Fundamentals

- [ ] null safety (`?.`, `?:`, `!!`)
- [ ] `val` vs `var`
- [ ] Data class, sealed class, enum class
- [ ] Companion object vs Object
- [ ] Extension functions
- [ ] Scope functions (`let`, `apply`, `also`, `run`, `with`)
- [ ] Higher-order functions & lambdas
- [ ] `inline`, `noinline`, `crossinline`
- [ ] `lazy` vs `lateinit`
- [ ] Generics: `in`, `out`, reified
- [ ] Delegation pattern
- [ ] `typealias`
- [ ] Destructuring declarations
- [ ] Coroutine Channels
- [ ] `Result<T>` class

---


## 🟡 Android Core

- [ ] Activity Lifecycle
- [ ] Fragment Lifecycle
- [ ] Launch Modes (standard, singleTop, singleTask, singleInstance)
- [ ] Explicit vs Implicit Intents
- [ ] Parcelable vs Serializable
- [ ] RecyclerView + DiffUtil
- [ ] ViewBinding
- [ ] Runtime Permissions
- [ ] Broadcast Receivers
- [ ] Services (Foreground, Background, Bound)
- [ ] WorkManager
- [ ] Navigation Component
- [ ] Room Database (Entity, DAO, Database)
- [ ] SharedPreferences / DataStore
- [ ] Handlers, Loopers
- [ ] ViewPager2
- [ ] min/compile/target SDK differences

---


## 🔵 Coroutines & Flow

- [ ] `launch` vs `async`
- [ ] `suspend` function
- [ ] Dispatchers (Main, IO, Default)
- [ ] Structured concurrency
- [ ] `viewModelScope`, `lifecycleScope`
- [ ] `CoroutineExceptionHandler`
- [ ] `SupervisorJob`
- [ ] Cold vs Hot Flow
- [ ] `StateFlow` vs `SharedFlow` vs `Flow`
- [ ] `collectLatest`, `debounce`, `conflate`
- [ ] `buffer()` for backpressure
- [ ] `combine`, `zip`, `merge` operators
- [ ] `snapshotFlow`

---


## 🟣 Jetpack Compose

- [ ] `@Composable` rules
- [ ] Recomposition internals
- [ ] `remember` vs `rememberSaveable`
- [ ] `mutableStateOf`, `derivedStateOf`
- [ ] State hoisting
- [ ] `LaunchedEffect`, `DisposableEffect`, `SideEffect`
- [ ] `LazyColumn` / `LazyRow` with keys
- [ ] `Modifier` system
- [ ] `Scaffold`, `TopAppBar`, `BottomNavigationBar`
- [ ] Navigation in Compose
- [ ] Animations (`AnimatedVisibility`, `animate*AsState`)
- [ ] Compose + ViewModel integration
- [ ] `collectAsStateWithLifecycle`
- [ ] `@Stable` / `@Immutable` for performance
- [ ] Compose Compiler Metrics
- [ ] Custom composables / Slot API

---


## 🏗️ Architecture

- [ ] MVVM pattern
- [ ] Clean Architecture (layers)
- [ ] UseCase / Interactor pattern
- [ ] Repository pattern
- [ ] MVI pattern
- [ ] Single Source of Truth
- [ ] Sealed class for UI state
- [ ] SOLID principles
- [ ] Dependency Inversion

---


## 💉 Dependency Injection

- [ ] DI vs Service Locator
- [ ] Hilt setup (`@HiltAndroidApp`, `@AndroidEntryPoint`)
- [ ] `@HiltViewModel`
- [ ] `@Module`, `@Provides`, `@Binds`
- [ ] Hilt scopes
- [ ] `@Qualifier`
- [ ] `@EntryPoint`

---


## 🧪 Testing

- [ ] Unit test for ViewModel
- [ ] `MainDispatcherRule`
- [ ] `runTest` for coroutines
- [ ] MockK basics
- [ ] Testing StateFlow
- [ ] In-memory Room testing
- [ ] Compose UI testing
- [ ] `InstantTaskExecutorRule` for LiveData

---


## ⚙️ Performance & Memory

- [ ] Memory leak common causes
- [ ] LeakCanary
- [ ] App startup types (cold/warm/hot)
- [ ] ANR detection + StrictMode
- [ ] Compose performance pitfalls
- [ ] `@Stable` / `@Immutable`
- [ ] Baseline Profiles
- [ ] Value classes (`@JvmInline`)

---


## 🌐 Kotlin Multiplatform

- [ ] `expect` / `actual`
- [ ] Shared module structure
- [ ] KMP with Ktor + SQLDelight
- [ ] KMP limitations
- [ ] Compose Multiplatform status
