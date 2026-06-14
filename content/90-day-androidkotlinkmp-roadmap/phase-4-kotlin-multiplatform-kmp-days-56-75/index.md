---
source: notion
title: "Phase 4 — Kotlin Multiplatform — KMP (Days 56–75)"
slug: "phase-4-kotlin-multiplatform-kmp-days-56-75"
notionId: "35bda883-bddd-8128-bb66-f8e87ad64e19"
notionRootId: "35ada883bddd81d9ab0ef4abfbd4114b"
parent: "90-day-androidkotlinkmp-roadmap"
children: []
order: 1
icon: "🌐"
cover: null
---
> **Core insight:** KMP is not "write once, run anywhere." It is "share logic, own the platform." The business rules, data fetching, and state management live in Kotlin in a shared module. The UI and platform-specific APIs stay native. This distinction is the entire mental model of KMP.

---


## 🧠 Why this phase exists


Kotlin Multiplatform is the most significant shift in mobile engineering since Swift. It lets your existing Kotlin code run on iOS, web, and desktop without a cross-platform UI compromise. This phase takes your Android Kotlin skills and extends them to a shared module that powers both Android and iOS.


---


## 📚 Topics in order


### Day 56–57 — KMP project structure and build setup


**KMP source sets:**


```javascript
shared/
  src/
    commonMain/kotlin/    ← shared business logic (runs on all targets)
    commonTest/kotlin/    ← shared tests (run on all targets)
    androidMain/kotlin/   ← Android-specific implementations
    iosMain/kotlin/       ← iOS-specific implementations
    desktopMain/kotlin/   ← Desktop-specific (optional)
```


**`build.gradle.kts`** **for a KMP shared module:**


```kotlin
kotlin {
    androidTarget { compilations.all { kotlinOptions.jvmTarget = "17" } }
    iosX64(); iosArm64(); iosSimulatorArm64()

    sourceSets {
        commonMain.dependencies {
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.ktor.client.core)
            implementation(libs.sqldelight.runtime)
            implementation(libs.koin.core)
        }
        androidMain.dependencies {
            implementation(libs.ktor.client.okhttp)
            implementation(libs.sqldelight.android.driver)
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
            implementation(libs.sqldelight.native.driver)
        }
    }
}
```


**What goes in** **`commonMain`****:** anything that is pure Kotlin with no platform API calls.

- Domain models, use cases, repository interfaces
- Ktor HTTP client logic (Ktor is KMP-native)
- SQLDelight queries (SQLDelight generates KMP-compatible code)
- Business logic, validators, mappers
- Coroutines + Flow-based state management

**What stays platform-specific:**

- UI (unless using Compose Multiplatform)
- Camera, GPS, biometrics, push notifications
- Platform-specific DB drivers (OkHttp on Android, Darwin on iOS)
- File system access, Keychain/Keystore

### Day 58―59 — `expect` / `actual` mechanism


**The problem it solves:** your shared module needs to use a platform-specific API (e.g., the current timestamp, UUID generation, platform name) but `commonMain` can’t import Android or iOS APIs.


**`expect`** **/** **`actual`** **pattern:**


```kotlin
// commonMain — declare the contract
expect class Platform() {
    val name: String
}

expect fun randomUUID(): String

expect fun currentTimeMillis(): Long
```


```kotlin
// androidMain — provide the Android implementation
actual class Platform actual constructor() {
    actual val name: String = "Android ${android.os.Build.VERSION.SDK_INT}"
}
actual fun randomUUID(): String = java.util.UUID.randomUUID().toString()
actual fun currentTimeMillis(): Long = System.currentTimeMillis()
```


```kotlin
// iosMain — provide the iOS implementation
actual class Platform actual constructor() {
    actual val name: String = UIDevice.currentDevice.systemName() + " " + UIDevice.currentDevice.systemVersion
}
actual fun randomUUID(): String = NSUUID().UUIDString()
actual fun currentTimeMillis(): Long = (NSDate().timeIntervalSince1970 * 1000).toLong()
```


**When to use** **`expect`****/****`actual`****:**

- Platform-specific system APIs (time, UUID, platform name)
- DB drivers (each platform needs a different SQLDelight driver)
- HTTP engines (OkHttp vs Darwin)
- Cryptography (Android Keystore vs iOS Keychain)

**When NOT to use:** don’t use `expect`/`actual` for business logic. If you find yourself writing the same logic twice in both `actual` implementations, it should be in `commonMain`.


### Day 60–61 — Ktor Client in KMP (shared networking)


