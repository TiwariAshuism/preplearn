---
source: notion
title: "Phase 1 — Swift Foundations (Days 1–15)"
slug: "phase-1-swift-foundations-days-1-15"
notionId: "39cda883-bddd-8158-b5d2-c437d961135f"
notionRootId: "39cda883bddd81908f86f82489b8c0c1"
parent: "90-day-swift-ios-development-roadmap-beginner-to-advanced"
children: []
order: 1
icon: "🔥"
cover: null
---
> **Core insight:** Swift is a type-safe, protocol-oriented language. Before you touch a single UIView or SwiftUI View, you need to own the language itself — optionals, closures, protocols, generics, and Swift concurrency. Every iOS bug you’ll ever chase traces back to a misunderstanding of one of these fundamentals.

---


## Day 1–3 — Swift Basics


```swift
// Variables and constants: prefer let, use var only when mutation is needed
let appName = "MyApp"        // constant: cannot be reassigned
var score = 0                 // variable: can be reassigned
score += 10

// Type inference: Swift figures out the type from context
let pi = 3.14159             // inferred as Double
let greeting = "Hello"       // inferred as String
let isActive = true          // inferred as Bool

// String interpolation
let name = "Ashu"
let message = "Welcome, \(name)! Your score is \(score)."

// Arrays, Dictionaries, Sets
var fruits = ["apple", "banana", "mango"]
fruits.append("orange")
fruits.filter { $0.count > 5 }  // ["banana", "orange"]

var scores: [String: Int] = ["Alice": 95, "Bob": 87]
scores["Charlie"] = 92

// Control flow
for fruit in fruits {
    print(fruit)
}

(1...10).forEach { print($0) }  // Swift idiom: use ranges

switch score {
case 90...100: print("A")
case 80..<90:  print("B")
default:       print("C")
}
```


---


## Day 4–6 — Optionals: the most important Swift concept


```swift
// Optional: a value that might be absent. This is NOT the same as null in other languages.
// Swift forces you to EXPLICITLY handle the absence case.
var username: String? = nil
username = "ashu"

// Four ways to unwrap optionals:

// 1. Optional binding (safest, preferred)
if let name = username {
    print("Hello, \(name)")
} else {
    print("No username set")
}

// 2. guard let -- early exit pattern, keeps the happy path unindented
func greet(username: String?) {
    guard let name = username else {
        print("No username")
        return   // must exit the current scope
    }
    // name is a non-optional String here
    print("Hello, \(name)")
}

// 3. Nil coalescing -- provide a default
let displayName = username ?? "Guest"

// 4. Optional chaining -- safely access properties/methods on optional values
// Returns nil if any step is nil, without crashing
let count = username?.count   // Int? not Int

// Force unwrap (!) -- NEVER use without being 100% certain the value exists
// The ! is a signal that a crash WILL happen if the value is nil
let dangerousUnwrap = username!  // crashes if username is nil

// Why optionals matter for iOS:
// UIKit returns optionals constantly (dequeueReusableCell, view.superview, etc.)
// Network responses are always optional (the server might return nothing)
// User input is always optional
```


---


## Day 7–9 — Functions, Closures, and Higher-Order Functions


```swift
// Functions with argument labels (Swift's elegant API design)
func move(from source: String, to destination: String) {
    print("Moving from \(source) to \(destination)")
}
move(from: "London", to: "Bangalore")  // reads like English

// Default parameters
func connect(host: String, port: Int = 443, secure: Bool = true) {}
connect(host: "api.example.com")  // uses defaults

// Returning multiple values with tuples
func minMax(array: [Int]) -> (min: Int, max: Int) {
    return (array.min()!, array.max()!)
}
let result = minMax(array: [3, 1, 4, 1, 5])
print(result.min, result.max)

// Closures: anonymous functions, stored and passed around
// THE most important concept for iOS -- every completion handler, every map/filter,
// every SwiftUI action uses closures
let multiply = { (a: Int, b: Int) -> Int in
    return a * b
}

// Trailing closure syntax (when last argument is a closure)
let doubled = [1, 2, 3].map { $0 * 2 }  // [2, 4, 6]
let evens = [1, 2, 3, 4, 5].filter { $0 % 2 == 0 }  // [2, 4]
let sum = [1, 2, 3, 4, 5].reduce(0) { $0 + $1 }  // 15

// Capture lists: how closures capture surrounding values
// THIS IS CRITICAL for avoiding retain cycles in iOS
var counter = 0
let increment = { [weak self] in  // in class context, always capture self weakly
    counter += 1
}

// @escaping: closure that outlives the function call
// Used for ALL completion handlers (networking, async operations)
func fetchData(completion: @escaping (Result<String, Error>) -> Void) {
    DispatchQueue.global().async {
        // simulate network call
        completion(.success("data"))
    }
}
```


---


