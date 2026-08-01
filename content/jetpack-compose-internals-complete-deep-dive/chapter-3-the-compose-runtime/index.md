---
source: notion
title: "Chapter 3 — The Compose Runtime"
slug: "chapter-3-the-compose-runtime"
notionId: "38eda883-bddd-81d3-a418-fbd09c147d9e"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: "jetpack-compose-internals-complete-deep-dive"
children: []
order: 3
icon: "3️⃣"
cover: null
---
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

