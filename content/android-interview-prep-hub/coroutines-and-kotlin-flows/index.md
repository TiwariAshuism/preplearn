---
source: notion
title: "🔵 Coroutines & Kotlin Flows"
slug: "coroutines-and-kotlin-flows"
notionId: "38ada883-bddd-81ef-a4ff-cc8f541f711d"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 7
icon: "🔵"
cover: null
---

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

