---
source: notion
title: "🧠 Jetpack Compose Internals — Complete Deep Dive"
slug: "jetpack-compose-internals-complete-deep-dive"
notionId: "38eda883bddd8103a17de1ddcca965c6"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: null
children: ["chapter-1-composable-functions","chapter-2-the-compose-compiler","chapter-3-the-compose-runtime","chapter-4-compose-ui","chapter-5-the-state-snapshot-system","chapter-6-smart-recomposition","chapter-7-effects-and-effect-handlers","chapter-8-the-composable-lifecycle","chapter-9-advanced-compose-use-cases"]
order: 2
icon: "🧠"
cover: null
category: "mobile"
---
> A comprehensive reference covering every internal mechanism of Jetpack Compose — from compiler plugins to runtime slot tables, snapshot state, recomposition, and beyond.

---


## 📚 Table of Contents


| # | Chapter                   | Topics                                         |
| - | ------------------------- | ---------------------------------------------- |
| 1 | Composable Functions      | Nature, properties, types, memoization         |
| 2 | The Compose Compiler      | Plugin, IR lowering, code generation           |
| 3 | The Compose Runtime       | Slot table, Composer, Recomposer               |
| 4 | Compose UI                | LayoutNode, modifiers, drawing, semantics      |
| 5 | State Snapshot System     | MVCC, snapshots, conflict merging              |
| 6 | Smart Recomposition       | Stability, skipping, diffing                   |
| 7 | Effects & Effect Handlers | Side effects, LaunchedEffect, DisposableEffect |
| 8 | Composable Lifecycle      | Enter, leave, recompose lifecycle              |
| 9 | Advanced Use Cases        | Runtime vs UI, vectors, DOM, browser           |


---

> 💡 **How to use this wiki:** Each chapter is a sub-page with fully detailed explanations, diagrams, and code examples. Read sequentially for a full mental model, or jump to any chapter as a reference.

## Chapter 1 — Composable Functions
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


## Chapter 2 — The Compose Compiler
> The Compose compiler is a Kotlin compiler plugin that transforms @Composable code before it ever reaches the runtime. Understanding it reveals why Compose behaves the way it does.

---


## 2.1 A Kotlin Compiler Plugin


The Compose compiler is not a separate tool — it is a **Kotlin compiler plugin** that hooks into the standard Kotlin compilation pipeline. It operates in two phases:

1. **Analysis phase**: Static checks, diagnostics, type inference assistance
2. **IR (Intermediate Representation) lowering phase**: Code generation and transformation

The plugin is applied via Gradle:


```kotlin
plugins {
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.0"
}
```


In Kotlin 2.0+, Compose compiler is decoupled from the Kotlin version and versioned independently.


---


## 2.2 Compose Annotations


The compiler recognizes and processes these key annotations:


| Annotation                  | Purpose                                                              |
| --------------------------- | -------------------------------------------------------------------- |
| `@Composable`               | Marks a function as composable, triggers all transformations         |
| `@Stable`                   | Tells compiler the type won’t change unexpectedly (enables skipping) |
| `@Immutable`                | Stronger than `@Stable`: all public properties are immutable         |
| `@StableMarker`             | Meta-annotation used to define custom stability annotations          |
| `@NoLiveLiterals`           | Opts a file out of live literals transformation                      |
| `@ComposeCompilerApi`       | Internal API marker                                                  |
| `@InternalComposeApi`       | Internal runtime API                                                 |
| `@DisallowComposableCalls`  | Prevents composable calls inside a lambda                            |
| `@ReadOnlyComposable`       | Composable that only reads from CompositionLocals, no writes         |
| `@NonRestartableComposable` | Skips restart lambda generation (optimization for tiny composables)  |
| `@ExplicitGroupsComposable` | Opt out of automatic group generation                                |


---


## 2.3 Registering Compiler Extensions


The plugin registers extensions into the Kotlin compiler pipeline:


```javascript
ComposeComponentRegistrar
  ├─ StorageComponentContainerContributor  → registers type checkers
  ├─ DiagnosticSuppressor                  → suppresses false positives
  ├─ TypeResolutionInterceptor             → helps infer composable lambda types
  ├─ DescriptorSerializerPlugin            → persists metadata to .class files
  └─ IrGenerationExtension                 → performs IR lowering / code generation
```


Each extension hooks into a different phase of the K1/K2 compiler. The IR extension is the most significant — this is where the actual code transformation happens.


---


## 2.4 Static Analysis and Static Checkers


Before code generation, the compiler runs **static analysis** to catch misuse early:

- Detecting composable calls outside composable context
- Detecting invalid use of `@Composable` on property getters with side effects
- Detecting missing `@Composable` annotations on lambdas that call composables
- Detecting `@Composable` on suspend functions (not allowed)

These are surfaced as **compile-time errors**, not runtime exceptions — one of Compose’s major safety wins.


---


## 2.5 Call, Type, and Declaration Checks


Three distinct checker categories:


**Call checks**: Validates every call site where a composable is invoked.

- Ensures caller is also composable
- Checks that lambda arguments annotated `@DisallowComposableCalls` don’t contain composable calls

**Type checks**: Validates composable types in type positions.

- `@Composable () -> Unit` and `() -> Unit` are different types — not assignable to each other
- Checks for illegal `@Composable` on override with incompatible parent type

**Declaration checks**: Validates the definition of composable functions.

- `@Composable` on `main()` is illegal
- `@Composable` on `suspend` functions is illegal
- Abstract composable functions must be in abstract classes or interfaces

---


## 2.6 Diagnostic Suppression


The `DiagnosticSuppressor` prevents Kotlin’s built-in checkers from firing false positives on composable code. For example:

- Kotlin warns about "unused" returns, but composables return `Unit` by design
- Kotlin warns about certain unreachable code patterns that Compose uses intentionally in control flow groups

Compose suppresses these to keep the IDE experience clean.


---


## 2.7 Kotlin and Runtime Version Checks


At compile time, the Compose compiler **verifies compatibility** between:

- The Compose compiler plugin version
- The Compose runtime version on the classpath
- The Kotlin compiler version

If they’re mismatched, compilation emits a warning or error. This is why Compose has a strict version matrix — the compiler emits bytecode that assumes specific runtime APIs are present.


---


## 2.8 Code Generation (IR) and Lowering


The most important phase. The compiler traverses the IR tree and **lowers** composable functions into their transformed equivalents. “Lowering” means transforming high-level IR into lower-level IR closer to actual bytecode.


