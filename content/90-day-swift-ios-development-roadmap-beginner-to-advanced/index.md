---
source: notion
title: "📱 90-Day Swift / iOS Development Roadmap — Beginner to Advanced"
slug: "90-day-swift-ios-development-roadmap-beginner-to-advanced"
notionId: "39cda883bddd81908f86f82489b8c0c1"
notionRootId: "39cda883bddd81908f86f82489b8c0c1"
parent: null
children: ["phase-1-swift-foundations-days-1-15","phase-2-uikit-essentials-days-16-30","phase-3-swiftui-and-modern-ui-days-31-45","phase-4-data-networking-and-persistence-days-4660","phase-5-architecture-and-advanced-topics-days-61-75","phase-6-production-and-app-store-days-76-90","all-90-days-reference-swiftios-roadmap"]
order: 1
icon: "📱"
cover: null
category: "mobile"
---
> **From Swift syntax to shipping production iOS apps.** A structured, daily-practice roadmap covering Swift fundamentals, UIKit, SwiftUI, networking, persistence, architecture, testing, and App Store deployment — with real projects at every phase.

---


## How to use this template

- Work phases **in order** — each builds directly on the previous one
- Every day: read the concept + **write real code** — no watching tutorials without building
- Use the **Daily Tracker** to log what you built and one thing that surprised you
- Every phase ends with a **capstone app** — ship it to a simulator at minimum, TestFlight ideally
> **The rule:** if you can’t build a feature from a blank Xcode project without looking it up, you don’t own it yet. Reading and watching are study. Building is learning.

---


## Roadmap at a glance


| Phase                                    | Days  | Focus                                                                             | Capstone                            |
| ---------------------------------------- | ----- | --------------------------------------------------------------------------------- | ----------------------------------- |
| Phase 1 — Swift Foundations              | 1–15  | Swift syntax, types, closures, protocols, generics, error handling, concurrency   | Swift playground CLI apps           |
| Phase 2 — UIKit Essentials               | 16–30 | Views, Auto Layout, navigation, table/collection views, delegates, lifecycle      | Notes app (UIKit)                   |
| Phase 3 — SwiftUI & Modern UI            | 31–45 | SwiftUI views, state, navigation, animations, lists, custom components            | Weather app (SwiftUI)               |
| Phase 4 — Data, Networking & Persistence | 46–60 | URLSession, Codable, Core Data, SwiftData, UserDefaults, Keychain                 | Movie browser with offline support  |
| Phase 5 — Architecture & Advanced Topics | 61–75 | MVVM, Combine, async/await, testing, accessibility, performance                   | Full-featured social feed app       |
| Phase 6 — Production & App Store         | 76–90 | Push notifications, deep links, App Store prep, CI/CD, analytics, in-app purchase | Ship your Phase 5 app to TestFlight |


---


## Core tech stack


| Layer             | Technology                                         |
| ----------------- | -------------------------------------------------- |
| Language          | Swift 5.9+                                         |
| UI frameworks     | SwiftUI (primary), UIKit (fundamentals)            |
| Architecture      | MVVM + Combine / async-await                       |
| Networking        | URLSession, async/await                            |
| Local persistence | Core Data, SwiftData, UserDefaults, Keychain       |
| State management  | Combine, @State/@ObservedObject/@EnvironmentObject |
| Testing           | XCTest, XCUITest                                   |
| CI/CD             | Xcode Cloud or GitHub Actions + Fastlane           |
| Analytics         | Firebase Analytics or Mixpanel                     |
| Tools             | Xcode 15+, SF Symbols, Instruments, TestFlight     |


---


## My progress

- **Current phase:** Phase 1
- **Current day:** Day 1 of 90
- **Apps shipped:** 0 / 6
- **TestFlight builds:** 0

---


## Quick links

- Phase 1 — Swift Foundations (Days 1–15)
- Phase 2 — UIKit Essentials (Days 16–30)
- Phase 3 — SwiftUI & Modern UI (Days 31–45)
- Phase 4 — Data, Networking & Persistence (Days 46–60)
- Phase 5 — Architecture & Advanced Topics (Days 61–75)
- Phase 6 — Production & App Store (Days 76–90)
- All 90 Days Reference

---


## Essential resources


| Resource                                          | Use for                                       |
| ------------------------------------------------- | --------------------------------------------- |
| [Swift.org](http://swift.org/) documentation      | Phase 1 language reference                    |
| Apple Developer Documentation                     | All phases — the primary source of truth      |
| Hacking with Swift (Paul Hudson)                  | Practical code examples for every topic       |
| WWDC session videos                               | Advanced topics, SwiftUI updates, performance |
| Swift by Sundell                                  | Architecture, testing, concurrency deep dives |
| Point-Free ([pointfree.co](http://pointfree.co/)) | Functional patterns, Composable Architecture  |
| [Donnywals.com](http://donnywals.com/)            | Combine and async/await in depth              |


---


## Final prep checklist

- [ ] Explain optionals, optional chaining, and nil coalescing
- [ ] Write a protocol with associated types and a generic function
- [ ] Implement a delegate pattern from scratch
- [ ] Build a UITableView with custom cells using Auto Layout in code
- [ ] Build a SwiftUI view hierarchy with navigation and state
- [ ] Fetch JSON from a real API with async/await and decode with Codable
- [ ] Persist data with Core Data and SwiftData
- [ ] Implement MVVM with Combine publishers
- [ ] Write unit tests for a ViewModel
- [ ] Profile an app with Instruments and identify a memory leak
- [ ] Add push notifications to an app
- [ ] Create and submit a TestFlight build
- [ ] Explain the iOS app lifecycle
- [ ] Implement deep links with Universal Links
- [ ] Explain ARC and identify a retain cycle

📅 iOS Daily Tracker