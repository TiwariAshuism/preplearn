---
source: notion
title: "🧩 90-Day LLD Roadmap — Low-Level System Design"
slug: "90-day-lld-roadmap-low-level-system-design"
notionId: "35ada883bddd813694d3fa44eb7ceee9"
notionRootId: "35ada883bddd813694d3fa44eb7ceee9"
parent: null
children: ["phase-5-expert-lld-days-76-90","phase-4-advanced-lld-problems-days-56-75","phase-3-core-lld-problems-days-36-55","phase-2-design-patterns-days-16-35","phase-1-oop-and-solid-foundations-days-1-15"]
order: 2
icon: "🧩"
cover: null
---
> 🧩 **Frontend → Systems Engineer transition.** 90 days. 5 phases. Low-Level Design mastery from OOP fundamentals to production-grade class architecture.

---


## 📌 How to use this template

- Work phases **in strict order** — every phase builds on the last
- Daily ritual: study the concept → implement it in code → review your own code against the principles → log one mistake
- Use the **Daily Tracker** to stay accountable
- Open each **Phase page** for full breakdowns, code problems, real-world references, and mistake corrections
> 💡 **The #1 rule of LLD:** A design that cannot be changed without touching 10 files is a failed design. Every principle in this roadmap exists to make change cheap and isolated.

---


## 🗺️ Roadmap at a glance


| Phase                             | Days       | Focus                                               | Key Output                                 |
| --------------------------------- | ---------- | --------------------------------------------------- | ------------------------------------------ |
| Phase 1 — OOP & SOLID Foundations | Days 1–15  | OOP pillars, SOLID, UML, design thinking            | Solid mental model for every future design |
| Phase 2 — Design Patterns         | Days 16–35 | 23 GoF patterns, when to use each, anti-patterns    | Pattern recognition in code reviews        |
| Phase 3 — Core LLD Problems       | Days 36–55 | Parking Lot, Chess, Elevator, Vending Machine       | 6 fully designed + coded systems           |
| Phase 4 — Advanced LLD Problems   | Days 56–75 | Rate Limiter, Cache, Pub-Sub, Payment, Ride-share   | 5 production-grade class designs           |
| Phase 5 — Expert LLD              | Days 76–90 | Concurrency, thread safety, code review methodology | Staff-level design + review skills         |


---


## ⚡ The LLD Design Framework


Use this structure for every low-level design — interview or production.

1. **Clarify requirements** — functional (what it does) + constraints (what it must not do)
2. **Identify entities** — nouns in the problem are your classes
3. **Define relationships** — inheritance vs composition vs association
4. **Apply SOLID** — check each principle against your design
5. **Select patterns** — which GoF pattern solves the extensibility problem?
6. **Draw UML** — class diagram + sequence diagram for key flows
7. **Write the interface first** — code the contract before the implementation
8. **Review for change** — if requirement X changes tomorrow, which classes change? Should be ≤1.

---


## 📊 My progress

- Current phase: **Phase 1**
- Current day: **Day 1 of 90**
- LLD problems fully designed: **0 / 11**
- Design patterns recognised in code: **0 / 23**

---


## 🔖 Quick links

- 🏗️ Phase 1 — OOP & SOLID Foundations
- 🧩 Phase 2 — Design Patterns
- 🗂️ Phase 3 — Core LLD Problems
- ⚙️ Phase 4 — Advanced LLD Problems
- 🧠 Phase 5 — Expert LLD

---


## 📐 SOLID Principles — quick reference


| Principle                     | One-line definition                                       | Violation smell                                 |
| ----------------------------- | --------------------------------------------------------- | ----------------------------------------------- |
| **S** — Single Responsibility | One class, one reason to change                           | Class name contains ‘And’, ‘Manager’, ‘Helper’  |
| **O** — Open/Closed           | Open for extension, closed for modification               | Adding a feature requires editing existing code |
| **L** — Liskov Substitution   | Subclass can replace superclass without breaking anything | Subclass throws UnsupportedOperationException   |
| **I** — Interface Segregation | No client should depend on methods it doesn’t use         | Interface has 15 methods, clients implement 3   |
| **D** — Dependency Inversion  | Depend on abstractions, not concretions                   | `new ConcreteService()` inside a business class |


---


## 💻 Language recommendation


Use **Java** or **Go** for all LLD implementations in this roadmap.

- **Java:** Native OOP, interfaces, abstract classes, generics, `synchronized`. Most LLD interview solutions are in Java. Best choice if targeting product companies.
- **Go:** Interfaces via duck typing, goroutines for concurrency problems, no inheritance (composition only). Best choice if you’re already on the backend Go path.
- **Avoid:** Python for LLD — dynamic typing hides design problems that static typing would catch.

📅 LLD Daily Tracker


## Phase 1 — OOP & SOLID Foundations (Days 1–15)
> **Core insight:** Every LLD problem you will ever face is fundamentally a question about managing change. Which class changes when requirement X changes? If the answer is more than one, your design is wrong. OOP and SOLID exist entirely to make change cheap and isolated.

---


## 🧠 Why this phase exists


Most engineers who struggle with LLD interviews know Java or Go syntax perfectly. They fail because they don’t have a principled way to identify responsibilities, define boundaries, and manage dependencies between classes. This phase builds that operating system.


---


## 📚 Topics in order


### Day 1–2 — What is LLD and why it matters

- LLD vs HLD: HLD = which services/databases exist and how they communicate. LLD = which classes exist inside a service and how they communicate.
- The output of an LLD: class diagram, sequence diagram for key flows, interface definitions, key design decisions with tradeoffs.
- Why LLD matters in production: a system’s long-term cost is 80% maintenance. LLD determines whether a feature takes 1 hour or 1 week to add.
- The change test: for any design, ask “if requirement X changes, which files change?” A good LLD isolates change to 1–2 files. A bad LLD propagates it to 10.
- LLD interview format: 45 minutes. First 5 min: clarify requirements. Next 10 min: identify entities + relationships. Next 20 min: class diagram + key methods. Last 10 min: write code for the critical path.

### Day 3–4 — OOP Pillar 1 & 2: Encapsulation + Abstraction

- **Encapsulation:** bundle data and the methods that operate on it. Hide internal state. Expose only what callers need.
    - `private` fields with `public` getters/setters is NOT encapsulation — it’s just wrapping. True encapsulation means callers cannot put the object in an invalid state.
    - Example: `BankAccount.withdraw(amount)` validates internally. Caller cannot set `balance = -1000` directly.
- **Abstraction:** expose WHAT something does, hide HOW it does it.
    - Interface vs abstract class: interface defines a contract (what). Abstract class provides partial implementation (some how). Use interfaces by default; use abstract classes when sharing implementation makes sense.
    - The `List` interface in Java is abstraction: `ArrayList` vs `LinkedList` are implementation details the caller shouldn’t care about.
- Common confusion: abstraction is not the same as abstract class. Abstraction is a principle; abstract class is a language construct.

### Day 5–6 — OOP Pillar 3 & 4: Inheritance + Polymorphism

- **Inheritance:** “is-a” relationship. `Dog extends Animal`. Reuse behaviour through a class hierarchy.
    - When NOT to use: when you find yourself overriding most parent methods, or when the relationship is more “uses-a” than “is-a”. Use composition instead.
    - Deep inheritance hierarchies (>3 levels) are a design smell. They make change expensive and reasoning hard.
- **Polymorphism:** the same interface, different behaviour depending on runtime type.
    - Compile-time polymorphism (overloading): same method name, different parameter types.
    - Runtime polymorphism (overriding): subclass provides its own implementation of a parent method. The caller doesn’t know which subclass it has.
    - Why it matters for LLD: polymorphism is what allows you to add a new `PaymentMethod` subclass without touching the `PaymentProcessor` class. This is the Open/Closed Principle in action.
- The Liskov Substitution Principle preview: if you have `Animal a = new Dog()`, everything that works with `Animal` must work with `Dog`. If `Dog.makeSound()` throws an exception that `Animal.makeSound()` never throws, you’ve violated this.

### Day 7–8 — SOLID: S — Single Responsibility Principle

- **Definition:** A class should have one, and only one, reason to change.
- **Practical test:** can you describe what this class does in one sentence without the word “and”? If not, it has too many responsibilities.
- **Violation smells:** class names containing `Manager`, `Handler`, `Helper`, `Utility`, `God`. Methods with more than 20 lines. A class that imports from 10 different modules.
- **Example violation:** `UserService` that validates user input, hashes passwords, saves to DB, sends a welcome email, and logs the event. Five responsibilities, five reasons to change.
- **Refactored:** `UserValidator`, `PasswordHasher`, `UserRepository`, `WelcomeEmailSender`, each with one responsibility. Changing the email template touches only `WelcomeEmailSender`.
- **The module level:** SRP applies to modules and microservices too, not just classes. A service that handles both user auth and payment processing is violating SRP at the service level.

### Day 9–10 — SOLID: O — Open/Closed Principle

- **Definition:** Software entities should be open for extension but closed for modification. Add new behaviour by adding new code, not by changing existing code.
- **Why it matters:** modifying existing code risks breaking existing behaviour. Adding new code (classes, methods) is safer — existing tests still pass.
- **Implementation mechanism:** interfaces + polymorphism. Define a `Discountable` interface. New discount types implement it. The `PriceCalculator` never changes.
- **Violation example:** a `ShapeCalculator` class with a `switch(shape.type)` statement. Every new shape type requires editing `ShapeCalculator`. The class is not closed for modification.
- **Refactored:** `Shape` interface with `area()` method. `Circle`, `Rectangle`, `Triangle` each implement it. `ShapeCalculator` calls `shape.area()` polymorphically. Adding a hexagon requires zero changes to `ShapeCalculator`.
- **Anti-pattern:** OCP taken too far creates premature abstraction. Don’t abstract until you have two concrete cases. Abstraction has a cost — indirection, cognitive load. Earn it.

### Day 11 — SOLID: L — Liskov Substitution Principle

- **Definition:** Objects of a subclass should be substitutable for objects of the superclass without altering the correctness of the program.
- **The contract model:** a subclass must fulfil the contract of its superclass. It can be more lenient on inputs and more strict on outputs, but never the reverse.
- **Classic violation:** `Square extends Rectangle`. `Rectangle.setWidth(5)` sets width to 5, height unchanged. `Square.setWidth(5)` sets both to 5 (to maintain squareness). Code that expects a `Rectangle` and calls `setWidth()` then `setHeight()` will get wrong results from a `Square`. `Square` is NOT a `Liskov-compliant` subtype of `Rectangle`.
- **Violation smell:** subclass overrides a parent method to throw `UnsupportedOperationException`. This is a guaranteed LSP violation.
- **Fix:** rethink the hierarchy. `Square` and `Rectangle` should both implement `Shape`, not inherit from each other.

