---
source: notion
title: "Chapter 4 — Compose UI"
slug: "chapter-4-compose-ui"
notionId: "38eda883-bddd-818d-8fa7-d7f456a59380"
notionRootId: "38eda883bddd8103a17de1ddcca965c6"
parent: "jetpack-compose-internals-complete-deep-dive"
children: []
order: 4
icon: "4️⃣"
cover: null
---
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

