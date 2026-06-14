---
source: notion
title: "Phase 3 — Architecture & Patterns (Days 36–55)"
slug: "phase-3-architecture-and-patterns-days-36-55"
notionId: "35bda883-bddd-8179-b1b1-e303998cc795"
notionRootId: "35ada883bddd81d9ab0ef4abfbd4114b"
parent: "90-day-androidkotlinkmp-roadmap"
children: []
order: 2
icon: "🏗️"
cover: null
---
> **Core insight:** Architecture is not about following a pattern because it has a cool name. It is about answering one question: when requirement X changes tomorrow, which files change? A good architecture isolates change. MVI + Clean Architecture is the production answer to that question for Android in 2025.

---


## 🧠 Why this phase exists


Phase 2 gave you all the Android building blocks. This phase teaches you how to assemble them into a system that scales to 100 screens, 10 engineers, and 3 years of requirements changes without becoming unmaintainable. Every pattern here is driven by a real pain point, not theory.


---


## 📚 Topics in order


### Day 36–37 — Clean Architecture for Android

- **The three layers:**
    - **Domain layer:** pure Kotlin. No Android imports. No framework dependencies. Contains: `UseCase` classes, domain models, repository interfaces. This layer is 100% unit-testable with no Android emulator.
    - **Data layer:** implements the repository interfaces defined in domain. Contains: `RepositoryImpl`, `RemoteDataSource` (Ktor/Retrofit), `LocalDataSource` (Room/SQLDelight), DTOs, mappers.
    - **Presentation layer:** Android-specific. Contains: `ViewModel`, `UiState`, `UiEvent`, Composables. Depends on domain use cases only.
- **Dependency rule:** dependencies point inward only. Presentation → Domain ➐ Data. The domain layer knows nothing about Android, Room, or Ktor. The data layer knows nothing about ViewModels or Compose.
- **Module structure:**

    ```javascript
    :domain          — pure Kotlin module
    :data            — Android library module  
    :presentation    — Android library module
    :app             — thin wiring module (DI setup, Application class)
    ```

- **UseCase (Interactor):** single-responsibility. One use case = one business operation.

    ```kotlin
    class GetUserProfileUseCase(private val userRepo: UserRepository) {
        suspend operator fun invoke(userId: String): Result<UserProfile> =
            userRepo.getUserProfile(userId)
    }
    ```


    The `operator fun invoke` allows calling it as `getUserProfile(id)` — reads like a function call, not an object method call.

- **Domain model vs DTO vs UI model:** three separate model layers.
    - DTO: JSON shape from the API (can change with API versioning)
    - Domain model: business entity (stable, only changes with business rules)
    - UI model: optimised for rendering (flattened, formatted strings, display flags)
    - Mappers: `UserDto.toDomain()`, `UserProfile.toUiModel()`. Never skip a layer to save boilerplate.

### Day 38–40 — MVI architecture pattern

- **Why MVI over MVVM:** MVVM with `MutableStateFlow` per field creates scattered, inconsistent state. MVI enforces a single immutable `UiState` object. The UI is always a pure function of the state. Impossible states are impossible.
- **MVI contracts:**

    ```kotlin
    // One sealed interface per screen for each contract
    data class HomeUiState(
        val isLoading: Boolean = false,
        val items: List<Item> = emptyList(),
        val error: String? = null
    )
    
    sealed interface HomeUiIntent {        // user actions
        data object Refresh : HomeUiIntent
        data class Search(val query: String) : HomeUiIntent
        data class ItemClick(val id: String) : HomeUiIntent
    }
    
    sealed interface HomeUiEffect {        // one-shot side effects
        data class NavigateTo(val route: String) : HomeUiEffect
        data class ShowSnackbar(val message: String) : HomeUiEffect
    }
    ```

- **ViewModel in MVI:**

    ```kotlin
    class HomeViewModel(private val getItems: GetItemsUseCase) : ViewModel() {
        private val _state = MutableStateFlow(HomeUiState())
        val state: StateFlow<HomeUiState> = _state.asStateFlow()
    
        private val _effects = Channel<HomeUiEffect>(Channel.BUFFERED)
        val effects: Flow<HomeUiEffect> = _effects.receiveAsFlow()
    
        fun processIntent(intent: HomeUiIntent) {
            when (intent) {
                HomeUiIntent.Refresh -> loadItems()
                is HomeUiIntent.Search -> search(intent.query)
                is HomeUiIntent.ItemClick -> navigate(intent.id)
            }
        }
    
        private fun loadItems() {
            viewModelScope.launch {
                _state.update { it.copy(isLoading = true) }
                getItems().fold(
                    onSuccess = { items -> _state.update { it.copy(isLoading = false, items = items) } },
                    onFailure = { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
                )
            }
        }
    }
    ```

