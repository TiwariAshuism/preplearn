---
source: notion
title: "🟡 Android Core Concepts"
slug: "android-core-concepts"
notionId: "38ada883-bddd-81aa-9e6d-eed5355fce30"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 8
icon: "🟡"
cover: null
---

---


## 📱 Activity & Fragment Lifecycle

<details>
<summary>Activity Lifecycle callbacks (in order)</summary>

```javascript
onCreate() → onStart() → onResume() → [RUNNING]
→ onPause() → onStop() → onDestroy()
```

- `onCreate()` — Initialize UI, bindings, ViewModel. Called once.
- `onStart()` — Activity visible but not interactive.
- `onResume()` — Activity in foreground and interactive.
- `onPause()` — Another activity comes to foreground (save lightweight state here).
- `onStop()` — Activity no longer visible (save heavier state here).
- `onDestroy()` — Activity is finishing or being destroyed by system.

</details>

<details>
<summary>Fragment Lifecycle vs Activity Lifecycle</summary>

Fragment has additional callbacks:

- `onAttach()` → `onCreate()` → `onCreateView()` → `onViewCreated()` → `onStart()` → `onResume()`
- `onPause()` → `onStop()` → `onDestroyView()` → `onDestroy()` → `onDetach()`

Key difference: `onDestroyView()` destroys the view hierarchy but the Fragment instance survives (e.g., in backstack). Always clear view references in `onDestroyView()` to avoid memory leaks.


</details>

<details>
<summary>What are Launch Modes in Android?</summary>

Defined in `AndroidManifest.xml` via `android:launchMode`:


| Mode             | Behavior                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `standard`       | New instance always created (default)                                  |
| `singleTop`      | Reuses top-of-stack instance if same; calls `onNewIntent()`            |
| `singleTask`     | Single instance per task; clears tasks above it; calls `onNewIntent()` |
| `singleInstance` | Single instance in its own task, no other activities in same task      |


</details>

<details>
<summary>What is the AndroidManifest.xml?</summary>

The manifest declares:

- App components (Activities, Services, Receivers, Providers)
- Required permissions
- Hardware/software features required
- App metadata (app ID, version, min/target SDK)
- Entry point Activity (intent-filter with MAIN + LAUNCHER)

</details>


---


## 🔄 Intents

<details>
<summary>Explicit vs Implicit Intents</summary>
- **Explicit**: Directly specifies the target component (class name).

```kotlin
startActivity(Intent(this, DetailActivity::class.java))
```

- **Implicit**: Declares an action; the system finds the matching component.

```kotlin
val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com"))
startActivity(intent)
```


</details>

<details>
<summary>How to pass data between Activities?</summary>

```kotlin
// Sending
val intent = Intent(this, DetailActivity::class.java)
intent.putExtra("USER_ID", 42)
startActivity(intent)

// Receiving
val userId = intent.getIntExtra("USER_ID", -1)
```


For complex objects, use `Parcelable` (faster on Android) or `Serializable`. Prefer `@Parcelize` annotation with the Kotlin plugin.


</details>


---


## 📼 RecyclerView

<details>
<summary>How does RecyclerView work?</summary>

RecyclerView recycles View objects using the **ViewHolder pattern**:

1. `RecyclerView.Adapter` creates `ViewHolder` objects (inflating views).
2. `onBindViewHolder()` binds data to the ViewHolder.
3. When an item scrolls off screen, its ViewHolder is put in a **RecycledViewPool**.
4. New items are bound by reusing pooled ViewHolders — avoiding costly `inflate()` calls.

Always use `DiffUtil` for efficient list updates instead of `notifyDataSetChanged()`.


</details>

<details>
<summary>What is DiffUtil?</summary>

`DiffUtil` computes the difference between two lists and dispatches minimal update operations. It runs on a background thread with `AsyncListDiffer` or `ListAdapter`:


```kotlin
class MyAdapter : ListAdapter<Item, MyViewHolder>(ItemDiffCallback()) {
    class ItemDiffCallback : DiffUtil.ItemCallback<Item>() {
        override fun areItemsTheSame(a: Item, b: Item) = a.id == b.id
        override fun areContentsTheSame(a: Item, b: Item) = a == b
    }
}
```


</details>


---


## 💾 Storage

<details>
<summary>Room Database architecture</summary>

Room is a Jetpack abstraction over SQLite with three main components:

- **Entity** (`@Entity`): Data class mapped to a DB table.
- **DAO** (`@Dao`): Interface with `@Query`, `@Insert`, `@Update`, `@Delete` methods.
- **Database** (`@Database`): Abstract class extending `RoomDatabase`, holds DAOs.

```kotlin
@Entity
data class User(@PrimaryKey val id: Int, val name: String)

@Dao
interface UserDao {
    @Query("SELECT * FROM user") fun getAll(): Flow<List<User>>
    @Insert suspend fun insert(user: User)
}
```


DAO methods can be `suspend` functions or return `Flow` for reactive updates.


</details>

<details>
<summary>Serializable vs Parcelable</summary>
- **Serializable**: Java standard, uses reflection, slower, more GC pressure.
- **Parcelable**: Android-specific, manual marshaling, ~10x faster for IPC/Intent passing.

Use `@Parcelize` from Kotlin Android Extensions to auto-generate Parcelable:


```kotlin
@Parcelize
data class User(val id: Int, val name: String) : Parcelable
```


</details>


---


## 📡 Services & Background Work

<details>
<summary>Types of Services</summary>

| Type                   | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| **Foreground Service** | Visible to user via notification; survives app backgrounding |
| **Background Service** | Limited by OS on API 26+                                     |
| **Bound Service**      | Client-server model; stops when all clients unbind           |


</details>

<details>
<summary>WorkManager vs Service vs JobScheduler</summary>
- **WorkManager**: Recommended for guaranteed deferred background work (even after reboot). Supports chaining, constraints (network, battery), and backoff.
- **Service**: Real-time work while app is running.
- **JobScheduler**: System-level API for scheduled jobs (WorkManager uses it internally on Android 6+).

For most use cases, prefer WorkManager.


</details>

<details>
<summary>Broadcast Receivers</summary>

Components that respond to system-wide broadcast announcements:

- Registered in manifest (static) or `registerReceiver()` (dynamic).
- Examples: `ACTION_BOOT_COMPLETED`, `CONNECTIVITY_CHANGE`, `BATTERY_LOW`.
- Static receivers are restricted on API 26+ for implicit broadcasts.

Always unregister dynamic receivers in `onStop()` or `onDestroy()` to prevent leaks.


</details>


---


## 🔐 Permissions

<details>
<summary>Runtime Permissions flow</summary>

```kotlin
if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
    != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this,
        arrayOf(Manifest.permission.CAMERA), REQUEST_CODE)
}

override fun onRequestPermissionsResult(code: Int, permissions: Array<String>, results: IntArray) {
    if (results[0] == PackageManager.PERMISSION_GRANTED) { /* proceed */ }
}
```


On API 30+, use `ActivityResultContracts.RequestPermission()` with the Activity Result API.


</details>