Transformations applied to every `@Composable` function:

1. **Inject** **`Composer`** **parameter**: Hidden `$composer: Composer` param added
2. **Inject** **`$changed`** **parameter**: Bitmask for comparison propagation
3. **Inject** **`$default`** **parameter**: For default argument handling
4. **Wrap body in groups**: `startRestartGroup` / `endRestartGroup` calls
5. **Generate restart lambda**: Enables re-execution during recomposition
6. **Wrap** **`remember {}`** **calls**: Enables caching in slot table

Before lowering:


```kotlin
@Composable fun Greeting(name: String) {
    Text("Hello, $name")
}
```


After lowering (conceptual, not exact bytecode):


```kotlin
fun Greeting(name: String, $composer: Composer, $changed: Int) {
    $composer.startRestartGroup(KEY)
    val $dirty = $changed
    if ($changed and 0b110 == 0) {
        $dirty = $dirty or if ($composer.changed(name)) 0b100 else 0b010
    }
    if ($dirty and 0b011 != 0b010 || !$composer.skipping) {
        Text("Hello, $name", $composer, 0)
    } else {
        $composer.skipToGroupEnd()
    }
    $composer.endRestartGroup()?.updateScope { nc, nc2 ->
        Greeting(name, nc, $changed or 0b001)
    }
}
```


---


## 2.9 Inferring Class Stability


**Stability** is the compiler’s assessment of whether a type’s public properties will change over time in a way Compose can detect.


**Stable** types:

- All primitive types (`Int`, `String`, `Boolean`, etc.)
- All `@Immutable`-annotated classes
- All `@Stable`-annotated classes
- Classes where all public properties are stable and `val`
- Functional types `() -> T` if `T` is stable

**Unstable** types (cause recomposition even if value didn’t change):

- Classes with `var` properties
- Classes with unstable property types
- `List`, `Map`, `Set` (mutable by default in Kotlin) — use `ImmutableList` from `kotlinx-collections-immutable`
- Classes from external modules (compiler can’t inspect)

```kotlin
// ❌ Unstable — has var property
data class User(var name: String)

// ✅ Stable — all val, all stable types
@Immutable
data class User(val name: String, val age: Int)
```


Stability determines whether the compiler emits **skip logic** for a composable. Unstable parameters always force recomposition.


---


## 2.10 Enabling Live Literals


**Live literals** is a compiler feature for tooling (Compose Preview, Live Edit) that replaces constant values in composables with references to a state holder:


```kotlin
// Source
Text("Hello")

// With live literals transform
Text(LiveLiterals.`getString-1`())
```


This allows Android Studio to inject updated values at runtime without a full recompilation — enabling near-instant preview updates. Controlled by a compiler flag; disabled in release builds.


---


## 2.11 Compose Lambda Memoization


Every time a composable recomposes, lambdas defined inside it would be recreated as new objects — breaking the stability contract and forcing child recompositions.


The compiler automatically wraps lambdas in `remember {}` calls when it can prove they’re stable:


```kotlin
// Source
@Composable fun MyComp(onClick: () -> Unit) {
    Button(onClick = { onClick() }) // inner lambda
}

// Compiler wraps the inner lambda
@Composable fun MyComp(onClick: () -> Unit) {
    val remembered = remember(onClick) { { onClick() } }
    Button(onClick = remembered)
}
```


This prevents unnecessary recompositions of `Button` caused by lambda identity changes.


---


## 2.12 Injecting the Composer


The `Composer` parameter injection is the foundational transformation. Every `@Composable` function receives:


```kotlin
fun MyComposable(
    // original params...
    $composer: Composer,     // injected
    $changed: Int,           // injected
    // $default: Int         // injected if has default params
)
```


At every call site, the compiler passes the current `$composer` down:


```kotlin
Text("Hello", $composer, 0)  // $composer forwarded
```


This is invisible to developers but is the mechanism that makes the entire runtime work — the `Composer` is a thread-local-like context that flows through the entire composable tree.


---


## 2.13 Comparison Propagation


The `$changed` bitmask carries information about which parameters have changed since the last composition. Each parameter gets 2 bits:


| Bits | Meaning                                   |
| ---- | ----------------------------------------- |
| `00` | Unknown — must check                      |
| `01` | Same as last time — can skip check        |
| `10` | Different from last time — must recompose |


The caller sets these bits based on what it knows. This allows the compiler to **propagate certainty** down the call tree — if the parent knows a value hasn’t changed, it can tell the child, and the child can skip the comparison entirely.


This is a major performance optimization: the `$changed` mechanism eliminates redundant `equals()` calls deep in the tree.


---


## 2.14 Default Parameters


Kotlin default parameters interact with Compose’s `$changed` system. The compiler injects a `$default` bitmask that tracks which parameters were explicitly provided vs. used their defaults:


```kotlin
@Composable fun Button(
    onClick: () -> Unit,
    enabled: Boolean = true,   // has default
    $composer: Composer,
    $changed: Int,
    $default: Int              // bit 0 = onClick provided, bit 1 = enabled provided
)
```


During recomposition, if a defaulted parameter wasn’t explicitly provided, its `$default` bit is set — and the runtime knows it will always have the same value (the default), so it can skip the comparison.


---


## 2.15 Control Flow Group Generation


The slot table is a linear structure, but composable code has branching control flow (`if`, `when`, `for`). The compiler generates **groups** to handle this:


```kotlin
@Composable fun Conditional(show: Boolean) {
    $composer.startRestartGroup(KEY_CONDITIONAL)
    if (show) {
        $composer.startGroup(KEY_IF_TRUE)  // marks this branch
        Text("Visible")
        $composer.endGroup()
    } else {
        $composer.startGroup(KEY_IF_FALSE)
        $composer.endGroup()
    }
    $composer.endRestartGroup()
}
```


Groups ensure the slot table stays consistent even when branches change between recompositions. When a branch changes, the old group is removed and the new group is inserted.


---


## 2.16 Klib and Decoy Generation


For **Kotlin Multiplatform** and **Compose Multiplatform**, composable functions are compiled to `.klib` files. However, other modules consuming the klib need to be able to call the composable without re-running the full compiler plugin.


**Decoy generation** solves this: the compiler generates **stub functions** (decoys) with the original signature that delegate to the transformed version:


