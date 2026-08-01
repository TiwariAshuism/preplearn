---
source: notion
title: "Chapter 9 — Advanced Compose Use Cases"
slug: "chapter-9-advanced-compose-use-cases"
notionId: "38eda883-bddd-8110-9107-e2afd8a65ece"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: "jetpack-compose-internals-complete-deep-dive"
children: []
order: 9
icon: "9️⃣"
cover: null
---
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

