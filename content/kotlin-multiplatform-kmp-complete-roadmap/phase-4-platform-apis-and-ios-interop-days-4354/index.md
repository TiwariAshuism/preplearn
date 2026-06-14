---
source: notion
title: "Phase 4 — Platform APIs & iOS Interop (Days 43—54)"
slug: "phase-4-platform-apis-and-ios-interop-days-4354"
notionId: "372da883-bddd-8191-bc8d-cad90b7e45ac"
notionRootId: "36eda883bddd81b49b29d6afa6a9119c"
parent: "kotlin-multiplatform-kmp-complete-roadmap"
children: []
order: 2
icon: "📱"
cover: null
---
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