```kotlin
// Original (in klib metadata)
fun Greeting(name: String)  // decoy — original signature

// Actual transformed (in klib IR)
fun Greeting(name: String, $composer: Composer, $changed: Int)
```


Consumers see the decoy and call it normally; the decoy forwards to the real implementation with the injected Composer.


## Chapter 3 — The Compose Runtime
> The runtime is the engine of Compose. It manages the slot table, tracks composition state, coordinates recomposition, and applies changes to the node tree.

---


## 3.1 The Slot Table and the List of Changes


The Compose runtime’s core data structure is the **SlotTable** — a flat, gap-buffered array that stores everything emitted during composition:

- Composable call groups (with keys)
- State values (from `remember {}`)
- CompositionLocals
- Source information
- Node references

The `SlotTable` is not a tree — it’s a **linear array** with embedded structure encoded via group markers. Groups have a start marker (with a key and size) and contain slots for their children.


```javascript
SlotTable (linear array):
[ Group(Greeting, size=5) | slot: name="Ashu" | Group(Text, size=2) | slot: "Hello Ashu" | ... ]
```


Alongside the SlotTable, the runtime maintains a **list of changes** — a list of lambdas (operations) to apply after composition completes. Composition is **two-phase**: first read/diff the slot table, then apply changes atomically.


---


## 3.2 Modeling the Changes


The changes list contains **`Change`** **lambdas** — functions that take an `Applier` and a `SlotWriter` and perform mutations. Examples:

- `insertNode(node)` — insert a new UI node
- `removeNode(index, count)` — remove nodes
- `moveNode(from, to, count)` — reorder nodes
- `updateValue(value)` — update a slot value
- `sideEffect { ... }` — schedule a side effect

By deferring all mutations to the changes list, composition can be **interrupted** (in concurrent recomposition) without partial state corruption. Changes are only applied once composition is complete and consistent.


---


## 3.3 The Composer and How It Is Fed


The `Composer` is the central object that:

- Maintains a **SlotReader** (reading the previous composition)
- Builds a **SlotWriter** (writing the new composition)
- Accumulates the **changes list**
- Tracks the current position in the slot table

```javascript
Composer
  ├─ SlotReader (reads previous slots — for comparison)
  ├─ pending changes list (mutations to apply)
  ├─ current Group cursor
  └─ Recompose scope tracking
```


Composable functions are **fed** to the Composer when `Composition.setContent {}` is called, or when a recompose scope is re-executed. The Composer tracks which groups are entered/exited as composable functions run.


---


## 3.4 Writing and Reading Groups


Every `@Composable` call site is wrapped in a **group**. Groups are the unit of identity in the slot table.


**Starting a group:**


```kotlin
$composer.startRestartGroup(key)  // for restartable composables
$composer.startReplaceableGroup(key)  // for if/when branches
$composer.startMovableGroup(key, dataKey)  // for key {} blocks
```


**Ending a group:**


```kotlin
$composer.endRestartGroup()
$composer.endReplaceableGroup()
$composer.endMovableGroup()
```


During **initial composition**: groups are written into the SlotTable.


During **recomposition**: groups are read and compared. If the key matches and inputs are stable/unchanged, the group is **skipped** (the composable is not re-executed).


---


## 3.5 Remembering Values


`remember {}` is how composables cache values across recompositions. It stores values in the slot table at the current position.


```kotlin
val count = remember { mutableStateOf(0) }
```


Under the hood:


```kotlin
val count = $composer.cache(false) { mutableStateOf(0) }
```

- On **first composition**: the lambda is called, the value is stored in the slot
- On **recomposition**: the stored value is read from the slot (lambda not called)
- When `key` parameters change: the slot is invalidated and the lambda re-runs

`rememberSaveable` additionally serializes values to `SavedStateHandle` for config change survival.


---


## 3.6 Recompose Scopes for Recomposition


A **RecomposeScope** is a wrapper around a composable function’s restart lambda. It is created by `startRestartGroup` and acts as the **observer** of state reads.


When state (a `StateObject`) is read inside a composable:

1. The snapshot system records which `RecomposeScope` is currently active
2. When that state changes, the snapshot system **notifies** those scopes
3. The `Recomposer` schedules those scopes for re-execution on the next frame

This is how Compose achieves **precise invalidation** — only composables that actually read changed state are re-executed, not the whole tree.


---


## 3.7 Side Effects in the Composer


When a composable calls an effect handler (`LaunchedEffect`, `DisposableEffect`), the Composer doesn’t run it immediately. Instead, it **schedules** it:

- `SideEffect` callbacks are added to the changes list and run after composition applies
- `LaunchedEffect` coroutines are launched after the composition is committed
- `DisposableEffect` cleanups are run when the composable leaves composition (the group is removed from the slot table)

This ensures effects run **after** the UI tree is in a consistent state, never during a partially-applied composition.


---


## 3.8 Storing CompositionLocals & Source Info


**CompositionLocals** are stored in the slot table as special provider values. When a `CompositionLocalProvider` is entered, it writes a provider map into its group’s slots. When a composable reads a local via `LocalXxx.current`, the Composer walks up the slot table to find the nearest provider.


**Source information** (file name, line, column of each composable call) is optionally stored in the slot table for tooling use (Compose Tooling, Layout Inspector). This is stripped in release builds.


---


## 3.9 Linking Compositions as a Tree


Sometimes a Composition needs to embed another independent Composition — for example, `Dialog`, `Popup`, and `SubcomposeLayout` all create sub-compositions.


Sub-compositions are **linked** to their parent via a `CompositionContext`. This ensures:

- CompositionLocals flow from parent to child composition
- The child composition is invalidated when the parent recomposes
- Disposing the parent disposes all children

The link is established via `rememberCompositionContext()` in the parent.


---


## 3.10 The Current State Snapshot


Every composition runs inside a **Snapshot** (see Chapter 5 for full detail). The snapshot provides an isolated, consistent view of all `StateObject` values at the moment composition started.


This means:

- State reads during composition see a **point-in-time snapshot**, not live mutable state
- Concurrent writes from other threads don’t corrupt composition mid-run
- Snapshot observation hooks record which states were read (for recomposition tracking)

---


## 3.11 Navigating the Tree Nodes


As composable functions run, they **emit nodes** into the tree via the `Applier`. The Composer maintains an `insertTable` (for new nodes during initial composition) and uses the `Applier` to navigate:


```kotlin
$composer.createNode { LayoutNode() }  // emit a new node
$composer.useNode()                     // enter existing node
// compose children...
$composer.endNode()
```


