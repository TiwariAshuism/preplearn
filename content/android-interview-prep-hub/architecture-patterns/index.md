---
source: notion
title: "🏗️ Architecture Patterns"
slug: "architecture-patterns"
notionId: "38ada883-bddd-81f3-ae93-cc3e2ca56ae9"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 5
icon: "🏗️"
cover: null
---

---


## 🏛️ MVVM

<details>
<summary>What is MVVM and why is it the standard for Android?</summary>

**Model-View-ViewModel**:

- **Model**: Data layer — repositories, data sources, domain entities.
- **View**: UI layer — Activity/Fragment/Composable. Observes ViewModel state.
- **ViewModel**: Holds and exposes UI state. Survives configuration changes. Business logic bridge.

Android-specific benefits:

- `ViewModel` survives rotation (unlike Activity).
- `LiveData`/`StateFlow` are lifecycle-aware.
- Separation makes testing easy (ViewModel doesn't need Android context).

```javascript
View ← observes ← ViewModel ← calls → Repository → DataSource
```


</details>

<details>
<summary>What is ViewModel and why is it important?</summary>

`ViewModel` is a Jetpack component that:

- Survives configuration changes (screen rotation).
- Holds `StateFlow`/`LiveData` for UI state.
- Scoped to a lifecycle (Activity/Fragment/NavGraph).

```kotlin
class UserViewModel(private val repo: UserRepository) : ViewModel() {
    private val _uiState = MutableStateFlow<UserState>(UserState.Loading)
    val uiState: StateFlow<UserState> = _uiState

    fun loadUser(id: Int) = viewModelScope.launch {
        _uiState.value = UserState.Success(repo.getUser(id))
    }
}
```


</details>

<details>
<summary>LiveData vs StateFlow</summary>

|                 | `LiveData`         | `StateFlow`                            |
| --------------- | ------------------ | -------------------------------------- |
| Lifecycle-aware | Yes (built-in)     | Requires `collectAsStateWithLifecycle` |
| Thread-safe     | Yes (`postValue`)  | Yes (Kotlin coroutines)                |
| Transformation  | `map`, `switchMap` | Flow operators                         |
| Kotlin-first    | No                 | Yes                                    |
| Null support    | Yes                | Requires nullable type                 |


Prefer `StateFlow` for new code; it integrates better with coroutines and Compose.


</details>


---


## 🧱 Clean Architecture

<details>
<summary>What is Clean Architecture in Android?</summary>

Clean Architecture separates code into concentric layers with a strict dependency rule: **outer layers depend on inner layers, never the reverse**.


```javascript
Presentation (ViewModel, Composables)
      ↓
Domain (UseCases, Entities, Repository interfaces)
      ↓
Data (RepositoryImpl, DataSources, APIs, DB)
```

- **Domain layer**: Pure Kotlin. No Android dependencies. Holds `UseCase` classes and repository interfaces.
- **Data layer**: Implements repository interfaces. Contains Retrofit/Room.
- **Presentation layer**: ViewModels, UI components.

</details>

<details>
<summary>What is a UseCase?</summary>

A `UseCase` (also called Interactor) encapsulates a single business operation:


```kotlin
class GetUserUseCase(private val repo: UserRepository) {
    suspend operator fun invoke(id: Int): User = repo.getUser(id)
}

// In ViewModel:
val user = getUserUseCase(userId)
```


Benefits: Reusable across ViewModels, easy to test, clear single responsibility.


</details>

<details>
<summary>Repository pattern</summary>

The repository abstracts data sources behind a single interface:


```kotlin
interface UserRepository {
    suspend fun getUser(id: Int): User
}

class UserRepositoryImpl(
    private val api: UserApi,
    private val dao: UserDao
) : UserRepository {
    override suspend fun getUser(id: Int): User {
        return dao.getUser(id) ?: api.getUser(id).also { dao.insert(it) }
    }
}
```


ViewModel/UseCase only knows about the interface — not whether data comes from network or cache.


</details>

<details>
<summary>SOLID principles in Android</summary>
- **S**ingle Responsibility: Each class does one thing (ViewModel ≠ data fetcher).
- **O**pen/Closed: Extend behavior via new classes, not modifying existing ones.
- **L**iskov Substitution: Implementations can replace their interfaces without breaking behavior.
- **I**nterface Segregation: Prefer small, focused interfaces.
- **D**ependency Inversion: Depend on abstractions (interfaces), not concrete classes.

</details>


---


## 🔁 MVI

<details>
<summary>What is MVI architecture?</summary>

**Model-View-Intent**:

- **Model**: Immutable UI state.
- **View**: Renders state, emits user intents.
- **Intent**: User actions that trigger state transitions.

```kotlin
sealed class UserIntent {
    data class LoadUser(val id: Int) : UserIntent()
    object Retry : UserIntent()
}

data class UserState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val error: String? = null
)
```


MVI pairs naturally with `StateFlow` and Compose because both are state-driven. The unidirectional data flow makes state transitions predictable and easy to test.


</details>

