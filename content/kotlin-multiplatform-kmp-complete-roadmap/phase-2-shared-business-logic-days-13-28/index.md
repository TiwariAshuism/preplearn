---
source: notion
title: "Phase 2 — Shared Business Logic (Days 13–28)"
slug: "phase-2-shared-business-logic-days-13-28"
notionId: "36eda883-bddd-8106-aecf-ebbffaf0844c"
notionRootId: "36eda883bddd81b49b29d6afa6a9119c"
parent: "kotlin-multiplatform-kmp-complete-roadmap"
children: []
order: 4
icon: "📁"
cover: null
---
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