The `Applier` is the bridge between the abstract Composer and the concrete node tree (e.g., `LayoutNode` for UI, or a custom tree for other Compose targets).


---


## 3.12 Performance When Building the Tree


The slot table uses a **gap buffer** data structure — an array with a movable "gap" (empty space) that sits at the current insertion point. Insertions and deletions at the current position are O(1); repositioning the gap is O(n) but rare.


This matches Compose’s access pattern: composition usually proceeds **forward** through the tree, making sequential reads/writes fast. Random-access mutations are rare and handled by group moves.


---


## 3.13 Applying the Changes


After the composition lambda completes, `Composition.applyChanges()` is called. This iterates the changes list and executes each change lambda:


```javascript
for change in changesList:
    change(applier, slotWriter, rememberManager)
```


`RememberManager` handles the lifecycle of remembered values: it calls `onForgotten()` on values being removed and `onRemembered()` on values being added (for `RememberObserver` implementations).


---


## 3.14 Attaching and Drawing the Nodes


When a node is inserted via the changes list, the `Applier.insertTopDown()` or `insertBottomUp()` method is called. For `LayoutNode` trees, nodes are attached bottom-up (children before parents) to ensure children are measured before parents lay them out.


After attachment, the node is **dirty** — it needs measurement and drawing. The `Owner` (the `AndroidComposeView`) schedules a layout pass and draw pass via the Android `View` machinery.


---


## 3.15 Composition


A `Composition` is the object that holds together:

- The composable content (the root composable lambda)
- The `Composer` instance
- The `Applier` (defines the node tree type)
- The `CompositionContext` (link to parent)

```kotlin
val composition = Composition(
    applier = MyApplier(rootNode),
    parent = recomposer
)
composition.setContent { MyRoot() }
```


---


## 3.16 Creating a Composition


For Compose UI, the Composition is created by `setContent` on `ComponentActivity` or `ComposeView`. For custom uses:


```kotlin
val recomposer = Recomposer(Dispatchers.Main)
val composition = Composition(
    applier = VectorApplier(rootNode),
    parent = recomposer
)
composition.setContent { VectorContent() }
```


The `Recomposer` drives recomposition scheduling. One `Recomposer` can manage many `Composition` instances.


---


## 3.17 The Initial Composition Process


When `setContent {}` is called for the first time:


```javascript
setContent(content)
  ↓
Composer.composeContent(content)
  ↓
composer.startGroup(ROOT_KEY)
  Run content() lambda (all composables execute)
  All groups written to SlotTable
  All nodes accumulated in changes list
composer.endGroup()
  ↓
Composition.applyChanges()
  ↓
All LayoutNodes inserted into tree
  ↓
Owner schedules measure/layout/draw
```


---


## 3.18 Applying Changes After Composition


Changes are applied in order. The `applyChanges()` call:

1. Calls `RememberManager.remembering()` for new `RememberObserver` values
2. Inserts, removes, moves nodes via the `Applier`
3. Calls `RememberManager.forgetting()` for removed values
4. Runs `SideEffect` callbacks
5. Calls `snapshotManager.apply()` to commit state changes

---


## 3.19 The Recomposer


The `Recomposer` is the **scheduler** for recomposition. It:

- Receives invalidation signals from the snapshot system
- Schedules recomposition on the correct dispatcher (usually `Dispatchers.Main`)
- Coordinates frame timing with the Choreographer (Android)
- Supports **concurrent recomposition** on a background dispatcher

```kotlin
// Simplified Recomposer loop
while (true) {
    awaitFrame()           // wait for next Choreographer frame
    val invalid = drainInvalidations()
    for (scope in invalid) {
        scope.recompose()  // re-run the composable
    }
    applyChanges()         // apply accumulated changes
}
```


---


## 3.20 Recomposition Process


When a `RecomposeScope` is invalidated:


```javascript
State changes in snapshot
  ↓
Snapshot notifies registered read observers
  ↓
Recomposer.invalidate(recomposeScope)
  ↓
Next frame: Recomposer.performRecompose()
  ↓
Composer reads slot table from scope’s group position
  ↓
Re-runs composable lambda
  ↓
Diffs against existing slots:
  - Unchanged groups → skipped
  - Changed groups → updated
  - New groups → inserted
  - Removed groups → deleted
  ↓
applyChanges() → tree updated
```


---


## 3.21 Concurrent Recomposition


In **concurrent recomposition** (Android API 28+ with `ComposeView`), recomposition runs on a **background thread** while the UI thread renders the previous frame:


```javascript
Background thread:  Recompose (read-only, builds change list)
UI thread:          Render previous frame
  ↓
UI thread:          Apply changes from background recomposition
```


This is safe because:

- Composition is **read-only** during the recompose phase (only reads the slot table)
- Mutations are deferred to the changes list
- The snapshot system provides isolation — background composition sees a snapshot, not live state
- `applyChanges()` is called on the UI thread after the background recompose completes

Concurrent recomposition can be **interrupted** if higher-priority work arrives — the partial changes list is discarded and recomposition restarts.


## Chapter 4 — Compose UI
> Compose UI is the layer that bridges the abstract Compose runtime (which knows nothing about UI) with Android’s concrete rendering system. It provides LayoutNode, modifiers, measure/layout, drawing, and semantics.

---


## 4.1 Integrating UI with the Compose Runtime


The Compose **runtime** is UI-agnostic — it only knows about slot tables, groups, and an abstract `Applier<N>`. Compose **UI** is one concrete implementation of that abstraction.


Compose UI provides:

- `LayoutNode` as the node type `N`
- `UiApplier` as the `Applier<LayoutNode>` implementation
- `AndroidComposeView` as the `Owner` (the bridge to the Android View system)

```javascript
Android View system
  └─ AndroidComposeView (extends View)
       └─ Owner (Compose UI interface)
            └─ Composition
                 ├─ Composer
                 └─ UiApplier → operates on LayoutNode tree
```


---


## 4.2 Mapping Scheduled Changes to Actual Changes to the Tree


When the Compose runtime calls `applyChanges()`, the changes list contains abstract operations. The `UiApplier` maps these to mutations of the `LayoutNode` tree:


| Runtime Change                | UiApplier Action                |
| ----------------------------- | ------------------------------- |
| `insertTopDown(index, node)`  | `parent.insertAt(index, node)`  |
| `insertBottomUp(index, node)` | (bottom-up alternative)         |
| `remove(index, count)`        | `parent.removeAt(index, count)` |
| `move(from, to, count)`       | `parent.move(from, to, count)`  |
| `clear()`                     | `parent.removeAll()`            |