### Day 12 — SOLID: I — Interface Segregation Principle

- **Definition:** No client should be forced to depend on methods it does not use. Prefer many small, specific interfaces over one large general interface.
- **Violation smell:** a class implements an interface but leaves several methods empty or throwing exceptions. This means the interface is too broad.
- **Example violation:** `Animal` interface with `walk()`, `swim()`, `fly()`. `Dog` implements `Animal` but `fly()` throws `UnsupportedOperationException`. `Penguin` implements it but `fly()` also throws. The interface demands that all animals can fly.
- **Refactored:** `Walkable`, `Swimmable`, `Flyable` interfaces. `Dog implements Walkable, Swimmable`. `Eagle implements Walkable, Flyable`. Each class only implements what it can actually do.
- **In Go:** Go’s implicit interfaces naturally enforce ISP. Small interfaces (like `io.Reader`, `io.Writer`) are idiomatic. A function that only needs `Read()` accepts `io.Reader`, not a fat `io.ReadWriteCloser`.

### Day 13 — SOLID: D — Dependency Inversion Principle

- **Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions.
- **Practical meaning:** your business logic class (`OrderService`) should not directly instantiate or depend on a concrete class (`MySQLOrderRepository`). It should depend on an interface (`OrderRepository`) that `MySQLOrderRepository` implements.
- **Why it matters:** if `OrderService` depends on `MySQLOrderRepository` directly, switching to PostgreSQL requires changing `OrderService`. If it depends on `OrderRepository` interface, switching requires only a new implementation.
- **Mechanism:** Constructor injection. `OrderService(OrderRepository repo)`. The caller decides which implementation to inject. This is the foundation of Dependency Injection (DI) frameworks.
- **Violation smell:** `new ConcreteService()` inside a business class. `static` method calls to concrete utility classes. Import of infrastructure packages inside domain classes.
- **Testability connection:** DI makes testing trivial. Inject a `MockOrderRepository` in tests. No database required. This is why DI is a prerequisite for unit testing.

### Day 14–15 — UML for LLD practitioners

