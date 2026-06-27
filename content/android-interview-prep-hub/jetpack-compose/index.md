---
source: notion
title: "🟣 Jetpack Compose"
slug: "jetpack-compose"
notionId: "38ada883-bddd-811f-a3da-d3c512758553"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 6
icon: "🟣"
cover: null
---

---


## 🌱 Compose Fundamentals

<details>
<summary>What is Jetpack Compose? How does it differ from XML?</summary>

Jetpack Compose is Android's modern **declarative UI toolkit**. Instead of inflating XML layouts and mutating views imperatively, you describe UI as a function of state:


| XML (Imperative)             | Compose (Declarative)       |
| ---------------------------- | --------------------------- |
| Inflate layout, find views   | Describe what UI looks like |
| Mutate views on state change | Recompose on state change   |
| Separate XML + Kotlin        | Everything in Kotlin        |
| ViewGroup hierarchy          | Composition tree            |


```kotlin
@Composable
fun Greeting(name: String) {
    Text(text = "Hello, $name!")
}
```


</details>

<details>
<summary>What is a @Composable function?</summary>

A function annotated with `@Composable` can call other composables and has access to the Compose runtime. Rules:

- Must be called from another `@Composable` function.
- Should be side-effect free (no writing to shared state directly).
- Named in PascalCase.
- Returns `Unit` typically.

</details>

<details>
<summary>What is recomposition?</summary>

When state read inside a composable changes, Compose schedules a **recomposition** — re-running only the affected composables, not the entire UI tree. This is done via the **Compose Snapshot system**.


Compose tracks which `State<T>` objects are read during composition. Only composables that read changed state are recomposed.


</details>


---


## 💡 State Management

<details>
<summary>remember vs rememberSaveable</summary>
- `remember {}`: Survives recomposition, lost on configuration change.
- `rememberSaveable {}`: Survives recomposition AND configuration changes (uses `SavedStateHandle` internally). Only works with types that are `Parcelable` or `Serializable`, or with a custom `Saver`.

```kotlin
var count by remember { mutableStateOf(0) }
var name by rememberSaveable { mutableStateOf("") }
```


</details>

<details>
<summary>mutableStateOf, derivedStateOf, snapshotFlow</summary>
- `mutableStateOf()`: Holds observable state that triggers recomposition.
- `derivedStateOf { }`: Derives computed state from other states. Only recomposes when the derived value changes.
- `snapshotFlow { }`: Converts Compose state into a Flow.

```kotlin
val scrollState = rememberLazyListState()
val showFab by remember {
    derivedStateOf { scrollState.firstVisibleItemIndex > 0 }
}
```


</details>

<details>
<summary>How to prevent unnecessary recompositions?</summary>
1. Use `derivedStateOf` for computed values.
2. Pass lambdas as stable types (`() -> Unit`) instead of re-creating them.
3. Use `key()` to help Compose identity-track composables in loops.
4. Annotate classes with `@Stable` or `@Immutable` to tell Compose they won't change.
5. Use `remember {}` to avoid recreating objects on every recompose.
6. Hoist state minimally — don't lift state higher than needed.

</details>


---


## 🎌 Side Effects

<details>
<summary>LaunchedEffect, DisposableEffect, SideEffect</summary>
- **`LaunchedEffect(key)`**: Launches a coroutine when the composable enters composition. Re-runs if `key` changes. Use for async work, navigation, one-time events.

```kotlin
LaunchedEffect(userId) {
    viewModel.loadUser(userId) // re-runs if userId changes
}
```

- **`DisposableEffect(key)`**: For effects that need cleanup (registering listeners, callbacks).

```kotlin
DisposableEffect(lifecycle) {
    lifecycle.addObserver(observer)
    onDispose { lifecycle.removeObserver(observer) }
}
```

- **`SideEffect {}`**: Runs on every successful recomposition. For synchronizing Compose state to non-Compose code.

</details>

<details>
<summary>How to integrate ViewModel with Compose?</summary>

```kotlin
@Composable
fun MyScreen(viewModel: MyViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // Use uiState to render UI
}
```


Use `collectAsStateWithLifecycle()` (Lifecycle-aware) instead of `collectAsState()` for lifecycle-safe collection.


</details>


---


## 📱 Layout & Navigation

<details>
<summary>LazyColumn performance optimization</summary>
- Always provide a stable `key` for list items to help Compose track identity:

```kotlin
LazyColumn {
    items(items, key = { it.id }) { item ->
        ItemCard(item)
    }
}
```

- Avoid creating lambdas inside `items {}` block — hoist them.
- Use `Modifier.fillParentMaxWidth()` instead of `Modifier.fillMaxWidth()` inside lazy lists.
- Avoid nesting scrollable layouts (LazyColumn inside ScrollColumn).

</details>

<details>
<summary>Scaffold, TopAppBar, BottomNavigation</summary>

```kotlin
Scaffold(
    topBar = { TopAppBar(title = { Text("My App") }) },
    bottomBar = {
        NavigationBar {
            items.forEach { item ->
                NavigationBarItem(
                    selected = currentDest == item.route,
                    onClick = { navController.navigate(item.route) },
                    icon = { Icon(item.icon, null) },
                    label = { Text(item.label) }
                )
            }
        }
    }
) { paddingValues ->
    NavHost(modifier = Modifier.padding(paddingValues), ...) { ... }
}
```


</details>

<details>
<summary>Navigation in Compose</summary>

```kotlin
val navController = rememberNavController()

NavHost(navController, startDestination = "home") {
    composable("home") { HomeScreen(navController) }
    composable("detail/{id}",
        arguments = listOf(navArgument("id") { type = NavType.IntType })
    ) { backStackEntry ->
        DetailScreen(id = backStackEntry.arguments?.getInt("id")!!)
    }
}

// Navigate:
navController.navigate("detail/42")
```


</details>

<details>
<summary>Animations in Compose</summary>
- `AnimatedVisibility`: Animate enter/exit of a composable.
- `AnimatedContent`: Animate content changes (e.g., tab transitions).
- `animate*AsState()`: Animate a single value (Float, Color, Dp).
- `updateTransition()`: Coordinate multiple animations.

```kotlin
AnimatedVisibility(
    visible = isVisible,
    enter = fadeIn() + expandVertically(),
    exit = fadeOut() + shrinkVertically()
) {
    MyContent()
}
```


</details>