After these mutations, `LayoutNode` marks itself dirty and requests a remeasure from the `Owner`.


---


## 4.3 Composition from the Point of View of Compose UI


From Compose UI’s perspective, composition produces a `LayoutNode` tree. The root `LayoutNode` is owned by `AndroidComposeView`, and child `LayoutNode`s are attached to it during `applyChanges()`.


Every `Layout {}` composable call ultimately emits a `LayoutNode` via:


```kotlin
$composer.createNode { LayoutNode() }
// configure the node via its modifier chain
```


---


## 4.4 Subcomposition from the Point of View of Compose UI


**Subcomposition** is a composition that is nested inside another, but has an **independent lifecycle**. Used by `SubcomposeLayout`, `LazyColumn`, `Dialog`, `Popup`.


Subcomposition enables **measuring children before they’re fully composed** — for example, `LazyColumn` only composes items as they scroll into view. Without subcomposition, all items would be composed upfront regardless of visibility.


```kotlin
SubcomposeLayout { constraints ->
    val measurables = subcompose("header") { Header() }
    val headerPlaceable = measurables[0].measure(constraints)
    // use header size to determine body constraints
    layout(constraints.maxWidth, constraints.maxHeight) {
        headerPlaceable.placeRelative(0, 0)
    }
}
```


---


## 4.5 Reflecting Changes in the UI


After `applyChanges()` mutates the `LayoutNode` tree:

1. `LayoutNode.markLayoutPending()` is called on dirty nodes
2. `AndroidComposeView` calls `requestLayout()` / `invalidate()` on itself (as a View)
3. Android’s `View` system triggers measure and draw on the next frame
4. `AndroidComposeView.onMeasure()` → Compose measure pass
5. `AndroidComposeView.onDraw()` → Compose draw pass

---


## 4.6 Different Types of Appliers


Because the Compose runtime is node-type-agnostic, different `Applier` implementations exist:


| Applier           | Node Type    | Use Case                              |
| ----------------- | ------------ | ------------------------------------- |
| `UiApplier`       | `LayoutNode` | Standard Compose UI                   |
| `VectorApplier`   | `VNode`      | Vector graphics (`VectorPainter`)     |
| `AbstractApplier` | Custom       | Custom Compose targets (web, desktop) |


You can build a custom Compose target by providing your own node type and `Applier`.


---


## 4.7 Materializing a New LayoutNode


When a composable like `Box {}` runs, it calls the `Layout` composable, which calls `ReusableComposeNode`:


```kotlin
@Composable
inline fun <T : Any> ReusableComposeNode(
    noinline factory: () -> T,
    update: Updater<T>.() -> Unit
) {
    $composer.startReusableNode()
    if ($composer.inserting) {
        $composer.createNode(factory)      // new LayoutNode
    } else {
        $composer.useNode()                // reuse existing
    }
    Updater<T>($composer).update()         // apply modifier/measure updates
    $composer.endNode()
}
```


The `factory` lambda creates the `LayoutNode`. The `update` block configures its `measurePolicy` and modifiers.


---


## 4.8 Materializing a Change to Remove Nodes


When a composable group is no longer emitted (e.g., an `if` branch switches), the runtime detects the missing group during recomposition and adds a **remove change** to the list:


```kotlin
// Change: remove 1 node at index 2
{ applier, _, _ -> applier.remove(2, 1) }
```


The `UiApplier` calls `parent.removeAt(2, 1)`, which detaches the `LayoutNode` from the tree and triggers a layout pass.


---


## 4.9 Materializing a Change to Move Nodes


Movable groups (created by `key {}`) enable the runtime to **move** subtrees instead of removing and reinserting them. This is used by `LazyColumn` to reorder items efficiently:


```kotlin
{ applier, _, _ -> applier.move(from = 3, to = 1, count = 1) }
```


Moving preserves the `LayoutNode`’s identity and any state stored in its `remember {}` slots.


---


## 4.10 Materializing a Change to Clear All Nodes


When a composition is disposed, all its nodes must be removed. The `clear()` change is applied:


```kotlin
{ applier, _, _ -> applier.clear() }
```


`UiApplier.clear()` removes all children from the root `LayoutNode`, releasing them for garbage collection.


---


## 4.11 setContent as the Integration Point


`setContent {}` is where Android’s View world meets the Compose world:


```kotlin
// ComponentActivity.setContent
fun ComponentActivity.setContent(content: @Composable () -> Unit) {
    val existingComposeView = window.decorView
        .findViewById<ViewGroup>(android.R.id.content)
        .getChildAt(0) as? ComposeView

    if (existingComposeView != null) {
        existingComposeView.setContent(content)
    } else {
        ComposeView(this).also {
            setContentView(it)
            it.setContent(content)
        }
    }
}
```


`ComposeView.setContent` creates the `Composition` with a `UiApplier` and the `Recomposer`, then calls `composition.setContent(content)` to trigger initial composition.


---


## 4.12 Measuring in Compose UI


Compose uses a **single-pass measurement** model — parents measure children once, children cannot ask to be remeasured by their parent. This is the key difference from Android Views which support multiple measure passes.


Measurement flows:


```javascript
Owner.measure(constraints)
  ↓
Root LayoutNode.measure(constraints)
  ↓
MeasurePolicy.measure(measurables, constraints)
  ↓ [for each child]
Child LayoutNode.measure(childConstraints)
  ↓
Child.placeAt(x, y)
```


---


## 4.13 Measuring Policies


A `MeasurePolicy` defines how a `Layout` node measures its children and itself. Every `Layout` composable provides one:


```kotlin
Layout(
    content = { children() },
    measurePolicy = { measurables, constraints ->
        val placeables = measurables.map { it.measure(constraints) }
        val maxWidth = placeables.maxOf { it.width }
        val totalHeight = placeables.sumOf { it.height }
        layout(maxWidth, totalHeight) {
            var y = 0
            placeables.forEach { placeable ->
                placeable.placeRelative(0, y)
                y += placeable.height
            }
        }
    }
)
```


---


## 4.14 Intrinsic Measurements


**Intrinsic measurements** let a parent ask a child: "what size would you be if given unlimited/zero space?" without fully measuring the child.


