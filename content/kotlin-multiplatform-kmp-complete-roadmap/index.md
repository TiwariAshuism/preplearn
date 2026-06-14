---
source: notion
title: "🌐 Kotlin Multiplatform (KMP) — Complete Roadmap"
slug: "kotlin-multiplatform-kmp-complete-roadmap"
notionId: "36eda883bddd81b49b29d6afa6a9119c"
notionRootId: "36eda883bddd81b49b29d6afa6a9119c"
parent: null
children: ["60-day-plan-all-days-reference","phase-5-production-and-cicd-days-5560","phase-4-platform-apis-and-ios-interop-days-4354","phase-3-compose-multiplatform-ui-days-29-42","phase-2-shared-business-logic-days-13-28","phase-1-kmp-foundations-days-1-12"]
order: 8
icon: "🌐"
cover: null
---
> 🌐 **One Kotlin codebase. Android. iOS. Desktop. Web.** From KMP project setup to production-grade shared logic, Compose Multiplatform UI, iOS interop with SKIE, and full CI/CD pipeline.

---


## 📌 What this roadmap covers


KMP is not “write once run anywhere.” It is **share logic, own the platform.** Business rules, networking, databases, and state management live in shared Kotlin. The UI and platform-specific behaviour stay native or use Compose Multiplatform. This roadmap builds that system end-to-end.


---


## 🗺️ Roadmap at a glance


| Phase                                 | Days       | Focus                                                        | Key Output                                  |
| ------------------------------------- | ---------- | ------------------------------------------------------------ | ------------------------------------------- |
| Phase 1 — KMP Foundations             | Days 1–12  | Project structure, source sets, expect/actual, Gradle KSP    | Working KMP project on Android + iOS        |
| Phase 2 — Shared Business Logic       | Days 13–28 | Ktor, SQLDelight, Koin, kotlinx.serialization, coroutines    | Full shared data layer                      |
| Phase 3 — Compose Multiplatform       | Days 29–42 | CMP UI, Voyager navigation, shared design system, animations | Identical UI on Android + iOS + Desktop     |
| Phase 4 — Platform APIs & iOS Interop | Days 43–54 | SKIE, Swift interop, camera, GPS, Keychain, notifications    | Native platform features from shared Kotlin |
| Phase 5 — Production & CI/CD          | Days 55–60 | Testing, Fastlane, GitHub Actions, App Store + Play Store    | Fully automated ship pipeline               |


---


## 🛠️ Complete tech stack


| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| Language      | Kotlin 2.x                             |
| Build         | Gradle Kotlin DSL + Convention Plugins |
| Shared UI     | Compose Multiplatform (CMP)            |
| Navigation    | Voyager                                |
| Networking    | Ktor Client                            |
| Local DB      | SQLDelight                             |
| DI            | Koin                                   |
| Serialisation | kotlinx.serialization                  |
| Async         | Kotlin Coroutines + Flow               |
| iOS Interop   | SKIE                                   |
| Image loading | Coil 3 (KMP)                           |
| Date/Time     | kotlinx-datetime                       |
| Testing       | kotlin.test, Turbine, Paparazzi        |
| CI/CD         | GitHub Actions + Fastlane              |
| Analytics     | Firebase KMP wrapper                   |


---


## 📁 Full project structure


```javascript
MyKMPApp/
├── build-logic/                    # Convention plugins
│   └── src/main/kotlin/
│       ├── KmpLibraryConventionPlugin.kt
│       └── AndroidAppConventionPlugin.kt
├── shared/                         # Shared KMP module
│   └── src/
│       ├── commonMain/kotlin/
│       │   ├── data/
│       │   ├── domain/
│       │   └── presentation/
│       ├── commonTest/kotlin/
│       ├── androidMain/kotlin/
│       ├── androidTest/kotlin/
│       ├── iosMain/kotlin/
│       └── iosTest/kotlin/
├── composeApp/                     # Compose Multiplatform UI
│   └── src/
│       ├── commonMain/kotlin/          # All Compose UI here
│       ├── androidMain/kotlin/         # Android entry point
│       ├── iosMain/kotlin/             # iOS entry point
│       └── desktopMain/kotlin/         # Desktop entry point
├── androidApp/                     # Android standalone (optional)
├── iosApp/                         # Xcode project
│   ├── iosApp.xcodeproj/
│   └── iosApp/
│       └── ContentView.swift
└── gradle/
    └── libs.versions.toml              # Version catalog
```


---


## 📊 My progress

- Current phase: **Phase 1**
- Current day: **Day 1 of 60**
- Platforms running: **0 / 4**
- Shared modules built: **0**
- KMP apps shipped: **0**

---


## 🔖 Phase pages

- 📦 Phase 1 — KMP Foundations (Days 1–12)
- 📁 Phase 2 — Shared Business Logic (Days 13–28)
- 🎨 Phase 3 — Compose Multiplatform UI (Days 29–42)
- 📱 Phase 4 — Platform APIs & iOS Interop (Days 43–54)
- 🚀 Phase 5 — Production & CI/CD (Days 55–60)

---


## 📘 The KMP mental model


```javascript
commonMain        — pure Kotlin. NO platform imports. Runs on every target.
                    Domain models, use cases, repository interfaces,
                    Ktor calls, SQLDelight queries, Koin modules, Flows.

androidMain       — Android-specific actual implementations.
                    Context, Android Keystore, Room (if not using SQLDelight).

iosMain           — iOS-specific actual implementations.
                    UIKit/SwiftUI interop, Keychain, NSUserDefaults.

desktopMain       — JVM desktop implementations.
                    File system, system tray, JVM-specific APIs.
```


**The rule:** if you find yourself importing `android.*` or `platform.UIKit.*` inside `commonMain/`, you need an `expect`/`actual` abstraction.


📅 KMP Daily Tracker


## Phase 1 — KMP Foundations (Days 1–12)
> **Core insight:** The KMP build system is the hardest part of getting started. Kotlin targets, source sets, Gradle dependencies, and expect/actual declarations must all be set up correctly before a single line of business logic runs. Invest here — everything else is just Kotlin.

---


## 📅 Day 1–2 — KMP Project Setup


### Method 1: KMP Wizard (recommended start)


```bash
# Use the official JetBrains KMP project generator
# https://kmp.jetbrains.com
# Select: Android + iOS + Desktop
# Opens in Android Studio with Kotlin Multiplatform plugin installed
```


### Method 2: Manual from scratch


```kotlin
// settings.gradle.kts
pluginManagement {
    includeBuild("build-logic")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "MyKMPApp"
include(":shared", ":composeApp", ":androidApp")
```


```toml
# gradle/libs.versions.toml — single source of truth for all versions
[versions]
kotlin = "2.0.21"
agp = "8.5.2"
compose = "1.7.3"
ksp = "2.0.21-1.0.27"
ktor = "3.0.1"
sqldelight = "2.0.2"
koin = "4.0.0"
coil = "3.0.4"
voyager = "1.1.0"
kotlinxSerialization = "1.7.3"
kotlinxCoroutines = "1.9.0"
kotlinxDatetime = "0.6.1"
skie = "0.9.4"
turbine = "1.2.0"

[libraries]
ktor-client-core = { module = "io.ktor:ktor-client-core", version.ref = "ktor" }
ktor-client-okhttp = { module = "io.ktor:ktor-client-okhttp", version.ref = "ktor" }
ktor-client-darwin = { module = "io.ktor:ktor-client-darwin", version.ref = "ktor" }
ktor-client-logging = { module = "io.ktor:ktor-client-logging", version.ref = "ktor" }
ktor-serialization-json = { module = "io.ktor:ktor-serialization-kotlinx-json", version.ref = "ktor" }
ktor-content-negotiation = { module = "io.ktor:ktor-client-content-negotiation", version.ref = "ktor" }
ktor-client-auth = { module = "io.ktor:ktor-client-auth", version.ref = "ktor" }

sqldelight-runtime = { module = "app.cash.sqldelight:runtime", version.ref = "sqldelight" }
sqldelight-coroutines = { module = "app.cash.sqldelight:coroutines-extensions", version.ref = "sqldelight" }
sqldelight-android-driver = { module = "app.cash.sqldelight:android-driver", version.ref = "sqldelight" }
sqldelight-native-driver = { module = "app.cash.sqldelight:native-driver", version.ref = "sqldelight" }
sqldelight-sqlite-driver = { module = "app.cash.sqldelight:sqlite-driver", version.ref = "sqldelight" }

koin-core = { module = "io.insert-koin:koin-core", version.ref = "koin" }
koin-android = { module = "io.insert-koin:koin-android", version.ref = "koin" }
koin-compose = { module = "io.insert-koin:koin-compose", version.ref = "koin" }

voyager-navigator = { module = "cafe.adriel.voyager:voyager-navigator", version.ref = "voyager" }
voyager-screenmodel = { module = "cafe.adriel.voyager:voyager-screenmodel", version.ref = "voyager" }
voyager-koin = { module = "cafe.adriel.voyager:voyager-koin", version.ref = "voyager" }

coil-compose = { module = "io.coil-kt.coil3:coil-compose", version.ref = "coil" }
coil-network-ktor = { module = "io.coil-kt.coil3:coil-network-ktor3", version.ref = "coil" }

kotlinx-serialization-json = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "kotlinxSerialization" }
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "kotlinxCoroutines" }
kotlinx-datetime = { module = "org.jetbrains.kotlinx:kotlinx-datetime", version.ref = "kotlinxDatetime" }

turbine = { module = "app.cash.turbine:turbine", version.ref = "turbine" }

[plugins]
kotlin-multiplatform = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
compose-multiplatform = { id = "org.jetbrains.compose", version.ref = "compose" }
compose-compiler = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
android-application = { id = "com.android.application", version.ref = "agp" }
android-library = { id = "com.android.library", version.ref = "agp" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
sqldelight = { id = "app.cash.sqldelight", version.ref = "sqldelight" }
skie = { id = "co.touchlab.skie", version.ref = "skie" }
```


```kotlin
// shared/build.gradle.kts
plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.sqldelight)
    alias(libs.plugins.ksp)
    alias(libs.plugins.skie)
}

kotlin {
    androidTarget {
        compilations.all {
            kotlinOptions.jvmTarget = "17"
        }
    }

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "Shared"
            isStatic = true
        }
    }

    jvm("desktop")

    sourceSets {
        commonMain.dependencies {
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.kotlinx.datetime)
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.logging)
            implementation(libs.ktor.serialization.json)
            implementation(libs.ktor.content.negotiation)
            implementation(libs.ktor.client.auth)
            implementation(libs.sqldelight.runtime)
            implementation(libs.sqldelight.coroutines)
            implementation(libs.koin.core)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation(libs.turbine)
            implementation(libs.kotlinx.coroutines.core)  // for runTest
        }
        androidMain.dependencies {
            implementation(libs.ktor.client.okhttp)
            implementation(libs.sqldelight.android.driver)
            implementation(libs.koin.android)
        }
        val iosMain by getting {
            dependencies {
                implementation(libs.ktor.client.darwin)
                implementation(libs.sqldelight.native.driver)
            }
        }
        val desktopMain by getting {
            dependencies {
                implementation(libs.ktor.client.okhttp)
                implementation(libs.sqldelight.sqlite.driver)
            }
        }
    }
}

android {
    namespace = "com.myapp.shared"
    compileSdk = 35
    defaultConfig { minSdk = 26 }
}

sqldelight {
    databases {
        create("AppDatabase") {
            packageName.set("com.myapp.db")
        }
    }
}
```


