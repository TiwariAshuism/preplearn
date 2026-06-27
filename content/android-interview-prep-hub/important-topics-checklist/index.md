---
source: notion
title: "📋 Important Topics Checklist"
slug: "important-topics-checklist"
notionId: "38ada883-bddd-819f-8ccd-c4994aa2af85"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 0
icon: "📋"
cover: null
---

Use this page to track your preparation progress. Check off topics as you feel confident.


---


## 🟢 Kotlin Fundamentals

- [ ] null safety (`?.`, `?:`, `!!`)
- [ ] `val` vs `var`
- [ ] Data class, sealed class, enum class
- [ ] Companion object vs Object
- [ ] Extension functions
- [ ] Scope functions (`let`, `apply`, `also`, `run`, `with`)
- [ ] Higher-order functions & lambdas
- [ ] `inline`, `noinline`, `crossinline`
- [ ] `lazy` vs `lateinit`
- [ ] Generics: `in`, `out`, reified
- [ ] Delegation pattern
- [ ] `typealias`
- [ ] Destructuring declarations
- [ ] Coroutine Channels
- [ ] `Result<T>` class

---


## 🟡 Android Core

- [ ] Activity Lifecycle
- [ ] Fragment Lifecycle
- [ ] Launch Modes (standard, singleTop, singleTask, singleInstance)
- [ ] Explicit vs Implicit Intents
- [ ] Parcelable vs Serializable
- [ ] RecyclerView + DiffUtil
- [ ] ViewBinding
- [ ] Runtime Permissions
- [ ] Broadcast Receivers
- [ ] Services (Foreground, Background, Bound)
- [ ] WorkManager
- [ ] Navigation Component
- [ ] Room Database (Entity, DAO, Database)
- [ ] SharedPreferences / DataStore
- [ ] Handlers, Loopers
- [ ] ViewPager2
- [ ] min/compile/target SDK differences

---


## 🔵 Coroutines & Flow

- [ ] `launch` vs `async`
- [ ] `suspend` function
- [ ] Dispatchers (Main, IO, Default)
- [ ] Structured concurrency
- [ ] `viewModelScope`, `lifecycleScope`
- [ ] `CoroutineExceptionHandler`
- [ ] `SupervisorJob`
- [ ] Cold vs Hot Flow
- [ ] `StateFlow` vs `SharedFlow` vs `Flow`
- [ ] `collectLatest`, `debounce`, `conflate`
- [ ] `buffer()` for backpressure
- [ ] `combine`, `zip`, `merge` operators
- [ ] `snapshotFlow`

---


## 🟣 Jetpack Compose

- [ ] `@Composable` rules
- [ ] Recomposition internals
- [ ] `remember` vs `rememberSaveable`
- [ ] `mutableStateOf`, `derivedStateOf`
- [ ] State hoisting
- [ ] `LaunchedEffect`, `DisposableEffect`, `SideEffect`
- [ ] `LazyColumn` / `LazyRow` with keys
- [ ] `Modifier` system
- [ ] `Scaffold`, `TopAppBar`, `BottomNavigationBar`
- [ ] Navigation in Compose
- [ ] Animations (`AnimatedVisibility`, `animate*AsState`)
- [ ] Compose + ViewModel integration
- [ ] `collectAsStateWithLifecycle`
- [ ] `@Stable` / `@Immutable` for performance
- [ ] Compose Compiler Metrics
- [ ] Custom composables / Slot API

---


## 🏗️ Architecture

- [ ] MVVM pattern
- [ ] Clean Architecture (layers)
- [ ] UseCase / Interactor pattern
- [ ] Repository pattern
- [ ] MVI pattern
- [ ] Single Source of Truth
- [ ] Sealed class for UI state
- [ ] SOLID principles
- [ ] Dependency Inversion

---


## 💉 Dependency Injection

- [ ] DI vs Service Locator
- [ ] Hilt setup (`@HiltAndroidApp`, `@AndroidEntryPoint`)
- [ ] `@HiltViewModel`
- [ ] `@Module`, `@Provides`, `@Binds`
- [ ] Hilt scopes
- [ ] `@Qualifier`
- [ ] `@EntryPoint`

---


## 🧪 Testing

- [ ] Unit test for ViewModel
- [ ] `MainDispatcherRule`
- [ ] `runTest` for coroutines
- [ ] MockK basics
- [ ] Testing StateFlow
- [ ] In-memory Room testing
- [ ] Compose UI testing
- [ ] `InstantTaskExecutorRule` for LiveData

---


## ⚙️ Performance & Memory

- [ ] Memory leak common causes
- [ ] LeakCanary
- [ ] App startup types (cold/warm/hot)
- [ ] ANR detection + StrictMode
- [ ] Compose performance pitfalls
- [ ] `@Stable` / `@Immutable`
- [ ] Baseline Profiles
- [ ] Value classes (`@JvmInline`)

---


## 🌐 Kotlin Multiplatform

- [ ] `expect` / `actual`
- [ ] Shared module structure
- [ ] KMP with Ktor + SQLDelight
- [ ] KMP limitations
- [ ] Compose Multiplatform status