- **`Channel`** **for one-shot effects:** `StateFlow` replays the last value — bad for one-shot events (navigation fires twice after rotation). `Channel` with `receiveAsFlow()` delivers each event exactly once.
- **State vs Effect decision rule:** if the UI needs to reflect it persistently (loading spinner, list content, error message) — it’s state. If it’s a one-time action (navigate, show toast, vibrate) — it’s an effect.

### Day 41–42 — Dependency Injection — Koin vs Hilt


**Hilt (Google, compile-time DI):**

- Annotation-based. `@HiltViewModel`, `@Inject`, `@Module`, `@Provides`, `@Binds`.
- Compile-time validation: if a dependency is missing, the build fails. No runtime crashes.
- Android-aware scopes: `@Singleton`, `@ActivityScoped`, `@ViewModelScoped`.
- Boilerplate-heavy but IDE-friendly. Best choice for large teams.

```kotlin
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getItems: GetItemsUseCase
) : ViewModel()
```


**Koin (Kotlin, runtime DI):**

- DSL-based. `module { single { } factory { } viewModel { } }`.
- No code generation, no annotation processing. Faster build times.
- Runtime validation: missing dependencies fail at startup (or on first use if lazy).
- KMP-compatible: `koin-core` works in shared modules. Best for KMP projects.

```kotlin
val appModule = module {
    single<UserRepository> { UserRepositoryImpl(get(), get()) }
    factory { GetItemsUseCase(get()) }
    viewModel { HomeViewModel(get()) }
}
```


**Decision:** Hilt for Android-only apps at scale. Koin for KMP projects (Koin supports shared modules natively). Never mix both in one project.


### Day 43–44 — Repository pattern + offline-first architecture

- **Repository as the single source of truth:** the ViewModel never decides where data comes from. It calls the repository. The repository decides: serve from cache, fetch from network, or both.
- **Offline-first strategy:**

    ```kotlin
    fun getItems(): Flow<Result<List<Item>>> = flow {
        // 1. Emit cached data immediately
        val cached = localDataSource.getItems()
        if (cached.isNotEmpty()) emit(Result.success(cached.map { it.toDomain() }))
    
        // 2. Fetch from network
        try {
            val fresh = remoteDataSource.getItems()
            localDataSource.saveItems(fresh)       // update cache
            emit(Result.success(fresh.map { it.toDomain() }))
        } catch (e: IOException) {
            if (cached.isEmpty()) emit(Result.failure(e))  // only fail if no cache
        }
    }
    ```

- **Cache invalidation strategy:** TTL (timestamp in Room entity), explicit refresh trigger (pull-to-refresh), or event-driven (WebSocket update invalidates specific keys).
- **Pagination with Paging 3:**
    - `PagingSource`: defines how to load a page. `load(params)` returns `LoadResult.Page`.
    - `Pager`: creates a `PagingData` flow from a `PagingSource`.
    - `RemoteMediator`: coordinates network + local cache for paged data. Loads from network into Room, Room is the source of truth.
    - In Compose: `collectAsLazyPagingItems()` + `LazyColumn` with `items(lazyPagingItems)`.

### Day 45–47 — Testing strategy for Android


**The testing pyramid for Android:**

- **Unit tests (70%):** domain layer, ViewModel, use cases, mappers. Pure Kotlin, no Android. Run in milliseconds on the JVM. JUnit5 + MockK + Turbine.
- **Integration tests (20%):** repository with a real in-memory Room database. DAO tests. Run on JVM with Robolectric or on a real device/emulator.
- **UI/E2E tests (10%):** Compose UI tests. Full app flows. Run on device/emulator. Slowest.

**Testing a ViewModel with Turbine:**