---


## 📅 Day 3–4 — Source Sets & the Dependency Graph


```javascript
Source set hierarchy:

commonMain
  ├── androidMain       (+ androidTest)
  ├── iosMain           (+ iosTest)
  │   ├── iosX64Main
  │   ├── iosArm64Main
  │   └── iosSimulatorArm64Main
  └── desktopMain       (JVM desktop)
```


```kotlin
// Intermediate source sets — share code between iOS targets
kotlin {
    sourceSets {
        // Share code between all Apple targets
        val appleMain by creating {
            dependsOn(commonMain.get())
        }
        val iosMain by getting {
            dependsOn(appleMain)
        }
        val macosMain by getting {
            dependsOn(appleMain)
        }

        // Share code between JVM targets (Android + Desktop)
        val jvmMain by creating {
            dependsOn(commonMain.get())
        }
        val androidMain by getting {
            dependsOn(jvmMain)
        }
        val desktopMain by getting {
            dependsOn(jvmMain)
        }
    }
}
```


---


## 📅 Day 5–7 — expect / actual — The Core Mechanism


### What it solves


`commonMain` cannot import platform APIs. `expect`/`actual` defines an interface in `commonMain` and a platform-specific implementation in each target.


```kotlin
// commonMain: declare the contract
expect class Platform() {
    val name: String
    val version: String
    val isDebug: Boolean
}

expect fun randomUUID(): String

expect fun currentTimeMillis(): Long

expect fun createLogger(tag: String): AppLogger

interface AppLogger {
    fun debug(message: String)
    fun error(message: String, throwable: Throwable? = null)
}
```


```kotlin
// androidMain: Android implementation
actual class Platform actual constructor() {
    actual val name: String = "Android"
    actual val version: String = android.os.Build.VERSION.RELEASE
    actual val isDebug: Boolean = BuildConfig.DEBUG
}

actual fun randomUUID(): String = java.util.UUID.randomUUID().toString()

actual fun currentTimeMillis(): Long = System.currentTimeMillis()

actual fun createLogger(tag: String): AppLogger = AndroidAppLogger(tag)

class AndroidAppLogger(private val tag: String) : AppLogger {
    override fun debug(message: String) = android.util.Log.d(tag, message)
    override fun error(message: String, throwable: Throwable?) {
        android.util.Log.e(tag, message, throwable)
    }
}
```


```kotlin
// iosMain: iOS implementation
actual class Platform actual constructor() {
    actual val name: String = UIDevice.currentDevice.systemName()
    actual val version: String = UIDevice.currentDevice.systemVersion
    actual val isDebug: Boolean = Platform.isSimulator
}

actual fun randomUUID(): String = NSUUID().UUIDString()

actual fun currentTimeMillis(): Long =
    (NSDate().timeIntervalSince1970 * 1000).toLong()

actual fun createLogger(tag: String): AppLogger = IosAppLogger(tag)

class IosAppLogger(private val tag: String) : AppLogger {
    override fun debug(message: String) = NSLog("[$tag] DEBUG: $message")
    override fun error(message: String, throwable: Throwable?) {
        NSLog("[$tag] ERROR: $message ${throwable?.message ?: ""}")
    }
}
```


```kotlin
// desktopMain: JVM desktop implementation
actual class Platform actual constructor() {
    actual val name: String = "Desktop (${System.getProperty("os.name")})"
    actual val version: String = System.getProperty("os.version") ?: "unknown"
    actual val isDebug: Boolean = System.getenv("DEBUG") == "true"
}

actual fun randomUUID(): String = java.util.UUID.randomUUID().toString()
actual fun currentTimeMillis(): Long = System.currentTimeMillis()
```


### Common expect/actual patterns


```kotlin
// Settings / Preferences
expect class AppSettings {
    fun getString(key: String, defaultValue: String = ""): String
    fun putString(key: String, value: String)
    fun remove(key: String)
    fun clear()
}
// Android: SharedPreferences / DataStore
// iOS: NSUserDefaults
// Desktop: java.util.prefs.Preferences

// File system
expect fun getDocumentsDirectory(): String
expect fun getTemporaryDirectory(): String

// Network connectivity
expect class ConnectivityObserver() {
    val isOnline: StateFlow<Boolean>
}

// Crypto / Security
expect fun encryptString(value: String, key: String): String
expect fun decryptString(encrypted: String, key: String): String
// Android: Android Keystore
// iOS: CommonCrypto
// Desktop: javax.crypto
```


---


## 📅 Day 8–9 — Convention Plugins & Build-Logic


```kotlin
// build-logic/build.gradle.kts
plugins {
    `kotlin-dsl`
}
dependencies {
    compileOnly(libs.android.gradlePlugin)
    compileOnly(libs.kotlin.gradlePlugin)
    compileOnly(libs.compose.gradlePlugin)
}

// build-logic/src/main/kotlin/KmpLibraryConventionPlugin.kt
class KmpLibraryConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        with(pluginManager) {
            apply("org.jetbrains.kotlin.multiplatform")
            apply("com.android.library")
        }
        extensions.configure<KotlinMultiplatformExtension> {
            androidTarget {
                compilations.all {
                    kotlinOptions.jvmTarget = JavaVersion.VERSION_17.toString()
                }
            }
            iosX64(); iosArm64(); iosSimulatorArm64()
            sourceSets.commonMain.dependencies {
                implementation(libs.findLibrary("kotlinx-coroutines-core").get())
                implementation(libs.findLibrary("koin-core").get())
            }
        }
        extensions.configure<LibraryExtension> {
            compileSdk = 35
            defaultConfig.minSdk = 26
        }
    }
}
```


---


## 📅 Day 10–12 — Phase 1 Project: KMP Skeleton App


**Build and run on ALL platforms:**


```kotlin
// commonMain — Platform info screen
class PlatformViewModel : ViewModel() {
    private val platform = Platform()
    val platformInfo: StateFlow<PlatformInfo> = MutableStateFlow(
        PlatformInfo(
            name = platform.name,
            version = platform.version,
            uuid = randomUUID(),
            time = currentTimeMillis()
        )
    ).asStateFlow()
}

data class PlatformInfo(
    val name: String,
    val version: String,
    val uuid: String,
    val time: Long
)
```


**Deliverables:**

- `./gradlew :shared:testDebugUnitTest` — all tests pass on JVM
- `./gradlew :shared:iosSimulatorArm64Test` — all tests pass on iOS sim
- Android app runs in emulator showing platform info
- iOS app runs in simulator showing platform info
- Desktop app runs showing platform info
- All three show different platform names from the SAME shared `Platform()` class

---


## ⚠️ Common mistakes Phase 1


### Mistake 1


**❌ Importing Android classes in** **`commonMain`****.**


`import android.util.Log` in a `commonMain` file compiles for Android but fails for iOS/Desktop.


**✅** Use `expect`/`actual` for all platform APIs. The rule: if the IDE shows a red import in `commonMain`, it needs an abstraction.


### Mistake 2


**❌ Using** **`@JvmStatic`** **or** **`@JvmOverloads`** **in** **`commonMain`****.**


JVM annotations don’t exist on iOS targets. Compilation fails.


**✅** Put JVM-specific annotations in `androidMain` or `jvmMain` source sets only.


### Mistake 3


**❌ Wrong Gradle source set naming.** `iosMain` and `val iosMain by getting` — if targets aren’t declared before source sets are configured, you get “source set not found” errors.


**✅** Always declare targets (iosX64, iosArm64, etc.) BEFORE configuring source sets in the `kotlin { }` block.


## Phase 2 — Shared Business Logic (Days 13–28)
> **Core insight:** The shared business logic layer is where KMP pays off. One Ktor client, one SQLDelight schema, one Koin module, one set of use cases — runs identically on Android, iOS, and Desktop. Every line written here is a line never written twice.

---


## 📅 Day 13–15 — Ktor Client: Shared Networking


### Why Ktor for KMP


Ktor is the only HTTP client with a genuine KMP implementation. Same API on all targets. Engine is injected per platform via `expect`/`actual`.


```kotlin
// commonMain — data/remote/HttpClientFactory.kt
package com.myapp.data.remote

import io.ktor.client.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

fun createHttpClient(
    engine: HttpClientEngine,
    tokenProvider: () -> String?
): HttpClient = HttpClient(engine) {

    install(ContentNegotiation) {
        json(Json {
            ignoreUnknownKeys = true
            isLenient = true
            prettyPrint = false
        })
    }

    install(Logging) {
        logger = Logger.DEFAULT
        level = LogLevel.HEADERS
        sanitizeHeader { header -> header == "Authorization" }
    }

    install(Auth) {
        bearer {
            loadTokens {
                val token = tokenProvider() ?: return@loadTokens null
                BearerTokens(accessToken = token, refreshToken = "")
            }
            refreshTokens {
                // refresh logic here
                null
            }
        }
    }

    install(HttpTimeout) {
        connectTimeoutMillis = 10_000
        requestTimeoutMillis = 30_000
        socketTimeoutMillis = 30_000
    }

    install(HttpRequestRetry) {
        retryOnServerErrors(maxRetries = 2)
        exponentialDelay()
    }

    defaultRequest {
        url("https://api.myapp.com/v1/")
        headers.append("Accept", "application/json")
    }
}
```


```kotlin
// expect/actual for engine injection
// commonMain
expect fun createPlatformHttpEngine(): HttpClientEngine

// androidMain
actual fun createPlatformHttpEngine(): HttpClientEngine =
    OkHttp.create {
        config {
            retryOnConnectionFailure(true)
            followRedirects(true)
        }
    }

// iosMain
actual fun createPlatformHttpEngine(): HttpClientEngine =
    Darwin.create {
        configureRequest {
            setAllowsCellularAccess(true)
            setTimeoutInterval(30.0)
        }
    }

// desktopMain
actual fun createPlatformHttpEngine(): HttpClientEngine =
    OkHttp.create()
```


### Remote data sources


