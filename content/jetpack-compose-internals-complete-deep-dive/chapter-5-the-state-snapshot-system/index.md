---
source: notion
title: "Chapter 5 — The State Snapshot System"
slug: "chapter-5-the-state-snapshot-system"
notionId: "38eda883-bddd-8185-88fe-fb4019145f82"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: "jetpack-compose-internals-complete-deep-dive"
children: []
order: 5
icon: "5️⃣"
cover: null
---
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

