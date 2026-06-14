---
source: notion
title: "Phase 1 — OOP & SOLID Foundations (Days 1–15)"
slug: "phase-1-oop-and-solid-foundations-days-1-15"
notionId: "35ada883-bddd-81a2-866a-d50300ad560d"
notionRootId: "35ada883bddd813694d3fa44eb7ceee9"
parent: "90-day-lld-roadmap-low-level-system-design"
children: []
order: 4
icon: "🏗️"
cover: null
---
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
