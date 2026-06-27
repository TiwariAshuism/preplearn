---
source: notion
title: "🟢 Kotlin Basics & Fundamentals"
slug: "kotlin-basics-and-fundamentals"
notionId: "38ada883-bddd-81af-8ca0-d643a2f1fcdd"
notionRootId: "38ada883bddd811cadbfeb0a79a2e71b"
parent: "android-interview-prep-hub"
children: []
order: 9
icon: "🟢"
cover: null
---

---


## 🧠 Core Language

<details>
<summary>What is Kotlin? How is it different from Java?</summary>

Kotlin is a statically typed, JVM-targeting language developed by JetBrains. Key differences from Java:

- **Null Safety**: Kotlin distinguishes nullable (`String?`) and non-nullable (`String`) types at the compiler level.
- **Conciseness**: Data classes, extension functions, and smart casts eliminate boilerplate.
- **Coroutines**: First-class async/concurrency support.
- **No checked exceptions**: Kotlin does not force you to catch exceptions.
- **Functional programming**: Lambdas, higher-order functions, and collection operators are idiomatic.
- **Interoperability**: 100% compatible with Java — you can call Java code from Kotlin and vice versa.

</details>

<details>
<summary>What is null safety in Kotlin?</summary>

Kotlin's type system distinguishes nullable from non-nullable types at compile time:


```kotlin
var a: String = "hello"   // cannot be null
var b: String? = null      // can be null
b?.length                  // safe call — returns null if b is null
b ?: "default"             // Elvis operator — fallback value
b!!.length                 // non-null assertion — throws NPE if null
```


This eliminates most NullPointerExceptions at compile time.


</details>

<details>
<summary>val vs var</summary>
- `val` = immutable reference (like Java `final`). The object itself can still be mutated.
- `var` = mutable reference, can be reassigned.

```kotlin
val x = 10       // cannot reassign x
var y = 20       // y can be reassigned
y = 30           // OK
```


</details>

<details>
<summary>What is the Elvis operator `?:`?</summary>

The Elvis operator provides a default value when an expression is null:


```kotlin
val length = name?.length ?: 0
// If name is null, length = 0; otherwise length = name.length
```


</details>

<details>
<summary>What are extension functions?</summary>

Extension functions let you add methods to existing classes without inheriting from them:


```kotlin
fun String.isPalindrome(): Boolean {
    return this == this.reversed()
}
"racecar".isPalindrome() // true
```


They're resolved statically and don't modify the original class.


</details>

<details>
<summary>What is a data class?</summary>

A data class auto-generates `equals()`, `hashCode()`, `toString()`, `copy()`, and `componentN()` functions:


```kotlin
data class User(val name: String, val age: Int)
val u1 = User("Ashu", 28)
val u2 = u1.copy(age = 29)
```


Best for immutable value objects, DTOs, and domain models.


</details>

<details>
<summary>Sealed class vs Enum class</summary>

**Enum**: Fixed set of constant instances, all of the same type.


**Sealed class**: Fixed set of subclasses, each can hold different data. Great for modeling states.


```kotlin
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
    object Loading : Result<Nothing>()
}
```


Use sealed classes when subclasses need to carry different payloads.


</details>

<details>
<summary>What is a companion object?</summary>

A companion object is a singleton tied to a class — it replaces Java's `static` members:


```kotlin
class MyClass {
    companion object {
        const val TAG = "MyClass"
        fun create() = MyClass()
    }
}
MyClass.TAG
MyClass.create()
```


</details>

<details>
<summary>Scope functions: let, apply, also, run, with</summary>

| Function | Receiver | Returns         | Common Use                      |
| -------- | -------- | --------------- | ------------------------------- |
| `let`    | `it`     | Lambda result   | Null checks, transformations    |
| `apply`  | `this`   | Receiver object | Object configuration / builder  |
| `also`   | `it`     | Receiver object | Side effects, logging           |
| `run`    | `this`   | Lambda result   | Execute block, compute result   |
| `with`   | `this`   | Lambda result   | Call multiple methods on object |


```kotlin
val user = User().apply {
    name = "Ashu"
    age = 28
}
user?.let { println(it.name) }
```


</details>


---


## 🔁 Higher-Order Functions & Lambdas

<details>
<summary>What is a higher-order function?</summary>

A function that takes a function as parameter or returns a function:


```kotlin
fun operate(x: Int, y: Int, op: (Int, Int) -> Int): Int = op(x, y)
operate(3, 4) { a, b -> a + b } // 7
```


</details>

<details>
<summary>What is an inline function?</summary>

Inline functions copy their body to the call site at compile time, eliminating lambda object allocation overhead:


```kotlin
inline fun measure(block: () -> Unit) {
    val start = System.nanoTime()
    block()
    println(System.nanoTime() - start)
}
```


Use for small functions that accept lambdas to reduce memory pressure.


</details>

<details>
<summary>Difference between inline, noinline, and crossinline</summary>
- `inline`: The entire lambda is inlined at call site.
- `noinline`: Prevents a specific lambda parameter from being inlined (when you want to store it).
- `crossinline`: Allows inlining but prevents non-local returns inside the lambda.

```kotlin
inline fun example(inlined: () -> Unit, noinline notInlined: () -> Unit) {
    inlined()       // inlined
    notInlined()    // stored as object
}
```


</details>

<details>
<summary>Lazy vs lateinit</summary>
- `lazy`: Value is computed once on first access. Thread-safe by default. Used with `val`.
- `lateinit`: Mutable `var` that will be assigned before use. Not null-safe — throws if accessed before init.

```kotlin
val config: Config by lazy { loadConfig() }
lateinit var binding: ActivityMainBinding
```


Use `lazy` for read-only computed values; `lateinit` for DI-injected or lifecycle-bound mutable references.


</details>


---


## 📚 Collections

<details>
<summary>Mutable vs Immutable collections</summary>

Kotlin separates read-only interfaces (`List`, `Set`, `Map`) from mutable ones (`MutableList`, `MutableSet`, `MutableMap`):


```kotlin
val list = listOf(1, 2, 3)           // read-only
val mutableList = mutableListOf(1, 2) // mutable
mutableList.add(3)
```


Read-only collections are not thread-safe — use `ConcurrentHashMap` or coroutine-friendly structures for shared state.


</details>

<details>
<summary>map, filter, reduce, flatMap</summary>

```kotlin
val nums = listOf(1, 2, 3, 4, 5)
nums.filter { it % 2 == 0 }     // [2, 4]
nums.map { it * 2 }              // [2, 4, 6, 8, 10]
nums.reduce { acc, it -> acc + it } // 15
listOf(listOf(1,2), listOf(3,4)).flatMap { it } // [1, 2, 3, 4]
```


`flatMap` maps each element to a collection and flattens the result into a single list.


</details>

<details>
<summary>What is the Result class in Kotlin?</summary>

`Result<T>` is a standard library class that models success or failure:


```kotlin
val result = runCatching { riskyOperation() }
result.onSuccess { println(it) }
result.onFailure { println(it.message) }
```


Great alternative to try/catch chains in functional-style code.


</details>

