---
source: notion
title: "Phase 3 — Core LLD Problems (Days 36–55)"
slug: "phase-3-core-lld-problems-days-36-55"
notionId: "35ada883-bddd-81ba-80e4-ec882bc65fb0"
notionRootId: "35ada883bddd813694d3fa44eb7ceee9"
parent: "90-day-lld-roadmap-low-level-system-design"
children: []
order: 2
icon: "🗂️"
cover: null
---
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
