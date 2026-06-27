---
source: notion
title: "💉 Dependency Injection (Hilt)"
slug: "dependency-injection-hilt"
notionId: "38ada883-bddd-81ef-b371-cf7069ca1bf4"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 4
icon: "💉"
cover: null
---

---

<details>
<summary>What is Dependency Injection?</summary>

Dependency Injection is a design pattern where objects receive their dependencies from outside rather than creating them internally:


```kotlin
// Without DI (tight coupling)
class UserViewModel {
    private val repo = UserRepositoryImpl() // creates own dependency
}

// With DI (loose coupling)
class UserViewModel(private val repo: UserRepository) // injected
```


Benefits: testability, swappable implementations, separation of concerns.


</details>

<details>
<summary>What is Hilt and how does it differ from Dagger?</summary>

Hilt is a Jetpack DI framework built on top of Dagger that reduces boilerplate:


|                     | Dagger                    | Hilt                                         |
| ------------------- | ------------------------- | -------------------------------------------- |
| Setup               | Manual components/modules | Auto-generated components                    |
| Android integration | Manual                    | Built-in for Activity/Fragment/ViewModel     |
| Scope               | Custom                    | Predefined (Singleton, ActivityScoped, etc.) |
| Learning curve      | Steep                     | Simpler                                      |


Hilt auto-generates components for standard Android classes.


</details>

<details>
<summary>Setting up Hilt</summary>

```kotlin
@HiltAndroidApp
class MyApp : Application()

@AndroidEntryPoint
class MainActivity : AppCompatActivity()

@HiltViewModel
class UserViewModel @Inject constructor(
    private val repo: UserRepository
) : ViewModel()

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideUserRepo(api: UserApi, dao: UserDao): UserRepository =
        UserRepositoryImpl(api, dao)
}
```


</details>

<details>
<summary>Hilt Scopes</summary>

| Scope Annotation   | Component            | Lifetime           |
| ------------------ | -------------------- | ------------------ |
| `@Singleton`       | `SingletonComponent` | App lifetime       |
| `@ActivityScoped`  | `ActivityComponent`  | Activity lifetime  |
| `@ViewModelScoped` | `ViewModelComponent` | ViewModel lifetime |
| `@FragmentScoped`  | `FragmentComponent`  | Fragment lifetime  |


Always scope at the minimum necessary lifetime to avoid memory leaks.


</details>

<details>
<summary>Injecting interfaces with @Binds</summary>

```kotlin
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    abstract fun bindUserRepo(impl: UserRepositoryImpl): UserRepository
}
```


`@Binds` is more efficient than `@Provides` for binding interface to implementation.


</details>

<details>
<summary>Using @Qualifier for multiple implementations</summary>

```kotlin
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class RemoteDataSource

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class LocalDataSource

// Inject specific one:
class UserRepo @Inject constructor(
    @RemoteDataSource private val remoteSource: UserDataSource,
    @LocalDataSource private val localSource: UserDataSource
)
```


</details>

