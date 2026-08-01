---
source: notion
title: "Chapter 2 — The Compose Compiler"
slug: "chapter-2-the-compose-compiler"
notionId: "38eda883-bddd-81fc-afd9-f0c358755b2e"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: "jetpack-compose-internals-complete-deep-dive"
children: []
order: 2
icon: "2️⃣"
cover: null
---
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

