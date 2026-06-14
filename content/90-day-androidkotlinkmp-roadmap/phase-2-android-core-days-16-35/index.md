---
source: notion
title: "Phase 2 — Android Core (Days 16–35)"
slug: "phase-2-android-core-days-16-35"
notionId: "35ada883-bddd-8161-acbb-caa8ae2f11f5"
notionRootId: "35ada883bddd81d9ab0ef4abfbd4114b"
parent: "90-day-androidkotlinkmp-roadmap"
children: []
order: 3
icon: "📱"
cover: null
---
> **Core insight:** The Android lifecycle is not a bug or a legacy design — it is the constraint that every correct Android app is built around. Engineers who ignore it write apps that crash on rotation, leak memory, and drain batteries. Learn the lifecycle first. Every Jetpack library is just a tool to make lifecycle compliance easier.

---


## 🧠 Why this phase exists


You can write perfect Kotlin and still build broken Android apps if you don't understand how the OS manages your components. This phase covers the Android runtime model, Jetpack Compose as the UI layer, and the Jetpack libraries that form the standard production stack in 2025+.


---


## 📚 Topics in order


### Day 16–17 — Android lifecycle deep dive

- **Activity lifecycle:** `onCreate` → `onStart` → `onResume` → `onPause` → `onStop` → `onDestroy`. Know exactly what triggers each transition and what is safe to do in each state.
- **Configuration change:** rotation, language change, dark mode toggle — all destroy and recreate the Activity. Any data stored in the Activity is lost. This is why ViewModel exists.
- **Process death:** the OS kills your process when memory is low. The back stack is preserved (via `savedInstanceState`), but in-memory state is lost. `SavedStateHandle` in ViewModel survives process death.
- **Fragment lifecycle vs Activity lifecycle:** Fragment has its own lifecycle AND a view lifecycle. `viewLifecycleOwner` is the correct owner for UI-bound observers — not `this` (the Fragment itself).
- **`onSaveInstanceState`** **vs ViewModel:** `onSaveInstanceState` for small serialisable data (selected tab, scroll position). ViewModel for larger in-memory data (list of items, loaded state).
- **`rememberSaveable`** **in Compose:** persists Compose state across recomposition AND configuration changes. Uses the same `savedInstanceState` bundle mechanism internally.

### Day 18–19 — Jetpack ViewModel + StateFlow

- **ViewModel purpose:** survives configuration changes. Scoped to the screen, not the Activity/Fragment instance. Cleared when the user navigates away permanently.
- **`viewModelScope`****:** a `CoroutineScope` tied to the ViewModel's lifecycle. Cancelled when `onCleared()` is called. All coroutines launched here are automatically cancelled.
- **The correct ViewModel pattern:**

    ```kotlin
    class HomeViewModel(private val repo: HomeRepository) : ViewModel() {
        private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
        val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
        init { loadData() }
    
        private fun loadData() {
            viewModelScope.launch {
                _uiState.value = try {
                    HomeUiState.Success(repo.getData())
                } catch (e: Exception) {
                    HomeUiState.Error(e.message ?: "Unknown error")
                }
            }
        }
    }
    ```

- **Expose** **`StateFlow`****, not** **`MutableStateFlow`****:** UI should never be able to modify state directly. Expose read-only `StateFlow` from ViewModel.
- **`SavedStateHandle`****:** a `Map`-like object injected into ViewModel that persists across process death. Use `savedStateHandle.getStateFlow("key", default)` for reactive access.

### Day 20–22 — Jetpack Compose fundamentals

- **The recomposition model:** Compose re-executes `@Composable` functions when their inputs (state) change. Not the whole UI — only the composables whose inputs changed (smart recomposition).
- **State in Compose:**
    - `remember { }`: survives recomposition. Lost on configuration change.
    - `rememberSaveable { }`: survives recomposition AND configuration change.
    - `collectAsStateWithLifecycle()`: safely collects a `Flow`/`StateFlow` in a composable, respecting lifecycle.
