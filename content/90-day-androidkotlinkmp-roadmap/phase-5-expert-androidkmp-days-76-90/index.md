---
source: notion
title: "Phase 5 — Expert Android/KMP (Days 76–90)"
slug: "phase-5-expert-androidkmp-days-76-90"
notionId: "35bda883-bddd-8137-839d-d7457a9f24ae"
notionRootId: "35ada883bddd81d9ab0ef4abfbd4114b"
parent: "90-day-androidkotlinkmp-roadmap"
children: []
order: 0
icon: "🧠"
cover: null
---
> **Core insight:** At the expert level, the job is not writing features — it is building the systems that let other engineers write features safely, quickly, and correctly. Performance budgets, CI pipelines, build systems, and code quality automation are the infrastructure that multiplies team velocity.

---


## 🧠 Why this phase exists


Phases 1–4 made you a capable Android/KMP engineer. This phase makes you the engineer other teams rely on: the one who owns performance, tooling, CI/CD, and the architectural decisions that affect the whole codebase. These are the staff-level Android skills.


---


## 📚 Topics in order


### Day 76–77 — Android performance profiling


**Android Profiler tools:**

- **CPU Profiler:** record method traces or sample-based profiles. Identify: slow `onDraw()` calls, main thread blocking, unnecessary work during scroll.
- **Memory Profiler:** heap dumps, allocation tracking, leak detection. Find: bitmaps not recycled, activities retained after close, coroutine scope leaks.
- **Network Profiler:** request timing, payload sizes, failed requests.
- **Layout Inspector:** inspect the live Compose composition tree. Find unnecessary recompositions with the recomposition count overlay.

**Compose performance profiling:**

- Enable recomposition count overlay: `enableRecompositionHighlighting()` in debug builds.
- Compose compiler metrics: add `-P plugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=...` to compiler args. Produces reports on unstable classes, skippable vs non-skippable composables.
- `LazyColumn` performance: always use `key { }`. Use `contentType { }` for mixed lists. Avoid creating lambdas inside `items { }` — use `remember`d callbacks.

**Common Android performance issues:**

- **Main thread IO:** `StrictMode.enableDefaults()` in debug builds detects this. Crashes with `StrictMode` policy violations.
- **Overdraw:** use the GPU overdraw visualiser in developer options. Each additional overdraw layer wastes fill rate.
- **Object allocation in hot paths:** avoid allocating objects inside `onDraw()`, inside composable functions that recompose frequently, or inside tight loops.
- **Bitmap recycling:** `Glide`/`Coil` handle this automatically. Custom image loading must explicitly recycle `Bitmap` objects or use `BitmapPool`.

**Memory leak detection:**

- **LeakCanary:** add to debug builds. Automatically detects activity, fragment, and ViewModel leaks. Zero configuration.
- Common leak patterns: anonymous inner class holding an Activity reference, `Handler` with a posted `Runnable` referencing a destroyed Activity, static reference to a Context.

### Day 78–79 — Advanced Gradle and build optimisation


**Gradle build speed:**

- **Configuration cache:** `org.gradle.configuration-cache=true` in `gradle.properties`. Caches the build configuration phase. Significant speedup on large projects.
- **Build cache:** `org.gradle.caching=true`. Caches task outputs. Shared build cache in CI eliminates redundant work across machines.
- **Parallel execution:** `org.gradle.parallel=true`. Modules with no inter-dependency build simultaneously.
- **`--daemon`****:** long-lived Gradle daemon reuses JVM warm state. Default in Android Studio, explicit in CI.

**Dependency management:**

- **Version catalogs (****`libs.versions.toml`****):** centralises all dependency versions. All modules reference `libs.ktor.client.core` instead of hardcoded version strings. Single place to upgrade.
- **Dependency locking:** `dependencyLocking { lockAllConfigurations() }`. Pins transitive dependency versions. Prevents silent upgrades breaking builds.
- **Detecting unused dependencies:** `./gradlew dependencyInsight` + `gradle-dependency-analysis` plugin. Remove unused dependencies to reduce APK size and build time.

**APK/AAB size reduction:**

- **R8/ProGuard:** enable in release builds. R8 removes unused classes (shrinking), obfuscates names (obfuscation), and optimises bytecode.
- **`android:extractNativeLibs="false"`****:** prevents ABI extraction, reducing install size.
- **`resConfigs`****:** `resConfigs("en", "xxhdpi")` strips unused language/density resources in debug builds.
- **App Bundles (AAB):** upload AAB to Play Store. Google Play serves per-device split APKs. 15–20% smaller downloads.

