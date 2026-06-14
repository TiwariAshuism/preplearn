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


| Phase | Days | Focus | Key Output |
| ----- | ---- | ----- | ---------- |
| [Phase 1 — OOP & SOLID Foundations](/templates/phase-1-oop-and-solid-foundations-days-1-15) | Days 1–15 | OOP pillars, SOLID, UML, design thinking | Solid mental model for every future design |
| [Phase 2 — Design Patterns](/templates/phase-2-design-patterns-days-16-35) | Days 16–35 | 23 GoF patterns, when to use each, anti-patterns | Pattern recognition in code reviews |
| [Phase 3 — Core LLD Problems](/templates/phase-3-core-lld-problems-days-36-55) | Days 36–55 | Parking Lot, Chess, Elevator, Vending Machine | 6 fully designed + coded systems |
| [Phase 4 — Advanced LLD Problems](/templates/phase-4-advanced-lld-problems-days-56-75) | Days 56–75 | Rate Limiter, Cache, Pub-Sub, Payment, Ride-share | 5 production-grade class designs |
| [Phase 5 — Expert LLD](/templates/phase-5-expert-lld-days-76-90) | Days 76–90 | Concurrency, thread safety, code review methodology | Staff-level design + review skills |


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

- [🏗️ Phase 1 — OOP & SOLID Foundations](/templates/phase-1-oop-and-solid-foundations-days-1-15)
- [🧩 Phase 2 — Design Patterns](/templates/phase-2-design-patterns-days-16-35)
- [🗂️ Phase 3 — Core LLD Problems](/templates/phase-3-core-lld-problems-days-36-55)
- [⚙️ Phase 4 — Advanced LLD Problems](/templates/phase-4-advanced-lld-problems-days-56-75)
- [🧠 Phase 5 — Expert LLD](/templates/phase-5-expert-lld-days-76-90)

---


## 📐 SOLID Principles — quick reference


| Principle | One-line definition | Violation smell |
| --------- | ------------------- | --------------- |
| **S** — Single Responsibility | One class, one reason to change | Class name contains ‘And’, ‘Manager’, ‘Helper’ |
| **O** — Open/Closed | Open for extension, closed for modification | Adding a feature requires editing existing code |
| **L** — Liskov Substitution | Subclass can replace superclass without breaking anything | Subclass throws UnsupportedOperationException |
| **I** — Interface Segregation | No client should depend on methods it doesn’t use | Interface has 15 methods, clients implement 3 |
| **D** — Dependency Inversion | Depend on abstractions, not concretions | `new ConcreteService()` inside a business class |


---


## 💻 Language recommendation


Use **Java** or **Go** for all LLD implementations in this roadmap.

- **Java:** Native OOP, interfaces, abstract classes, generics, `synchronized`. Most LLD interview solutions are in Java. Best choice if targeting product companies.
- **Go:** Interfaces via duck typing, goroutines for concurrency problems, no inheritance (composition only). Best choice if you’re already on the backend Go path.
- **Avoid:** Python for LLD — dynamic typing hides design problems that static typing would catch.