```kotlin
@Test
fun `load items emits loading then success`() = runTest {
    val fakeRepo = FakeItemRepository(items = listOf(item1, item2))
    val vm = HomeViewModel(GetItemsUseCase(fakeRepo))

    vm.state.test {
        assertEquals(HomeUiState(isLoading = true), awaitItem())
        assertEquals(HomeUiState(items = listOf(item1, item2)), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}
```


**MockK over Mockito for Kotlin:**

- `mockk<UserRepository>()` creates a mock. `every { repo.getUser(any()) } returns user` stubs it. `coEvery` for suspend functions. `verify { }` for assertion.
- `spyk` for partial mocks (spy). `relaxed = true` for mocks that auto-stub all methods.

**Fake over Mock:** for repositories, prefer writing a `FakeRepository` that stores data in a list. Fakes are more readable, easier to set up complex scenarios, and closer to real behaviour than mocks.


**Testing Compose UI:**


```kotlin
@Test
fun homeScreen_showsItems_whenStateIsSuccess() {
    composeTestRule.setContent {
        HomeContent(state = HomeUiState(items = listOf(item1)), onRetry = {})
    }
    composeTestRule.onNodeWithText(item1.title).assertIsDisplayed()
}
```


**`TestDispatcher`** **and** **`runTest`****:** always use `UnconfinedTestDispatcher` or `StandardTestDispatcher` to control coroutine execution in tests. `runTest` automatically advances virtual time, so `delay(1000)` in tests completes instantly.


### Day 48–50 — Modularisation strategy


**Why modularise:**

- Faster incremental builds (only changed modules recompile)
- Enforced architecture boundaries (module cannot access what it doesn’t depend on)
- Feature teams own feature modules
- Parallel development without merge conflicts

**Module types:**

- `:core:domain` — pure Kotlin, shared domain models + interfaces
- `:core:data` — repository implementations, Room, Ktor
- `:core:ui` — shared Compose components, theme, design system
- `:core:common` — utilities, extensions, constants
- `:feature:home` — feature module (ViewModel + Composables for home screen)
- `:feature:profile` — feature module
- `:app` — thin wiring: DI setup, MainActivity, top-level NavHost

**Convention plugins (Gradle Kotlin DSL):**


Instead of duplicating build config in every `build.gradle.kts`, write convention plugins:


```kotlin
// build-logic/src/main/kotlin/AndroidFeatureConventionPlugin.kt
class AndroidFeatureConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) {
        with(target) {
            apply("com.android.library")
            apply("org.jetbrains.kotlin.android")
            // apply standard dependencies, lint rules, test config
        }
    }
}
```


Apply with `plugins { id("convention.android.feature") }` in each feature module. Now in Android sample is the reference for this.


### Day 51–55 — Advanced Compose patterns


**Composition Local:**

- `CompositionLocal` provides values implicitly through the composition tree. Use for: theming, navigation controller, analytics.
- `staticCompositionLocalOf { }` for values that rarely change. `compositionLocalOf { }` for values that change (triggers recomposition of all consumers when changed).
- Don’t use for dependency injection of business logic — that’s what Hilt/Koin is for.

**Custom** **`Modifier`** **extensions:**


```kotlin
fun Modifier.shimmerEffect(): Modifier = composed {
    val transition = rememberInfiniteTransition()
    val alpha by transition.animateFloat(0.2f, 0.9f, infiniteRepeatable(tween(1000)))
    this.background(MaterialTheme.colorScheme.onSurface.copy(alpha = alpha))
}
```


**Shared element transitions (Compose 1.7+):**

- `SharedTransitionLayout` + `Modifier.sharedElement()` for hero animations between screens.
- The navigation library integrates with shared element transitions via `SharedTransitionScope`.

**Compose stability and performance:**

- Use the Compose compiler metrics (`-P plugin:...`) to identify unstable classes causing unnecessary recomposition.
- `@Immutable` on data classes used as Compose parameters prevents recomposition when the reference hasn’t changed.
- `remember(key)` to memoise expensive computations. `derivedStateOf` to derive state without over-triggering recomposition.

---


## 🔨 Projects


### Project 1 — Full MVI + Clean Architecture app


**Stack:** Kotlin, Compose, Hilt or Koin, Room, Ktor, Navigation, MVI


