---
source: notion
title: "Phase 1 — KMP Foundations (Days 1–12)"
slug: "phase-1-kmp-foundations-days-1-12"
notionId: "36eda883-bddd-81f2-a83b-f259d8d994d0"
notionRootId: "36eda883bddd81b49b29d6afa6a9119c"
parent: "kotlin-multiplatform-kmp-complete-roadmap"
children: []
order: 5
icon: "📦"
cover: null
---
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

