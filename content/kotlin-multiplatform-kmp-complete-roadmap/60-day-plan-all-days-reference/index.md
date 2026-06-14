---
source: notion
title: "🗓️ 60-Day Plan — All Days Reference"
slug: "60-day-plan-all-days-reference"
notionId: "373da883-bddd-81f8-a930-d77390c5b8c8"
notionRootId: "36eda883bddd81b49b29d6afa6a9119c"
parent: "kotlin-multiplatform-kmp-complete-roadmap"
children: []
order: 0
icon: "🗓️"
cover: null
---
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
