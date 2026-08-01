---
source: notion
title: "Chapter 1 — Composable Functions"
slug: "chapter-1-composable-functions"
notionId: "38eda883-bddd-81ea-b945-c45aa088c0ce"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: "jetpack-compose-internals-complete-deep-dive"
children: []
order: 1
icon: "1️⃣"
cover: null
---
> Composable functions are not ordinary Kotlin functions. They carry a fundamentally different execution model, calling contract, and set of guarantees. This chapter dissects all of it.

---


## 1.1 The Nature of Composable Functions


A `@Composable` function is a **description of UI**, not a series of imperative commands. When you write:


```kotlin
@Composable
fun Greeting(name: String) {
    Text("Hello, $name")
}
```


You are **not** creating a `Text` widget and adding it to a parent. You are **emitting a description** into the Compose runtime’s slot table. The runtime then decides if, when, and how to materialize that description into actual UI nodes.


This is the core mental shift: **Composable functions are data emitters into a tree, not imperative UI constructors.**


The Compose compiler transforms every `@Composable` function behind the scenes, injecting a hidden `Composer` parameter. The `Composer` is the runtime’s context — it tracks where in the tree you are, manages state, and records changes.


---


## 1.2 Composable Function Properties


Compose defines a strict contract for composable functions. They must obey all of the following properties:


| Property                  | Meaning                                    |
| ------------------------- | ------------------------------------------ |
| **Idempotent**            | Same inputs always produce the same output |
| **Free of side effects**  | No observable external state changes       |
| **Restartable**           | Can be re-executed at any time             |
| **Fast**                  | No blocking I/O or heavy computation       |
| **Positionally memoized** | Identity tied to call site position        |


---


## 1.3 Calling Context


Composable functions can **only** be called from:

1. Another `@Composable` function
2. A composable lambda
3. A composable inline function

This restriction exists because every composable call implicitly receives the `Composer` parameter. The compiler enforces this at compile time — calling a composable from a regular function is a compile error.


The `Composer` is **ambient** — it flows down the call tree implicitly without the developer ever seeing it, similar to how Kotlin coroutines flow their `CoroutineContext`.


```kotlin
// INVALID — Composer not available
fun notComposable() {
    Text("Error") // ❌ compile error
}

// VALID — Composer flows through
@Composable
fun Valid() {
    Text("OK") // ✅
}
```


---


## 1.4 Idempotent


**Idempotency** means: calling a composable multiple times with the same inputs must produce the same result every time, with no observable side effects.


This is required because Compose may re-execute (recompose) any composable at any time when its inputs change. If a composable mutated global state on every call, recomposition would corrupt that state.


```kotlin
// ❌ NOT idempotent — side effect on every call
@Composable
fun Bad() {
    counter++ // mutates external state every recomposition
    Text("$counter")
}

// ✅ Idempotent — same output for same input
@Composable
fun Good(count: Int) {
    Text("$count")
}
```


---


## 1.5 Free of Side Effects


A **side effect** is any observable interaction with the outside world: writing to a file, mutating a shared variable, making a network call, logging.


Composable functions should **not** produce side effects directly. Instead, they use **effect handlers** (`LaunchedEffect`, `SideEffect`, `DisposableEffect`) which the runtime controls. This gives Compose the ability to:

- Cancel effects when a composable leaves composition
- Re-run effects when keys change
- Delay effects until after composition completes

```kotlin
// ❌ Direct side effect — dangerous during recomposition
@Composable
fun Bad() {
    viewModel.loadData() // called on every recompose!
}

// ✅ Controlled side effect via effect handler
@Composable
fun Good() {
    LaunchedEffect(Unit) {
        viewModel.loadData() // called once on enter
    }
}
```


---


## 1.6 Restartable


The runtime can **restart** (re-execute) any composable scope at any time. This is how recomposition works: when state read inside a composable changes, Compose marks that scope for restart and re-runs it.


For restartability to work safely:

- Composables must not assume they run only once
- Composables must not depend on external mutable state not tracked by Compose
- All state that composables read must go through Compose’s snapshot system

The compiler emits **restart lambdas** for every restartable composable function, which the runtime invokes during recomposition.


---


## 1.7 Fast Execution


Composable functions may be called **very frequently** — potentially every frame during animations (60–120 times per second). They must:

- Complete in microseconds, not milliseconds
- Never block the main thread
- Never do I/O, disk access, or heavy computation

Heavy work belongs in coroutines (`LaunchedEffect`, `produceState`) or ViewModels, not in composable function bodies.


---


## 1.8 Positional Memoization


Compose identifies each composable invocation by its **position in the call tree**, not by its name or a user-provided key. This is called **positional memoization**.


The compiler assigns each composable call site a unique **source key** (based on file name, line number, and column) which becomes part of the slot table entry for that call.


```kotlin
@Composable
fun List() {
    Item("A") // slot key = hash(file, line 3, col 5)
    Item("B") // slot key = hash(file, line 4, col 5)
    // These are distinct even though both call Item()
}
```


This is why using composables inside loops without `key {}` is dangerous — the positional identity shifts if items are inserted/removed:


```kotlin
// ❌ Positional identity breaks on insertion
for (item in items) {
    Item(item)
}

// ✅ Stable identity via explicit key
for (item in items) {
    key(item.id) { Item(item) }
}
```


---


## 1.9 Similarities with Suspend Functions


Composable functions share deep structural similarities with Kotlin `suspend` functions:


| Aspect             | `suspend` functions         | `@Composable` functions               |
| ------------------ | --------------------------- | ------------------------------------- |
| Hidden parameter   | `Continuation<T>`           | `Composer`                            |
| Call restriction   | Only from coroutine/suspend | Only from composable                  |
| Compiler transform | CPS transform               | Composer injection + group generation |
| "Colored"          | Yes (suspend-colored)       | Yes (composable-colored)              |
| Restartable        | Via `resume()`              | Via restart lambda                    |


Both are **effect systems** encoded in the type system. The key difference: suspend functions model asynchronous _computation_, composables model _UI structure_.


---


## 1.10 Composable Functions are Colored


"Colored functions" is a concept from Bob Nystrom’s essay — a function’s type is "infected" by its calling context. Composable functions are **composable-colored**:

- A composable can only call other composables
- A non-composable cannot call a composable
- This coloring is **viral** — once you need composable, everything in the call chain must be composable
- Unlike `suspend`, there’s no `runBlocking` escape hatch from outside

The only entry points into composable-land are:

- `setContent {}` (Activity/Fragment)
- `ComposeView` (interop)
- `Composition` (custom use)

---


## 1.11 Composable Function Types


Composable functions have a **distinct type** in Kotlin’s type system:


```kotlin
// Type: @Composable () -> Unit
val content: @Composable () -> Unit = { Text("Hello") }

// Type: @Composable (String) -> Unit
val greeting: @Composable (String) -> Unit = { name -> Text(name) }

// Composable lambda as parameter (slot API)
@Composable
fun Card(content: @Composable () -> Unit) {
    Box { content() }
}
```


`@Composable` is a **type annotation** that modifies the function type. A `@Composable () -> Unit` and a plain `() -> Unit` are **incompatible types** — you cannot pass a composable lambda where a regular lambda is expected and vice versa.


This is what the Compose runtime relies on for safety — the type system ensures the `Composer` is always available when composable code runs.