## Day 10–12 — Structs, Classes, Enums, and Protocols


```swift
// Struct vs Class: the most important architectural decision in Swift
// Struct: VALUE type (copied on assignment). Preferred for model data.
// Class: REFERENCE type (shared reference). Use for objects with identity/lifecycle.

struct User {              // VALUE type
    var name: String
    var age: Int
    
    // Mutating: structs are immutable by default
    mutating func birthday() { age += 1 }
}

var user1 = User(name: "Alice", age: 30)
var user2 = user1   // COPY: user2 is independent
user2.name = "Bob"  // user1.name is still "Alice"

class ViewController: UIViewController {  // REFERENCE type
    var data: [String] = []
}  // When you copy a class instance, both variables point to the SAME object

// Enums with associated values: powerful Swift feature
enum APIResult {
    case success(Data)
    case failure(Error)
    case loading
}

// Result type (built-in Swift): the standard way to handle success/failure
func loadUser() -> Result<User, Error> {
    // either .success(user) or .failure(error)
}

// Protocols: Swift's primary abstraction mechanism
protocol Displayable {
    var displayName: String { get }
    func show()
}

// Protocol extensions: add default implementations
extension Displayable {
    func show() { print(displayName) }
}

// Protocol composition: conform to multiple protocols
protocol Saveable { func save() }
typealias DisplayableAndSaveable = Displayable & Saveable

// Delegation pattern: THE most common iOS pattern (UITableViewDelegate, etc.)
protocol DataSourceDelegate: AnyObject {  // AnyObject = class-only protocol
    func didSelectItem(_ item: String)
}

class DataSource {
    weak var delegate: DataSourceDelegate?  // ALWAYS weak to avoid retain cycles!
    
    func selectItem(_ item: String) {
        delegate?.didSelectItem(item)
    }
}
```


---


## Day 13—14 — Generics, Error Handling, and Memory Management


```swift
// Generics: write code that works with any type
func swap<T>(_ a: inout T, _ b: inout T) {
    let temp = a; a = b; b = temp
}

// Generic types with constraints
func largest<T: Comparable>(_ array: [T]) -> T? {
    return array.max()
}

// Error handling with do-catch
enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingFailed(String)
}

func fetchUser(id: Int) throws -> User {
    guard id > 0 else { throw NetworkError.invalidURL }
    // ...
}

do {
    let user = try fetchUser(id: 1)
} catch NetworkError.invalidURL {
    print("Bad URL")
} catch {
    print("Unknown error: \(error)")
}

// ARC (Automatic Reference Counting): Swift manages memory automatically
// BUT retain cycles can cause memory leaks in your app
class Parent {
    var child: Child?          // strong reference
}
class Child {
    weak var parent: Parent?   // weak: breaks the cycle (becomes nil when Parent is deallocated)
}
// Without 'weak', Parent keeps Child alive, Child keeps Parent alive = memory leak
```


---


## Day 15 — Phase 1 Capstone: Swift CLI Playground Apps


**Build 3 command-line Swift programs** (Xcode Playground or Swift Package)


```javascript
1. Contact Book
   - Store contacts (struct with name, phone, email)
   - Add, search (case-insensitive), delete, sort by name
   - Use protocols: Printable, Searchable
   - Persist to a JSON file using Codable

2. Network Request Simulator
   - Define a Protocol: NetworkClient with func fetch(url: URL) -> Result<Data, Error>
   - Implement: RealNetworkClient, MockNetworkClient
   - Show how delegation and protocol-based design enable easy testing

3. Generic Stack Data Structure
   - Generic Stack<T> with push, pop, peek, isEmpty
   - Extension: make it Sequence and conform to CustomStringConvertible
   - Use it to solve a valid parentheses problem (test your Swift knowledge)
```


---


## Common mistakes


### Mistake 1


**❌ Force unwrapping optionals with ! throughout the codebase.**


Every `!` is a potential crash. In production apps, a force unwrap is a timer waiting to go off when a user has an unexpected state.


**✅ Correct approach:** Use `if let`, `guard let`, or `??` for every optional. Reserve `!` only for IBOutlets (which Xcode generates), and understand why even those should be used carefully.


### Mistake 2


**❌ Using class when struct is appropriate.**


Beginners default to classes because that’s familiar from other languages. Swift’s standard library is built on structs (Array, Dictionary, String are all structs).


**✅ Correct approach:** Default to struct. Use class when you need inheritance, identity, or Objective-C interoperability. If you’re making a model (User, Product, Message) — it’s almost certainly a struct.


### Mistake 3


**❌ Forgetting [weak self] in closures.**


If a closure captures self strongly, and self holds the closure, you have a retain cycle — a memory leak that can accumulate silently.


**✅ Correct approach:** Any closure that captures self inside a class should use `[weak self]` unless you have a deliberate reason for a strong reference. Always guard let self = self before using it inside the closure.