### Day 80–81 — CI/CD for Android and KMP


**GitHub Actions pipeline structure:**


```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'zulu' }
      - uses: gradle/actions/setup-gradle@v3
      - run: ./gradlew testDebugUnitTest  # unit tests
      - run: ./gradlew shared:testDebugUnitTest  # KMP shared tests
      - run: ./gradlew lintDebug  # lint
      - run: ./gradlew detekt  # static analysis

  screenshot-test:
    runs-on: ubuntu-latest
    steps:
      - run: ./gradlew verifyPaparazziDebug  # screenshot regression tests

  build:
    needs: [test, screenshot-test]
    runs-on: ubuntu-latest
    steps:
      - run: ./gradlew assembleRelease
      - uses: actions/upload-artifact@v4
        with: { name: apk, path: app/build/outputs/apk/release/ }
```


**Fastlane for Android:**


```ruby
# fastlane/Fastfile
lane :deploy_internal do
  gradle(task: "bundle", build_type: "Release", properties: { "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"] })
  upload_to_play_store(track: "internal", aab: "app/build/outputs/bundle/release/app-release.aab")
end
```


**Secrets management in CI:**

- Store keystore as a base64-encoded GitHub Secret.
- Decode in CI: `echo $KEYSTORE_BASE64 | base64 --decode > keystore.jks`.
- Never commit keystore files or signing configs with passwords to git.

**KMP iOS CI on GitHub Actions:**

- iOS builds require macOS runners (`runs-on: macos-latest`). These are 10x more expensive than Ubuntu runners.
- **Strategy:** run unit tests (JVM target) on Ubuntu. Run iOS simulator tests on macOS only when needed (e.g., on `main` branch merges, not every PR).
- `./gradlew shared:iosSimulatorArm64Test` for shared module iOS tests.

### Day 82–83 — Code quality automation


**Detekt — Kotlin static analysis:**


```kotlin
// detekt.yml
style:
  MagicNumber:
    active: true
    ignoreNumbers: ['-1', '0', '1', '2']
complexity:
  ComplexMethod:
    threshold: 15
performance:
  ArrayPrimitive:
    active: true
```


Run in CI. Block merges on new violations. Gradually fix existing violations with a `baseline.xml` that suppresses existing issues.


**Ktlint — Kotlin formatting:**

- `./gradlew ktlintCheck` in CI. `./gradlew ktlintFormat` locally.
- Enforce consistent formatting across all contributors. No formatting debates in code review.

**ArchUnit for Android (via custom Gradle task):**


Enforce architecture rules as tests:


```kotlin
@Test
fun `domain layer must not depend on Android`() {
    val classes = ClassFileImporter().importPackages("com.example.domain")
    noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAPackage("android..")
        .check(classes)
}
```


**Danger — automated PR checks:**

- Comment on PRs: “This PR increases APK size by 2MB.” “Test coverage decreased from 82% to 79%.”
- Blocks merge if coverage drops below threshold.
- Runs as part of CI via `bundle exec danger`.

### Day 84–85 — App security and production hardening


**Certificate pinning:**


```kotlin
val certificatePinner = CertificatePinner.Builder()
    .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .build()
val okHttpClient = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```


Prevents MITM attacks by validating the server’s certificate against a known hash. Pin 2 certificates (current + backup) to survive certificate rotation.


**Root/jailbreak detection:**

- `RootBeer` library detects root indicators on Android.
- Not foolproof (advanced root hiders exist), but stops 99% of casual tampering.
- Decision: block rooted devices (banking apps) or warn and log (most apps).

**Sensitive data storage:**

- Never store passwords, tokens, or PII in `SharedPreferences` (unencrypted).
- Use `EncryptedSharedPreferences` (Jetpack Security) or `DataStore` with the `encrypted` extension.
- Tokens: store in Android Keystore-backed `EncryptedSharedPreferences`. Keys never leave the secure enclave.

**Network security config:**


```xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false"> <!-- No HTTP, HTTPS only -->
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" /> <!-- Charles Proxy in debug only -->
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```


**Obfuscation:** R8 obfuscates class and method names in release builds. Add `proguard-rules.pro` to keep: serialisation classes, reflection-based code, JNI entry points. Never ship a release build without obfuscation for security-sensitive apps.


### Day 86–87 — Advanced Compose: custom rendering and animations


**`Canvas`** **API for custom drawing:**