```kotlin
val minHeight = child.minIntrinsicHeight(width = constraints.maxWidth)
val maxWidth = child.maxIntrinsicWidth(height = constraints.maxHeight)
```


Intrinsics exist specifically to handle cases where a parent needs sizing information before laying out children — for example, `Row` aligning children by text baseline.


Using intrinsics bypasses the single-pass guarantee, so they should be used sparingly.


---


## 4.15 Layout Constraints


`Constraints` define the allowed size range for a child:


```kotlin
data class Constraints(
    val minWidth: Int,   // 0..maxWidth
    val maxWidth: Int,
    val minHeight: Int,  // 0..maxHeight
    val maxHeight: Int
)
```


Special values: `Constraints.Infinity` for unbounded dimension (e.g., inside a `ScrollRow`).


Constraints flow **top-down** — parents constrain children. Sizes flow **bottom-up** — children report their size to parents.


---


## 4.16 Modeling Modifier Chains


Modifiers form a **linked list** of elements. When you write:


```kotlin
Modifier.padding(16.dp).background(Color.Red).clickable { }
```


This creates: `CombinedModifier(CombinedModifier(padding, background), clickable)`


Each modifier element can implement:

- `LayoutModifier` — wraps measurement/placement
- `DrawModifier` — draws before/after the content
- `PointerInputModifier` — intercepts touch events
- `SemanticsModifier` — contributes to accessibility tree
- `ParentDataModifier` — passes data to parent layout

---


## 4.17 Setting Modifiers to the LayoutNode


Modifiers are applied to a `LayoutNode` via the `Updater` block in `ReusableComposeNode`:


```kotlin
Updater<LayoutNode>(composer).apply {
    set(modifier) { this.modifier = it }
    set(measurePolicy) { this.measurePolicy = it }
}
```


Setting a new modifier chain triggers `LayoutNode.modifier = newModifier`, which rebuilds the node’s modifier-backed wrapper nodes.


---


## 4.18 How LayoutNode Ingests New Modifiers


When `LayoutNode.modifier` is set:

1. The chain is traversed
2. Each modifier element is wrapped in a `LayoutNodeWrapper` (a chain of wrappers)
3. Wrappers intercept measure, draw, and input dispatch calls
4. The node marks itself dirty for re-measure

```javascript
LayoutNode
  └─ ClickableWrapper (intercepts touch)
       └─ BackgroundWrapper (draws background)
            └─ PaddingWrapper (adjusts constraints)
                 └─ inner LayoutNode content
```


---


## 4.19 Drawing the Node Tree


Draw is a **top-down** pass using a `Canvas`. Each `LayoutNode` calls `draw()` on its `LayoutNodeWrapper` chain:


```javascript
LayoutNode.draw(canvas)
  → DrawModifier.draw(canvas, drawContent)
       → Background draws
       → drawContent() → children draw recursively
       → Foreground draws
```


Compose uses **display lists** (Android `RenderNode`) for each `LayoutNode`, allowing individual nodes to be redrawn without redrawing the entire tree.


---


## 4.20 Semantics in Jetpack Compose


Semantics provide accessibility information (for screen readers like TalkBack) and test infrastructure. Each `LayoutNode` can carry a `SemanticsConfiguration`:


```kotlin
Modifier.semantics {
    contentDescription = "User avatar"
    role = Role.Image
    onClick(label = "Open profile") { true }
}
```


The semantics tree mirrors the `LayoutNode` tree but contains only semantically meaningful nodes.


---


## 4.21 Notifying About Semantic Changes


When the semantics tree changes (nodes added, removed, or properties updated), `AndroidComposeView` notifies Android’s accessibility framework via `AccessibilityManager.sendAccessibilityEvent()`.


Compose batches accessibility events to avoid flooding the system during rapid recompositions.


---


## 4.22 Merged and Unmerged Semantic Trees


Compose maintains **two** semantics trees:

- **Unmerged tree**: Every `LayoutNode` with semantics, no merging. Used by Layout Inspector and testing.
- **Merged tree**: Adjacent semantics nodes are merged (e.g., an `Icon` + `Text` inside a `Button` merge into a single accessible node with the button’s role). Used by TalkBack.

```kotlin
// This Column merges its children's semantics
Column(Modifier.semantics(mergeDescendants = true) {}) {
    Icon(Icons.Default.Favorite, contentDescription = null)
    Text("Like")
}
// Merged result: one node with "Like" as contentDescription
```


## Chapter 5 — The State Snapshot System
> The snapshot system is Compose’s concurrency model. It gives every thread an isolated, consistent view of state, enables safe concurrent recomposition, and drives invalidation with surgical precision.

---


## 5.1 What Snapshot State Is


**Snapshot state** is any state wrapped in a Compose `StateObject` — most commonly `mutableStateOf()`, `mutableStateListOf()`, `mutableStateMapOf()`.


Unlike plain Kotlin `var` properties, snapshot state:

- Is **observable**: reads and writes can be intercepted
- Is **isolated**: each snapshot sees its own version of values
- Is **thread-safe**: concurrent reads don’t require locks
- Drives **recomposition**: changes propagate to Compose automatically

```kotlin
val count = mutableStateOf(0)  // StateObject backed by snapshot system
count.value++  // write recorded in current snapshot
```


---


## 5.2 Concurrency Control Systems


The snapshot system is a **concurrency control system** — it manages how concurrent readers and writers interact with shared state.


Traditional approaches and their drawbacks:

- **Locks/Mutex**: Simple but blocks threads, risk of deadlock
- **Copy-on-Write**: Safe but expensive for large structures
- **STM (Software Transactional Memory)**: Elegant but complex, conflict retries

Compose uses **MVCC** (see below) — optimistic, non-blocking, version-based.


---


## 5.3 Multiversion Concurrency Control (MVCC)


**MVCC** is the same technique used by databases like PostgreSQL. The core idea:

> Instead of locking a value during a read, keep **multiple versions** of it. Each reader sees the version that existed when it started. Writers create a new version.

Benefits:

- Readers never block writers
- Writers never block readers
- Each "transaction" (snapshot) sees a consistent point-in-time view
- Conflicts only occur between concurrent **writers** to the same value

---


## 5.4 The Snapshot


A `Snapshot` is a **point-in-time view** of all snapshot state. Every read through a snapshot sees the state as it was when the snapshot was created.


```kotlin
val snapshot = Snapshot.takeSnapshot()
snapshot.enter {
    // reads here see state at snapshot creation time
    // writes here are NOT allowed (read-only snapshot)
    println(count.value) // sees value from snapshot creation
}
snapshot.dispose()
```