- **Unidirectional Data Flow (UDF):** state flows down, events flow up. Composable receives state as parameters, emits events via lambdas. Never passes ViewModel directly into a child composable.

    ```kotlin
    @Composable
    fun HomeScreen(viewModel: HomeViewModel = viewModel()) {
        val state by viewModel.uiState.collectAsStateWithLifecycle()
        HomeContent(state = state, onRetry = viewModel::loadData)
    }
    @Composable
    fun HomeContent(state: HomeUiState, onRetry: () -> Unit) { ... }
    ```

- **Composition vs recomposition vs side effects:** `LaunchedEffect(key)` runs a coroutine when the key changes. `DisposableEffect` for cleanup. `SideEffect` for every recomposition. Know when to use each.
- **`derivedStateOf`****:** creates a derived state that only triggers recomposition when the derived value changes (not when the source changes). Use for computed values from list state.
- **Stable and unstable types:** composables with unstable parameter types always recompose. Use `@Stable` or `@Immutable` annotations, or use immutable data classes, to make recomposition skippable.

### Day 23–24 — Compose layouts, modifiers, theming

- **Layout composables:** `Column`, `Row`, `Box` (Z-axis stacking), `LazyColumn`, `LazyRow`, `LazyVerticalGrid`.
- **Modifier chain:** order matters. `Modifier.padding(16.dp).clickable { }` adds padding first, then clickable area includes padding. `Modifier.clickable { }.padding(16.dp)` — only the content area is clickable.
- **`LazyColumn`** **keys:** always provide a `key` in `items(list, key = { it.id })`. Without keys, Compose can't track item identity during list changes, causing animation glitches and state loss.
- **Material 3 theming:** `MaterialTheme` provides `colorScheme`, `typography`, `shapes`. Define a custom theme once. Access via `MaterialTheme.colorScheme.primary`, etc. Never hardcode colours.
- **Dynamic colour (Material You):** `dynamicColorScheme()` on Android 12+. Provide a fallback scheme for older versions.
- **Custom** **`Layout`** **composable:** when `Column`/`Row`/`Box` are insufficient. `Layout` gives you full control over measurement and placement.

### Day 25–26 — Navigation Component (Compose)

- **NavController + NavHost:** `rememberNavController()` creates the controller. `NavHost` defines the navigation graph.
- **Type-safe navigation (Navigation 2.8+):** define routes as `@Serializable` data classes. No string routes. No manual argument parsing.

    ```kotlin
    @Serializable data class ProductDetail(val productId: String)
    
    NavHost(navController, startDestination = Home) {
        composable<Home> { HomeScreen(onProductClick = { navController.navigate(ProductDetail(it)) }) }
        composable<ProductDetail> { backStackEntry ->
            val args = backStackEntry.toRoute<ProductDetail>()
            ProductDetailScreen(productId = args.productId)
        }
    }
    ```

- **ViewModel scoped to NavBackStackEntry:** `viewModel()` inside a composable scoped to that screen. Use `navController.getBackStackEntry(route)` to scope a ViewModel to a nested graph (e.g., shared ViewModel across a checkout flow).
- **Deep links:** `deepLinks = listOf(navDeepLink<ProductDetail>(basePath = "https://app.com/product"))`. Handle both web and app-internal deep links.
- **Back stack manipulation:** `popUpTo`, `launchSingleTop`, `saveState/restoreState` for bottom navigation patterns.

### Day 27–28 — Room database

- **Room components:** `@Entity` (table), `@Dao` (queries), `@Database` (database holder).
- **Suspend DAO functions:** Room auto-runs suspend functions on a background thread. No `withContext(IO)` needed.
- **Flow-returning queries:** `@Query("...") fun getAll(): Flow<List<Item>>`. Room emits a new value whenever the underlying table changes. Combine with `stateIn` in ViewModel.
- **`@Transaction`****:** use for queries that join multiple tables. Prevents inconsistent reads.
- **Migration:** `Migration(fromVersion, toVersion)` with SQL. `fallbackToDestructiveMigration()` for dev only — never in production.
- **Type converters:** `@TypeConverter` for custom types (e.g., `List<String>` ↔ `String` JSON, `Instant` ↔ `Long`).
- **Room vs SQLDelight:** Room is Android-only. SQLDelight is KMP-compatible and generates type-safe Kotlin from SQL. In a KMP project, prefer SQLDelight.