```kotlin
@Composable
fun CircularProgressIndicator(progress: Float, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(48.dp)) {
        val strokeWidth = 4.dp.toPx()
        drawCircle(color = Color.LightGray, style = Stroke(strokeWidth))
        drawArc(
            color = Color.Blue,
            startAngle = -90f,
            sweepAngle = 360f * progress,
            useCenter = false,
            style = Stroke(strokeWidth, cap = StrokeCap.Round)
        )
    }
}
```


**`Animatable`** **for physics-based animation:**


```kotlin
val offsetX = remember { Animatable(0f) }
LaunchedEffect(isVisible) {
    if (isVisible) offsetX.animateTo(0f, spring(dampingRatio = Spring.DampingRatioMediumBouncy))
    else offsetX.animateTo(-300f, tween(300, easing = FastOutLinearInEasing))
}
```


**`Modifier.pointerInput`** **for custom gestures:**


```kotlin
Modifier.pointerInput(Unit) {
    detectDragGestures(
        onDragStart = { /* start */ },
        onDrag = { change, dragAmount -> /* update position */ },
        onDragEnd = { /* snap or settle */ }
    )
}
```


**Compose** **`@Preview`** **at scale:**

- `@PreviewParameter` with a `PreviewParameterProvider` to preview a composable in multiple states without duplicating `@Preview` annotations.
- `@PreviewScreenSizes`, `@PreviewFontScales`, `@PreviewDynamicColors` for systematic coverage.
- Paparazzi renders previews as screenshots in unit tests — no device required.

### Day 88–90 — Staff-level review + portfolio


**Day 88 — Architecture review:**


Conduct a formal review of your Phase 3 app:

- Draw the current module dependency graph. Are there any cycles?
- Run the Compose compiler metrics report. How many composables are skippable? Which are not? Why?
- Run LeakCanary through the main user flows. Any leaks?
- Measure cold start time with Android Profiler. What is the time-to-first-frame? What is the bottleneck?
- Identify the 3 things you would change with more time and document why.

**Day 89 — KMP portfolio project:**


Complete your Compose Multiplatform weather app from Phase 4 with:

- Full CI/CD pipeline (GitHub Actions): unit tests on Ubuntu, Paparazzi screenshot tests, build AAB, upload to Play Store internal track.
- Detekt + Ktlint enforced in CI.
- LeakCanary in debug build. `StrictMode` in debug build.
- R8 fully configured for release.
- Certificate pinning on the API client.
- README documenting architecture decisions, module structure, and how to run on both Android and iOS.

**Day 90 — Engineering portfolio document:**


Write a 1-page summary for each of your 5 major projects from this roadmap:

1. Kotlin coroutines event bus (Phase 1)
2. News reader app (Phase 2)
3. MVI + Clean Architecture task manager (Phase 3)
4. KMP shared module + CMP weather app (Phase 4)
5. Production-hardened app with full CI/CD (Phase 5)

For each: problem statement, architecture decisions with tradeoffs, KMP/Android-specific challenges solved, what you’d do differently, and a link to the GitHub repository.


---


## 🔨 Projects


### Project 1 — Performance audit and optimisation


**Scenario:** Take your Phase 3 app. Measure before. Optimise. Measure after.


**Deliverable:** (1) Baseline measurements: cold start time, `LazyColumn` scroll frame rate (target: 60fps stable), memory usage on the main screen. (2) Enable Compose compiler metrics. Fix all non-skippable composables in the hot path. (3) Profile the cold start path. Defer non-critical initialisation with `App Startup` library. (4) After measurements: document % improvement for each metric. Target: cold start < 800ms, zero jank on scroll, no memory leaks.


### Project 2 — Full CI/CD pipeline for KMP project


**Deliverable:** GitHub Actions pipeline with: (a) PR checks: unit tests (JVM + iOS simulator), Detekt, Ktlint, Paparazzi screenshot tests, (b) merge-to-main: build release AAB, sign, upload to Play Store internal track via Fastlane, (c) automated version bump via semantic-release or a custom Gradle task, (d) Slack notification on deploy success/failure. All secrets managed via GitHub Secrets. Zero manual steps to ship.


### Project 3 — Complete KMP production app


**Stack:** CMP, Voyager, Koin, Ktor, SQLDelight, SKIE, GitHub Actions


Build and ship: a production-quality KMP app (your choice of domain) with: identical UI on Android and iOS via CMP, shared business logic via shared module, full offline support with SQLDelight, SKIE for Swift interop, security hardening (certificate pinning, encrypted storage, no plaintext traffic), full CI/CD pipeline, screenshots in App Store and Play Store descriptions, and a public GitHub repository with a comprehensive README.


**This is your flagship portfolio project.**


---