```kotlin
// commonMain — data/remote/dto/UserDto.kt
@Serializable
data class UserDto(
    @SerialName("id") val id: String,
    @SerialName("name") val name: String,
    @SerialName("email") val email: String,
    @SerialName("avatar_url") val avatarUrl: String?,
    @SerialName("created_at") val createdAt: String
)

@Serializable
data class UserListResponse(
    @SerialName("data") val data: List<UserDto>,
    @SerialName("total") val total: Int,
    @SerialName("page") val page: Int
)

// commonMain — data/remote/UserRemoteDataSource.kt
class UserRemoteDataSource(private val client: HttpClient) {

    suspend fun getUsers(page: Int = 1): Result<UserListResponse> =
        runCatching {
            client.get("users") {
                parameter("page", page)
                parameter("limit", 20)
            }.body<UserListResponse>()
        }

    suspend fun getUserById(id: String): Result<UserDto> =
        runCatching {
            client.get("users/$id").body<UserDto>()
        }

    suspend fun createUser(request: CreateUserRequest): Result<UserDto> =
        runCatching {
            client.post("users") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }.body<UserDto>()
        }

    suspend fun uploadAvatar(
        userId: String,
        imageBytes: ByteArray,
        fileName: String
    ): Result<UserDto> = runCatching {
        client.submitFormWithBinaryData(
            url = "users/$userId/avatar",
            formData = formData {
                append("avatar", imageBytes, Headers.build {
                    append(HttpHeaders.ContentType, "image/jpeg")
                    append(HttpHeaders.ContentDisposition, "filename=$fileName")
                })
            }
        ).body<UserDto>()
    }
}
```


### Error handling with sealed Result


```kotlin
// commonMain — domain/util/NetworkResult.kt
sealed interface NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>
    data class Error(
        val code: Int? = null,
        val message: String? = null,
        val cause: Throwable? = null
    ) : NetworkResult<Nothing>
    data object Loading : NetworkResult<Nothing>
}

// Extension to wrap Ktor exceptions
suspend fun <T> safeApiCall(block: suspend () -> T): NetworkResult<T> {
    return try {
        NetworkResult.Success(block())
    } catch (e: ClientRequestException) {
        NetworkResult.Error(code = e.response.status.value, message = e.message)
    } catch (e: ServerResponseException) {
        NetworkResult.Error(code = e.response.status.value, message = "Server error")
    } catch (e: IOException) {
        NetworkResult.Error(message = "Network unavailable")
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Unknown error")
    }
}
```


---


## 📅 Day 16–18 — SQLDelight: Shared Local Database


### Why SQLDelight for KMP


SQLDelight generates type-safe Kotlin from SQL. Works on Android (SQLite), iOS (native SQLite), and Desktop (H2/SQLite). Same queries. Same generated API. No ORM magic.


```sql
-- shared/src/commonMain/sqldelight/com/myapp/db/User.sq

CREATE TABLE User (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatarUrl TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    isCached INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX user_email_idx ON User(email);

-- Named queries (SQLDelight generates typed functions for each)
selectAll:
SELECT * FROM User ORDER BY createdAt DESC;

selectById:
SELECT * FROM User WHERE id = ?;

selectByEmail:
SELECT * FROM User WHERE email = ?;

insertOrReplace:
INSERT OR REPLACE INTO User(id, name, email, avatarUrl, createdAt, updatedAt, isCached)
VALUES (?, ?, ?, ?, ?, ?, ?);

updateName:
UPDATE User SET name = ?, updatedAt = ? WHERE id = ?;

deleteById:
DELETE FROM User WHERE id = ?;

deleteAll:
DELETE FROM User;

countAll:
SELECT COUNT(*) FROM User;
```


```sql
-- shared/src/commonMain/sqldelight/com/myapp/db/Post.sq
CREATE TABLE Post (
    id TEXT NOT NULL PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

selectByUserId:
SELECT * FROM Post WHERE userId = ? ORDER BY createdAt DESC;

selectWithUser:
SELECT Post.*, User.name AS authorName, User.avatarUrl AS authorAvatar
FROM Post
INNER JOIN User ON Post.userId = User.id
ORDER BY Post.createdAt DESC;

insert:
INSERT INTO Post(id, userId, title, body, createdAt) VALUES (?, ?, ?, ?, ?);
```


### Database driver: expect/actual


```kotlin
// commonMain
expect fun createDatabaseDriver(context: Any? = null): SqlDriver

// androidMain
actual fun createDatabaseDriver(context: Any?): SqlDriver =
    AndroidSqliteDriver(
        schema = AppDatabase.Schema,
        context = context as Context,
        name = "app.db"
    )

// iosMain
actual fun createDatabaseDriver(context: Any?): SqlDriver =
    NativeSqliteDriver(
        schema = AppDatabase.Schema,
        name = "app.db"
    )

// desktopMain
actual fun createDatabaseDriver(context: Any?): SqlDriver =
    JdbcSqliteDriver(
        url = "jdbc:sqlite:app.db",
        properties = Properties().apply { put("foreign_keys", "true") }
    ).also { driver ->
        AppDatabase.Schema.create(driver)
    }
```


### Flow-based repository


```kotlin
// commonMain — data/local/UserLocalDataSource.kt
class UserLocalDataSource(private val db: AppDatabase) {

    // Returns a Flow — emits new list whenever DB changes
    fun getAllUsers(): Flow<List<User>> =
        db.userQueries
            .selectAll()
            .asFlow()
            .mapToList(Dispatchers.IO)
            .map { users -> users.map { it.toDomain() } }

    fun getUserById(id: String): Flow<User?> =
        db.userQueries
            .selectById(id)
            .asFlow()
            .mapToOneOrNull(Dispatchers.IO)
            .map { it?.toDomain() }

    suspend fun upsertUser(user: User) {
        withContext(Dispatchers.IO) {
            db.userQueries.insertOrReplace(
                id = user.id,
                name = user.name,
                email = user.email,
                avatarUrl = user.avatarUrl,
                createdAt = user.createdAt.toString(),
                updatedAt = Clock.System.now().toString(),
                isCached = 1
            )
        }
    }

    suspend fun upsertUsers(users: List<User>) {
        withContext(Dispatchers.IO) {
            db.userQueries.transaction {
                users.forEach { user ->
                    db.userQueries.insertOrReplace(
                        id = user.id,
                        name = user.name,
                        email = user.email,
                        avatarUrl = user.avatarUrl,
                        createdAt = user.createdAt.toString(),
                        updatedAt = Clock.System.now().toString(),
                        isCached = 1
                    )
                }
            }
        }
    }
}

// Mapper extension
fun com.myapp.db.User.toDomain(): User = User(
    id = id,
    name = name,
    email = email,
    avatarUrl = avatarUrl,
    createdAt = Instant.parse(createdAt)
)
```


---


## 📅 Day 19–21 — Clean Architecture in shared module


```javascript
shared/commonMain/
  domain/
    model/          — pure data classes (User, Post, etc.)
    repository/     — interfaces (UserRepository)
    usecase/        — single-responsibility business logic
    util/           — Result, NetworkResult, extensions
  data/
    remote/
      dto/           — API response shapes
      UserRemoteDataSource.kt
    local/
      UserLocalDataSource.kt
    repository/
      UserRepositoryImpl.kt
  presentation/
    UserListViewModel.kt
    UserDetailViewModel.kt
```


```kotlin
// domain/model/User.kt
data class User(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String?,
    val createdAt: Instant
)

// domain/repository/UserRepository.kt
interface UserRepository {
    fun getUsers(): Flow<List<User>>
    fun getUserById(id: String): Flow<User?>
    suspend fun refreshUsers(): Result<Unit>
    suspend fun createUser(name: String, email: String): Result<User>
}

// domain/usecase/GetUsersUseCase.kt
class GetUsersUseCase(private val repository: UserRepository) {
    operator fun invoke(): Flow<List<User>> = repository.getUsers()
}

class RefreshUsersUseCase(private val repository: UserRepository) {
    suspend operator fun invoke(): Result<Unit> = repository.refreshUsers()
}

// data/repository/UserRepositoryImpl.kt — offline-first
class UserRepositoryImpl(
    private val remote: UserRemoteDataSource,
    private val local: UserLocalDataSource
) : UserRepository {

    override fun getUsers(): Flow<List<User>> = local.getAllUsers()

    override fun getUserById(id: String): Flow<User?> = local.getUserById(id)

    override suspend fun refreshUsers(): Result<Unit> = runCatching {
        val users = remote.getUsers().getOrThrow()
        local.upsertUsers(users.data.map { it.toDomain() })
    }

    override suspend fun createUser(name: String, email: String): Result<User> =
        runCatching {
            val dto = remote.createUser(CreateUserRequest(name, email)).getOrThrow()
            val user = dto.toDomain()
            local.upsertUser(user)
            user
        }
}
```


---


## 📅 Day 22–24 — Koin: Dependency Injection in KMP


```kotlin
// commonMain — di/SharedModule.kt
val networkModule = module {
    single { createPlatformHttpEngine() }
    single { createHttpClient(get(), get<TokenProvider>()::getToken) }
    single { UserRemoteDataSource(get()) }
}

val databaseModule = module {
    single { createDatabaseDriver(getOrNull()) }
    single { AppDatabase(get()) }
    single { UserLocalDataSource(get()) }
    single { PostLocalDataSource(get()) }
}

val repositoryModule = module {
    single<UserRepository> { UserRepositoryImpl(get(), get()) }
    single<PostRepository> { PostRepositoryImpl(get(), get()) }
}

val useCaseModule = module {
    factory { GetUsersUseCase(get()) }
    factory { RefreshUsersUseCase(get()) }
    factory { GetUserByIdUseCase(get()) }
    factory { CreateUserUseCase(get()) }
}

val viewModelModule = module {
    viewModelOf(::UserListViewModel)
    viewModelOf(::UserDetailViewModel)
    viewModelOf(::CreateUserViewModel)
}

fun sharedModules() = listOf(
    networkModule,
    databaseModule,
    repositoryModule,
    useCaseModule,
    viewModelModule
)
```


```kotlin
// androidMain — di/AndroidModule.kt
val androidModule = module {
    single<TokenProvider> { AndroidTokenProvider(androidContext()) }
    single { createDatabaseDriver(androidContext()) }
}

// Android Application class
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidContext(this@MyApp)
            modules(sharedModules() + androidModule)
        }
    }
}
```


```kotlin
// iosMain — di/IosModule.kt  
val iosModule = module {
    single<TokenProvider> { IosKeychainTokenProvider() }
}

// iOS helper function called from Swift AppDelegate
fun initKoin() {
    startKoin {
        modules(sharedModules() + iosModule)
    }
}
```


---


## 📅 Day 25–27 — Shared ViewModels with KMP-ViewModel


