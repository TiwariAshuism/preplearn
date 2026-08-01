---
source: notion
title: "Chapter 7 — Effects and Effect Handlers"
slug: "chapter-7-effects-and-effect-handlers"
notionId: "38eda883-bddd-8171-96b4-fff6be9ddff2"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: "jetpack-compose-internals-complete-deep-dive"
children: []
order: 7
icon: "7️⃣"
cover: null
---
> Side effects in Compose need controlled execution — at the right time, with proper cleanup, and safely tied to a composable’s lifecycle.

---


## 7.1 Introducing Side Effects


A **side effect** is any operation that affects state or the world outside the composable’s own output:

- Starting a network request
- Writing to a database
- Registering a listener
- Logging
- Navigation
- Playing audio

Side effects are not inherently bad — they’re necessary. The problem is _uncontrolled_ side effects during recomposition.


---


## 7.2 Side Effects in Compose


Why can’t we just run side effects directly in composable functions?


```kotlin
@Composable fun Bad() {
    viewModel.fetchData()  // ❌ runs on EVERY recomposition!
    // Compose may recompose this many times per second
    // fetchData() would be called hundreds of times
}
```


Composables can recompose:

- When state changes
- When a parent recomposes
- During animations (every frame)
- Multiple times before the frame is committed

Uncontrolled effects would run too frequently, in the wrong order, or multiple times for a single "event".


---


## 7.3 What We Need


A good effect system must guarantee:


| Need                    | Explanation                                                    |
| ----------------------- | -------------------------------------------------------------- |
| **Run once**            | Effects that should fire once (e.g., initial data load)        |
| **Run on key change**   | Re-run when dependencies change                                |
| **Cleanup on leave**    | Cancel coroutines, unregister listeners when composable leaves |
| **Controlled ordering** | Effects run after composition is committed                     |
| **Lifecycle awareness** | Effects tied to composable’s lifetime in the composition       |


---


## 7.4 Effect Handlers Overview


| Handler                    | Suspended | Runs When                  | Cleanup                     |
| -------------------------- | --------- | -------------------------- | --------------------------- |
| `SideEffect`               | No        | Every successful recompose | None                        |
| `DisposableEffect(key)`    | No        | On enter + key change      | Yes (`onDispose`)           |
| `LaunchedEffect(key)`      | Yes       | On enter + key change      | Coroutine cancelled         |
| `rememberCoroutineScope()` | Yes       | On demand (user action)    | Scope cancelled on leave    |
| `produceState(key)`        | Yes       | On enter + key change      | Coroutine cancelled         |
| `snapshotFlow { }`         | Yes       | Inside coroutine           | Flow cancels with coroutine |


---


## 7.5 Non-Suspended Effects


### SideEffect


`SideEffect {}` runs after **every successful recomposition** (not after failed/cancelled ones). Use it to sync Compose state to non-Compose objects:


```kotlin
@Composable fun Analytics(screenName: String) {
    SideEffect {
        // Runs after each recomposition that commits
        // Safe to call external (non-Compose) systems here
        FirebaseAnalytics.setCurrentScreen(screenName)
    }
}
```


**Key property**: runs synchronously, on the main thread, after the composition is applied.


---


### DisposableEffect


`DisposableEffect(key)` runs when the composable **enters composition** and whenever `key` changes. Provides `onDispose {}` for cleanup:


```kotlin
@Composable fun LifecycleObserver(lifecycle: Lifecycle) {
    val observer = remember { MyObserver() }

    DisposableEffect(lifecycle) {
        lifecycle.addObserver(observer)  // register

        onDispose {
            lifecycle.removeObserver(observer)  // cleanup on leave or key change
        }
    }
}
```


**Lifecycle:**

- **Enter/key change**: block runs, `onDispose` of previous run is called first
- **Leave composition**: `onDispose` runs

Perfect for: registering/unregistering listeners, callbacks, BroadcastReceivers.


---


## 7.6 Suspended Effects


### LaunchedEffect


`LaunchedEffect(key)` launches a coroutine that lives as long as the composable is in composition (or until `key` changes):


```kotlin
@Composable fun AutoRefresh(id: String) {
    LaunchedEffect(id) {
        // New coroutine launched when id changes
        // Previous coroutine cancelled before new one starts
        while (true) {
            viewModel.refresh(id)
            delay(30_000)
        }
    }
}
```


**Key behavior**: When `key` changes, the running coroutine is **cancelled** and a new one starts. When the composable leaves, the coroutine is cancelled.


Multiple keys supported:


```kotlin
LaunchedEffect(userId, token) {
    // Re-runs if either userId or token changes
}
```


---


### rememberCoroutineScope


`rememberCoroutineScope()` gives a coroutine scope tied to the composable’s lifetime, for launching coroutines from **event handlers** (not from composition):


```kotlin
@Composable fun SubmitButton() {
    val scope = rememberCoroutineScope()

    Button(onClick = {
        scope.launch {          // launch from click handler
            submitForm()        // not inside composition, so LaunchedEffect won’t work
        }
    }) {
        Text("Submit")
    }
}
```


The scope’s `Job` is cancelled when the composable leaves composition — all launched coroutines are cancelled.


---


### produceState


`produceState` converts any async value into Compose state:


```kotlin
@Composable fun UserProfile(userId: String): State<User?> {
    return produceState<User?>(initialValue = null, userId) {
        value = null // reset while loading
        value = userRepository.getUser(userId)
        // Coroutine cancelled if userId changes or composable leaves
    }
}

// Usage
@Composable fun Screen(userId: String) {
    val user by produceState<User?>(null, userId) {
        value = repo.getUser(userId)
    }
    if (user != null) UserCard(user!!) else Loading()
}
```


---


### snapshotFlow


`snapshotFlow {}` converts Compose state into a cold Flow. It re-emits whenever the snapshot state read inside the block changes:


```kotlin
@Composable fun SearchField() {
    val query = remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        snapshotFlow { query.value }    // observe Compose state as Flow
            .debounce(300)
            .collect { search(it) }
    }
}
```


Internally, `snapshotFlow` uses snapshot read observers to detect which states it reads, and re-emits when any of them change.


---


## 7.7 Third Party Library Adapters


Compose provides adapters to integrate common reactive libraries with its state system:


### Flow → State


```kotlin
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
// Lifecycle-aware collection — pauses when app backgrounds
// Preferred over collectAsState() for UI
```


### LiveData → State


```kotlin
val data by liveData.observeAsState(initial = null)
```


### RxJava → State


```kotlin
// With compose-rxjava3 artifact
val data by observable.subscribeAsState(initial = null)
```


### Async Image Loading (Coil)


```kotlin
AsyncImage(
    model = imageUrl,
    contentDescription = null
) // Coil integrates with Compose’s runtime via Painter state
```


**How adapters work internally**: They use `produceState` or `LaunchedEffect` under the hood, converting the reactive stream’s emissions into `mutableStateOf` updates, which then drive recomposition through the snapshot system.