- **Class diagram notation:** box = class (name, fields, methods). Solid line with arrow = association. Hollow triangle arrow = inheritance. Dashed arrow = dependency. Diamond = aggregation/composition.
- **Composition vs aggregation:** composition (◆ filled diamond) = child cannot exist without parent (`Order` and `OrderItem`). Aggregation (◊ hollow diamond) = child can exist independently (`Team` and `Player`).
- **Sequence diagram:** shows message flow between objects over time. Vertical lines = object lifelines. Horizontal arrows = method calls. Use for: showing the critical path through your design.
- **Practical LLD UML rule:** in an interview, draw the class diagram first. Then draw one sequence diagram for the most complex flow. That’s enough. Don’t over-draw.
- **Tools:** Excalidraw (whiteboard), [draw.io](http://draw.io/) (structured), PlantUML (code-generated diagrams). In an interview: pencil and paper or a whiteboard.

---


## 🔨 Projects


### Project 1 — Refactor a God Class


**Scenario:** You’re given a 400-line `UserManager` class that: validates input, hashes passwords, writes to a database, sends emails, logs events, and generates auth tokens.


**Deliverable:** Identify every responsibility. Split into cohesive classes: `UserValidator`, `PasswordHasher`, `UserRepository`, `EmailNotifier`, `TokenGenerator`, `AuditLogger`. Wire them together via constructor injection. Write the interface for each. Verify: does changing the email template touch only `EmailNotifier`? Does switching from MD5 to bcrypt touch only `PasswordHasher`?


### Project 2 — OCP extension exercise


**Scenario:** A `ReportGenerator` class has a switch statement: `case PDF: ... case CSV: ... case HTML: ...`


**Deliverable:** Refactor using the Open/Closed Principle. Define a `ReportFormat` interface with a `generate(data)` method. Implement `PdfReport`, `CsvReport`, `HtmlReport`. Now add `ExcelReport` without touching any existing class. Verify: zero modifications to `ReportGenerator` or any existing format class.


### Project 3 — DI container from scratch (mini)


**Deliverable:** Build a minimal dependency injection container in Java or Go. It should: register an interface-to-implementation mapping, resolve a class by constructing it with its dependencies injected. Test it by wiring `OrderService → OrderRepository → DatabaseConnection`. Swap the `DatabaseConnection` for a mock and verify `OrderService` works without change.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Making every field private and adding public getters/setters and calling it encapsulation.**


`getBalance()` + `setBalance()` is not encapsulation. It exposes the internal state just as much as a public field. Any caller can set balance to -1,000,000.


**✅ Correct approach:** Expose behaviour, not data. `account.withdraw(amount)` validates the amount internally and ensures the balance never goes invalid. The caller can’t put the object in an illegal state because there is no setter for balance.


### Mistake 2


**❌ Defaulting to inheritance when the relationship is “has-a” not “is-a”.**


`Car extends Engine` is wrong. A car has an engine, it is not a type of engine. Deep inheritance hierarchies are brittle: changing a parent breaks all children.


**✅ Correct approach:** Favour composition over inheritance. `Car` has-a `Engine` field. This is flexible: you can swap `ElectricEngine` for `PetrolEngine` without changing `Car`. Composition + interface is almost always the better design.


### Mistake 3


**❌ Applying SRP by splitting classes at the method level (one class per method).**


SRP doesn’t mean each class has one method. It means each class has one reason to change — one cohesive responsibility.


**✅ Correct approach:** Group methods by the actor that causes them to change. All methods that change when the “database schema changes” belong in the repository class. All methods that change when the “business rule changes” belong in the domain class.


### Mistake 4


**❌ Violating DIP by depending on concrete classes in business logic.**


`OrderService` directly creating `new MySQLOrderRepository()` means your business logic is coupled to your database technology.


**✅ Correct approach:** `OrderService` receives an `OrderRepository` interface in its constructor. The concrete `MySQLOrderRepository` is injected at the composition root (main function or DI framework). Business logic never knows which database it’s talking to.


---


## 🏢 How real companies apply this


**Google:** Their internal code review culture enforces SRP rigorously. A class that does two things will be flagged in review with “can you split this?” This is why Go’s standard library has tiny, focused interfaces like `io.Reader` (one method: `Read`) and `io.Writer` (one method: `Write`).


**Stripe:** Their payment SDK is a textbook example of OCP. Adding a new payment method (Stripe Checkout, PaymentIntents, SetupIntents) never required changes to the core `StripeClient`. Each capability was added via new interfaces and implementations, not by modifying existing classes.


**Spring Framework (Java):** Built entirely on DIP. Every `@Service`, `@Repository`, `@Component` is wired by the Spring DI container at runtime. Business logic classes depend on interfaces. The framework injects the concrete implementations. This is DIP at framework scale.


---


## 📖 Resources

- _Clean Code_ — Robert Martin (Chapters 1–6, 10)
- _Head First Design Patterns_ — Freeman & Robson (read the first 2 chapters now, rest in Phase 2)
- _Effective Java_ — Joshua Bloch (Items 15–25 on classes and interfaces)
- SOLID principles visualised: [solidbook.io](http://solidbook.io/)
- Refactoring Guru: [refactoring.guru/refactoring](http://refactoring.guru/refactoring) (code smell catalogue)

## Phase 2 — Design Patterns (Days 16–35)
> **Core insight:** Design patterns are not solutions to memorise — they are names for recurring design structures that experienced engineers have already solved. The skill is recognising WHICH pattern applies to the problem in front of you, not reciting the pattern from memory.

---


## 🧠 Why this phase exists


Design patterns are the vocabulary of experienced software engineers. When a senior engineer says “we should use a Strategy pattern here” or “that’s a classic Observer problem,” they’re communicating an entire design structure in one word. This phase gives you that vocabulary and, more importantly, teaches you when NOT to use each pattern.


---


## 📚 Patterns in order


### Day 16–17 — Creational Patterns: Singleton, Factory Method, Abstract Factory


**Singleton**

- Ensures only one instance of a class exists. Provides a global access point.
- Use case: database connection pool, logger, configuration manager.
- Thread-safe implementation: double-checked locking with `volatile` in Java. `sync.Once` in Go.
- Anti-pattern warning: Singleton is global mutable state. It makes testing hard (you can’t inject a mock) and creates hidden dependencies. Use sparingly. Prefer DI instead.
- Test for overuse: if you have more than 2 Singletons in a codebase, you probably have a DI problem.

**Factory Method**

- Defines an interface for creating an object, but lets subclasses decide which class to instantiate.
- Use case: a `NotificationFactory` that returns `EmailNotification`, `SMSNotification`, or `PushNotification` based on the user’s preference. The caller asks for a `Notification`, doesn’t care which type.
- Implementation: `Notification createNotification(String type)` in the factory. Each subclass creates its own type.
- Benefit: adding a new notification type requires a new class + one line in the factory. Zero changes to calling code.

**Abstract Factory**

- Creates families of related objects without specifying their concrete classes.
- Use case: a UI toolkit that must produce consistent components — `WindowsButton`, `WindowsTextBox` vs `MacButton`, `MacTextBox`. The `UIFactory` interface creates matched sets.
- Distinction from Factory Method: Factory Method creates one product. Abstract Factory creates a family of related products.

### Day 18–19 — Creational Patterns: Builder, Prototype


**Builder**

- Constructs complex objects step by step. Allows producing different representations of the same object using the same construction process.
- Use case: constructing an `HTTP Request` with optional headers, query params, body, timeout, retry config. A constructor with 12 parameters is unreadable.
- Implementation: `RequestBuilder.url(”...”).header(“...”).timeout(5000).build()`. Each method returns `this` (fluent interface). `build()` validates and constructs.
- Java example: `StringBuilder`, `AlertDialog.Builder`, Lombok `@Builder`.
- Go example: functional options pattern. `NewServer(opts ...Option)` where each `Option` is a function that configures the server.
- When NOT to use: for simple objects with 2–3 fields. Builder adds complexity; earn it with genuinely complex construction.

**Prototype**

- Creates new objects by cloning an existing object (the prototype).
- Use case: when object creation is expensive (DB query, network call) and you need many similar objects. Clone a template, modify specific fields.
- Java: implement `Cloneable`, override `clone()`. Be careful with deep vs shallow copy.
- Real-world example: game enemy spawning — clone a pre-configured ‘zombie’ prototype rather than re-constructing from scratch each time.

### Day 20–21 — Structural Patterns: Adapter, Decorator, Facade


**Adapter**

- Converts the interface of a class into another interface that clients expect. Lets classes work together that couldn’t otherwise because of incompatible interfaces.
- Use case: your system expects a `Logger` interface. You want to use a third-party `log4j` library which has a different API. Write a `Log4jAdapter` that implements `Logger` and delegates to `log4j`.
- Real-world: charging adapter. Same principle. Two incompatible interfaces. An adapter bridges them.
- In Go: very common pattern. A struct with the correct method signatures that wraps a third-party type.

**Decorator**

- Attaches additional behaviours to objects dynamically by wrapping them in decorator objects. Provides a flexible alternative to subclassing for extending functionality.
- Use case: a `Coffee` interface. `SimpleCoffee` is the base. `MilkDecorator`, `SugarDecorator`, `VanillaDecorator` each wrap a `Coffee` and add behaviour. Stack decorators at runtime.
- Java example: `BufferedReader` wraps `FileReader` wraps `File`. Each layer adds capability.
- Key insight: the decorator implements the same interface as what it wraps. To the caller, it’s indistinguishable from the original.
- When to use vs subclassing: when you need combinations of behaviours at runtime. 3 decorators = 8 possible combinations. 3 subclasses for each combination = 8 subclasses. Decorator wins.

**Facade**

- Provides a simplified interface to a complex subsystem.
- Use case: a `HomeTheaterFacade` that exposes `watchMovie()` and `endMovie()`. Internally, it coordinates Projector, SoundSystem, StreamingService, Lights — but the caller sees one simple interface.
- Real-world: AWS SDK. `s3.PutObject()` is a facade over HTTP, authentication, request signing, retry logic.
- Facade vs encapsulation: facade is about simplifying a complex external system. Encapsulation is about hiding internal state.

### Day 22–23 — Structural Patterns: Composite, Proxy, Bridge, Flyweight


**Composite**

- Composes objects into tree structures to represent part-whole hierarchies. Clients treat individual objects and compositions uniformly.
- Use case: file system (`File` and `Directory` both implement `FileSystemComponent`). `Directory.getSize()` recursively sums children. `File.getSize()` returns its own size. Caller calls `getSize()` on either, same interface.
- Also used for: UI component trees, organisational hierarchies, expression trees in compilers.

**Proxy**

- Provides a surrogate or placeholder for another object to control access to it.
- Three types:
    - **Virtual proxy:** delays expensive object creation until needed (lazy loading).
    - **Protection proxy:** controls access based on permissions.
    - **Remote proxy:** represents an object in a different address space (gRPC stub is a remote proxy).
- Real-world: Hibernate lazy-loads database entities via proxy objects. The entity is only fetched when you access a field.

**Bridge**

- Decouples an abstraction from its implementation so that the two can vary independently.
- Use case: `RemoteControl` (abstraction) works with any `Device` (implementation). `BasicRemote` and `AdvancedRemote` both extend `RemoteControl`. `TV` and `Radio` both implement `Device`. 2 × 2 = 4 combinations without 4 subclasses.
- Prevents class explosion when both abstractions and implementations need to be extensible independently.

**Flyweight**

- Shares common state among many fine-grained objects to reduce memory usage.
- Use case: a text editor with millions of character objects. Instead of each character storing font, size, colour (shared state), store only the character position (unique state). The shared state is stored once in a flyweight.
- Real-world: Java `String` interning, Java `Integer` cache (-128 to 127), game particle systems.

### Day 24–25 — Behavioural Patterns: Strategy, Observer, Command


**Strategy**

- Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Lets the algorithm vary independently from the clients that use it.
- Use case: `Sorter` that can use `BubbleSort`, `QuickSort`, or `MergeSort` based on data size. `PaymentProcessor` that uses `CreditCard`, `PayPal`, or `Crypto` strategy. `Navigator` that uses `DrivingStrategy`, `WalkingStrategy`, `TransitStrategy`.
- Implementation: `SortStrategy` interface with `sort(data)`. Inject at runtime. Swap without changing the `Sorter` class.
- Relation to OCP: Strategy IS the OCP in action. New algorithm = new strategy class, zero changes to context.

**Observer (Publish-Subscribe)**

- Defines a one-to-many dependency. When one object (subject) changes state, all dependents (observers) are notified automatically.
- Use case: `EventBus`, UI event listeners, `Model` notifying multiple `Views` in MVC, stock price feed.
- Implementation: `Subject` holds a list of `Observer` references. `notifyAll()` iterates the list calling `observer.update(event)`.
- Java built-in: `java.util.Observable` (deprecated, but good reference). `EventListener` pattern.
- Go built-in: channels ARE the Observer pattern. Goroutines subscribe to channels. Publisher writes; all readers receive.
- Production version: Kafka is Observer pattern at system scale. Topics are subjects. Consumer groups are observers.

**Command**

- Encapsulates a request as an object. Lets you parameterise methods with requests, queue or log them, and support undoable operations.
- Use case: text editor undo/redo (each action is a `Command` object stored in a stack). Job queues (commands serialised and executed later). Remote procedure calls.
- Implementation: `Command` interface with `execute()` and `undo()`. `CommandHistory` stack. `Invoker` calls `command.execute()` without knowing what it does.
- Real-world: database transaction log, Kafka message (a serialised command), REST API request queue.

### Day 26–27 — Behavioural Patterns: Iterator, Template Method, State, Chain of Responsibility


**Iterator**

- Provides a way to access elements of a collection sequentially without exposing its underlying representation.
- Every collection in Java (`List`, `Set`, `Map`) implements `Iterable`. The for-each loop is the Iterator pattern.
- In Go: `range` is the iterator protocol. Writing a custom iterator means implementing a `Next()` method.
- LLD relevance: when you need to traverse a custom data structure (binary tree, graph, file system) without coupling callers to its internals.

**Template Method**

- Defines the skeleton of an algorithm in a base class, deferring some steps to subclasses. Subclasses can override specific steps without changing the algorithm’s structure.
- Use case: data mining pipeline — `openFile()`, `extractData()`, `parseData()`, `analyzeData()`, `sendReport()`, `closeFile()`. The order is fixed. Specific steps vary by data source.
- Abstract class defines the template method. Concrete steps are abstract methods overridden by subclasses.
- Relation to Strategy: Template Method uses inheritance to vary the algorithm. Strategy uses composition (injection). Prefer Strategy — composition over inheritance.

**State**

- Allows an object to alter its behaviour when its internal state changes. The object will appear to change its class.
- Use case: traffic light (`Red` → `Green` → `Yellow` → `Red`). Order processing (`New` → `Paid` → `Shipped` → `Delivered` → `Cancelled`). Vending machine states.
- Implementation: `State` interface with `handle(context)`. Each concrete state (e.g., `LockedState`, `UnlockedState`) implements the correct behaviour. The context delegates to the current state object.
- Alternative to: a massive `switch(state)` or `if-else` chain that grows with every new state.

**Chain of Responsibility**

- Passes a request along a chain of handlers. Each handler either handles it or passes it to the next.
- Use case: HTTP middleware pipeline (auth → rate-limit → logging → business logic). Support ticket escalation (L1 → L2 → L3 support). Input validation pipeline.
- Implementation: each handler has a `next` reference. `handle(request)` either handles or calls `next.handle(request)`.
- Real-world: Gin/Express middleware chains, Java servlet filters, Go HTTP handler chaining.

### Day 28–29 — Behavioural Patterns: Mediator, Memento, Visitor, Interpreter


**Mediator**

- Defines an object (mediator) that encapsulates how a set of objects interact. Reduces direct communication between objects; they communicate through the mediator.
- Use case: air traffic control (planes don’t talk to each other; they talk to the control tower). Chat room (users don’t message each other directly; they go through the chat room server).
- Reduces coupling from O(N²) connections (each object knows all others) to O(N) (each object knows only the mediator).

**Memento**

- Captures and externalises an object’s internal state without violating encapsulation, so the object can be restored to this state later.
- Use case: undo history in text editors, save game states, database transaction rollback.
- Three roles: `Originator` (creates and restores mementos), `Memento` (stores the state), `Caretaker` (holds mementos but can’t inspect them).

**Visitor**

- Lets you define a new operation without changing the classes of the elements it operates on.
- Use case: AST (Abstract Syntax Tree) in compilers. Add a `TypeChecker`, `CodeGenerator`, `PrettyPrinter` visitor without modifying AST node classes.
- Use when: you have a stable class hierarchy but need to add many operations. Visitor externalises operations from the classes.

**Interpreter**

- Defines a grammar for a language and provides an interpreter to process the language.
- Use case: SQL parsing, regular expression engines, simple scripting languages.
- In LLD interviews: rarely asked. Understand the concept; don’t spend more than 1 hour on it.

### Day 30–31 — Anti-patterns and when NOT to use patterns

- **Pattern overuse:** applying a pattern because you know it, not because the problem requires it.
- **Premature abstraction:** adding a Strategy pattern when there’s only one strategy. Adding an Observer when there’s only one observer. Abstraction has a cost — indirection, cognitive load. Earn it.
- **Pattern soup:** multiple patterns stacked on top of each other making the code unreadable. 3 patterns interacting is a design review, not a design.
- **God objects disguised as Facades:** if your Facade has 40 methods, it’s a God class with a nicer name.
- **The YAGNI principle:** “You Aren’t Gonna Need It.” Don’t add patterns for hypothetical future requirements.
- **The rule:** add a pattern when you have pain without it, not before. Two concrete implementations of the same logic is the threshold for introducing a Strategy or Factory.

### Day 32–33 — Pattern combinations in real systems

- **MVC (Model-View-Controller):** Observer (Model notifies View), Strategy (Controller can swap input strategies), Composite (View component tree).
- **Repository pattern:** Adapter (adapts ORM to your domain interface) + Factory (creates repository instances).
- **Event-driven systems:** Command (events are commands) + Observer (subscribers react to events) + Chain of Responsibility (event middleware pipeline).
- **Plugin systems:** Strategy (each plugin is a strategy) + Factory Method (plugin loader creates plugin instances) + Decorator (plugins can wrap each other).
- Practice: for each real system you design in Phase 3+, identify which patterns appear and name them explicitly.

### Day 34–35 — Pattern recognition in code review

- How to spot patterns in existing code: look for interface-based polymorphism (Strategy/Factory), event emission (Observer), method chaining (Builder/Decorator), `handle(request)` chains (Chain of Responsibility).
- Code review vocabulary: “This looks like it wants to be a Strategy pattern — let’s extract the algorithm into an interface.” “This switch statement will keep growing; a Factory would close it off.”
- The question to ask in every design: “What changes here most often? Can I isolate that change into one class?” — that isolated class is often a pattern.

---


## 🔨 Projects


### Project 1 — Payment processor with Strategy + Factory


**Scenario:** Build a payment processing system supporting Credit Card, PayPal, UPI, and Crypto.


**Deliverable:** `PaymentStrategy` interface with `processPayment(amount)` and `refund(transactionId)`. Concrete implementations: `CreditCardPayment`, `PayPalPayment`, `UPIPayment`. `PaymentFactory` that returns the correct strategy based on a `PaymentType` enum. `PaymentProcessor` class that depends only on `PaymentStrategy` — never on concrete types. Adding Crypto requires zero changes to `PaymentProcessor` or `PaymentFactory` call sites.


### Project 2 — Notification system with Observer + Decorator


**Scenario:** Users subscribe to events (order placed, shipped, delivered). Notifications are sent via email, SMS, and push — possibly multiple channels per user.


**Deliverable:** `EventListener` observer interface. `OrderService` (subject) maintains a list of listeners and notifies on state change. `NotificationSender` base with `EmailDecorator`, `SMSDecorator`, `PushDecorator` that stack channel delivery. A user with email + SMS gets both notifications via a stacked decorator without a separate class for each combination.


### Project 3 — HTTP middleware pipeline with Chain of Responsibility


**Scenario:** Build a request handler pipeline: authentication → rate limiting → request logging → business logic.


**Deliverable:** `Handler` interface with `handle(request, next)`. `AuthHandler`, `RateLimitHandler`, `LoggingHandler`, `BusinessHandler` each implement it. Chain is constructed at startup. Adding a new middleware step requires zero changes to existing handlers. Write tests: verify a request blocked by `AuthHandler` never reaches `BusinessHandler`.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Singleton for everything that needs to be ‘shared’.**


Singleton creates a hidden global dependency. Tests can’t swap the implementation. Parallel tests share state and interfere with each other.


**✅ Correct approach:** Use dependency injection. Pass the shared instance explicitly via constructor. The DI container manages the lifetime (singleton, transient, etc.). Now you can inject a mock in tests.


### Mistake 2


**❌ Applying Observer when the relationship is synchronous and simple.**


Observer adds indirection. If `A` always needs to notify `B` after a change and this never varies, direct method call is clearer and simpler.


**✅ Correct approach:** Use Observer when: multiple parties need to be notified, the subject shouldn’t know about its observers, or observers are added/removed dynamically at runtime. Not for static 1-to-1 relationships.


### Mistake 3


**❌ Using Template Method instead of Strategy.**


Template Method uses inheritance, which is tight coupling. The base class and all subclasses are locked in a hierarchy. Adding new variations requires subclassing.


**✅ Correct approach:** Prefer Strategy (composition). Inject the varying algorithm as an interface. This is looser coupling, easier to test (inject a mock strategy), and allows mixing at runtime (combine strategies).


### Mistake 4


**❌ Using Builder for simple objects with 2–3 fields.**


`new User.Builder().name(“Ashu”).email(”...”).build()` for a class with 2 fields adds boilerplate for no benefit. A normal constructor is cleaner.


**✅ Correct approach:** Use Builder when construction has: 4+ optional parameters, complex validation logic, or multiple valid representations. The threshold is complexity, not preference.


---


## 🏢 How real companies use these patterns


**Netflix — Observer at scale:** Kafka is the Observer pattern implemented as infrastructure. Topics are subjects. Consumer groups are observer pools. The `OrderService` publishes an ‘order placed’ event without knowing which services care. The notification service, inventory service, and analytics service each independently subscribe.


**Java Standard Library — Decorator everywhere:** `BufferedInputStream(new FileInputStream(file))`. `Collections.unmodifiableList(list)`. `Collections.synchronizedList(list)`. The entire `java.io` package is built on Decorator. This is why the pattern exists in the first place.


**Spring Framework — Template Method:** `JdbcTemplate`, `RestTemplate`, `JmsTemplate`. The framework defines the skeleton (open connection, execute, close connection, handle errors). You provide the SQL or the HTTP call. The template handles the boilerplate.


---


## 📖 Resources

- _Design Patterns: Elements of Reusable OO Software_ — Gang of Four (the original, dense but canonical)
- _Head First Design Patterns_ — Freeman (approachable, visual, great for beginners)
- Refactoring Guru: [refactoring.guru/design-patterns](http://refactoring.guru/design-patterns) (best visual reference, free online)
- SourceMaking: [sourcemaking.com/design_patterns](http://sourcemaking.com/design_patterns)
- Java Design Patterns: [github.com/iluwatar/java-design-patterns](http://github.com/iluwatar/java-design-patterns) (1,000+ real code examples)

## Phase 3 — Core LLD Problems (Days 36–55)
> **Core insight:** Every LLD interview problem is really asking one question: can you identify the changing parts and isolate them from the stable parts? The 6 problems in this phase each have a different ‘axis of change’. Learn to spot it before designing anything.

---


## 🧠 Why this phase exists


Patterns are tools. This phase is the workshop where you use them on real problems under structured conditions. Each problem is a canonical LLD question that appears regularly in staff-level interviews at Google, Amazon, Uber, and Flipkart. Solve each one completely — class diagram, interfaces, key code, and design rationale.


---


## 💻 LLD problem-solving process (use for every problem)

1. Read the requirements. Identify: what are the nouns? (entities/classes) What are the verbs? (methods/operations)
2. Identify the primary axis of change: what will change most often as requirements evolve?
3. Define interfaces for the unstable parts. Concrete classes for the stable parts.
4. Apply relevant SOLID principles. Name the patterns you’re using.
5. Draw class diagram first, then sequence diagram for the most complex flow.
6. Write code for the critical path — the 3–5 classes that do the most important work.
7. State your tradeoffs explicitly: what does your design sacrifice for extensibility?

---


## 📚 Problems in order


### Day 36–38 — Parking Lot


**Requirements clarification questions (always ask first):**

- Multiple floors? Multiple entry/exit points?
- Vehicle types: bike, car, truck? Different spot sizes?
- Pricing model: flat rate, hourly, daily?
- Spot reservation in advance?
- Is payment handled inside this system or external?

**Entities:** `ParkingLot`, `ParkingFloor`, `ParkingSpot`, `Vehicle`, `Ticket`, `EntrancePanel`, `ExitPanel`, `ParkingDisplayBoard`, `PricingStrategy`


**Key design decisions:**

- `ParkingSpot` is abstract. Subtypes: `BikeSpot`, `CompactSpot`, `LargeSpot`. Each spot knows its size and whether it’s free.
- `Vehicle` is abstract. Subtypes: `Bike`, `Car`, `Truck`. Each vehicle knows which spot type it fits.
- **Spot assignment:** `ParkingLot.getAvailableSpot(vehicle)` — finds the nearest free spot matching vehicle type. Isolate spot-finding logic behind a `SpotFindingStrategy` interface (Strategy pattern) — nearest, first-available, or reserve-specific.
- **Pricing:** `PricingStrategy` interface. `HourlyPricing`, `FlatRatePricing`, `WeekdayWeekendPricing` implement it. Injected into `Ticket` at creation time.
- **Concurrency:** two cars entering simultaneously must not be assigned the same spot. `ParkingSpot.assignSpot()` must be thread-safe. Use `synchronized` or `AtomicBoolean isOccupied`.
- **Display board:** Observer pattern. `ParkingDisplayBoard` observes spot state changes and updates available count.

**SOLID check:**

- S: `ParkingLot` does not compute pricing. That’s `PricingStrategy`.
- O: new vehicle type = new `Vehicle` subclass. No change to `ParkingLot`.
- L: `BikeSpot.assignSpot(truck)` should work (return false, not throw). Never throw from a substituted type.
- I: `Payable` interface only on `Ticket`, not on `Vehicle`.
- D: `ParkingLot` depends on `SpotFindingStrategy` interface, not concrete implementation.

**Sequence for ‘car enters’:** EntrancePanel.entry(vehicle) → ParkingLot.getAvailableSpot(vehicle) → SpotFindingStrategy.find() → ParkingSpot.assignSpot(vehicle) → Ticket.create(spot, vehicle, timestamp) → EntrancePanel.printTicket(ticket)


### Day 39–40 — Chess Game


**Requirements:**

- Two-player game on 8×8 board
- All 6 piece types with correct movement rules
- Check and checkmate detection
- Stalemate detection
- Move history (for undo, or just logging)

**Entities:** `Game`, `Board`, `Cell`, `Piece`, `Player`, `Move`, `MoveValidator`


**Key design decisions:**

- `Piece` is abstract. Subtypes: `King`, `Queen`, `Rook`, `Bishop`, `Knight`, `Pawn`. Each overrides `getValidMoves(board)` returning a `List<Cell>`.
- **Move validation axis of change:** each piece has unique movement rules. This is the primary axis. `Piece.getValidMoves()` is polymorphic — new piece type = new subclass. OCP satisfied.
- `Board` is a `Cell[8][8]` matrix. `Cell` has a `Piece` (nullable). `Board.movePiece(from, to)` is the core operation.
- **Check detection:** `Game.isKingInCheck(player)` — for every opponent piece, check if any valid move lands on the king’s cell. O(pieces × valid_moves).
- **Move history:** Command pattern. Each `Move` is a `Command` with `execute()` and `undo()`. `MoveHistory` stack enables undo.
- **Special moves:** en passant, castling, pawn promotion. Each handled in the respective `Piece` subclass’s `getValidMoves()`. Don’t pollute `Board`.
- **State pattern for game status:** `GameState` interface. `ActiveState`, `CheckState`, `CheckmateState`, `StalemateState`. Game transitions between states after each move.

**SOLID check:**

- S: `King` knows how to move. `Game` knows when the game ends. `Board` knows how to move a piece. Three separate responsibilities.
- O: Add `Joker` piece (chess variant) = new `Joker extends Piece` class. Zero changes to `Board` or `Game`.
- L: All `Piece` subtypes must honour `getValidMoves()` contract — return valid moves, never throw.

### Day 41–42 — Elevator System


**Requirements clarification:**

- Number of elevators? Number of floors?
- Elevator capacity?
- Dispatch algorithm: FCFS, nearest elevator, SCAN (like a hard drive scheduler)?
- Emergency mode? Maintenance mode per elevator?

**Entities:** `ElevatorSystem`, `Elevator`, `ElevatorButton`, `HallButton`, `Floor`, `ElevatorDoor`, `ElevatorPanel`, `ElevatorController`, `DispatchStrategy`


**Key design decisions:**

- **Dispatch strategy is the primary axis of change.** `DispatchStrategy` interface. `NearestElevatorStrategy`, `RoundRobinStrategy`, `SCANStrategy` implement it. `ElevatorController` is injected with a strategy.
- **Elevator state machine:** `ElevatorState` interface. States: `IdleState`, `MovingUpState`, `MovingDownState`, `DoorOpenState`, `MaintenanceState`. State pattern handles transitions.
- **Request queuing:** each elevator has a `TreeSet<Integer>` of pending floor requests, sorted for efficient SCAN dispatch.
- **Hall buttons:** `HallButton(floor, direction)` — a call from floor 5 going up. Sent to `ElevatorController` which dispatches using strategy.
- **Concurrency:** multiple hall button presses and elevator arrivals happen concurrently. `ElevatorController` request queue must be thread-safe (`ConcurrentLinkedQueue` or `synchronized`).
- **Observer:** `Elevator` notifies `ElevatorDisplayBoard` and door system on state change.

**The key insight:** the elevator scheduling problem is the same as OS disk scheduling (SCAN/LOOK algorithms). The design decision that most candidates miss: which object owns the dispatch decision? Answer: `ElevatorController` — not `Elevator` and not `Floor`.


### Day 43–44 — Vending Machine


**Requirements:**

- Select item, pay, dispense, give change
- Multiple payment methods (coin, card)
- Handle invalid selection, insufficient funds, out-of-stock
- Admin: restock items, set prices

**Entities:** `VendingMachine`, `Item`, `Slot`, `Inventory`, `PaymentProcessor`, `CoinProcessor`, `CardProcessor`, `VendingMachineState`, `Display`


**Key design decisions:**

- **State pattern is the core.** States: `IdleState` (waiting for selection), `ItemSelectedState` (item chosen, waiting for payment), `PaymentReceivedState` (payment complete, dispensing), `OutOfStockState`, `MaintenanceState`.
- Each state implements the full `VendingMachineState` interface: `selectItem()`, `insertCoin()`, `insertCard()`, `dispense()`, `cancel()`. Invalid operations in a state return an error or no-op — never throw (LSP).
- **Payment strategy:** `PaymentProcessor` interface. `CoinProcessor` and `CardProcessor` implement it. Change calculation is only in `CoinProcessor`.
- **Inventory:** `Map<SlotCode, Item>` with stock count. `Inventory.isAvailable(code)` drives the state machine’s transition decision.
- **Change dispensing:** coin denominations held in the machine. Greedy algorithm to compute change. If exact change impossible — refund and return to idle.

**SOLID check:**

- O: add `CryptocurrencyProcessor` → new class, no changes to `VendingMachine`.
- S: `VendingMachine` does not compute change. `CoinProcessor` does.
- D: `VendingMachine` depends on `PaymentProcessor` interface.

### Day 45–47 — Library Management System


**Requirements:**

- Books, members, librarians
- Borrow, return, renew
- Search by title, author, ISBN, category
- Fine calculation for late returns
- Reservations: reserve a book that’s currently checked out
- Notifications when reserved book becomes available

**Entities:** `Library`, `Book`, `BookItem` (physical copy), `Member`, `Librarian`, `BookLending`, `Reservation`, `FineCalculator`, `SearchCatalog`, `NotificationService`


**Key design decisions:**

- **Book vs BookItem:** `Book` is the logical entity (title, author, ISBN). `BookItem` is a physical copy with a barcode and a `BookStatus` (AVAILABLE, CHECKED_OUT, RESERVED, LOST). A book can have multiple `BookItem` instances.
- **Lending flow:** `Librarian.checkoutBook(member, bookItemBarcode)` — validates member can borrow (limit, active fines), creates `BookLending` record, updates `BookItem.status = CHECKED_OUT`.
- **Fine calculation:** `FineStrategy` interface (DIP). `DailyFineStrategy`, `TieredFineStrategy`. Fine = `FineStrategy.calculate(daysLate)`.
- **Reservation + Observer:** when a `BookItem` is returned, `Library` notifies `ReservationService`. `ReservationService` checks for waiting members. `NotificationService.notify(member, book)` is called. Observer pattern.
- **Search:** `SearchCatalog` interface. `TitleSearch`, `AuthorSearch`, `ISBNSearch`, `CategorySearch` implement it. Or: a single `SearchCatalog` with a `SearchFilter` Strategy that composes predicates.
- **Member state machine:** `ACTIVE`, `BLACKLISTED` (unpaid fines), `SUSPENDED`. State affects `canBorrow()` result.

### Day 48–50 — Movie Ticket Booking System (BookMyShow)


**Requirements:**

- Cities, cinemas, screens, shows, movies
- Browse shows, select seats, book, pay, cancel
- Multiple payment methods
- Seat locking during booking (prevent double booking)
- Cancellation policy and refunds

**Entities:** `BookingSystem`, `City`, `Cinema`, `CinemaHall`, `Show`, `Movie`, `Seat`, `Booking`, `Payment`, `CancellationPolicy`


**Key design decisions:**

- **Seat locking (the hardest part):** when a user selects seats, lock them for 10 minutes. Two users cannot book the same seat simultaneously.
    - Option A: optimistic locking — `Seat.version` field. `UPDATE seat SET status=LOCKED, version=version+1 WHERE id=? AND version=?`. Retry on conflict.
    - Option B: distributed lock — Redis `SET seat:{id} user:{userId} EX 600 NX`. Fails if already locked.
    - In LLD context: `Seat.lock(userId)` with `synchronized` or `ReentrantLock`. In production, this moves to the database/cache layer.
- **Seat hierarchy:** `Seat` is abstract. `SilverSeat`, `GoldSeat`, `PlatinumSeat` with different pricing. Pricing via `SeatType` enum or `PricingStrategy` per seat type.
- **Booking state machine:** `PENDING` (seats locked, payment not done) → `CONFIRMED` (payment done) → `CANCELLED` → `REFUNDED`. State pattern.
- **Cancellation policy:** `CancellationPolicy` interface. `FullRefundPolicy` (>24h before), `50PercentRefundPolicy` (12–24h before), `NoRefundPolicy` (<12h before). Strategy pattern. Injected into `Booking`.
- **Search:** `ShowFinder.findShows(city, movie, date)` returns available shows. Uses repository pattern internally.

**SOLID check:**

- S: `Booking` does not compute refund. `CancellationPolicy` does.
- O: add a new cancellation policy = new class, zero changes to `Booking`.
- D: `Booking` depends on `CancellationPolicy` interface, `PaymentProcessor` interface. Neither on concrete types.

### Day 51–55 — Design review: all 6 systems

- Day 51: revisit Parking Lot. Can you explain every design decision in 5 minutes without notes?
- Day 52: revisit Chess. Can you add a new piece type (Empress = Rook + Knight) with zero changes to existing classes?
- Day 53: revisit Elevator. What happens if a third dispatch strategy is needed? How many files change?
- Day 54: revisit Vending Machine + Library. Name every pattern used in each and justify it.
- Day 55: self-timed mock — 45 minutes. Design a Hotel Management System from scratch. No notes.

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Putting business logic in the entity class.**


`Booking.calculateRefund()` means every time the refund policy changes, you edit `Booking`. At a company with 10 cancellation policies, `Booking` becomes a God class.


**✅ Correct approach:** `CancellationPolicy` interface injected into `Booking`. Refund logic lives in the policy. `Booking` calls `policy.calculateRefund(booking)`. Policy changes never touch `Booking`.


### Mistake 2


**❌ Designing without asking about concurrency upfront.**


A parking lot with 1,000 simultaneous entries. A booking system with 500 users selecting the same seat. Concurrency is not an afterthought — it changes which data structures and locking mechanisms you choose.


**✅ Correct approach:** In the requirements phase, ask: what’s the peak concurrency? Which resources are shared? Design shared resources to be thread-safe from the start: `AtomicBoolean`, `ReentrantLock`, `ConcurrentHashMap`.


### Mistake 3


**❌ Modelling every noun as a class immediately.**


Not every noun needs its own class. `CinemaHallSeatRow` is probably just an attribute of `Seat`, not a class. Over-modelling creates complexity with no extensibility benefit.


**✅ Correct approach:** A class earns its existence when: (1) it has its own behaviour (methods), (2) its attributes vary independently from other entities, (3) it’s referred to by multiple other classes. Bare data containers are structs, not classes.


### Mistake 4


**❌ Designing the happy path only.**


The interviewer WILL ask: what happens when the card payment fails mid-booking? What if the elevator is in maintenance mode? What if the reserved book is lost? Happy path design is not a complete design.


**✅ Correct approach:** For every state machine, explicitly design all error transitions. For every operation, define the failure contract: what state is the system in after a failure? What does the caller receive? This is the signal of production-grade thinking.


---


## 🏢 How real companies designed these systems


**BookMyShow — Seat locking at scale:** Their actual implementation uses Redis distributed locks with TTL. When you click a seat, a Redis `SET NX EX 600` command claims it atomically. If another user already claimed it, your request fails with “seat unavailable.” The lock auto-expires if payment doesn’t complete. This is the production version of the `Seat.lock()` method you implement here.


**Google Maps — Elevator scheduling analogy:** The elevator dispatch algorithm (SCAN) is the same algorithm used in hard drive scheduling. Google’s routing engine uses similar sweep-line techniques for route computation. The pattern recurs across domains.


**Uber — State machines everywhere:** Every Uber entity (trip, driver, payment) is a state machine. State transitions are events persisted to Kafka. The state machine logic lives in a single service with explicit state transition tables. The same pattern as the Vending Machine State pattern, at distributed system scale.


---


## 📖 Resources

- Grokking the Object Oriented Design Interview ([Educative.io](http://educative.io/)) — covers all 6 systems in this phase
- LeetCode Discuss — search “LLD” for community solutions to each problem
- GitHub: tssovi/grokking-the-object-oriented-design-interview (free markdown version)
- _Object-Oriented Analysis and Design with Applications_ — Booch (for deeper theory)
- Draw your class diagrams in [draw.io](http://draw.io/) or Excalidraw, not on paper. Build the habit of clean digital diagrams.

## Phase 4 — Advanced LLD Problems (Days 56–75)
> **Core insight:** Phase 3 problems were toy systems. Phase 4 problems are infrastructure components that real engineers build and maintain. The design bar is higher: thread safety is not optional, extensibility must be provable, and every interface must be justifiable.

---


## 🧠 Why this phase exists


Rate limiters, caches, pub-sub systems — these are not interview puzzles. They are production infrastructure that runs inside every large tech company. Designing them correctly requires combining OOP, design patterns, concurrency, and algorithmic thinking simultaneously. This phase is where LLD meets system engineering.


---


## 💻 Problems in order


### Day 56–58 — Rate Limiter


**Requirements:**

- Limit requests per user, per IP, per endpoint
- Multiple algorithms: Token Bucket, Sliding Window Counter, Fixed Window
- Thread-safe: handle concurrent requests correctly
- Pluggable backend: in-memory for single instance, Redis-backed for distributed
- Return: is request allowed? How many remaining? Reset time?

**Entities:** `RateLimiter`, `RateLimitRule`, `RateLimitResult`, `RateLimitAlgorithm`, `StorageBackend`, `RateLimiterConfig`


**Key design decisions:**


**Algorithm as Strategy pattern:**


```javascript
interface RateLimitAlgorithm {
    RateLimitResult allowRequest(String key, RateLimitRule rule);
}
class TokenBucketAlgorithm implements RateLimitAlgorithm { ... }
class SlidingWindowCounterAlgorithm implements RateLimitAlgorithm { ... }
class FixedWindowAlgorithm implements RateLimitAlgorithm { ... }
```


`RateLimiter` depends on `RateLimitAlgorithm` interface. Swap algorithms at config time.


**Storage as Strategy pattern:**


```javascript
interface StorageBackend {
    long getCount(String key);
    void increment(String key, Duration window);
    boolean setIfAbsent(String key, long value, Duration ttl);
}
class InMemoryStorage implements StorageBackend { ... }  // ConcurrentHashMap
class RedisStorage implements StorageBackend { ... }     // Redis commands
```


**Thread safety for Token Bucket:**

- `Map<String, TokenBucket>` with `ConcurrentHashMap`.
- Each `TokenBucket` uses `AtomicLong tokens` and `AtomicLong lastRefillTime`.
- `refill()` and `consume()` must be atomic: use `synchronized` on the bucket instance or `compareAndSet` loop.

**Rule hierarchy:** `RateLimitRule` has `limit` (count) and `window` (duration). Rules are looked up in priority order: user-specific rule → endpoint rule → global default. `RateLimiterConfig` manages the rule hierarchy.


**RateLimitResult:**


```javascript
class RateLimitResult {
    boolean allowed;
    long remainingTokens;
    Instant resetTime;
    String limitedBy;  // which rule triggered
}
```


**Multi-tier limiting:** apply user rule first. If allowed, apply endpoint rule. If allowed, allow request. Each tier is a separate `allowRequest()` call with a different key pattern: `user:{userId}`, `endpoint:{path}`, `ip:{address}`.


**SOLID check:** S: algorithm computes the limit check. Config manages rules. Storage manages state. Three classes. O: new algorithm = new class, zero changes to `RateLimiter`. D: `RateLimiter` depends on interfaces only.


### Day 59–61 — In-memory Cache (LRU + LFU)


**Requirements:**

- Fixed capacity. Evict on overflow.
- LRU (Least Recently Used) eviction policy
- LFU (Least Frequently Used) eviction policy
- O(1) get and put for both
- Thread-safe
- Pluggable eviction policy

**Entities:** `Cache<K,V>`, `EvictionPolicy<K>`, `CacheEntry<K,V>`, `LRUEvictionPolicy<K>`, `LFUEvictionPolicy<K>`


**LRU implementation (O(1) get + put):**

- `HashMap<K, Node>` for O(1) lookup.
- `DoublyLinkedList` maintaining access order. Head = most recently used. Tail = LRU victim.
- On `get(key)`: move node to head. O(1) with direct node reference from map.
- On `put(key, value)`: add to head. If capacity exceeded, remove tail node AND remove from map.
- On eviction: remove tail. O(1).

**LFU implementation (O(1) get + put):**

- `HashMap<K, Node>` for O(1) lookup.
- `HashMap<Integer, DoublyLinkedList>` mapping frequency → list of nodes at that frequency.
- `minFrequency` variable tracks the eviction target.
- On `get(key)`: increment node’s frequency. Move from `freqMap[freq]` to `freqMap[freq+1]`. If `freqMap[minFrequency]` is now empty, increment `minFrequency`.
- On eviction: remove tail of `freqMap[minFrequency]`. O(1).

**Eviction as Strategy:**


```javascript
interface EvictionPolicy<K> {
    void onAccess(K key);
    void onInsert(K key);
    K evict();
}
class LRUEvictionPolicy<K> implements EvictionPolicy<K> { ... }
class LFUEvictionPolicy<K> implements EvictionPolicy<K> { ... }
```


`Cache` is injected with `EvictionPolicy`. Adding TTL-based eviction = new `TTLEvictionPolicy`, zero changes to `Cache`.


**Thread safety:** `ReadWriteLock`. `get()` acquires read lock (multiple concurrent readers). `put()` acquires write lock (exclusive). This maximises read throughput under concurrent access.


**Cache decorator for TTL:** wrap the base `Cache` in a `TTLCache` decorator that checks expiry on `get()` and runs a background cleanup thread. Decorator pattern.


**SOLID check:** O: adding `ARCEvictionPolicy` (Adaptive Replacement Cache) = new class, zero changes to `Cache`. S: `Cache` manages storage. `EvictionPolicy` manages eviction order. Two separate responsibilities.


### Day 62–64 — Pub-Sub Message System


**Requirements:**

- Topics: create, delete
- Publishers: publish messages to a topic
- Subscribers: subscribe to a topic, receive messages
- Multiple subscribers per topic (fan-out)
- Subscriber types: synchronous (in-process) and async (background thread)
- Message retention: keep N last messages per topic
- At-least-once delivery: retry if subscriber fails

**Entities:** `MessageBroker`, `Topic`, `Message`, `Publisher`, `Subscriber`, `SubscriberGroup`, `MessageQueue`, `DeliveryWorker`


**Key design decisions:**


**Observer pattern as the core:**


```javascript
interface Subscriber {
    String getId();
    void onMessage(Message message);
}
class SyncSubscriber implements Subscriber { ... }   // calls handler inline
class AsyncSubscriber implements Subscriber { ... }  // puts message on internal queue
```


**Topic structure:**


```javascript
class Topic {
    String name;
    List<Subscriber> subscribers;           // thread-safe: CopyOnWriteArrayList
    Deque<Message> messageLog;             // bounded, last N messages
    
    void publish(Message msg) {
        messageLog.addLast(msg);
        for (Subscriber s : subscribers) s.onMessage(msg);
    }
    void subscribe(Subscriber s) { subscribers.add(s); }
}
```


**Async delivery with retry:**

- `AsyncSubscriber` has a bounded `BlockingQueue<Message>`.
- A `DeliveryWorker` thread drains the queue and calls the handler.
- On handler exception: exponential backoff retry up to N times, then dead letter queue.
- Dead letter queue: a special `Topic` named `{originalTopic}.dlq`.

**Message retention:** `ArrayDeque<Message>` with max size. On overflow: evict oldest. Allows late-joining subscribers to replay recent messages.


**Message schema:**


```javascript
class Message {
    String id;          // UUID for deduplication
    String topic;
    byte[] payload;
    Instant timestamp;
    Map<String, String> headers;
}
```


**SOLID check:** S: `Topic` manages subscriptions and fan-out. `DeliveryWorker` manages retry logic. `MessageBroker` manages topic lifecycle. Three separate classes. O: add a `FilteredSubscriber` (only receives messages matching a predicate) = new class implementing `Subscriber`.


### Day 65–68 — Ride-sharing System (Uber LLD)


**Requirements:**

- Riders request rides. Drivers accept.
- Match nearest available driver
- Trip lifecycle: requested → matched → in-progress → completed / cancelled
- Fare calculation: base fare + per-km + per-minute + surge multiplier
- Ratings: rider rates driver, driver rates rider
- Multiple vehicle categories: Auto, Mini, Prime, Premium

**Entities:** `RideRequest`, `Trip`, `Driver`, `Rider`, `Vehicle`, `Location`, `FareCalculator`, `FareStrategy`, `MatchingService`, `TripStateMachine`, `RatingService`


**Key design decisions:**


**Vehicle category as Strategy for fare:**


```javascript
interface FareStrategy {
    double calculate(double distanceKm, long durationSeconds, double surgeMultiplier);
}
class AutoFareStrategy implements FareStrategy { ... }    // lowest base
class PremiumFareStrategy implements FareStrategy { ... } // highest base
```


`Trip` holds its `FareStrategy`. Adding a new vehicle type = new strategy, zero changes to `Trip`.


**Trip state machine:**


```javascript
interface TripState {
    void onDriverAssigned(Trip trip);
    void onDriverArrived(Trip trip);
    void onTripStart(Trip trip);
    void onTripEnd(Trip trip);
    void onCancel(Trip trip);
}
// States: RequestedState, MatchedState, InProgressState, CompletedState, CancelledState
```


Each state handles only the valid transitions. Invalid transitions no-op or throw a domain exception.


**Matching service:**


```javascript
interface MatchingStrategy {
    Optional<Driver> match(Location riderLocation, VehicleCategory category, List<Driver> availableDrivers);
}
class NearestDriverStrategy implements MatchingStrategy { ... }  // Haversine distance
class SurgeAwareStrategy implements MatchingStrategy { ... }     // factors surge pricing
```


**Location model:**


```javascript
class Location {
    double latitude;
    double longitude;
    Instant timestamp;
    
    double distanceTo(Location other) { // Haversine formula }
}
```


**Driver availability:** `Driver` has `DriverStatus` enum: `AVAILABLE`, `ON_TRIP`, `OFFLINE`. `MatchingService` only considers `AVAILABLE` drivers. Update is atomic: `driver.setStatus(AVAILABLE)` must be thread-safe.


**Rating system:** Separate `RatingService`. `Trip` holds `tripId`. After completion, `RatingService.rateDriver(tripId, rating)` and `RatingService.rateRider(tripId, rating)`. Driver and Rider maintain `averageRating` computed from all ratings. Decoupled from `Trip` via Observer: `TripCompletedEvent` triggers rating prompt.


### Day 69–71 — Payment Wallet System (Paytm / Google Pay LLD)


**Requirements:**

- User wallet with balance
- Add money (bank transfer, card)
- Send money to another user
- Pay merchant
- Transaction history
- Refunds
- Concurrent transfers: no double-spend, no race condition

**Entities:** `Wallet`, `User`, `Transaction`, `TransactionLedger`, `PaymentGateway`, `TransactionType`, `WalletService`, `FraudDetectionService`


**Key design decisions:**


**Ledger-based balance:**

- Never store `balance` as a mutable field. Balance = `SUM(credits) - SUM(debits)` over all transactions.
- `Transaction` is immutable and append-only. Every credit and debit is a row.
- `Wallet.getBalance()` = `ledger.sumByWalletId(walletId)`.
- Why: full audit trail, no balance inconsistency, refunds are new credit transactions.

**Concurrent transfer (the hard part):**

- Transfer from A to B must: debit A and credit B atomically. Partial execution (debit A, fail to credit B) = money disappears.
- Solution 1 (single-machine): `synchronized` on both wallets in a deterministic order (by walletId) to prevent deadlock.

    ```java
    Wallet first = a.id < b.id ? a : b;
    Wallet second = a.id < b.id ? b : a;
    synchronized(first) { synchronized(second) { executeTransfer(a, b, amount); } }
    ```

- Solution 2 (production): database transaction with `SELECT FOR UPDATE` on both wallet rows. DB handles the locking.
- Solution 3 (distributed): saga pattern. Debit A (step 1) → Credit B (step 2). Compensate with credit A if step 2 fails.

**Payment gateway as Adapter:**


```javascript
interface PaymentGateway {
    PaymentResult charge(String instrumentId, Amount amount);
    RefundResult refund(String transactionId, Amount amount);
}
class StripeGatewayAdapter implements PaymentGateway { ... }
class RazorpayGatewayAdapter implements PaymentGateway { ... }
```


Swap payment processor = swap adapter. Zero changes to `WalletService`.


**Fraud detection as Chain of Responsibility:**


```javascript
interface FraudCheck {
    FraudResult check(Transaction tx, FraudCheck next);
}
// Chain: VelocityCheck → AmountThresholdCheck → GeolocationCheck → AllowAll
```


Adding a new fraud check = new class added to the chain. Zero changes to existing checks.


### Day 72–75 — Design review: all 5 advanced systems

- Day 72: Rate Limiter. Can you add a new algorithm (Leaky Bucket) with zero changes to `RateLimiter`? Prove it.
- Day 73: Cache. What happens if you need to add TTL support? Which class changes?
- Day 74: Pub-Sub + Ride-sharing. Name every pattern. Justify each one. Can any be removed without losing extensibility?
- Day 75: Wallet system. Self-timed 45-min mock. Design a Stock Trading System (buy/sell orders, portfolio, order matching). No notes.

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Designing concurrent data structures as an afterthought.**


A rate limiter that uses `HashMap` instead of `ConcurrentHashMap` will corrupt its state under concurrent load. Thread safety is a first-class design requirement, not a refactor.


**✅ Correct approach:** In the requirements phase, ask: what is the peak concurrency? Identify every shared mutable resource. Choose the correct concurrent data structure: `ConcurrentHashMap`, `AtomicLong`, `CopyOnWriteArrayList`, `BlockingQueue`. Never add locks as an afterthought.


### Mistake 2


**❌ Putting transaction logic inside the** **`Wallet`** **entity.**


`wallet.transfer(otherWallet, amount)` means `Wallet` knows about other wallets, the ledger, the payment gateway, and fraud detection. God class.


**✅ Correct approach:** `WalletService.transfer(fromWalletId, toWalletId, amount)` orchestrates the flow. `Wallet` is a pure domain entity: knows its ID and exposes `getBalance()`. The service handles the coordination across multiple domain objects.


### Mistake 3


**❌ Ignoring failure modes in the pub-sub delivery path.**


If `subscriber.onMessage()` throws, the exception propagates up, other subscribers in the list don’t receive the message, and the message is lost.


**✅ Correct approach:** Wrap each `subscriber.onMessage()` call in try-catch. Catch and log the exception. Continue delivering to remaining subscribers. Failed delivery triggers retry logic in `DeliveryWorker`. Messages that exhaust retries go to DLQ. Each subscriber’s failure is isolated.


### Mistake 4


**❌ Using primitives for money (****`double`** **or** **`float`****).**


`0.1 + 0.2 = 0.30000000000000004` in IEEE 754 floating point. For financial calculations, this causes incorrect balances and rounding errors.


**✅ Correct approach:** Use `BigDecimal` in Java (never `double` for money). Use `int` or `long` in cents/paise (avoid decimals entirely). Define a `Money` value object: `Money(BigDecimal amount, Currency currency)`. All arithmetic goes through `Money.add()`, `Money.subtract()` — never raw arithmetic.


---


## 🏢 How real companies designed these systems


**Stripe — Ledger-based accounting:** Stripe’s internal accounting system is append-only. Every financial event (charge, refund, dispute, payout) is an immutable ledger entry. Balance is always computed from the ledger, never stored as a mutable field. This gives them a complete audit trail and makes reconciliation deterministic.


**Redis (LRU implementation):** Redis’s LRU is approximate, not exact. Instead of tracking full access order (expensive), they sample 5 random keys from the keyspace and evict the one with the oldest access time. This gives 95%+ accuracy at 1/N the cost. The lesson: perfect LRU is O(1) per operation but complex. Approximate LRU is simpler and close enough for caching.


**Uber — Ride matching as a service:** Driver matching is not a method on `Trip`. It’s a separate `MatchingService` that runs independently, continuously updating a spatial index of driver positions. When a ride request comes in, the service queries the index. This separation — matching as a standalone service with its own algorithm — allows them to swap matching algorithms (nearest, ETA-based, revenue-optimised) without touching trip logic.


---


## 📖 Resources

- _Java Concurrency in Practice_ — Goetz (essential for concurrent LLD problems)
- LeetCode 146 (LRU Cache) — implement before designing the full cache system
- LeetCode 460 (LFU Cache) — implement before the LFU design section
- _Effective Java_ — Items 78–84 on concurrency
- Go sync package documentation — `sync.Mutex`, `sync.RWMutex`, `sync.Map`, `atomic`

## Phase 5 — Expert LLD (Days 76–90)
> **Core insight:** At the expert level, LLD is no longer about passing an interview. It’s about the designs you create today being maintainable by someone else 2 years from now, at 10x the current load, by a team that wasn’t there when you wrote it. That standard changes everything about how you design.

---


## 🧠 Why this phase exists


Phases 1–4 taught you to design correctly. This phase teaches you to design for change, for teams, for time, and under the constraints of concurrent execution at production scale. These are the skills that separate a senior engineer from a staff engineer in code and design reviews.


---


## 📚 Topics in order


### Day 76–77 — Concurrency patterns in LLD


**The concurrency problem in LLD:** most LLD designs work perfectly single-threaded. At 1,000 concurrent requests, they corrupt state, deadlock, or starve threads. Concurrency is a first-class design concern, not an afterthought.


**Monitor pattern:**

- A class that encapsulates its own synchronisation. All public methods are `synchronized`. The object is its own lock.
- Use when: the class has multiple methods that must be mutually exclusive.
- Problem: coarse-grained locking reduces concurrency. One thread in any method blocks all others.
- Example: `BankAccount` with `synchronized deposit()`, `synchronized withdraw()`, `synchronized getBalance()`.

**Read-Write Lock pattern:**

- Multiple readers can run concurrently. Writers need exclusive access.
- Java: `ReentrantReadWriteLock`. Acquire `readLock()` for reads, `writeLock()` for writes.
- Use when: reads are frequent, writes are rare. Cache `get()` uses read lock. Cache `put()` uses write lock.
- Go: `sync.RWMutex`. `RLock()`/`RUnlock()` for reads. `Lock()`/`Unlock()` for writes.

**Immutable object pattern:**

- An object whose state cannot change after construction is inherently thread-safe. No synchronisation needed.
- Design for immutability: `final` fields (Java), all-caps naming convention, no setters, defensive copies in constructor.
- Use for: value objects (`Money`, `Location`, `Message`), configuration objects, event payloads.
- Cost: creating new objects instead of mutating. For small objects, this is negligible. For large objects, use copy-on-write.

**Producer-Consumer pattern:**

- Producer threads generate work items. Consumer threads process them. `BlockingQueue` decouples them.
- `LinkedBlockingQueue` with capacity bound: producer blocks when queue is full (backpressure). Consumer blocks when queue is empty.
- Use for: `AsyncSubscriber` in pub-sub, job queues, event processing pipelines.
- Thread pool sizing: I/O-bound consumers: `threads = CPU_cores × (1 + wait_time / compute_time)`. CPU-bound: `threads = CPU_cores`.

**Thread pool pattern:**

- Reuse a fixed number of threads instead of creating/destroying per task. Avoids thread creation overhead.
- Java: `ExecutorService`, `ThreadPoolExecutor` with `corePoolSize`, `maxPoolSize`, `workQueue`, `RejectionPolicy`.
- Go: worker pool of goroutines reading from a channel. Bounded concurrency without a framework.
- Rejection policies when queue is full: `AbortPolicy` (throw), `CallerRunsPolicy` (caller executes the task — natural backpressure), `DiscardPolicy` (silently drop), `DiscardOldestPolicy`.

**Future/Promise pattern:**

- Represent the result of an async computation. Caller gets a `Future<T>` immediately. Blocks on `future.get()` only when the result is needed.
- Java: `CompletableFuture` chains async operations. `thenApply()`, `thenCompose()`, `allOf()`.
- Go: return a channel. Caller reads from channel when ready.
- Use for: parallel I/O operations, async service calls, parallel data processing.

### Day 78–79 — Designing for testability


**The testability constraint:** if a class is hard to unit test, it’s badly designed. Hard to test = too many dependencies, too much responsibility, or too much global state.


**Dependency injection and mocking:**

- Inject every external dependency (DB, cache, external API, clock) via constructor.
- In tests: inject mocks. `OrderService(MockOrderRepository, MockEmailSender, MockClock)`.
- The clock as a dependency: `Clock.systemUTC()` vs injected `Clock`. With injection, you can test time-sensitive logic (TTL expiry, rate limit windows) without sleeping.

**Testing state machines:**

- Test every valid transition. Test every invalid transition (ensure they no-op or throw consistently).
- Inject the state machine with a `MockStateTransitionListener` to verify transitions were called.
- Parameterised tests: one test method, N (startState, event, expectedEndState) inputs.

**Testing concurrency:**

- `CountDownLatch`: synchronise N threads to start simultaneously. Test for race conditions.
- `CyclicBarrier`: all threads wait until all are ready, then proceed together. Amplifies race conditions.
- Repeat concurrent tests N=1000 times. A race condition that occurs 1-in-100 times will be caught.
- Use `java.util.concurrent.atomic` counters to verify exact execution counts under concurrency.

**The test pyramid for LLD:**

- Unit tests (70%): each class in isolation with mocked dependencies. Fast. No I/O.
- Integration tests (20%): a few classes wired together. May use an in-memory DB.
- End-to-end tests (10%): full flow from entry point to final state. Slowest. Fewest.
- A class without unit tests is an untested design claim. Every public method should have a test.

**Interface-based design = testable design:** if your class depends on interfaces, you can always inject a test double. If it depends on concrete classes, you’re coupled to real I/O in tests.


### Day 80–81 — Refactoring legacy code to clean LLD


**The refactoring context:** in a real job, you rarely design greenfield. You inherit a codebase with God classes, no interfaces, static methods everywhere, and tests written after bugs were found. This phase teaches you to systematically improve it.


**Characterisation tests (first step):**

- Before refactoring, write tests that capture the current behaviour — even if the behaviour is wrong.
- These tests prevent you from accidentally changing behaviour during refactoring.
- Rule: never refactor code without a characterisation test suite.

**Strangler Fig pattern:**

- Gradually replace a component by building the new version alongside the old one. Route a small percentage of traffic to the new component. Increase over time. Retire the old.
- In LLD: extract an interface from the old class. Write a new implementation. Feature-flag which one is used.
- Applies to: replacing a God class with focused classes, swapping an algorithm, changing a data structure.

**Extract Interface refactoring:**

- Take a concrete class. Identify the methods its callers use. Extract those into an interface. Replace direct dependencies on the class with the interface.
- Now: you can inject a mock in tests. You can add a second implementation. The caller is decoupled.

**Break the dependency chain:**

- A calls B calls C calls D: if D is a database, A is coupled to the database. You can’t test A without a database.
- Fix: inject D as an interface into C. Inject C as an interface into B. Inject B as an interface into A. Now A has zero knowledge of the database.

**The God class decomposition strategy:**

1. List all methods in the God class.
2. Group methods by the actor that causes them to change (SRP grouping).
3. Extract each group into a focused class with its own interface.
4. Inject the focused classes into a thin orchestrator that replaces the God class.
5. Verify with characterisation tests that behaviour is unchanged.

### Day 82–83 — LLD code review methodology


**The staff engineer’s code review checklist for LLD:**


**Responsibility:**

- Does each class have a single, clearly nameable responsibility?
- Can you describe what each class does without the word ‘and’?
- Are there any classes named `Manager`, `Helper`, `Utility`, `Handler`? (smell)

**Extensibility:**

- If the most likely next requirement arrived tomorrow, how many files would change?
- Are the change-prone parts hidden behind interfaces?
- Is there a switch/if-else statement that will grow with every new type? (Should be a Factory + polymorphism)

**Dependencies:**

- Does any business logic class depend on a concrete infrastructure class (DB, HTTP client)? (DIP violation)
- Is there a `new ConcreteClass()` inside a business class? (DIP violation)
- Are there circular dependencies between packages? (design problem)

**Concurrency:**

- Is every shared mutable resource protected? (ConcurrentHashMap, synchronized, atomic)
- Are locks acquired in a consistent order? (deadlock prevention)
- Is there any blocking I/O on a thread that should be non-blocking?

**Testability:**

- Can each class be tested without spinning up a database, cache, or external service?
- Does each class receive its dependencies via constructor? (DI enables mocking)
- Are there static method calls to concrete classes inside business logic? (hard to mock)

**Error handling:**

- Are failure modes explicit in method signatures (checked exceptions, Result types)?
- Does every error path result in a defined system state?
- Are there silent swallowed exceptions (`catch(Exception e) {}`)?

### Day 84–85 — Advanced design: Generic frameworks and plugin systems


**Building a plugin system:**

- Core: a `PluginRegistry` that maps plugin names to `Plugin` implementations.
- Each `Plugin` implements a standard interface: `init()`, `execute(context)`, `shutdown()`.
- Loading: `ServiceLoader` in Java, or `reflect` in Go, or explicit registration.
- Ordering: plugins have `priority` or explicit `after/before` dependencies. Build a DAG, topological sort.
- Real example: Gin/Express middleware is a plugin system. Webpack loaders are a plugin system.

**Generic repository pattern:**


```java
interface Repository<T, ID> {
    Optional<T> findById(ID id);
    List<T> findAll();
    T save(T entity);
    void delete(ID id);
}
class UserRepository implements Repository<User, UUID> { ... }
class OrderRepository implements Repository<Order, UUID> { ... }
```


All CRUD operations follow the same contract. The business layer depends only on `Repository<T, ID>`. Swap SQL for NoSQL = new implementation class.


**Event system with generics:**


```java
interface EventHandler<T extends Event> {
    void handle(T event);
}
class EventBus {
    Map<Class<?>, List<EventHandler<?>>> handlers;
    <T extends Event> void subscribe(Class<T> type, EventHandler<T> handler);
    <T extends Event> void publish(T event);
}
```


Type-safe event routing. `OrderPlacedHandler implements EventHandler<OrderPlacedEvent>` is registered for exactly `OrderPlacedEvent` and nothing else.


### Day 86–88 — Designing for evolution: the 18-month test


**The 18-month test:** for every design decision, ask: “In 18 months, when this system has 10x the users and 3 new engineers who weren’t here, will this design help or hurt them?”


**Documentation as design output:**

- Every interface must have a Javadoc/GoDoc comment that specifies: what it does, what preconditions callers must meet, what postconditions the implementation guarantees, and what exceptions/errors are possible.
- Every design decision that is non-obvious must have an inline comment with the WHY (not the what).
- ADR (Architecture Decision Record): for significant design choices, write a 1-page document: context, decision, consequences, alternatives considered.

**Versioning interfaces:**

- Once an interface is used by multiple callers, it’s a contract. Breaking changes require a new interface version.
- Strategy: deprecate the old interface. Add a new interface. Migrate callers. Remove old.
- Never add methods to an existing interface without a default implementation (Java 8+) or a new interface version.

**The refactoring budget:**

- Good design accumulates less tech debt. Tech debt is the interest you pay on bad design in the form of slower feature velocity.
- Rule: 20% of every sprint is refactoring budget. Use it to apply patterns, extract interfaces, split God classes. Don’t wait for a dedicated ‘cleanup sprint’ — it never comes.

### Day 89–90 — The Staff Engineer LLD review + portfolio


**Day 89 — Staff-level design review:**


Take your Phase 3 Parking Lot design from Day 36. Conduct a formal review:

- List every SOLID principle. Is each satisfied? Produce a counterexample if not.
- Name every design pattern used. Justify each. Remove any pattern that adds complexity without adding extensibility.
- Concurrency audit: which shared resources are unprotected? What breaks at 1,000 concurrent entries?
- Testability audit: which classes can be unit-tested without a database? Which cannot? Why?
- The 18-month test: if the requirement changes from ‘hourly pricing’ to ‘dynamic pricing by demand’, how many files change?

**Day 90 — LLD portfolio:**


Document your 5 best designs as a personal reference and interview prep kit.


For each system, write:

1. One-sentence problem statement
2. Class diagram (Excalidraw or [draw.io](http://draw.io/) export)
3. Primary axis of change (the thing most likely to evolve)
4. Patterns used and why (not just names — the justification)
5. Concurrency design (which resources are shared, how they’re protected)
6. One thing you’d change with more time
7. The question this design cannot answer — what’s out of scope and why

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Designing for concurrency by adding** **`synchronized`** **to every method.**


Coarse-grained locking eliminates concurrency. All threads queue behind a single lock. A `HashMap` + `synchronized` is functionally correct but performs worse than a single-threaded program under load.


**✅ Correct approach:** Identify the minimal scope that must be atomic. Use `ConcurrentHashMap` for concurrent map access. `AtomicLong` for counters. `ReadWriteLock` for read-heavy maps. `synchronized` only for complex multi-step operations that must be atomic as a unit.


### Mistake 2


**❌ Refactoring without characterisation tests.**


You extract a God class into 4 focused classes. The behaviour changes subtly. You find out in production. Without tests that captured the before-behaviour, you can’t prove correctness.


**✅ Correct approach:** Write characterisation tests first. Run them. They all pass. Refactor. Run them again. They still pass. Now you can be confident the behaviour is preserved. This is the only safe refactoring process.


### Mistake 3


**❌ Designing the perfect system in isolation.**


The best design no one else understands is worse than a good design with clear documentation. At a team level, the maintainability of a design is measured by how quickly a new engineer can understand it.


**✅ Correct approach:** After designing a system, explain it to someone who wasn’t in the room. If they have questions about WHY a class exists or WHY a pattern was chosen, those are documentation gaps. Write ADRs for non-obvious decisions. Interface comments that explain contracts.


### Mistake 4


**❌ “We’ll clean it up later” without a mechanism to enforce it.**


“Later” is a calendar date that never arrives. Tech debt compounds. A God class grows by one more method every sprint because “there’s no time to refactor.”


**✅ Correct approach:** Budget refactoring into every sprint (the 20% rule). Use automated tools: ArchUnit (Java) to enforce architectural rules in CI. If a new dependency from business layer to infrastructure layer appears, the build fails. Architecture is enforced, not hoped for.


---


## 🏢 How real companies do this


**Google — Code review culture:** Google’s code review process explicitly checks for: SRP (can you describe this class in one sentence?), DIP (are there `new ConcreteClass()` calls in business logic?), and testability (can this be tested without I/O?). These are not suggestions — they block merges.


**Netflix — Resilience4j:** Their circuit breaker, rate limiter, bulkhead, and retry library is a textbook example of expert LLD. Each resilience pattern is a separate class implementing a `Decorator` around the protected function. They compose: `CircuitBreaker(RateLimiter(Bulkhead(targetFunction)))`. Every pattern is injectable, testable, and configurable independently.


**Airbnb — ArchUnit enforcement:** They use ArchUnit to enforce their layered architecture in CI. `domainLayer.shouldNotDependOn(infrastructureLayer)` is a test that runs on every PR. DIP violations block the build. Architecture is code.


---


## 🏆 You’ve completed the 90-day LLD roadmap


After 90 days you should be able to:

- Apply SOLID principles to any design and identify violations in any codebase
- Recognise and correctly apply all 23 GoF patterns
- Design 11 canonical LLD systems from scratch with class diagrams, sequence diagrams, and code
- Write thread-safe designs with correct concurrency primitives
- Conduct a staff-level design review: identify SOLID violations, testability gaps, concurrency risks
- Pass LLD rounds at any tier-1 product company

**What’s next:**

- Pair with the HLD roadmap — design both levels of the same system (Twitter feed: HLD architecture + LLD class design)
- Contribute to an open-source project and apply these principles in a real codebase review
- Read _Working Effectively with Legacy Code_ — Michael Feathers (the refactoring bible)
- Take on a real design review at work and write a formal critique using the Day 83 checklist

---


## 📖 Resources

- _Working Effectively with Legacy Code_ — Michael Feathers (for Phase 5 refactoring topics)
- _Java Concurrency in Practice_ — Goetz (mandatory for concurrency patterns)
- _Clean Architecture_ — Robert Martin (extends SOLID to the architecture level)
- ArchUnit: [archunit.org](http://archunit.org/) (enforce architecture rules in Java CI pipelines)
- Resilience4j source code: [github.com/resilience4j](http://github.com/resilience4j) (read it — expert LLD in production)