```kotlin
// commonMain — presentation/UserListViewModel.kt
class UserListViewModel(
    private val getUsers: GetUsersUseCase,
    private val refreshUsers: RefreshUsersUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(UserListState())
    val state: StateFlow<UserListState> = _state.asStateFlow()

    private val _effects = Channel<UserListEffect>(Channel.BUFFERED)
    val effects: Flow<UserListEffect> = _effects.receiveAsFlow()

    init {
        observeUsers()
        refresh()
    }

    private fun observeUsers() {
        viewModelScope.launch {
            getUsers()
                .distinctUntilChanged()
                .collect { users ->
                    _state.update { it.copy(users = users, isLoading = false) }
                }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(isRefreshing = true) }
            refreshUsers()
                .onFailure { error ->
                    _state.update { it.copy(isRefreshing = false) }
                    _effects.send(UserListEffect.ShowError(error.message ?: "Unknown error"))
                }
                .onSuccess {
                    _state.update { it.copy(isRefreshing = false) }
                }
        }
    }

    fun onUserClick(userId: String) {
        viewModelScope.launch {
            _effects.send(UserListEffect.NavigateToDetail(userId))
        }
    }
}

data class UserListState(
    val users: List<User> = emptyList(),
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null
)

sealed interface UserListEffect {
    data class NavigateToDetail(val userId: String) : UserListEffect
    data class ShowError(val message: String) : UserListEffect
}
```


---


## 📅 Day 28 — Phase 2 Project: Full Shared Data Layer


**Deliverable: A shared module with the complete data layer for a social app**


```javascript
Features:
  ✓ User list (remote fetch + SQLDelight cache)
  ✓ Offline-first: cached data shown immediately, refresh in background
  ✓ User detail with posts
  ✓ Create user
  ✓ Pull-to-refresh

Tests:
  ✓ UserRepositoryImpl: mock remote, test offline-first flow with Turbine
  ✓ UserListViewModel: test state transitions on success + error
  ✓ SQLDelight: in-memory driver for fast DB tests
  ✓ ./gradlew :shared:allTests passes on JVM + iOS simulator
```


```kotlin
// Test example with Turbine + in-memory SQLite
class UserRepositoryTest {
    private lateinit var repo: UserRepositoryImpl
    private lateinit var db: AppDatabase

    @BeforeTest
    fun setup() {
        val driver = JdbcSqliteDriver(JdbcSqliteDriver.IN_MEMORY)
        AppDatabase.Schema.create(driver)
        db = AppDatabase(driver)
        repo = UserRepositoryImpl(
            remote = FakeUserRemoteDataSource(),
            local = UserLocalDataSource(db)
        )
    }

    @Test
    fun `getUsers emits cached then fresh data`() = runTest {
        repo.getUsers().test {
            assertEquals(emptyList(), awaitItem())  // initially empty
            repo.refreshUsers()                       // trigger refresh
            val users = awaitItem()
            assertEquals(2, users.size)               // fake returns 2 users
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```


---


## ⚠️ Common mistakes Phase 2


### Mistake 1


**❌ Using** **`runBlocking`** **in** **`commonMain`** **tests.** Kotlin/Native (iOS) doesn’t support `runBlocking`.


**✅** Use `runTest` from `kotlinx-coroutines-test`. It’s the only correct way to run coroutine tests in KMP.


### Mistake 2


**❌ Calling SQLDelight queries on the main thread.** iOS crashes with `IllegalStateException` — SQLite on main thread is forbidden on native.


**✅** Always use `withContext(Dispatchers.IO)` for all DB operations, or use SQLDelight’s `asFlow().mapToList(Dispatchers.IO)` which handles threading automatically.


### Mistake 3


**❌ Creating the Ktor** **`HttpClient`** **inside a use case or repository.** Client creation is expensive (connection pools, config). Creating one per request is a memory and latency disaster.


**✅** Create `HttpClient` once via Koin `single { }`. Share it across all data sources.


## Phase 3 — Compose Multiplatform UI (Days 29–42)
> **Core insight:** Compose Multiplatform is not a compromise. The same Compose code that runs on Android runs on iOS and Desktop with full Material 3, animations, gestures, and custom layouts. The only code that differs is the entry point — one `MainActivity` for Android, one `MainViewController` for iOS, one `application {}` block for Desktop.

---


## 📅 Day 29–31 — CMP Project Structure & Entry Points


```kotlin
// composeApp/src/commonMain/kotlin/App.kt
// This file runs on EVERY platform
@Composable
fun App() {
    AppTheme {
        val navigator = rememberNavigator()
        NavigatorWrapper(navigator)
    }
}
```


```kotlin
// composeApp/src/androidMain/kotlin/MainActivity.kt
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            App()
        }
    }
}
```


```kotlin
// composeApp/src/iosMain/kotlin/MainViewController.kt
// Called from Swift: ContentView().body = makeViewController()
fun MainViewController(): UIViewController =
    ComposeUIViewController { App() }
```


```swift
// iosApp/iosApp/ContentView.swift
import SwiftUI
import ComposeApp

struct ContentView: View {
    var body: some View {
        ComposeView()
            .ignoresSafeArea(.keyboard) // Handle keyboard insets
    }
}

struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController()
    }
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}
```


```kotlin
// composeApp/src/desktopMain/kotlin/Main.kt
fun main() = application {
    val state = rememberWindowState(
        width = 1200.dp,
        height = 800.dp
    )
    Window(
        onCloseRequest = ::exitApplication,
        title = "MyKMPApp",
        state = state
    ) {
        App()
    }
}
```


---


## 📅 Day 32–33 — Shared Design System & Material 3 Theming


```kotlin
// commonMain — ui/theme/Theme.kt
private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF6650A4),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFEADDFF),
    onPrimaryContainer = Color(0xFF21005D),
    secondary = Color(0xFF625B71),
    onSecondary = Color(0xFFFFFFFF),
    tertiary = Color(0xFF7D5260),
    background = Color(0xFFFFFBFE),
    surface = Color(0xFFFFFBFE),
    error = Color(0xFFB3261E),
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFD0BCFF),
    onPrimary = Color(0xFF381E72),
    primaryContainer = Color(0xFF4F378B),
    background = Color(0xFF1C1B1F),
    surface = Color(0xFF1C1B1F),
)

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}

// ui/theme/Typography.kt
val AppTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    ),
    headlineLarge = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 32.sp,
        lineHeight = 40.sp
    ),
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    labelSmall = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)
```


### Shared design tokens


```kotlin
// ui/theme/Dimensions.kt
object Dimensions {
    val paddingSmall = 8.dp
    val paddingMedium = 16.dp
    val paddingLarge = 24.dp
    val paddingExtraLarge = 32.dp

    val cornerRadius = 12.dp
    val cornerRadiusSmall = 8.dp
    val cornerRadiusLarge = 24.dp

    val iconSize = 24.dp
    val iconSizeLarge = 32.dp

    val cardElevation = 2.dp
    val buttonHeight = 56.dp
}

// ui/theme/Icons.kt — use Material Icons throughout
object AppIcons {
    val Home = Icons.Rounded.Home
    val Profile = Icons.Rounded.Person
    val Settings = Icons.Rounded.Settings
    val Search = Icons.Rounded.Search
    val Back = Icons.AutoMirrored.Rounded.ArrowBack
    val Add = Icons.Rounded.Add
    val Error = Icons.Rounded.Error
}
```


---


## 📅 Day 34–35 — Voyager Navigation


```kotlin
// commonMain — ui/navigation/AppNavigation.kt
@Composable
fun AppNavigation() {
    Navigator(screen = HomeScreen()) { navigator ->
        SlideTransition(navigator)
    }
}

// Using tab navigation
@Composable
fun AppTabNavigation() {
    TabNavigator(tab = HomeTab) { tabNavigator ->
        Scaffold(
            bottomBar = {
                NavigationBar {
                    TabNavigationItem(HomeTab)
                    TabNavigationItem(SearchTab)
                    TabNavigationItem(ProfileTab)
                }
            }
        ) { paddingValues ->
            Box(modifier = Modifier.padding(paddingValues)) {
                CurrentTab()
            }
        }
    }
}
```


```kotlin
// commonMain — ui/screen/UserListScreen.kt
class UserListScreen : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<UserListViewModel>()
        val state by viewModel.state.collectAsStateWithLifecycle()

        // Collect one-shot effects
        LaunchedEffect(Unit) {
            viewModel.effects.collect { effect ->
                when (effect) {
                    is UserListEffect.NavigateToDetail ->
                        navigator.push(UserDetailScreen(effect.userId))
                    is UserListEffect.ShowError ->
                        // show snackbar
                }
            }
        }

        UserListContent(
            state = state,
            onRefresh = viewModel::refresh,
            onUserClick = viewModel::onUserClick
        )
    }
}

// Composable UI — pure function of state
@Composable
private fun UserListContent(
    state: UserListState,
    onRefresh: () -> Unit,
    onUserClick: (String) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Users") },
                actions = {
                    IconButton(onClick = onRefresh) {
                        Icon(AppIcons.Search, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues).fillMaxSize()) {
            when {
                state.isLoading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
                state.error != null -> ErrorState(message = state.error, onRetry = onRefresh)
                state.users.isEmpty() -> EmptyState(message = "No users yet")
                else -> UserList(
                    users = state.users,
                    isRefreshing = state.isRefreshing,
                    onRefresh = onRefresh,
                    onUserClick = onUserClick
                )
            }
        }
    }
}
```


---


## 📅 Day 36–37 — Shared Component Library


```kotlin
// commonMain — ui/components/UserCard.kt
@Composable
fun UserCard(
    user: User,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(Dimensions.cornerRadius),
        elevation = CardDefaults.cardElevation(defaultElevation = Dimensions.cardElevation)
    ) {
        Row(
            modifier = Modifier.padding(Dimensions.paddingMedium),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Dimensions.paddingMedium)
        ) {
            AsyncImage(
                model = user.avatarUrl,
                contentDescription = "${user.name}'s avatar",
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentScale = ContentScale.Crop,
                error = painterResource(Res.drawable.placeholder_avatar)
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = user.name,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Icon(
                imageVector = Icons.AutoMirrored.Rounded.KeyboardArrowRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// Reusable loading + error + empty states
@Composable
fun LoadingState(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
fun ErrorState(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = AppIcons.Error,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(Modifier.height(16.dp))
        Text(text = message, style = MaterialTheme.typography.bodyLarge, textAlign = TextAlign.Center)
        Spacer(Modifier.height(24.dp))
        Button(onClick = onRetry) { Text("Try Again") }
    }
}

@Composable
fun EmptyState(
    message: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = message, style = MaterialTheme.typography.bodyLarge)
        Spacer(Modifier.height(16.dp))
        action?.invoke()
    }
}
```


---


## 📅 Day 38–39 — Compose Resources (Images, Strings, Fonts)


```kotlin
// Compose Multiplatform Resources — shared across all platforms
// File location: composeApp/src/commonMain/composeResources/

// composeResources/values/strings.xml
<resources>
    <string name="app_name">MyKMPApp</string>
    <string name="users_title">Users</string>
    <string name="loading">Loading...</string>
    <string name="retry">Try Again</string>
    <string name="no_users">No users yet</string>
    <string name="error_network">Network error. Check your connection.</string>
</resources>

// composeResources/values-hi/strings.xml (Hindi localisation)
<resources>
    <string name="app_name">मेरा एप्प</string>
    <string name="users_title">उपयोगकर्ता</string>
</resources>
```


