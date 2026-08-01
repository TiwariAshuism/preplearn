---
source: notion
title: "Chapter 8 — The Composable Lifecycle"
slug: "chapter-8-the-composable-lifecycle"
notionId: "38eda883-bddd-810a-816b-c3c4ce441c47"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: "jetpack-compose-internals-complete-deep-dive"
children: []
order: 8
icon: "8️⃣"
cover: null
---
> Every composable has a lifecycle inside the composition. Understanding it is essential for correct use of remember, effects, and state.

---


## 8.1 The Three Lifecycle Events


A composable has exactly three lifecycle events:


```javascript
┌──────────────────────────────────┐
│   Enter Composition                  │
│     (first time composable runs)     │
├──────────────────────────────────┤
│   Recompose (0 or more times)        │
│     (re-runs when inputs change)     │
├──────────────────────────────────┤
│   Leave Composition                  │
│     (group removed from slot table)  │
└──────────────────────────────────┘
```


Notice: there is NO onStart/onStop, no pause/resume, no visibility changes. The lifecycle is purely about presence in the slot table.


---


## 8.2 Entering Composition


A composable **enters composition** when its group is first written into the slot table. This happens when:

- `setContent {}` runs for the first time
- A parent composable adds a new child composable (e.g., `if (show) Child()`)
- A `key {}` block changes, causing the old group to be replaced by a new one

**On enter:**

- `remember {}` lambdas execute and values are stored
- `RememberObserver.onRemembered()` is called for any remembered values implementing that interface
- `LaunchedEffect` coroutines start
- `DisposableEffect` blocks run

---


## 8.3 Recomposition


A composable **recomposes** when one of its inputs changes or when state it directly reads is invalidated. During recomposition:

- The function body re-runs
- `remember(key) {}` with the same key returns the cached value
- `remember(key) {}` with a changed key re-runs the lambda
- Effect handlers **do not re-run** unless their keys change
- The slot table is updated with new values
- Children may be skipped if their inputs haven’t changed

**Recomposition is not the same as a lifecycle event** — the composable never "leaves" and "re-enters" during recomposition.


---


## 8.4 Leaving Composition


A composable **leaves composition** when its group is removed from the slot table:

- An `if (show)` branch turns false
- A `key {}` changes (old group leaves, new group enters)
- The parent composable is removed
- `setContent {}` is called with new content that doesn’t include this composable
- The `Composition` is disposed

**On leave:**

- `RememberObserver.onForgotten()` is called for all remembered values implementing it
- `DisposableEffect` `onDispose {}` runs
- `LaunchedEffect` coroutines are cancelled
- `rememberCoroutineScope()` scope is cancelled

---


## 8.5 RememberObserver — Hooking into Lifecycle


`RememberObserver` is the low-level hook that effects use internally. Any class can implement it to observe composable lifecycle:


```kotlin
class MyResource : RememberObserver {
    override fun onRemembered() {
        // Composable entered composition
        initialize()
    }
    override fun onForgotten() {
        // Composable left composition
        cleanup()
    }
    override fun onAbandoned() {
        // remember {} ran but composition was abandoned (e.g., exception)
        cleanup()
    }
}

@Composable fun MyComp() {
    remember { MyResource() }  // lifecycle tied to composable
}
```


`LaunchedEffect` and `DisposableEffect` are built on top of `RememberObserver` internally.


---


## 8.6 Identity and Lifecycle


A composable’s **identity** in the slot table is determined by its position (or explicit `key {}`). As long as the composable occupies the same slot, it **retains its remembered state** across recompositions.


Identity changes (and thus restart the lifecycle) when:

- The composable’s key changes (`key(newId) { Composable() }`)
- The composable moves positions in the tree without a key
- The composable’s group is removed and a different composable takes its slot

---


## 8.7 Lifecycle vs Android Lifecycle


Composable lifecycle and Android Activity/Fragment lifecycle are **independent**:


| Android Event        | Composable Effect                                                        |
| -------------------- | ------------------------------------------------------------------------ |
| Activity `onCreate`  | First composition starts                                                 |
| Activity `onResume`  | No composable lifecycle event                                            |
| Activity `onPause`   | No composable lifecycle event                                            |
| Activity `onStop`    | No composable lifecycle event                                            |
| Activity `onDestroy` | Composition disposed, all composables leave                              |
| Screen rotation      | Composition disposed + recreated (state survives via `rememberSaveable`) |


For responding to Android lifecycle events from composables, use `LifecycleEventEffect` or `DisposableEffect(lifecycle)`.

