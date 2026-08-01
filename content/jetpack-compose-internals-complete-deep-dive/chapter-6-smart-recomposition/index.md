---
source: notion
title: "Chapter 6 — Smart Recomposition"
slug: "chapter-6-smart-recomposition"
notionId: "38eda883-bddd-81b7-9ad0-db955170cc6d"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: "jetpack-compose-internals-complete-deep-dive"
children: []
order: 6
icon: "6️⃣"
cover: null
---
> Recomposition is only useful if it’s fast. Smart recomposition is Compose’s set of techniques to skip as much work as possible during updates.

---


## 6.1 What Smart Recomposition Means


Naive recomposition would re-run the entire composable tree on every state change. Compose is much smarter:

1. Only composables that **read changed state** are invalidated
2. Only composables with **changed inputs** actually re-execute
3. Composables with **stable, unchanged inputs** are **skipped**

This three-level filtering makes Compose handle complex UIs at 60+ fps.


---


## 6.2 Invalidation is Precise


The snapshot system records **exactly which RecomposeScope read which StateObject**. When state changes, only the scopes that read it are invalidated.


```kotlin
@Composable fun Parent() {
    val a = remember { mutableStateOf(0) }
    val b = remember { mutableStateOf(0) }
    Child1(a.value)   // reads a → invalidated when a changes
    Child2(b.value)   // reads b → invalidated when b changes
    // Changing a does NOT invalidate Child2
}
```


This is **scope-level invalidation** — not component-level or tree-level.


---


## 6.3 Skippable Composables


A composable is **skippable** if the compiler can prove it will produce the same output given the same inputs. For a composable to be skippable:

- All parameters must be **stable types**
- The composable must not have `@NonRestartableComposable`

When the runtime re-enters a skippable composable scope:


```kotlin
// Generated skip logic (simplified)
if ($dirty and CHANGED_MASK == SAME_MASK && $composer.skipping) {
    $composer.skipToGroupEnd()  // skip! don’t execute body
} else {
    // execute composable body
}
```


`skipToGroupEnd()` moves the slot reader past all slots of this group without executing any composable code inside.


---


## 6.4 Stability


Stability is the compiler’s guarantee that a value won’t change in a way Compose can’t detect.


**Stable types** that enable skipping:


```kotlin
@Immutable data class Color(val red: Int, val green: Int, val blue: Int)
// All vals, all stable types → @Immutable guarantees no change ever

@Stable class Counter(val count: State<Int>)
// Holds State → changes are observable via snapshot system → @Stable
```


**Unstable types** that force recomposition:


```kotlin
data class User(var name: String)  // var → unstable
class Wrapper(val list: List<Int>) // List is mutable interface → unstable
```


---


## 6.5 Making Unstable Types Stable


Options to stabilize types from external modules or with mutable members:


**Option 1:** **`@Immutable`** **annotation**


```kotlin
@Immutable
data class UiState(val items: List<Item>) // compiler trusts this is immutable
```


**Option 2:** **`@Stable`** **annotation**


```kotlin
@Stable
class AppConfig(private val _theme: MutableState<Theme>) {
    val theme: Theme get() = _theme.value
}
```


**Option 3: Use** **`ImmutableList`** **from** **`kotlinx-collections-immutable`**


```kotlin
implementation("org.jetbrains.kotlinx:kotlinx-collections-immutable:0.3.7")

@Composable fun List(items: ImmutableList<Item>) { ... } // stable!
```


**Option 4: Compose Compiler** **`stabilityConfigurationPath`**


```kotlin
// compose_compiler_config.conf
com.google.gson.Gson  // tell compiler to treat Gson as stable
```


---


## 6.6 The $dirty Bitmask and Comparison Propagation


The `$dirty` bitmask carries information about each parameter:


```javascript
Bits 0-1: parameter 0 status
Bits 2-3: parameter 1 status
...
```


Values:

