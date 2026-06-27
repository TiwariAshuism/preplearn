---
source: notion
title: "🧪 Testing"
slug: "testing"
notionId: "38ada883-bddd-8101-8be7-f689bed70e25"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 3
icon: "🧪"
cover: null
---

---

<details>
<summary>Unit testing a ViewModel</summary>

```kotlin
@ExperimentalCoroutinesApi
class UserViewModelTest {
    @get:Rule
    val coroutineRule = MainDispatcherRule()

    private val mockRepo = mockk<UserRepository>()
    private lateinit var viewModel: UserViewModel

    @Before
    fun setup() {
        viewModel = UserViewModel(mockRepo)
    }

    @Test
    fun `loadUser emits success state`() = runTest {
        coEvery { mockRepo.getUser(1) } returns User(1, "Ashu")
        viewModel.loadUser(1)
        assertEquals(UserState.Success(User(1, "Ashu")), viewModel.uiState.value)
    }
}
```


</details>

<details>
<summary>MainDispatcherRule for coroutines</summary>

```kotlin
class MainDispatcherRule(
    private val dispatcher: TestCoroutineDispatcher = TestCoroutineDispatcher()
) : TestWatcher() {
    override fun starting(desc: Description) {
        Dispatchers.setMain(dispatcher)
    }
    override fun finished(desc: Description) {
        Dispatchers.resetMain()
        dispatcher.cleanupTestCoroutines()
    }
}
```


Replace `Dispatchers.Main` in tests to run coroutines synchronously.


</details>

<details>
<summary>How to test StateFlow / LiveData</summary>

```kotlin
// StateFlow
@Test
fun `state updates correctly`() = runTest {
    val values = mutableListOf<UiState>()
    val job = launch { viewModel.uiState.toList(values) }
    viewModel.loadData()
    job.cancel()
    assertEquals(UiState.Loading, values[0])
    assertTrue(values[1] is UiState.Success)
}

// LiveData (use InstantTaskExecutorRule)
@get:Rule
val liveDataRule = InstantTaskExecutorRule()
```


</details>

<details>
<summary>Mocking with MockK</summary>

```kotlin
val repo = mockk<UserRepository>()
coEvery { repo.getUser(any()) } returns User(1, "Ashu")
coVerify { repo.getUser(1) }

// Relaxed mock (doesn't fail on unstubbed calls)
val relaxedRepo = mockk<UserRepository>(relaxed = true)
```


MockK is the preferred Kotlin mocking library (over Mockito) because it's coroutine-aware.


</details>

<details>
<summary>Testing Room Database</summary>

```kotlin
@RunWith(AndroidJUnit4::class)
class UserDaoTest {
    private lateinit var db: AppDatabase
    private lateinit var dao: UserDao

    @Before
    fun setup() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).allowMainThreadQueries().build()
        dao = db.userDao()
    }

    @After
    fun tearDown() { db.close() }

    @Test
    fun insertAndRetrieve() = runTest {
        dao.insert(User(1, "Ashu"))
        val users = dao.getAll().first()
        assertEquals(1, users.size)
    }
}
```


</details>

<details>
<summary>Compose UI Testing</summary>

```kotlin
@get:Rule
val composeRule = createComposeRule()

@Test
fun myComposableTest() {
    composeRule.setContent {
        MyComposable(text = "Hello")
    }
    composeRule.onNodeWithText("Hello").assertIsDisplayed()
    composeRule.onNodeWithTag("submit_button").performClick()
    composeRule.onNodeWithText("Success").assertExists()
}
```


</details>

