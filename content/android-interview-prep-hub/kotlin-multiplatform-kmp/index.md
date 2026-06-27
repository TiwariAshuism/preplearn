---
source: notion
title: "🌐 Kotlin Multiplatform (KMP)"
slug: "kotlin-multiplatform-kmp"
notionId: "38ada883-bddd-8140-81bf-f427a7d81d1f"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 1
icon: "🌐"
cover: null
---

---

<details>
<summary>What is Kotlin Multiplatform?</summary>

KMP allows sharing Kotlin code across platforms: Android, iOS, Web, Desktop, and Server — without forcing a shared UI layer.

- **Shared module**: Pure Kotlin, no platform-specific APIs.
- **Android/iOS targets**: Platform-specific code in `androidMain` / `iosMain`.

Different from React Native/Flutter: KMP shares **logic**, not UI (unless using Compose Multiplatform for UI too).


</details>

<details>
<summary>expect / actual mechanism</summary>

`expect` declares a contract in shared code; `actual` provides the platform-specific implementation:


```kotlin
// commonMain
expect fun getCurrentTimestamp(): Long

// androidMain
actual fun getCurrentTimestamp(): Long = System.currentTimeMillis()

// iosMain
actual fun getCurrentTimestamp(): Long =
    NSDate().timeIntervalSince1970.toLong() * 1000
```


</details>

<details>
<summary>KMP limitations</summary>
- No direct access to platform APIs from shared code (must use `expect`/`actual`).
- Compose Multiplatform for iOS is still maturing.
- Gradle setup can be complex.
- Some Kotlin coroutine patterns differ between Android and iOS (iOS requires `@SharedImmutable` for shared state in older setups).
- Swift/ObjC interop has some rough edges (generics, coroutines).

</details>

<details>
<summary>What can be shared in KMP?</summary>
- Business logic / UseCases
- Data models / DTOs
- Repository interfaces and implementations (with Ktor for networking, SQLDelight for DB)
- ViewModels (with KMP-ViewModel library)
- Utility functions (date parsing, validation, formatting)

</details>