### Day 29–30 — Retrofit + OkHttp / Ktor (Android)

- **Retrofit:** type-safe HTTP client for Android. `@GET`, `@POST`, `@Query`, `@Body` annotations. Suspend function support: `suspend fun getUser(id: String): User`.
- **OkHttp interceptors:** add auth headers, logging, retry logic as an interceptor chain. `HttpLoggingInterceptor` for debug builds only (never in release — leaks PII).
- **Kotlinx Serialization:** Kotlin-native JSON serialisation. KMP-compatible. Use over Gson/Moshi in new projects.

    ```kotlin
    @Serializable data class UserDto(val id: String, val name: String)
    ```

- **Ktor Client (preferred for KMP):** multiplatform HTTP client. Same API on Android and iOS. Use in the shared module in KMP projects.
- **Error handling:** wrap API calls in `Result<T>`. Never let network exceptions propagate to the ViewModel uncaught.

    ```kotlin
    suspend fun getUser(id: String): Result<User> = runCatching { apiService.getUser(id).toDomain() }
    ```


### Day 31–32 — WorkManager + background processing

- **WorkManager:** guaranteed background execution. Persists across app restarts and device reboots. Use for: sync operations, upload queues, periodic cleanup.
- **`Worker`** **vs** **`CoroutineWorker`****:** use `CoroutineWorker` — it runs the work in a coroutine on `Dispatchers.IO` and handles cancellation correctly.
- **Constraints:** `Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()`. Work only executes when constraints are met.
- **`OneTimeWorkRequest`** **vs** **`PeriodicWorkRequest`****:** one-time for triggered tasks, periodic for scheduled recurring work (minimum interval: 15 minutes).
- **Chaining:** `WorkManager.getInstance().beginWith(workA).then(workB).then(workC).enqueue()`. Output of A is input to B via `Data`.
- **When NOT to use WorkManager:** for immediate foreground work, use coroutines. For real-time messaging, use FCM. WorkManager is for deferrable, guaranteed-execution tasks.

### Day 33–35 — DataStore + app architecture wiring

- **DataStore vs SharedPreferences:** DataStore uses coroutines and `Flow`. No blocking reads. No `apply()` vs `commit()` confusion. Crash-safe. Always prefer DataStore in new code.
- **Preferences DataStore:** key-value store with `Preferences` API. Typed keys (`intPreferencesKey`, `stringPreferencesKey`).
- **Proto DataStore:** stores typed objects defined in Protocol Buffers. Type-safe, schema-versioned. Preferred for complex preference structures.
- **Reading:**

    ```kotlin
    val themeFlow: Flow<Theme> = dataStore.data.map { prefs -> prefs[THEME_KEY] ?: Theme.SYSTEM }
    ```

- **Writing:** `dataStore.edit { prefs -> prefs[THEME_KEY] = Theme.DARK }` — runs in a coroutine, atomic.
- **Wiring it all together:** by Day 35, build a complete mini-app: DataStore for settings, Room for local data, Retrofit/Ktor for network, ViewModel + StateFlow for state, Compose UI, Navigation. All pieces connected end-to-end.

---


## 🔨 Projects


### Project 1 — News reader app (all Jetpack components)


**Stack:** Kotlin, Jetpack Compose, ViewModel, Room, Retrofit, Navigation, DataStore


Features: browse news articles (fetched from a public API), offline caching in Room, save articles as favourites (Room), theme preference (DataStore), article detail screen with shared-element-style transition. Navigation graph with 3 screens. ViewModel per screen. `StateFlow` for all state. Zero direct API calls from composables.


**Deliverable:** App survives rotation without re-fetching. App works offline using cached data. Theme preference persists across process death.


