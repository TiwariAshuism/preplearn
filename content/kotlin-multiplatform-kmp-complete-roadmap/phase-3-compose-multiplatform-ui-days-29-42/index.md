---
source: notion
title: "Phase 3 — Compose Multiplatform UI (Days 29–42)"
slug: "phase-3-compose-multiplatform-ui-days-29-42"
notionId: "36eda883-bddd-81a0-a1c6-f70a05675902"
notionRootId: "36eda883bddd81b49b29d6afa6a9119c"
parent: "kotlin-multiplatform-kmp-complete-roadmap"
children: []
order: 3
icon: "🎨"
cover: null
---
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