```kotlin
// Using resources in composables
import myapp.composeapp.generated.resources.Res
import myapp.composeapp.generated.resources.*

@Composable
fun GreetingScreen() {
    Column {
        // String resources
        Text(text = stringResource(Res.string.users_title))

        // Image resources
        Image(
            painter = painterResource(Res.drawable.logo),
            contentDescription = null
        )

        // Font resources
        Text(
            text = "Hello",
            fontFamily = FontFamily(Font(Res.font.inter_regular))
        )
    }
}
```


---


## 📅 Day 40–41 — Adaptive Layouts for Different Screen Sizes


```kotlin
// commonMain — adaptive layout for phone + tablet + desktop
@Composable
fun AdaptiveUserLayout(
    users: List<User>,
    selectedUser: User?,
    onUserSelect: (User) -> Unit
) {
    val windowSizeClass = calculateWindowSizeClass()

    when (windowSizeClass.widthSizeClass) {
        WindowWidthSizeClass.Compact -> {
            // Phone: single panel, navigate between screens
            if (selectedUser == null) {
                UserList(users = users, onUserClick = { onUserSelect(it) })
            } else {
                UserDetail(user = selectedUser)
            }
        }
        WindowWidthSizeClass.Medium, WindowWidthSizeClass.Expanded -> {
            // Tablet/Desktop: two-panel layout
            Row(modifier = Modifier.fillMaxSize()) {
                UserList(
                    users = users,
                    onUserClick = { onUserSelect(it) },
                    modifier = Modifier.weight(0.4f)
                )
                VerticalDivider()
                if (selectedUser != null) {
                    UserDetail(
                        user = selectedUser,
                        modifier = Modifier.weight(0.6f)
                    )
                } else {
                    Box(
                        modifier = Modifier.weight(0.6f).fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Select a user")
                    }
                }
            }
        }
    }
}
```


---


## 📅 Day 42 — Phase 3 Project: Full CMP App


**Deliverable: Complete UI running on Android + iOS + Desktop**


```javascript
Screens:
  HomeScreen      — tab navigation hub
  UserListScreen  — list with pull-to-refresh, search, empty/error/loading states
  UserDetailScreen — profile card, posts list, follow button
  CreateUserScreen — form with validation, loading state on submit
  SettingsScreen  — theme toggle, account info

Components:
  UserCard        — avatar, name, email, chevron
  PostCard        — title, body, relative timestamp
  AppButton       — primary/secondary/destructive variants
  AppTextField    — with error state and label
  ConfirmDialog   — reusable modal

Navigation:
  Bottom tab: Home | Search | Profile
  Stack: push UserDetail from UserList
  Adaptive: 2-panel on iPad/desktop

Verify:
  Android emulator: full app works
  iOS simulator: full app works, no layout differences
  Desktop: resizable window, adaptive 2-panel layout at wide size
```


---


## ⚠️ Common mistakes Phase 3


### Mistake 1


**❌ Passing ViewModel directly into child composables.**


Child composables become untestable and unreusable — they can only be used in one context.


**✅** Screen-level composable gets the ViewModel and extracts state + handlers. All children receive plain data types and lambdas. Children are pure functions of their parameters.


### Mistake 2


**❌ Using** **`remember { }`** **for state that must survive screen rotation or process death.**


On Android, configuration changes recreate the composition. `remember` is cleared.


**✅** Use `rememberSaveable { }` for user-input state (text field contents, selected tab). Use ViewModel for anything that comes from the data layer.


### Mistake 3


**❌ Not testing composables with Paparazzi / Roborazzi.**


Visual regressions on one platform are invisible until a user reports them.


**✅** Add Paparazzi screenshot tests for all key components. Run in CI. Fails on any pixel-level change.


## Phase 4 — Platform APIs & iOS Interop (Days 43—54)
> **Core insight:** KMP shares logic. Platforms own their feel. Camera, GPS, biometrics, push notifications, and Keychain are platform APIs that must be accessed from `iosMain` or `androidMain`. SKIE makes the Swift side of this effortless — Kotlin sealed classes become Swift enums, `StateFlow` becomes `AsyncSequence`, coroutines become async/await.

---


## 📅 Day 43–44 — SKIE: Swift-Kotlin Interop Done Right


### Why SKIE


Without SKIE, Kotlin code exposed to Swift is awkward:

- `StateFlow` has no Swift equivalent
- Sealed classes become open classes in Swift (no exhaustive switch)
- Coroutines require manual wrapping

SKIE generates idiomatic Swift wrappers automatically.


```kotlin
// shared/build.gradle.kts
plugins {
    alias(libs.plugins.skie)
}

skie {
    features {
        // All features enabled by default with SKIE 0.9+
        // Sealed classes → Swift enums
        // StateFlow → AsyncSequence
        // Suspend functions → async/await
        // Flows → AsyncStream
    }
}
```


```kotlin
// commonMain — sealed class for UI state
sealed interface AuthState {
    data object Loading : AuthState
    data class Authenticated(val user: User) : AuthState
    data class Unauthenticated(val reason: String? = null) : AuthState
    data class Error(val message: String) : AuthState
}

class AuthViewModel : ViewModel() {
    val authState: StateFlow<AuthState> = MutableStateFlow(AuthState.Loading)
}
```


```swift
// Swift side — SKIE transforms these automatically
func observeAuthState() async {
    for await state in viewModel.authState {
        // SKIE generates a proper Swift enum
        switch state {
        case .loading:
            showLoadingSpinner()
        case .authenticated(let user):
            showHomeScreen(user: user)
        case .unauthenticated(let reason):
            showLoginScreen(message: reason)
        case .error(let message):
            showError(message: message)
        }
    }
}

// Calling suspend functions from Swift
func login(email: String, password: String) async {
    do {
        // SKIE wraps suspend fun as async throws
        let user = try await viewModel.login(email: email, password: password)
        print("Logged in: \(user.name)")
    } catch {
        print("Login failed: \(error)")
    }
}
```


### Initialising Koin from Swift


```kotlin
// iosMain — KoinInitializer.kt
object KoinInitializer {
    fun init() {
        startKoin {
            modules(sharedModules() + iosModule)
        }
    }
}

// Swift AppDelegate / @main App
@main
struct iOSApp: App {
    init() {
        KoinInitializer.shared.init()
    }
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```


---


## 📅 Day 45—46 — Platform APIs: Keychain & Secure Storage


```kotlin
// commonMain — domain/security/SecureStorage.kt
interface SecureStorage {
    suspend fun saveString(key: String, value: String)
    suspend fun getString(key: String): String?
    suspend fun remove(key: String)
    suspend fun clear()
}

// commonMain — domain/security/TokenManager.kt
class TokenManager(private val storage: SecureStorage) {
    suspend fun saveAccessToken(token: String) =
        storage.saveString(KEY_ACCESS_TOKEN, token)

    suspend fun getAccessToken(): String? =
        storage.getString(KEY_ACCESS_TOKEN)

    suspend fun saveRefreshToken(token: String) =
        storage.saveString(KEY_REFRESH_TOKEN, token)

    suspend fun clearTokens() = storage.clear()

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
    }
}
```


```kotlin
// androidMain — security/AndroidSecureStorage.kt
class AndroidSecureStorage(context: Context) : SecureStorage {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    override suspend fun saveString(key: String, value: String) =
        withContext(Dispatchers.IO) { prefs.edit().putString(key, value).apply() }

    override suspend fun getString(key: String): String? =
        withContext(Dispatchers.IO) { prefs.getString(key, null) }

    override suspend fun remove(key: String) =
        withContext(Dispatchers.IO) { prefs.edit().remove(key).apply() }

    override suspend fun clear() =
        withContext(Dispatchers.IO) { prefs.edit().clear().apply() }
}
```


```kotlin
// iosMain — security/IosSecureStorage.kt
class IosSecureStorage : SecureStorage {
    override suspend fun saveString(key: String, value: String) {
        val query = CFDictionaryCreateMutable(null, 0, null, null)
        CFDictionarySetValue(query, kSecClass, kSecClassGenericPassword)
        CFDictionarySetValue(query, kSecAttrAccount, CFStringCreateWithCString(null, key, kCFStringEncodingUTF8))
        SecItemDelete(query)  // delete existing first

        val newItem = CFDictionaryCreateMutable(null, 0, null, null)
        CFDictionarySetValue(newItem, kSecClass, kSecClassGenericPassword)
        CFDictionarySetValue(newItem, kSecAttrAccount, CFStringCreateWithCString(null, key, kCFStringEncodingUTF8))
        val data = value.encodeToByteArray().toNSData()
        CFDictionarySetValue(newItem, kSecValueData, data)
        SecItemAdd(newItem, null)
    }

    override suspend fun getString(key: String): String? {
        val query = CFDictionaryCreateMutable(null, 0, null, null)
        CFDictionarySetValue(query, kSecClass, kSecClassGenericPassword)
        CFDictionarySetValue(query, kSecAttrAccount, CFStringCreateWithCString(null, key, kCFStringEncodingUTF8))
        CFDictionarySetValue(query, kSecReturnData, kCFBooleanTrue)
        var result: CFTypeRef? = null
        val status = SecItemCopyMatching(query, result?.ptr)
        if (status == errSecSuccess) {
            return (result as? NSData)?.toByteArray()?.decodeToString()
        }
        return null
    }

    override suspend fun remove(key: String) { /* SecItemDelete */ }
    override suspend fun clear() { /* SecItemDelete all */ }
}
```


---


## 📅 Day 47—48 — Platform APIs: Camera & Image Picker


```kotlin
// commonMain — expect/actual for image picking
expect class ImagePicker {
    @Composable
    fun registerPicker(onImagePicked: (ByteArray) -> Unit)
    fun pickImage()
}
```


```kotlin
// androidMain
actual class ImagePicker {
    private var onImagePicked: (ByteArray) -> Unit = {}
    private lateinit var launcher: ActivityResultLauncher<PickVisualMediaRequest>

    @Composable
    actual fun registerPicker(onImagePicked: (ByteArray) -> Unit) {
        this.onImagePicked = onImagePicked
        launcher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.PickVisualMedia()
        ) { uri ->
            uri?.let { selectedUri ->
                val context = LocalContext.current
                val bytes = context.contentResolver.openInputStream(selectedUri)?.readBytes()
                bytes?.let { onImagePicked(it) }
            }
        }
    }

    actual fun pickImage() {
        launcher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
    }
}
```


```kotlin
// iosMain
actual class ImagePicker : NSObject(), UIImagePickerControllerDelegateProtocol,
    UINavigationControllerDelegateProtocol {

    private var onImagePicked: (ByteArray) -> Unit = {}
    private var viewController: UIViewController? = null

    @Composable
    actual fun registerPicker(onImagePicked: (ByteArray) -> Unit) {
        this.onImagePicked = onImagePicked
        viewController = LocalUIViewController.current
    }

    actual fun pickImage() {
        val picker = UIImagePickerController()
        picker.sourceType = UIImagePickerControllerSourceType.UIImagePickerControllerSourceTypePhotoLibrary
        picker.delegate = this
        viewController?.presentViewController(picker, animated = true, completion = null)
    }

    override fun imagePickerController(
        picker: UIImagePickerController,
        didFinishPickingMediaWithInfo: Map<Any?, *>
    ) {
        val image = didFinishPickingMediaWithInfo[UIImagePickerControllerOriginalImage] as? UIImage
        image?.let {
            val data = UIImageJPEGRepresentation(it, 0.8)
            val bytes = data?.toByteArray() ?: return
            onImagePicked(bytes)
        }
        picker.dismissViewControllerAnimated(true, completion = null)
    }
}
```


