---
source: notion
title: "Phase 5 — Production & CI/CD (Days 55—60)"
slug: "phase-5-production-and-cicd-days-5560"
notionId: "372da883-bddd-8174-92cd-ef0cc0ab26fe"
notionRootId: "36eda883bddd81b49b29d6afa6a9119c"
parent: "kotlin-multiplatform-kmp-complete-roadmap"
children: []
order: 1
icon: "🚀"
cover: null
---
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
