---
source: notion
title: "Phase 2 — Design Patterns (Days 16–35)"
slug: "phase-2-design-patterns-days-16-35"
notionId: "35ada883-bddd-815d-b9c8-d1d0dd8f7603"
notionRootId: "35ada883bddd813694d3fa44eb7ceee9"
parent: "90-day-lld-roadmap-low-level-system-design"
children: []
order: 3
icon: "🧩"
cover: null
---
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