---


## 📅 Day 49—50 — Platform APIs: Push Notifications


```kotlin
// commonMain — notification interface
interface NotificationManager {
    suspend fun requestPermission(): Boolean
    fun showLocalNotification(title: String, body: String, id: Int = 0)
    val fcmToken: Flow<String?>
}

// commonMain — handle notification payloads
@Serializable
data class PushPayload(
    val type: String,
    val targetId: String? = null,
    val message: String? = null
)

class NotificationHandler(
    private val notificationManager: NotificationManager
) {
    fun handlePush(payloadJson: String) {
        val payload = Json.decodeFromString<PushPayload>(payloadJson)
        when (payload.type) {
            "new_message" -> { /* navigate to chat */ }
            "new_follower" -> { /* navigate to profile */ }
            "system" -> { /* show alert */ }
        }
    }
}
```


```kotlin
// androidMain — Firebase Messaging Service
class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // Store via Koin → TokenManager
        GlobalScope.launch {
            KoinPlatform.getKoin().get<TokenManager>().saveFcmToken(token)
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val payload = remoteMessage.data["payload"] ?: return
        KoinPlatform.getKoin().get<NotificationHandler>().handlePush(payload)
    }
}
```


---


## 📅 Day 51—52 — Platform APIs: GPS & Location


```kotlin
// commonMain — domain/location/LocationService.kt
data class Location(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Double,
    val timestamp: Long
)

interface LocationService {
    suspend fun requestPermission(): Boolean
    fun observeLocation(): Flow<Location?>
    suspend fun getCurrentLocation(): Location?
}

// commonMain — use case
class GetNearbyUsersUseCase(
    private val locationService: LocationService,
    private val userRepository: UserRepository
) {
    operator fun invoke(): Flow<List<User>> = flow {
        val location = locationService.getCurrentLocation() ?: return@flow
        userRepository.getNearbyUsers(
            lat = location.latitude,
            lon = location.longitude,
            radiusKm = 10.0
        ).collect { emit(it) }
    }
}
```


```kotlin
// androidMain — LocationServiceImpl using Fused Location Provider
class AndroidLocationService(private val context: Context) : LocationService {
    private val fusedLocationClient =
        LocationServices.getFusedLocationProviderClient(context)

    override suspend fun requestPermission(): Boolean {
        // Use accompanist-permissions or ActivityResultContract
        return true
    }

    override fun observeLocation(): Flow<Location?> = callbackFlow {
        val request = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY, 5000L
        ).build()

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { loc ->
                    trySend(Location(loc.latitude, loc.longitude, loc.accuracy.toDouble(), loc.time))
                }
            }
        }
        fusedLocationClient.requestLocationUpdates(request, callback, Looper.getMainLooper())
        awaitClose { fusedLocationClient.removeLocationUpdates(callback) }
    }

    override suspend fun getCurrentLocation(): Location? =
        suspendCancellableCoroutine { cont ->
            fusedLocationClient.lastLocation
                .addOnSuccessListener { loc ->
                    cont.resume(loc?.let { Location(it.latitude, it.longitude, it.accuracy.toDouble(), it.time) })
                }
                .addOnFailureListener { cont.resume(null) }
        }
}
```


---


## 📅 Day 53—54 — Phase 4 Project: Native Features App


**Deliverable: App using all platform APIs from shared Kotlin**


```javascript
Features:
  ✓ Login with biometrics (FaceID on iOS, Fingerprint on Android)
  ✓ Profile image: pick from gallery or take photo
  ✓ Upload avatar: ByteArray → Ktor multipart → display with Coil
  ✓ Location: show nearby users on a map
  ✓ Push notifications: handle payload → navigate to relevant screen
  ✓ Secure token storage: JWT in Keychain (iOS) / EncryptedSharedPreferences (Android)
  ✓ SKIE: Swift UI consumes Kotlin ViewModel directly

SKIE verification:
  ✓ AuthState sealed class → exhaustive Swift switch
  ✓ StateFlow<UserListState> → for-await loop in Swift
  ✓ suspend fun login() → async throws in Swift
  ✓ No manual wrapping required in any Swift file
```


---


## ⚠️ Common mistakes Phase 4


### Mistake 1


**❌ Writing** **`@ObjCName`** **and manual Swift wrappers instead of using SKIE.**


Before SKIE existed, every Kotlin sealed class, Flow, and coroutine needed manual Swift wrappers. This is 2x the code and always out of sync.


**✅** Use SKIE. It auto-generates everything. The only manual Swift code you write is the entry point (`ContentView.swift`) and UI-specific interactions.


### Mistake 2


**❌ Calling platform APIs from** **`commonMain`** **directly using** **`@OptIn(ExperimentalForeignApi::class)`****.**


This compiles but makes your common module iOS-only. It will fail to compile for Android or Desktop.


**✅** Platform API calls ALWAYS go in platform source sets. `commonMain` only sees the interface (via `expect` or regular interfaces). Implementations live in `androidMain`, `iosMain`, etc.


### Mistake 3


**❌ Not handling iOS memory model in** **`iosMain`** **code.**


Kotlin/Native had strict ownership rules. Although the new memory model (Kotlin 1.7.20+) relaxed most of this, objects shared across threads must still be careful with mutable state.


**✅** Keep shared objects immutable where possible. Use `@ThreadLocal` for thread-specific mutable state. Ensure all network/DB work uses `Dispatchers.IO`.


## Phase 5 — Production & CI/CD (Days 55—60)
> **Core insight:** A KMP app that runs on Android and iOS but requires 15 manual steps to ship is not production-grade. Phase 5 automates everything — testing on all platforms, screenshot regression, Play Store upload, App Store upload — triggered by a single git push.

---


## 📅 Day 55—56 — Testing Strategy for KMP


### The KMP testing pyramid


```javascript
70% — Unit tests in commonTest (JVM + iOS sim)
        Run on JVM: fast, no device needed
        Run on iOS: ./gradlew :shared:iosSimulatorArm64Test

20% — Integration tests (Repository + DB + Network)
        In-memory SQLite driver for DB tests
        MockEngine for Ktor tests

10% — UI tests
        Android: Compose UI tests + Paparazzi screenshot tests
        iOS: XCUITest (via Xcode)
        Desktop: Compose test utilities
```


### commonTest: runs on all targets


```kotlin
// shared/src/commonTest/kotlin/domain/UserRepositoryTest.kt
class UserRepositoryTest {

    private lateinit var repo: UserRepositoryImpl
    private lateinit var db: AppDatabase
    private val fakeRemote = FakeUserRemoteDataSource()

    @BeforeTest
    fun setup() {
        // In-memory driver works on JVM and iOS sim
        val driver = TestSqlDriver()
        db = AppDatabase(driver)
        repo = UserRepositoryImpl(
            remote = fakeRemote,
            local = UserLocalDataSource(db)
        )
    }

    @Test
    fun getUsers_emitsEmpty_thenFreshData() = runTest {
        repo.getUsers().test {
            assertEquals(emptyList(), awaitItem())

            repo.refreshUsers()

            val users = awaitItem()
            assertEquals(2, users.size)
            assertEquals("Alice", users[0].name)

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun refreshUsers_onNetworkError_returnsFailure() = runTest {
        fakeRemote.shouldFail = true
        val result = repo.refreshUsers()
        assertTrue(result.isFailure)
    }

    @Test
    fun createUser_savesLocallyAndReturnsUser() = runTest {
        val result = repo.createUser("Bob", "bob@test.com")
        assertTrue(result.isSuccess)
        assertEquals("Bob", result.getOrNull()?.name)

        repo.getUsers().first().let { users ->
            assertTrue(users.any { it.name == "Bob" })
        }
    }
}

// Test helper: in-memory SQLite driver for KMP
fun TestSqlDriver(): SqlDriver {
    val driver = JdbcSqliteDriver(JdbcSqliteDriver.IN_MEMORY)
    AppDatabase.Schema.create(driver)
    return driver
}
```


### ViewModel tests with Turbine


```kotlin
class UserListViewModelTest {
    private val testDispatcher = UnconfinedTestDispatcher()

    @BeforeTest
    fun setup() {
        Dispatchers.setMain(testDispatcher)
    }

    @AfterTest
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun state_startsLoading_thenShowsUsers() = runTest {
        val fakeRepo = FakeUserRepository()
        val vm = UserListViewModel(
            getUsers = GetUsersUseCase(fakeRepo),
            refreshUsers = RefreshUsersUseCase(fakeRepo)
        )

        vm.state.test {
            // Initial state
            val initial = awaitItem()
            assertTrue(initial.isLoading)

            // After data loads
            fakeRepo.emitUsers(listOf(User(id = "1", name = "Alice", email = "a@test.com", avatarUrl = null, createdAt = Clock.System.now())))
            val withData = awaitItem()
            assertFalse(withData.isLoading)
            assertEquals(1, withData.users.size)

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun onUserClick_emitsNavigationEffect() = runTest {
        val vm = UserListViewModel(GetUsersUseCase(FakeUserRepository()), RefreshUsersUseCase(FakeUserRepository()))

        vm.effects.test {
            vm.onUserClick("user-123")
            val effect = awaitItem()
            assertIs<UserListEffect.NavigateToDetail>(effect)
            assertEquals("user-123", effect.userId)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```


### Fake implementations for testing


```kotlin
// commonTest — fakes used across all test targets
class FakeUserRepository : UserRepository {
    private val _users = MutableStateFlow<List<User>>(emptyList())
    var shouldFail = false

    fun emitUsers(users: List<User>) { _users.value = users }

    override fun getUsers(): Flow<List<User>> = _users
    override fun getUserById(id: String): Flow<User?> =
        _users.map { users -> users.find { it.id == id } }

    override suspend fun refreshUsers(): Result<Unit> {
        if (shouldFail) return Result.failure(IOException("Network error"))
        return Result.success(Unit)
    }

    override suspend fun createUser(name: String, email: String): Result<User> {
        if (shouldFail) return Result.failure(IOException("Network error"))
        val user = User(id = randomUUID(), name = name, email = email, avatarUrl = null, createdAt = Clock.System.now())
        _users.value = _users.value + user
        return Result.success(user)
    }
}
```


### Paparazzi screenshot tests (Android)