**Ktor is the standard KMP HTTP client.** Same API on Android and iOS. Engine is injected per platform.


```kotlin
// commonMain
class ApiClient(private val httpClient: HttpClient) {
    suspend fun getUsers(): List<UserDto> =
        httpClient.get("https://api.example.com/users").body()
}

fun createHttpClient(engine: HttpClientEngine): HttpClient = HttpClient(engine) {
    install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) }
    install(Logging) { level = LogLevel.HEADERS }
    defaultRequest { header("Authorization", "Bearer ${getToken()}") }
}
```


```kotlin
// androidMain
val client = createHttpClient(OkHttp.create())
// iosMain
val client = createHttpClient(Darwin.create())
```


**Ktor plugins:**

- `ContentNegotiation`: JSON serialisation with `kotlinx.serialization`
- `Auth`: Bearer token, Basic auth, automatic token refresh
- `Logging`: request/response logging (use `LogLevel.NONE` in production)
- `HttpTimeout`: connect, request, and socket timeouts
- `HttpRequestRetry`: automatic retry with backoff

**Error handling with Ktor:**


```kotlin
suspend fun getUser(id: String): Result<User> = runCatching {
    httpClient.get("/users/$id") {
        parameter("fields", "id,name,email")
    }.body<UserDto>().toDomain()
}.mapFailure { e ->
    when (e) {
        is ClientRequestException -> when (e.response.status) {
            HttpStatusCode.NotFound -> UserNotFoundError(id)
            HttpStatusCode.Unauthorized -> UnauthorisedError
            else -> NetworkError(e.message)
        }
        is IOException -> NoConnectionError
        else -> UnknownError(e)
    }
}
```


### Day 62–64 — SQLDelight in KMP (shared local database)


**Why SQLDelight over Room for KMP:** Room is Android-only. SQLDelight generates type-safe Kotlin from SQL and works on Android, iOS, desktop, and JS.


**Setup:**


```kotlin
// build.gradle.kts
sqldelight {
    databases {
        create("AppDatabase") {
            packageName.set("com.example.db")
        }
    }
}
```


**Define schema in** **`.sq`** **files:**


```sql
-- commonMain/sqldelight/com/example/db/User.sq
CREATE TABLE User (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    createdAt INTEGER NOT NULL
);

getAllUsers:
SELECT * FROM User ORDER BY createdAt DESC;

getUserById:
SELECT * FROM User WHERE id = ?;

insertOrReplaceUser:
INSERT OR REPLACE INTO User(id, name, email, createdAt)
VALUES (?, ?, ?, ?);

deleteUser:
DELETE FROM User WHERE id = ?;
```


SQLDelight generates: `UserQueries` class with typed functions matching your SQL. `getAllUsers()` returns `Query<User>` which maps to a Flow.