Snapshots are cheap to create — they just record the current **snapshot ID**, not copies of all state.


---


## 5.5 The Snapshot Tree


Snapshots form a **tree** of parent–child relationships. Nested snapshots (child snapshots) see a view of state as of their creation, inheriting from their parent.


```javascript
GlobalSnapshot (root)
  ├─ Snapshot A (composition 1)
  ├─ Snapshot B (composition 2)
  └─ MutableSnapshot C
       └─ NestedMutableSnapshot C1
```


This tree structure enables **nested transactions** — a child snapshot can be committed into its parent without affecting the global state until the parent commits.


---


## 5.6 Snapshots and Threading


Every thread in a Compose app has a **current snapshot** context:

- The **main thread** runs inside the `GlobalSnapshot` (live, always-current view)
- Background **recomposition** runs inside a read-only snapshot taken at recompose start
- `LaunchedEffect` coroutines run inside their own snapshot context

This means:

- Composition (on background thread) sees a stable view of state even if the main thread is mutating it
- Main thread mutations don’t corrupt an in-progress background recomposition

---


## 5.7 Observing Reads and Writes


Snapshots support **read and write observers** — callbacks invoked every time a `StateObject` is read or written:


```kotlin
val readObserver: (Any) -> Unit = { stateObject ->
    // track that this recompose scope reads this state
    currentRecomposeScope.recordRead(stateObject)
}

val snapshot = Snapshot.takeSnapshot(readObserver)
```


During composition, the runtime installs a read observer. Any `StateObject` read during composition is recorded, creating the **invalidation map**: state → set of RecomposeScopes that read it.


When state changes, the invalidation map is used to find exactly which scopes need recomposition.


---


## 5.8 MutableSnapshots


A `MutableSnapshot` allows **writes** that are isolated from other snapshots until committed:


```kotlin
val mutable = Snapshot.takeMutableSnapshot(
    readObserver = { ... },
    writeObserver = { ... }
)
mutable.enter {
    count.value = 42  // only visible inside this snapshot
}
mutable.apply()  // commit to parent snapshot
mutable.dispose()
```


If `apply()` is not called, the writes are discarded. This is the mechanism Compose uses when you call `withMutableSnapshot {}` or when the runtime runs effects.


---


## 5.9 GlobalSnapshot and Nested Snapshots


**GlobalSnapshot**: The root snapshot. Everything running on the main thread outside explicit snapshot context reads/writes here. Changes to the `GlobalSnapshot` are immediately visible to everything else on the main thread.


**Nested snapshots**: Created inside another snapshot. Their writes are isolated until committed to the parent. This is how `LaunchedEffect` and background coroutines safely write state without affecting composition mid-run.


---


## 5.10 StateObjects and StateRecords


Every `StateObject` maintains a **linked list of StateRecords** — one record per version:


```javascript
StateObject (mutableStateOf(0))
  └─ StateRecord { value=42, snapshotId=15, next=→ }
       └─ StateRecord { value=0, snapshotId=1, next=null }
```


Each record carries:

- `value`: the state value at this version
- `snapshotId`: which snapshot this version belongs to

When reading a `StateObject`, the snapshot system walks the record list to find the most recent record whose `snapshotId` is visible to the current snapshot.


---


## 5.11 Reading and Writing State


**Reading:**


```kotlin
val current = snapshotState.value
// → finds the StateRecord with highest snapshotId <= current snapshot’s id
// → invokes read observer
```


**Writing:**


```kotlin
snapshotState.value = newValue
// → if current snapshot is mutable:
//     prepend a new StateRecord with the new value and current snapshot id
// → if global snapshot:
//     update directly, notify GlobalSnapshot observers
```


Writes in a mutable snapshot **don’t modify existing records** — they prepend new records. Old records remain visible to existing read-only snapshots.


---


## 5.12 Removing or Reusing Obsolete Records


Over time, old records accumulate. The snapshot system **prunes** records that are no longer visible to any live snapshot:

- A record is obsolete if all live snapshots have a snapshot ID **greater** than its creation ID
- Pruning runs when snapshots are disposed
- This prevents unbounded memory growth from accumulated records

Record reuse: instead of allocating new record objects frequently, the system reuses pruned records from the same `StateObject`.


---


## 5.13 Change Propagation


When a `MutableSnapshot` is applied (committed), it notifies the **GlobalSnapshot manager** of which `StateObject`s were written:


```javascript
MutableSnapshot.apply()
  ↓
GlobalSnapshot.notifyObjectsInitialized()
  ↓
Registered global write observers called
  ↓
Recomposer.invalidate(affectedRecomposeScopes)
  ↓
Next frame: recomposition of affected scopes
```


This is the chain that connects a plain `state.value = x` call to a visual update on screen.


---


## 5.14 Merging Write Conflicts


A **write conflict** occurs when two `MutableSnapshot`s both write to the same `StateObject` before either is committed.


Each `StateObject` provides a `mergeRecords()` function to resolve conflicts:


```kotlin
override fun mergeRecords(
    previous: StateRecord,
    current: StateRecord,
    applied: StateRecord
): StateRecord? {
    // return merged record, or null if merge is impossible
    return if (current.value == previous.value) applied  // other changed it, take theirs
    else if (applied.value == previous.value) current    // we changed it, keep ours
    else null  // both changed — conflict, can’t merge automatically
}
```


If `mergeRecords` returns `null`, the snapshot’s `apply()` call returns `SnapshotApplyResult.Failure` and the caller must handle the conflict (typically by retrying).


For `mutableStateOf`, the default merge: if both snapshots write different values, the **last write wins**.


## Chapter 6 — Smart Recomposition
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


## Chapter 7 — Effects and Effect Handlers
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


## Chapter 8 — The Composable Lifecycle
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


## Chapter 9 — Advanced Compose Use Cases
> The Compose runtime is not tied to Android UI. It’s a general tree-management engine. This chapter explores how it’s applied beyond standard UI.

---


## 9.1 Compose Runtime vs Compose UI


The Compose ecosystem has two distinct layers:


| Layer               | Artifact          | Responsibility                                       |
| ------------------- | ----------------- | ---------------------------------------------------- |
| **Compose Runtime** | `compose-runtime` | Slot table, Composer, Recomposer, Snapshot, Effects  |
| **Compose UI**      | `compose-ui`      | LayoutNode, modifiers, drawing, touch, accessibility |