### Project 2 — Compose animation showcase


**Deliverable:** A single-screen app demonstrating: `AnimatedVisibility`, `animateContentSize`, `Crossfade`, `AnimatedContent`, custom `animate*AsState` for a list item expand/collapse interaction, and a `Canvas`-based custom loading indicator. Each animation is triggered by state changes, not imperative calls.


### Project 3 — Background sync with WorkManager


**Scenario:** Sync local Room data with a remote API every hour when connected to WiFi.


**Deliverable:** `PeriodicWorkRequest` with `NetworkType.UNMETERED` constraint. `CoroutineWorker` that fetches from API, diffs against Room data, and inserts only changed records. Retry logic with exponential backoff. Work status observed in the UI via `WorkManager.getWorkInfoByIdFlow()` displayed as a sync indicator.


---


## ⚠️ Common mistakes


### Mistake 1


**✗ Passing ViewModel instances into child composables.**


Child composables become tightly coupled to the ViewModel. They can't be previewed, can't be reused in other screens, and can't be tested in isolation.


**✓ Correct approach:** ViewModel is instantiated only at the screen-level composable (the root of the screen). It extracts state and event handlers. These are passed as plain parameters to all child composables. Children are pure functions of their inputs.


### Mistake 2


**✗ Using** **`remember`** **when you need** **`rememberSaveable`****.**


A user fills in a form, rotates the screen, and all input is lost. `remember` only survives recomposition. Configuration changes destroy and recreate the composition.


**✓ Correct approach:** Use `rememberSaveable` for any UI state the user has interacted with: text field contents, selected tab, scroll position. Use `remember` only for derived or re-computable state.


### Mistake 3


**✗ Reading from Room on the main thread.**


Room throws `IllegalStateException: Cannot access database on the main thread` by default. Engineers sometimes call `.allowMainThreadQueries()` to silence the error. This causes ANRs.


**✓ Correct approach:** Always use suspend DAO functions (Room runs them on IO automatically) or Flow-returning queries (collected in viewModelScope on IO). Never call `allowMainThreadQueries()` except in tests.


### Mistake 4


**✗ Using** **`viewLifecycleOwner`** **incorrectly in Fragments.**


Using `this` (the Fragment) as the lifecycle owner for view-bound observers causes the observer to persist after the view is destroyed but before the Fragment is destroyed. This is a common memory leak.


**✓ Correct approach:** For view-bound operations (collecting flows for UI, observing LiveData for rendering), always use `viewLifecycleOwner`. In Compose-only apps with Navigation Compose, Fragments are largely eliminated — this issue goes away.


---


## 🏢 How real companies use Android Jetpack


**Google — Compose adoption:** Google's own apps (Maps, Photos, Gmail) are migrating to Compose. The Maps Compose library wraps the Maps SDK in composable functions. Google's architecture guidance ("Now in Android" sample) is the canonical reference for production Jetpack usage.


**Airbnb — Compose migration strategy:** Airbnb migrated their massive codebase incrementally using `ComposeView` in XML layouts and `AndroidView` in Compose. They published detailed findings on recomposition performance that led to improvements in the Compose compiler.


**Spotify — ViewModel architecture:** Spotify's Android architecture uses ViewModel + StateFlow with a single `UiState` data class per screen. Each user action is a sealed `UiEvent`. The ViewModel is the single source of truth for the screen. Their architecture influenced the "Unidirectional Data Flow" guidance Google now recommends officially.


---


## 📖 Resources

- Now in Android sample: [github.com/android/nowinandroid](http://github.com/android/nowinandroid) (Google's reference architecture)
- Android Developer docs: [developer.android.com/jetpack](http://developer.android.com/jetpack) (primary reference)
- Philipp Lackner YouTube channel (best Compose + Android tutorials)
- _Jetpack Compose Internals_ — Jorge Castillo (deep Compose runtime internals)
- Android Compose samples: [github.com/android/compose-samples](http://github.com/android/compose-samples)