**Platform-specific driver injection (via** **`expect`****/****`actual`****):**


```kotlin
// commonMain
expect fun createDatabaseDriver(context: Any?): SqlDriver

// androidMain
actual fun createDatabaseDriver(context: Any?): SqlDriver =
    AndroidSqliteDriver(AppDatabase.Schema, context as Context, "app.db")

// iosMain  
actual fun createDatabaseDriver(context: Any?): SqlDriver =
    NativeSqliteDriver(AppDatabase.Schema, "app.db")
```


**Flow integration:**


```kotlin
fun getAllUsersFlow(): Flow<List<User>> =
    userQueries.getAllUsers().asFlow().mapToList(Dispatchers.IO)
```


### Day 65–67 — Shared ViewModel / Presentation layer for KMP


**Option A — Shared ViewModel with KMP-ViewModel library:**


```kotlin
// commonMain using KMP-ViewModel (github.com/rickclephas/KMP-NativeCoroutines)
class UserListViewModel : KMPViewModel() {
    private val _state = MutableStateFlow(UserListState())
    val state: StateFlow<UserListState> = _state.asStateFlow()

    fun loadUsers() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            getUsersUseCase().fold(
                onSuccess = { _state.update { s -> s.copy(isLoading = false, users = it) } },
                onFailure = { _state.update { s -> s.copy(isLoading = false, error = it.message) } }
            )
        }
    }
}
```

- Android: use directly as a standard ViewModel (KMP-ViewModel extends AndroidX ViewModel on Android)
- iOS: access via Swift using KMP-NativeCoroutines wrappers that convert `StateFlow` to Swift `AsyncStream`

**Option B — Shared UseCase only, platform ViewModels:**

- `commonMain`: domain layer + use cases + repository interfaces
- `androidMain`: Android ViewModel that calls use cases
- `iosMain`/Swift: iOS ViewModel (ObservableObject) that calls the same use cases
- More boilerplate, but full platform-native feel for iOS developers

**Which to choose:**

- Small team, Kotlin-first: Option A (shared ViewModel reduces duplication by 60%)
- Dedicated iOS team, native feel priority: Option B (iOS devs write Swift ViewModels)
- Most KMP projects at scale use a hybrid: shared use cases + platform ViewModels

### Day 68–70 — Compose Multiplatform (CMP)


**CMP = Jetpack Compose for all platforms.** The same Compose code runs on Android, iOS, desktop (JVM), and web (Wasm). JetBrains maintains CMP; Google maintains Jetpack Compose for Android.


**What is stable (2025):**

- Android: stable and production-ready
- iOS: beta (production-ready for most use cases)
- Desktop (JVM): stable
- Web (Wasm): alpha

**CMP project structure:**


```javascript
composeApp/
  src/
    commonMain/   ← all Compose UI code goes here
    androidMain/  ← Android entry point (MainActivity)
    iosMain/      ← iOS entry point (MainViewController)
shared/
  src/
    commonMain/   ← business logic (no UI)
```


**What works in** **`commonMain`** **Compose:**

- All layout composables: `Column`, `Row`, `Box`, `LazyColumn`
- Material 3 components (via `compose-material3` for CMP)
- Animations, modifiers, theming
- Navigation: Compose Navigation or Voyager (KMP-native navigator)

**What still needs** **`expect`****/****`actual`****:**

- Image loading (`Coil` for Android, `Kamel` for KMP)
- File picker, camera, maps
- Platform-specific permission handling

**Voyager — KMP-native navigation:**


```kotlin
// commonMain — navigation is fully shared
class HomeScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        HomeContent(onNavigate = { navigator.push(DetailScreen(it)) })
    }
}
```


### Day 71–75 — KMP-specific patterns and interoperability


**Coroutine-Swift interoperability:**

- `StateFlow` in Kotlin does not expose well to Swift natively.
- **SKIE** (Swift Kotlin Interface Enhancer): generates Swift-idiomatic wrappers automatically. `StateFlow` → `AsyncSequence`. Sealed classes → Swift enums. The best solution in 2025.
- **KMP-NativeCoroutines**: an alternative that generates `AsyncStream` wrappers.

**Handling iOS main thread:**

- iOS requires UI updates on the main thread. Kotlin/Native coroutines run on a background thread by default.
- Use `@MainActor` equivalent via `Dispatchers.Main` in shared code.
- With SKIE: thread safety is handled transparently.

**Shared** **`Result`** **type:**


Avoid `kotlin.Result` in KMP public APIs exposed to Swift (boxing issues). Use a custom sealed class:


```kotlin
sealed class DataResult<out T> {
    data class Success<T>(val data: T) : DataResult<T>()
    data class Error(val message: String, val cause: Throwable? = null) : DataResult<Nothing>()
    data object Loading : DataResult<Nothing>()
}
```


This maps cleanly to a Swift enum via SKIE.


**KMP module as a CocoaPod / SPM package:**

- Gradle produces an XCFramework for iOS consumption.
- Integrate via CocoaPods: `kotlin { cocoapods { ... } }` in `build.gradle.kts`.
- Or Swift Package Manager (SPM): increasingly supported, preferred for new projects.

**Shared Analytics/Logging:**

- `Napier`: KMP logging library. `Napier.d("message")` in shared code. Each platform prints to Logcat / NSLog.
- Analytics events: define events as sealed classes in `commonMain`. Platform-specific `AnalyticsTracker` implementations call Firebase (Android) or Firebase iOS SDK.

---


## 🔨 Projects


### Project 1 — KMP shared module with full data layer


**Stack:** KMP, Ktor, SQLDelight, Koin, kotlinx.serialization


Build a shared `:shared` module with: `UserRepository` interface in domain, `UserRepositoryImpl` using Ktor for network + SQLDelight for cache in data, Koin DI module in shared, `expect`/`actual` for DB driver and `currentTimeMillis`. Wire to existing Android app from Phase 3. All existing Android tests still pass. Add identical unit tests for the shared module that run on both JVM and iOS simulator.


**Deliverable:** `./gradlew shared:testIosSimulatorArm64` and `./gradlew shared:testDebugUnitTest` both pass. Zero duplicated business logic.


### Project 2 — Compose Multiplatform app (Android + iOS)


**Stack:** CMP, Voyager navigation, Koin, shared `:shared` module


Build a weather app. Shared module: Ktor weather API client, domain models, use cases. Compose UI in `composeApp/commonMain`: home screen (current weather + 7-day forecast), location search screen. Navigation via Voyager. Android entry point in `androidMain`. iOS entry point in `iosMain` (SwiftUI wrapper calling `MainViewController()`). Theme is identical on both platforms.


**Deliverable:** One codebase. Two apps. Same UI. Runs on Android emulator and iOS simulator.


### Project 3 — SKIE + Swift integration


**Deliverable:** Take a shared ViewModel from Project 1. Expose its `StateFlow` to Swift using SKIE. In Swift: collect the `AsyncSequence` in an `ObservableObject`. Display the state in a pure SwiftUI view (no Compose). Demonstrate that the Swift ViewModel is < 30 lines because all logic is in Kotlin.


---


## ⚠️ Common mistakes


### Mistake 1


**✗ Putting Android-specific code in** **`commonMain`****.**


Importing `android.content.Context` in `commonMain` causes a compilation failure on iOS. Engineers from Android-only backgrounds do this instinctively.


**✓ Correct approach:** If you’re tempted to import an Android class in `commonMain`, you need an `expect`/`actual` abstraction. Define an interface or `expect fun` in `commonMain`. Implement with Android APIs in `androidMain`.


### Mistake 2


**✗ Using Room in the shared module.**


Room is an Android-only library. `@Entity`, `@Dao`, `@Database` annotations don’t exist in `commonMain`.


**✓ Correct approach:** SQLDelight for KMP shared modules. If migrating an existing Android app, Room stays in `:feature` Android modules. New shared data layer uses SQLDelight. Both can coexist during migration.


### Mistake 3


**✗ Sharing everything including platform-specific UI behaviour.**


Sharing the touch haptic feedback, the iOS swipe-back gesture, and the Android back button handling in `commonMain` creates platform-uncanny valley: the app feels wrong on both platforms.


**✓ Correct approach:** Share logic, own the platform experience. Business rules, data fetching, and state management are shared. Navigation gestures, platform conventions, and OS-specific interactions stay native. CMP for UI code that is truly identical; native UI for platform-feel interactions.


### Mistake 4


**✗ Ignoring Kotlin/Native memory model for iOS.**


Kotlin/Native (the iOS target) had a strict memory model requiring objects to be “frozen” before sharing between threads. This caused confusing `InvalidMutabilityException` crashes.


**✓ Correct approach:** Kotlin 1.7.20+ uses the new memory model by default — the old model is gone. But: avoid global mutable state in `commonMain`. Use `@ThreadLocal` for thread-local state when needed. Ensure all shared objects are immutable or managed by the coroutine dispatcher.


---


## 🏢 How real companies use KMP


**Netflix — KMP for shared business logic:** Netflix uses KMP to share their A/B testing framework, feature flag evaluation, and analytics logic across Android and iOS. Same experiment logic, same results, one Kotlin codebase. Their iOS team consumes the Kotlin module as an XCFramework.


**Touchlab — KMP consulting reference:** Touchlab (the leading KMP consulting firm) documented that teams sharing 60–70% of their code with KMP reduced mobile team size by 30% without sacrificing native UX. They maintain SKIE and several KMP open-source libraries.


**JetBrains — Fleet IDE:** JetBrains’ Fleet code editor uses Compose Multiplatform for its UI on all platforms: macOS, Windows, Linux. The entire UI codebase is shared Kotlin/Compose. This is the largest production CMP deployment and the proof that CMP can power professional-grade desktop apps.


---


## 📖 Resources

- KMP official docs: [kotlinlang.org/docs/multiplatform.html](http://kotlinlang.org/docs/multiplatform.html)
- KMP Wizard (project generator): [kmp.jetbrains.com](http://kmp.jetbrains.com/)
- SKIE: [github.com/touchlab/SKIE](http://github.com/touchlab/SKIE) (Swift interop, essential for iOS-facing KMP)
- SQLDelight: [sqldelight.github.io/sqldelight](http://sqldelight.github.io/sqldelight)
- Compose Multiplatform: [jb.gg/compose-multiplatform](http://jb.gg/compose-multiplatform)
- Touchlab KMP resources: [touchlab.co/kotlin-multiplatform](http://touchlab.co/kotlin-multiplatform)
- KMP samples: [github.com/JetBrains/compose-multiplatform-ios-android-template](http://github.com/JetBrains/compose-multiplatform-ios-android-template)