- `0b00` (Unknown): Must call `equals()` to check
- `0b01` (Same): Definitely not changed, no check needed
- `0b10` (Different): Definitely changed, must recompose

The parent sets these bits when calling a child. If a parent **knows** a value didn’t change (because its own `$dirty` shows it’s the same), it propagates `Same` to the child — the child skips the `equals()` call entirely.


---


## 6.7 Structural Equality vs Reference Equality


The comparison used in the `$dirty` check depends on the type:

- For **non-stable types**: reference equality (`===`)
- For **stable types**: structural equality (`==` / `equals()`)
- For **primitive types**: direct value comparison

This is why stability matters: without it, Compose falls back to reference equality, which fails for data class copies:


```kotlin
val user1 = User("Ashu")
val user2 = User("Ashu")
user1 === user2  // false! Different objects → triggers recomposition
user1 == user2   // true (if @Stable) → skips recomposition
```


---


## 6.8 Compose Compiler Metrics


Enable compiler metrics to see which composables are skippable vs non-skippable:


```kotlin
// build.gradle.kts
android {
    kotlinOptions {
        freeCompilerArgs += listOf(
            "-P", "plugin:androidx.compose.compiler.plugins.kotlin:metricsDestination=${project.buildDir}/compose_metrics",
            "-P", "plugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=${project.buildDir}/compose_reports"
        )
    }
}
```


Output includes:

- `*_composables.txt`: Which functions are skippable/restartable
- `*_classes.txt`: Which classes are stable/unstable
- `*_module.json`: Module-level stability summary

---


## 6.9 Remember as a Recomposition Optimization


`remember {}` prevents re-computing expensive values on every recomposition:


```kotlin
// ❌ Recomputed every recompose
@Composable fun Bad(items: List<Item>) {
    val sorted = items.sortedBy { it.name } // O(n log n) on every frame!
}

// ✅ Computed once, cached until items changes
@Composable fun Good(items: List<Item>) {
    val sorted = remember(items) { items.sortedBy { it.name } }
}
```


---


## 6.10 derivedStateOf — Derived Computation Memoization


`derivedStateOf {}` creates a state that only changes when its **computed result** changes, not whenever its inputs change:


```kotlin
val scrollState = rememberLazyListState()

// Without derivedStateOf: recomposes on every scroll pixel
val showFab = scrollState.firstVisibleItemIndex > 0

// With derivedStateOf: recomposes only when showFab changes (true↔false)
val showFab by remember {
    derivedStateOf { scrollState.firstVisibleItemIndex > 0 }
}
```


Internally, `derivedStateOf` creates a `DerivedState` that:

1. Reads its inputs inside a snapshot
2. Caches the result
3. Only marks dependents invalid when the cached result changes value

---


## 6.11 Key Blocks and Movable Content


The `key {}` composable forces a specific identity onto a composable group, overriding positional memoization:


```kotlin
for (item in items) {
    key(item.id) {  // identity = item.id, not list position
        ItemCard(item)
    }
}
```


Without `key`: if item at position 0 changes, the composable at position 0 recomposes even if it’s now a different item.


With `key`: if an item moves from position 2 to position 0, Compose **moves** the existing composable group rather than destroying/recreating it, preserving all its `remember {}` state.


---


## 6.12 Recomposition Scope Granularity


Compose creates recompose scopes at `startRestartGroup` boundaries — one per `@Composable` function. But the **granularity of invalidation** can be made finer with lambdas:


```kotlin
@Composable fun Parent() {
    val count by remember { mutableStateOf(0) }

    // Entire Parent recomposes when count changes
    Text("$count")
}

// Better: defer read into a lambda so only the lambda recomposes
@Composable fun Parent() {
    val count by remember { mutableStateOf(0) }
    // If Text accepted a () -> String, only the lambda's scope would invalidate
    // This pattern is used by Compose animation internally
}
```


This technique ("lambda state deferral") is used in animations where state reads are moved into drawing phases to avoid layout recompositions.