You can use `compose-runtime` **without** `compose-ui`. The runtime is just a general-purpose reactive tree management system. You provide a node type and an `Applier`, and Compose manages the tree reactively.


This is how Compose is used for:

- Vector graphics
- Managing the DOM in Compose for Web
- Custom render trees (game engines, 3D scenes)
- Server-side rendering

---


## 9.2 Composition of Vector Graphics


`VectorPainter` in Compose UI uses a **separate composition** to build vector image trees. The vector composition:

- Has its own `Composition` instance
- Uses `VectorApplier` (not `UiApplier`)
- Produces a `VNode` tree (vector nodes: groups, paths)

This allows vectors to be defined **declaratively** using composable functions:


```kotlin
val vector = rememberVectorPainter(
    defaultWidth = 24.dp,
    defaultHeight = 24.dp
) { viewportWidth, viewportHeight ->
    // This is a @Composable lambda — using the Compose runtime
    // but producing VNodes, not LayoutNodes
    Group(
        name = "outline",
        translationX = 2f
    ) {
        Path(
            pathData = pathData,
            fill = SolidColor(Color.Black)
        )
    }
}
```


---


## 9.3 Building the Vector Image Tree


The `VectorApplier` manages a tree of `VNode`s:


```kotlin
sealed class VNode {
    class VGroup : VNode() {
        val children = mutableListOf<VNode>()
        var name: String = ""
        var rotation: Float = 0f
    }
    class VPath : VNode() {
        var pathData: List<PathNode> = emptyList()
        var fill: Brush? = null
    }
}
```


`VectorApplier` implements `AbstractApplier<VNode>`, inserting/removing `VNode`s just like `UiApplier` does for `LayoutNode`s.


The `VNode` tree is then rendered to a `Canvas` via `DrawScope.drawIntoCanvas {}` when the `Painter` is asked to draw.


---


## 9.4 Integrating Vector Composition into Compose UI


The vector composition is a **subcomposition** of the main UI composition. It’s linked via `rememberCompositionContext()`:


```javascript
Main Composition (LayoutNode tree)
  └─ Image composable
       └─ VectorPainter (subcomposition)
            └─ VNode tree (vector group/path nodes)
```


When the `Image` composable recomposes, it can pass new parameters to the vector composition, triggering the vector tree to update. The vector composition is disposed when the `Image` leaves composition.


---


## 9.5 Managing the DOM with Compose


**Compose for Web** (Compose HTML) uses the Compose runtime to manage browser DOM nodes as the node type. The `Applier` is a `DomApplier` that calls real browser APIs:


```kotlin
// Compose HTML example
@Composable fun App() {
    Div({
        style { backgroundColor(Color.blue) }
    }) {
        H1 { Text("Hello from Compose HTML") }
        Button(onClick = { window.alert("clicked") }) {
            Text("Click me")
        }
    }
}
```


Under the hood:

- `Div`, `H1`, `Button` are composable functions that emit DOM element nodes
- `DomApplier.insertTopDown()` calls `parentElement.appendChild(childElement)`
- `DomApplier.remove()` calls `element.remove()`
- State changes trigger recomposition, which diffs and patches the DOM

This is exactly the same model as React’s virtual DOM, but implemented with the Compose runtime instead.


---


## 9.6 Standalone Composition in the Browser


For Compose Multiplatform (Web with Kotlin/Wasm), a standalone `Composition` is created without any Android context:


```kotlin
// Kotlin/Wasm + Compose Multiplatform
fun main() {
    val body = document.body ?: error("No body")
    renderComposable(rootElementId = "root") {
        App()  // composable tree rendered into the DOM
    }
}
```


`renderComposable` internally:

1. Creates a `Recomposer` backed by a `MonotonicFrameClock` tied to `requestAnimationFrame`
2. Creates a `Composition` with a DOM-targeting `Applier`
3. Calls `setContent { App() }`
4. Runs the Recomposer coroutine loop

State changes drive recomposition via the same snapshot system as Android.


---


## 9.7 Building a Custom Compose Target


You can build your own Compose target (e.g., for a game engine, 3D scene graph, or server-side HTML) by providing:


**Step 1: Define your node type**


```kotlin
sealed class SceneNode {
    class SceneObject(val id: String) : SceneNode()
    class SceneGroup : SceneNode() {
        val children = mutableListOf<SceneNode>()
    }
}
```


**Step 2: Implement an Applier**


```kotlin
class SceneApplier(root: SceneGroup) : AbstractApplier<SceneNode>(root) {
    override fun insertTopDown(index: Int, instance: SceneNode) {
        (current as SceneGroup).children.add(index, instance)
    }
    override fun remove(index: Int, count: Int) {
        (current as SceneGroup).children.subList(index, index + count).clear()
    }
    override fun move(from: Int, to: Int, count: Int) { /* ... */ }
    override fun onClear() {
        (current as SceneGroup).children.clear()
    }
}
```


**Step 3: Create composable node emitters**


```kotlin
@Composable
fun SceneObject(id: String) {
    ComposeNode<SceneObject, SceneApplier>(
        factory = { SceneObject(id) },
        update = { set(id) { this.id = it } }
    )
}
```


**Step 4: Create a Composition and run**


```kotlin
val root = SceneGroup()
val recomposer = Recomposer(Dispatchers.Main)
val composition = Composition(SceneApplier(root), recomposer)
composition.setContent {
    SceneObject("hero")
    SceneObject("enemy")
}
```


Compose now reactively manages your scene graph with the full power of state, effects, and smart recomposition.


---


## 9.8 Conclusion


### The Compose Mental Model — Unified


```javascript
Your @Composable code
        ↓
Compose Compiler transforms it:
  → Injects Composer parameter
  → Generates groups
  → Generates restart lambdas
  → Propagates $changed bitmask
        ↓
Compose Runtime executes it:
  → SlotTable stores structure and state
  → Snapshot system tracks state reads
  → Recomposer schedules recomposition
  → Changes list deferred to apply phase
        ↓
Compose UI materializes it:
  → LayoutNode tree built
  → Modifiers form wrapper chain
  → Measure → Layout → Draw
  → Semantics tree for accessibility
        ↓
Android renders it:
  → AndroidComposeView → RenderNode → GPU
```


Every `Text()` you write goes through all of these layers in milliseconds. Understanding them gives you the intuition to write fast, correct, and idiomatic Compose code.