```kotlin
// androidTest/kotlin/ui/UserCardTest.kt
class UserCardSnapshotTest {
    @get:Rule
    val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_6,
        theme = "Theme.AppCompat.Light.NoActionBar"
    )

    private val testUser = User(
        id = "1", name = "Ashu Tiwari", email = "ashu@example.com",
        avatarUrl = null, createdAt = Clock.System.now()
    )

    @Test
    fun userCard_defaultState() {
        paparazzi.snapshot {
            AppTheme {
                UserCard(user = testUser, onClick = {})
            }
        }
    }

    @Test
    fun userListContent_loadingState() {
        paparazzi.snapshot {
            AppTheme {
                UserListContent(
                    state = UserListState(isLoading = true),
                    onRefresh = {},
                    onUserClick = {}
                )
            }
        }
    }

    @Test
    fun userListContent_emptyState() {
        paparazzi.snapshot {
            AppTheme {
                UserListContent(
                    state = UserListState(isLoading = false, users = emptyList()),
                    onRefresh = {},
                    onUserClick = {}
                )
            }
        }
    }

    @Test
    fun userListContent_darkMode() {
        paparazzi.unsafeUpdateConfig(DeviceConfig.PIXEL_6.copy(
            nightMode = NightMode.NIGHT
        ))
        paparazzi.snapshot {
            AppTheme(darkTheme = true) {
                UserCard(user = testUser, onClick = {})
            }
        }
    }
}
```


---


## 📅 Day 57—58 — GitHub Actions CI/CD


```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ---- Shared module tests on JVM (fast, runs on Linux) ----
  test-shared-jvm:
    name: Shared JVM Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'zulu'
      - uses: gradle/actions/setup-gradle@v3
      - name: Run shared JVM tests
        run: ./gradlew :shared:testDebugUnitTest
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: jvm-test-results
          path: shared/build/reports/tests/

  # ---- Shared module tests on iOS Simulator (macOS, slower) ----
  test-shared-ios:
    name: Shared iOS Tests
    runs-on: macos-14
    needs: test-shared-jvm   # Only run if JVM tests pass
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'zulu'
      - uses: gradle/actions/setup-gradle@v3
      - name: Run shared iOS simulator tests
        run: ./gradlew :shared:iosSimulatorArm64Test
      - name: Upload iOS test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ios-test-results
          path: shared/build/reports/

  # ---- Screenshot tests (Android) ----
  screenshot-tests:
    name: Paparazzi Screenshot Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'zulu' }
      - uses: gradle/actions/setup-gradle@v3
      - name: Verify screenshots
        run: ./gradlew :composeApp:verifyPaparazziDebug
      - name: Upload screenshot diffs on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshot-diffs
          path: composeApp/build/reports/paparazzi/

  # ---- Lint & static analysis ----
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'zulu' }
      - uses: gradle/actions/setup-gradle@v3
      - run: ./gradlew :composeApp:lintDebug :shared:lint
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lint-results
          path: '**/build/reports/lint-results*.html'

  # ---- Build Android APK/AAB ----
  build-android:
    name: Build Android
    runs-on: ubuntu-latest
    needs: [test-shared-jvm, screenshot-tests, lint]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'zulu' }
      - uses: gradle/actions/setup-gradle@v3
      - name: Decode keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > keystore.jks
      - name: Build release AAB
        run: ./gradlew :composeApp:bundleRelease
        env:
          KEYSTORE_PATH: ../../keystore.jks
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
          STORE_PASSWORD: ${{ secrets.STORE_PASSWORD }}
      - uses: actions/upload-artifact@v4
        with:
          name: android-aab
          path: composeApp/build/outputs/bundle/release/

  # ---- Build iOS XCFramework ----
  build-ios:
    name: Build iOS
    runs-on: macos-14
    needs: [test-shared-ios]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'zulu' }
      - uses: gradle/actions/setup-gradle@v3
      - name: Build XCFramework
        run: ./gradlew :shared:assembleSharedReleaseXCFramework
      - name: Build iOS app archive
        run: |
          xcodebuild archive \
            -project iosApp/iosApp.xcodeproj \
            -scheme iosApp \
            -archivePath build/iosApp.xcarchive \
            -destination 'generic/platform=iOS' \
            CODE_SIGN_STYLE=Manual \
            CODE_SIGN_IDENTITY="${{ secrets.IOS_CODE_SIGN_IDENTITY }}"
      - uses: actions/upload-artifact@v4
        with:
          name: ios-archive
          path: build/iosApp.xcarchive
```


---


## 📅 Day 59 — Fastlane: Automated Deployment


```ruby
# fastlane/Fastfile

# ---- Android ----
platform :android do
  desc "Deploy to Play Store Internal Testing"
  lane :deploy_internal do
    gradle(
      task: "bundle",
      build_type: "Release",
      project_dir: "./",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["STORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"],
      }
    )
    upload_to_play_store(
      track: "internal",
      aab: "composeApp/build/outputs/bundle/release/composeApp-release.aab",
      skip_upload_screenshots: true,
      skip_upload_images: true
    )
  end

  desc "Promote internal to production"
  lane :promote_to_production do
    upload_to_play_store(
      track: "internal",
      track_promote_to: "production",
      rollout: "0.1"  # 10% canary rollout
    )
  end
end

# ---- iOS ----
platform :ios do
  desc "Deploy to TestFlight"
  lane :deploy_testflight do
    # Increment build number
    increment_build_number(
      xcodeproj: "iosApp/iosApp.xcodeproj",
      build_number: ENV["BUILD_NUMBER"]
    )

    # Build and sign
    build_app(
      scheme: "iosApp",
      workspace: "iosApp/iosApp.xcworkspace",
      export_method: "app-store",
      output_directory: "./build"
    )

    # Upload to TestFlight
    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      api_key_path: "fastlane/app_store_key.json"
    )
  end

  desc "Promote TestFlight to App Store"
  lane :release do
    deliver(
      submit_for_review: true,
      automatic_release: false,
      force: true,
      skip_screenshots: true,
      skip_metadata: false
    )
  end
end
```


```yaml
# .github/workflows/deploy.yml — triggered on version tags
name: Deploy

on:
  push:
    tags: ['v*.*.*']

jobs:
  deploy-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with: { ruby-version: '3.2', bundler-cache: true }
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'zulu' }
      - uses: gradle/actions/setup-gradle@v3
      - name: Setup Google Play credentials
        run: echo '${{ secrets.PLAY_STORE_JSON_KEY }}' > fastlane/google-play-key.json
      - name: Decode keystore
        run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > keystore.jks
      - name: Deploy to Play Store
        run: bundle exec fastlane android deploy_internal
        env:
          KEYSTORE_PATH: ../../keystore.jks
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
          STORE_PASSWORD: ${{ secrets.STORE_PASSWORD }}

  deploy-ios:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with: { ruby-version: '3.2', bundler-cache: true }
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'zulu' }
      - uses: gradle/actions/setup-gradle@v3
      - name: Setup App Store Connect API Key
        run: echo '${{ secrets.APP_STORE_CONNECT_KEY }}' > fastlane/app_store_key.json
      - name: Deploy to TestFlight
        run: bundle exec fastlane ios deploy_testflight
        env:
          BUILD_NUMBER: ${{ github.run_number }}
```


---


## 📅 Day 60 — Capstone: Production KMP App


### The flagship project — everything combined


**Architecture summary:**


```javascript
shared/commonMain/
  domain/
    model/          User, Post, Comment
    repository/     interfaces
    usecase/        9 use cases
  data/
    remote/         Ktor + DTOs + mappers
    local/          SQLDelight + 3 .sq files
    repository/     offline-first implementations
  presentation/     5 ViewModels (shared)

composeApp/commonMain/
  ui/
    theme/          Material3 + design tokens
    navigation/     Voyager tabs + stack
    screen/         5 screens
    components/     10 reusable components
    preview/        Paparazzi tests for all components
```


**Deliverables checklist:**


```javascript
Shared module:
  ✓ ./gradlew :shared:testDebugUnitTest — all pass
  ✓ ./gradlew :shared:iosSimulatorArm64Test — all pass
  ✓ 100% of domain + data layer covered by tests
  ✓ FakeRepository implementations for all tests

Android:
  ✓ Release AAB builds successfully
  ✓ Paparazzi screenshots: all components in light + dark + landscape
  ✓ No lint errors
  ✓ ProGuard/R8 rules configured, no crashes from minification

iOS:
  ✓ Runs on iOS 15+ simulator and real device
  ✓ SKIE: all sealed classes are Swift enums
  ✓ SKIE: all StateFlows are AsyncSequence
  ✓ No manual Swift wrappers needed
  ✓ Archives successfully for App Store submission

Desktop:
  ✓ ./gradlew :composeApp:run launches the desktop app
  ✓ Adaptive layout: 2-panel at > 800dp width
  ✓ Keyboard navigation works

CI/CD:
  ✓ PR: JVM tests + screenshot tests + lint run in < 5 min
  ✓ Push to main: iOS tests run on macOS runner
  ✓ git tag v1.0.0: deploys to Play Store internal + TestFlight
  ✓ Zero manual steps to ship a new version

Project structure:
  ✓ Version catalog (libs.versions.toml) for all deps
  ✓ Convention plugins (no duplicated build config)
  ✓ README: setup guide, architecture diagram, how to run each platform
  ✓ Public GitHub repo with clean commit history
```


---


## ⚠️ Common mistakes Phase 5


### Mistake 1


**❌ Running iOS simulator tests on every PR.** macOS runners cost 10x Ubuntu. Running `iosSimulatorArm64Test` on every PR means your CI bill explodes as the team grows.


**✅** Run iOS tests only on pushes to `main` or on PRs that touch `iosMain` files. Use path filters: `on: push: paths: ['shared/src/iosMain/**', 'shared/src/commonMain/**']`.


### Mistake 2


**❌ Not recording Paparazzi baseline screenshots.** First run of `verifyPaparazziDebug` fails because there are no reference images.


**✅** Run `./gradlew :composeApp:recordPaparazziDebug` once to generate baselines. Commit them to git. CI then uses `verify` to detect regressions against the committed baselines.


### Mistake 3


**❌ Hardcoding** **`versionCode`** **in** **`build.gradle.kts`****.** Every Play Store upload requires a unique, incrementing version code. Manual bumping causes forgotten increments and failed uploads.


**✅** Derive `versionCode` from CI: `versionCode = System.getenv("BUILD_NUMBER")?.toInt() ?: 1`. GitHub Actions `${{ github.run_number }}` is always incrementing and unique.


---


## 🏆 You’ve completed the 60-day KMP roadmap


**After 60 days you can:**

- Set up a KMP project from scratch for 4 targets
- Build a complete shared data layer: Ktor + SQLDelight + Koin
- Write a full Compose Multiplatform UI with identical code on Android + iOS + Desktop
- Expose Kotlin code to Swift idiomatically via SKIE
- Implement all platform-specific APIs from shared Kotlin
- Ship to Play Store and App Store from a single git push

**What’s next:**