Build a task management app with 4 features: task list (with offline-first), task detail, create task, settings (theme preference via DataStore). Strict Clean Architecture: `:domain`, `:data`, `:feature:tasks`, `:feature:settings`, `:app` modules. Every screen has `UiState`, `UiIntent`, `UiEffect` sealed classes. 80% unit test coverage on ViewModel and use case layers. Zero direct framework imports in `:domain`.


**Deliverable:** Running app with offline support. All ViewModel tests pass with Turbine. Architecture boundary violations fail the build (use module dependencies to enforce).


### Project 2 — Paging 3 + RemoteMediator


**Scenario:** A "GitHub repositories" browser with infinite scroll.


**Deliverable:** `GithubPagingSource` fetching from GitHub API. `GithubRemoteMediator` caching pages in Room. `Pager` combining both. `LazyColumn` with `collectAsLazyPagingItems()`. Load state handling: show skeleton on initial load, show footer spinner on append, show error with retry on failure. All with zero direct API calls from the composable.


### Project 3 — Screenshot testing with Paparazzi


**Deliverable:** Add Paparazzi screenshot tests for 5 key composables in your app. Test each in 3 states: loading, success, error. Test in light and dark mode. Add a GitHub Actions job that runs screenshot tests on every PR and blocks merge on visual regressions.


---


## ⚠️ Common mistakes


### Mistake 1


**✗ Using** **`MutableStateFlow`** **for one-shot UI effects (navigation, toasts).**


`StateFlow` holds and replays its last value. After rotation, the user gets navigated to the detail screen again because the navigation event was replayed.


**✓ Correct approach:** Use `Channel<UiEffect>` with `receiveAsFlow()` for one-shot effects. Each event is consumed exactly once. Collect in the composable inside `LaunchedEffect(Unit)`.


### Mistake 2


**✗ Injecting** **`Context`** **into domain layer use cases.**


The domain layer must be pure Kotlin with no Android dependencies. `Context` in use cases means the domain layer knows about Android internals, making it impossible to test without Android.


**✓ Correct approach:** If a use case needs a resource (string, file path), inject an interface (`ResourceProvider`) that the data layer implements using `Context`. The domain layer depends on the interface, not `Context` directly.


### Mistake 3


**✗ Writing one giant feature module instead of modularising.**


As the app grows, one module means: slow builds (entire app recompiles on any change), no architecture enforcement, and merge conflicts across all features.


**✓ Correct approach:** Start with modularisation from day one using the convention plugin pattern. Each feature is a module. Each module has a clear public API (`internal` modifier hides implementation details). Module boundaries enforce Clean Architecture for free.


### Mistake 4


**✗ Testing implementation details instead of behaviour.**


`verify { repo.getUser(id) }` tests that the repository was called — an implementation detail. If you refactor to cache first, the test breaks even though the behaviour is correct.


**✓ Correct approach:** Test observable behaviour: what state does the ViewModel emit? Does the UI show the correct content? Use fakes over mocks. Assert on `StateFlow` emissions via Turbine. The test survives refactoring as long as behaviour is preserved.


---


## 🏢 How real companies architect Android apps


**Google — Now in Android:** Google’s reference architecture uses exactly the modularisation strategy described here: `:core:*` modules for shared infrastructure, `:feature:*` modules for each feature, convention plugins for consistent build config. Open source at [github.com/android/nowinandroid](http://github.com/android/nowinandroid). Study this codebase.


**Spotify — Single UiState per screen:** Spotify’s Android team documented their migration from multiple `LiveData` fields per screen to a single `UiState` data class. Result: eliminated an entire category of bug (inconsistent state where `isLoading = true` and `error != null` simultaneously).


**Bumble — MVI at scale:** Bumble’s mobile team adopted MVI across their Android and iOS apps. Their key insight: MVI’s unidirectional data flow makes state bugs reproducible and fixable because any state can be reconstructed from the intent history.


---


## 📖 Resources

- Now in Android: [github.com/android/nowinandroid](http://github.com/android/nowinandroid) (study the module structure + convention plugins)
- _Android Development with Kotlin_ — Griffiths & Griffiths
- Kotlin Coroutines + Flow: Philipp Lackner YouTube series
- Turbine: [github.com/cashapp/turbine](http://github.com/cashapp/turbine) (Flow testing library)
- Paparazzi: [github.com/cashapp/paparazzi](http://github.com/cashapp/paparazzi) (screenshot testing without a device)