## ⚠️ Common mistakes


### Mistake 1


**✗ Ignoring build performance until the codebase is large.**


A monolithic module that takes 4 minutes to build doesn’t happen overnight. It grows one class at a time. By the time the pain is obvious, the refactoring cost is enormous.


**✓ Correct approach:** Enforce modularisation from day one with convention plugins. Enable configuration cache and build cache from the first commit. Measure build time on every PR with `./gradlew --profile`. Fix regressions before they compound.


### Mistake 2


**✗ Shipping a debug-configuration app to production.**


Debug builds have: logging enabled (PII in Logcat), `HttpLoggingInterceptor` at `BODY` level (full request/response logged), `debuggable=true` (allows attaching a debugger remotely), `StrictMode` enabled (crashes on strict policy violations), LeakCanary (adds overhead).


**✓ Correct approach:** Use `BuildConfig.DEBUG` to gate all debug-only code. Every debug tool (LeakCanary, Stetho, HttpLoggingInterceptor) is wrapped in `if (BuildConfig.DEBUG)` or added only to `debugImplementation`. Never ship a build without testing it in `release` variant first.


### Mistake 3


**✗ No certificate pinning in security-sensitive apps.**


Without certificate pinning, a compromised CA or a MITM proxy can intercept all HTTPS traffic. This is a critical security vulnerability in banking, health, and payment apps.


**✓ Correct approach:** Pin certificates in OkHttp (Android) and Ktor (KMP). Pin two certificates: the current one and a backup for rotation. Set up monitoring for certificate expiry. Test pinning in a Charles Proxy environment to verify it blocks interception.


### Mistake 4


**✗ Manual version bumps and manual Play Store uploads.**


Manual processes mean: human error (shipping the wrong build), no audit trail, releases blocked when the responsible person is unavailable, and inconsistent versioning.


**✓ Correct approach:** Automate everything. Version codes are derived from the CI build number (`versionCode = System.getenv("BUILD_NUMBER")?.toInt() ?: 1`). Fastlane handles signing and upload. `git tag` triggers the release pipeline. No human touches the release process.


---


## 🏢 How real companies do expert-level Android/KMP


**Square (Block) — Build engineering:** Square's Android team maintains a sophisticated Gradle build system with custom plugins for every convention. Their open-source `radiography` (view hierarchy inspection) and `leakcanary` (memory leak detection) came directly from internal tools. Build tooling is a first-class engineering discipline.


**Bumble — KMP + SKIE in production:** Bumble’s mobile platform team adopted KMP with SKIE to expose Kotlin flows to Swift as `AsyncSequence`. Their iOS developers write idiomatic Swift that calls shared Kotlin logic. The teams measured 40% reduction in mobile feature development time after the migration.


**Grab — Security at scale:** Grab (Southeast Asia’s super-app) implements certificate pinning, root detection, and runtime application self-protection (RASP) across their Android app. Their security engineering team publishes guidelines on preventing common Android vulnerabilities that are referenced throughout the industry.


---


## 🏆 You’ve completed the 90-day Android/Kotlin/KMP roadmap


After 90 days you should be able to:

- Write idiomatic Kotlin with coroutines, Flow, and the full type system
- Build production Android apps with MVI + Clean Architecture + Jetpack Compose
- Design and implement KMP shared modules consumed by both Android and iOS
- Build Compose Multiplatform apps with identical UI across platforms
- Own a complete CI/CD pipeline from commit to Play Store
- Profile, optimise, and harden Android apps for production
- Conduct staff-level architecture reviews on Android codebases

**What’s next:**

- Contribute to KMP open-source (SQLDelight, Ktor, Koin, SKIE)
- Study the Now in Android sample in depth: every decision is documented
- Take on KMP architecture ownership at work: define the shared module boundaries
- Pair this roadmap with the backend roadmap: full-stack Kotlin (KMP frontend + Ktor backend)

---


## 📖 Resources

- Android Performance Patterns: [youtube.com/c/AndroidDevelopers](http://youtube.com/c/AndroidDevelopers)
- _Android App Development_ — Professional Android (Reto Meier)
- LeakCanary: [square.github.io/leakcanary](http://square.github.io/leakcanary)
- SKIE docs: [skie.touchlab.co](http://skie.touchlab.co/)
- Gradle docs: [docs.gradle.org](http://docs.gradle.org/) (configuration cache, build cache)
- Fastlane: [fastlane.tools](http://fastlane.tools/) (the standard for mobile CI/CD)
- _Effective Kotlin_ — Marcin Moskala (advanced idiomatic Kotlin)