- Contribute to Touchlab’s KMM-Sample or SKIE
- Add a Web target (Kotlin/Wasm + Compose for Web)
- Explore KMP for backend (Ktor server) — true full-stack Kotlin
- Pair this with the backend roadmap: KMP frontend + Ktor backend = 100% Kotlin

---


## 📖 Resources

- KMP official docs: [kotlinlang.org/docs/multiplatform.html](http://kotlinlang.org/docs/multiplatform.html)
- KMP Wizard: [kmp.jetbrains.com](http://kmp.jetbrains.com/)
- SKIE docs: [skie.touchlab.co](http://skie.touchlab.co/)
- SQLDelight: [sqldelight.github.io/sqldelight](http://sqldelight.github.io/sqldelight)
- Compose Multiplatform: [jb.gg/compose-multiplatform](http://jb.gg/compose-multiplatform)
- Touchlab KMP resources: [touchlab.co/kotlin-multiplatform](http://touchlab.co/kotlin-multiplatform)
- JetBrains CMP samples: [github.com/JetBrains/compose-multiplatform-ios-android-template](http://github.com/JetBrains/compose-multiplatform-ios-android-template)
- Now in Android (architecture reference): [github.com/android/nowinandroid](http://github.com/android/nowinandroid)

## 🗓️ 60-Day Plan — All Days Reference
> Use this as your daily reference. Duplicate one row into your tracker for each day you study. Each day has a specific milestone — not “learn X” but “ship Y.”

---


## 📦 Phase 1 — KMP Foundations (Days 1–12)


| Day | Topic                             | Daily Milestone                                                                                        |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | KMP Project Setup                 | KMP Wizard project. Android + iOS + Desktop all compile. Platform() shows different name on each.      |
| 2   | Gradle KMP Configuration          | libs.versions.toml fully written. shared/build.gradle.kts compiles all 4 targets cleanly.              |
| 3   | Source Sets & Hierarchy           | appleMain intermediate source set created and compiles. Source set hierarchy diagram drawn.            |
| 4   | Source Set Dependencies           | All deps placed per source set. No Android import in commonMain. Verified with compiler.               |
| 5   | expect/actual Basics              | Platform() + randomUUID() + currentTimeMillis() in commonMain. actual in all 3 platforms.              |
| 6   | expect/actual: Settings & Logger  | AppSettings + AppLogger + ConnectivityObserver working on Android + iOS + Desktop.                     |
| 7   | expect/actual: Crypto & Security  | SecureStorage interface. Android EncryptedSharedPreferences + iOS Keychain both work.                  |
| 8   | Convention Plugins                | build-logic module. KmpLibraryConventionPlugin applies to shared. No duplicated Gradle config.         |
| 9   | Static Analysis                   | detekt + ktlint running. BinaryCompatibilityValidator added. API dump committed.                       |
| 10  | **Phase 1 Project: KMP Skeleton** | **3 platforms show Platform().name from same shared class. ./gradlew** **:shared:****allTests green.** |
| 11  | Domain Layer                      | User + Post models. UserRepository interface. 5 use cases. Zero framework imports in domain.           |
| 12  | Clean Architecture in KMP         | Boundaries verified. Mappers written. DTO ≠ domain model ≠ UI model all separate.                      |


---


## 📁 Phase 2 — Shared Business Logic (Days 13–28)


| Day | Topic                                   | Daily Milestone                                                                                       |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 13  | Ktor Client Setup                       | createHttpClient() with ContentNegotiation + Auth + Logging + Retry. Engine injected per platform.    |
| 14  | Ktor DTOs & Error Handling              | UserDto @Serializable. safeApiCall wrapper. NetworkResult sealed class.                               |
| 15  | Ktor Remote Data Sources                | UserRemoteDataSource: getUsers, getUserById, createUser, uploadAvatar all working.                    |
| 16  | SQLDelight Schema                       | User.sq + Post.sq with all queries. ./gradlew generateSqlDelightInterface runs clean.                 |
| 17  | SQLDelight Driver expect/actual         | createDatabaseDriver() actual for Android + iOS + Desktop. DB opens on all platforms.                 |
| 18  | SQLDelight Flow Integration             | getAllUsers() returns Flow<List<User>>. Emits on every table change. mapToList(IO) used.              |
| 19  | Repository Implementation               | UserRepositoryImpl: offline-first. Emits local immediately, refreshes from network async.             |
| 20  | Repository: Create & Update             | createUser + updateUser + deleteUser all working. SQLDelight transactions used for bulk ops.          |
| 21  | Koin: DI Module Setup                   | networkModule + databaseModule + repositoryModule. sharedModules() function exported.                 |
| 22  | Koin: Android & iOS Modules             | androidModule with Context. iosModule. startKoin called correctly on both platforms.                  |
| 23  | Koin: ViewModel Module                  | viewModelModule with viewModelOf(). koinViewModel() in Compose. koinScreenModel() in Voyager.         |
| 24  | Shared ViewModel                        | UserListViewModel: StateFlow<UserListState> + Channel<UserListEffect>. init observes + refreshes.     |
| 25  | ViewModel: State Machine                | Loading → Success → Error states. Refresh updates isRefreshing not isLoading. Effects fire once.      |
| 26  | ViewModel: Create & Detail              | CreateUserViewModel with form validation. UserDetailViewModel with posts sub-list.                    |
| 27  | Offline-First: TTL & Cache Invalidation | Cache TTL in SQLDelight (updatedAt column). Stale check in repository before network call.            |
| 28  | **Phase 2 Project: Full Data Layer**    | **FakeRepository tests pass with Turbine on JVM + iOS. Offline-first flow verified. allTests green.** |


---


## 🎨 Phase 3 — Compose Multiplatform UI (Days 29–42)


| Day | Topic                             | Daily Milestone                                                                                     |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| 29  | CMP Entry Points                  | App() in commonMain. MainActivity + MainViewController + Desktop main(). All load same Composable.  |
| 30  | ContentView.swift + Koin Init     | ContentView wraps ComposeUIViewController. KoinInitializer.init() in SwiftUI @main App.             |
| 31  | Material 3 Theme                  | LightColorScheme + DarkColorScheme + AppTypography + AppShapes. AppTheme() composable.              |
| 32  | Design Tokens                     | Dimensions, AppIcons, AppColors objects. All components use tokens, no hardcoded values.            |
| 33  | Voyager Tab Navigation            | TabNavigator with Home + Search + Profile tabs. BottomNavigationBar. TabNavigationItem.             |
| 34  | Voyager Stack Navigation          | Navigator + SlideTransition. UserListScreen pushes UserDetailScreen. Back stack works.              |
| 35  | UserListScreen                    | Loading/Empty/Error/Content states. PullRefresh. Voyager LocalNavigator for navigation.             |
| 36  | UserDetailScreen                  | User profile header. Posts LazyColumn. Follow button with loading state.                            |
| 37  | Shared Components                 | UserCard, PostCard, AppButton (3 variants), AppTextField (with error), ConfirmDialog.               |
| 38  | Compose Resources                 | strings.xml (EN + HI). painterResource for images. fontResource. stringResource used everywhere.    |
| 39  | CreateUserScreen                  | Form with validation. isSubmitting state disables button. Error messages below fields.              |
| 40  | SettingsScreen                    | Theme toggle. Account info. Logout with ConfirmDialog. All state in SettingsViewModel.              |
| 41  | Adaptive Layouts                  | WindowSizeClass used. Phone: single panel. Tablet/Desktop: 2-panel master-detail.                   |
| 42  | **Phase 3 Project: Full CMP App** | **Android + iOS + Desktop: all 5 screens working. Navigation correct. Adaptive layout on desktop.** |


---


## 📱 Phase 4 — Platform APIs & iOS Interop (Days 43–54)


| Day | Topic                                | Daily Milestone                                                                                      |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 43  | SKIE Installation & Config           | skie {} block in shared/build.gradle.kts. Build succeeds. Check Swift output has no manual wrappers. |
| 44  | SKIE: StateFlow → AsyncSequence      | AuthState sealed class. Swift for-await loop over viewModel.authState. Exhaustive switch works.      |
| 45  | SKIE: Suspend → async/throws         | login() suspend fun called as async throws in Swift. Error mapped to Swift Error type.               |
| 46  | SecureStorage: Android               | AndroidSecureStorage with EncryptedSharedPreferences. saveString + getString + clear tested.         |
| 47  | SecureStorage: iOS Keychain          | IosSecureStorage with SecItem APIs. Save + retrieve token. Survives app restart.                     |
| 48  | Image Picker: Android                | ActivityResultContracts.PickVisualMedia. ByteArray returned. Upload via Ktor multipart.              |
| 49  | Image Picker: iOS                    | UIImagePickerController delegate. ByteArray from UIImageJPEGRepresentation. Upload tested.           |
| 50  | Push Notifications                   | NotificationHandler in commonMain parses payload. AndroidFMS + iOS APNs delegate both route to it.   |
| 51  | GPS & Location: Android              | AndroidLocationService with FusedLocationProvider. getCurrentLocation() tested.                      |
| 52  | GPS & Location: iOS                  | IosLocationService with CLLocationManager. requestPermission() returns Bool. Flow works.             |
| 53  | Biometric Auth                       | BiometricManager expect/actual. Android BiometricPrompt. iOS LAContext evaluatePolicy.               |
| 54  | **Phase 4 Project: Native Features** | **Login with biometrics. Photo upload. Push notification routing. GPS nearby users. SKIE verified.** |


---


## 🚀 Phase 5 — Production & CI/CD (Days 55—60)


| Day | Topic                            | Daily Milestone                                                                             |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| 55  | Testing: commonTest + Turbine    | UserRepositoryTest with TestSqlDriver + FakeRemote. runTest used. JVM + iOS sim both pass.  |
| 56  | Testing: ViewModel + Paparazzi   | UserListViewModelTest state machine tested. Paparazzi: UserCard in light/dark/landscape.    |
| 57  | GitHub Actions: CI Pipeline      | PR workflow: JVM tests + screenshot tests + lint in < 5 min. iOS tests on main branch only. |
| 58  | GitHub Actions: Build Pipeline   | build-android job: release AAB signed + artifact. build-ios job: XCFramework + archive.     |
| 59  | Fastlane: Deploy                 | fastlane android deploy_internal uploads AAB. fastlane ios deploy_testflight uploads IPA.   |
| 60  | **Capstone: Production KMP App** | **git tag v1.0.0 → Play Store internal + TestFlight automatically. All checklists green.**  |


---


## 📊 Daily habit

1. Open this table. Find today’s row.
2. Study the topic. Write the code.
3. Hit the daily milestone — not “read about it” but “ship it.”
4. Log in tracker: tick **Runs on Android / iOS / Desktop** when each target works.
5. Tick **Code in commonMain** if you wrote platform-agnostic shared code today.
6. Write one sentence in **Key concept learned** — your own words, not copied.
> 💡 **The rule:** if the code only runs on one platform, it doesn’t count as KMP. Every day’s milestone must be verified on at least 2 targets.
