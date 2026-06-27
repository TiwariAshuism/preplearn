---
source: notion
title: "⚙️ Performance & Memory"
slug: "performance-and-memory"
notionId: "38ada883-bddd-8127-95ee-ed34d1c08d74"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 2
icon: "⚙️"
cover: null
---

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

