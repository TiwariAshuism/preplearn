---
source: notion
title: "🔥 Kotlin/Android Deep Mastery — 30-Day Sprint"
slug: "kotlinandroid-deep-mastery-30-day-sprint"
notionId: "397da883bddd8107828af62dce1be2a4"
notionRootId: "397da883bddd8107828af62dce1be2a4"
parent: null
children: []
order: 3
icon: "🔥"
cover: null
category: "mobile"
---
> Intermediate → AOSP-level depth. 3–4 hrs/day. No fluff, no tutorial hell.

This builds on your existing **AOSP Roadmap** and **Compose Internals Wiki** — this sprint is the forcing function that makes you actually use them instead of just collecting them.


---


# 🧠 The 1% Strategy


The top 1% don't learn Android by consuming courses. They learn by **reverse-engineering systems under pressure**. Four shifts that separate them from the 99%:


## 1. Source-first, not tutorial-first


Every framework class you use — `ViewModel`, `Recomposer`, `WorkManager` — has source on AOSP/GitHub. Read the actual implementation before reading someone's blog explaining it. Tutorials are pre-chewed food; source code is the meal.

- [ ] Set up AOSP source browsing (Android Code Search: [cs.android.com](http://cs.android.com/)) — bookmark it, use it daily
- [ ] Clone `androidx` repo locally for Compose/Jetpack internals

## 2. Build the same app 3 times, each time deleting the scaffolding


Round 1: Use every library (Hilt, Retrofit, Room). Round 2: Rebuild core pieces yourself (your own DI container, your own HTTP client wrapper). Round 3: Explain _why_ the library exists by comparing your hand-rolled version to it. This is where real understanding compounds — not in round 1.


## 3. Debug by reading stack traces into the framework, not just your code


When a crash happens, don't stop at your own function. Step _into_ `ActivityThread`, `Choreographer`, `Handler`. This is the single highest-leverage habit for internals mastery — most devs never go past their own call frame.


## 4. Teach before you're ready


Write a wiki page or explain a concept (SlotTable, Binder, ART GC) to an imaginary junior _before_ you feel fully confident. The gaps that surface when writing/teaching are exactly the gaps tutorials hide from you. You already do this instinctively with your Notion wikis — the sprint just adds a hard deadline.


---


# 🚫 Mistakes That Waste 80% of Time (even at intermediate level)


| Mistake                                                                                         | Why it kills momentum                                                                    | Fix                                                                                              |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Collecting roadmaps instead of shipping                                                         | Notion wikis feel like progress but produce zero muscle memory                           | Cap planning to 10% of time; 90% is building/reading source                                      |
| Jumping to Compose internals before ViewModel/Lifecycle internals are rock solid                | Compose internals assume you deeply get lifecycle-aware components; gaps compound        | Sequence: Lifecycle → ViewModel/SavedState → Compose runtime                                     |
| Reading AOSP top-down (start at `ActivityThread`)                                               | You drown in scope with no anchor                                                        | Start from ONE symptom (e.g. a jank frame) and trace backward into the framework                 |
| Rewriting notes instead of rewriting code                                                       | Notes feel productive, don't build recall under pressure                                 | Every internals concept gets a tiny reproducible code experiment, not just a note                |
| No time-boxing on rabbit holes                                                                  | AOSP source is infinite; you can lose a week in `Binder.cpp`                             | Hard 90-min cap per investigation, then write down the unanswered question and move on           |
| Skipping the 'why' behind Kotlin language features (inline, reified, coroutines under the hood) | You use `suspend` without knowing it's CPS-transformed state machines — ceiling hit fast | Dedicate explicit blocks to Kotlin compiler/runtime internals, not just Android framework        |
| Building portfolio apps with default Material templates                                         | Doesn't touch AOSP-level territory (rendering, process/IPC, memory)                      | Choose problems that force you into internals: custom View, custom layout, IPC, memory profiling |


---


# 📅 30-Day Plan (3–4 hrs/day)


Structure: **Week 1** Kotlin + coroutine internals → **Week 2** Android framework core (lifecycle, process, IPC) → **Week 3** Compose runtime internals (using your existing 9-chapter wiki as the spine) → **Week 4** AOSP-level systems (ART, Binder, WindowManager) + capstone.

<details>
<summary>Week 1 — Kotlin & Coroutine Internals (Days 1–7)</summary>
- [ ] Day 1: Kotlin compiler pipeline overview — read compiler IR docs, not blog summaries
- [ ] Day 2: `inline`/`reified`/`crossinline` — decompile to Java bytecode via Kotlin bytecode viewer, see what's actually generated
- [ ] Day 3: Sealed classes, delegation (`by`), property delegates — implement `lazy` and `observable` from scratch
- [ ] Day 4: Coroutines Part 1 — suspend functions as CPS state machines; decompile a simple suspend fn
- [ ] Day 5: Coroutines Part 2 — `CoroutineContext`, `Dispatchers`, structured concurrency; build your own toy dispatcher
- [ ] Day 6: Flow internals — cold streams, backpressure, `StateFlow` vs `SharedFlow` internals
- [ ] Day 7: Capstone — write a 1-page "Kotlin runtime model" explainer from memory, no notes open

</details>

<details>
<summary>Week 2 — Android Framework Core (Days 8–14)</summary>
- [ ] Day 8: Process/App startup — `Zygote` fork, `ActivityThread.main()`, application startup trace
- [ ] Day 9: `Looper`/`Handler`/`MessageQueue` — trace a `runOnUiThread` call end-to-end in source
- [ ] Day 10: Activity/Fragment lifecycle internals — `Lifecycle`, `LifecycleRegistry`, state machine source
- [ ] Day 11: `ViewModel` + `SavedStateHandle` internals — how survival across config change actually works
- [ ] Day 12: Binder/IPC fundamentals — what a `Parcelable` actually does at the kernel driver level (conceptual, not full driver deep-dive)
- [ ] Day 13: `Choreographer` + frame pipeline — VSYNC, jank, why 16ms matters
- [ ] Day 14: Capstone — instrument a real app with Perfetto/systrace, trace one full frame draw

</details>

<details>
<summary>Week 3 — Compose Runtime Internals (Days 15–21)</summary>

Use your existing 9-chapter Compose Internals wiki as the reading spine — this week is applying it hands-on.

- [ ] Day 15: Composer + slot table — write a minimal custom `@Composable` and trace slot writes
- [ ] Day 16: Recomposer + snapshot state system — build a tiny observable state system mimicking `mutableStateOf`
- [ ] Day 17: Compose compiler IR lowering — inspect generated code for a simple composable (Compose compiler reports)
- [ ] Day 18: Layout/measure/draw phases — implement a custom `Layout` composable from scratch
- [ ] Day 19: Recomposition scoping — deliberately cause and then fix unnecessary recompositions, profile before/after
- [ ] Day 20: CompositionLocal + side-effect APIs (`LaunchedEffect`, `DisposableEffect`) internals
- [ ] Day 21: Capstone — build a custom layout + custom drawing component with zero Material dependencies

</details>

<details>
<summary>Week 4 — AOSP-Level Systems + Capstone (Days 22–30)</summary>
- [ ] Day 22: ART — how bytecode becomes machine code (interpreter → JIT → AOT), GC generations overview
- [ ] Day 23: Memory profiling — heap dumps, leak tracing with your own instrumented app
- [ ] Day 24: WindowManager + SurfaceFlinger — how a Window becomes pixels on screen
- [ ] Day 25: Binder deep-dive — trace an actual cross-process call (e.g. a system service call) with logs
- [ ] Day 26: App startup optimization — cold/warm/hot start, baseline profiles, real measurement
- [ ] Day 27–29: Capstone build — a small tool that touches 3+ internals areas (e.g. a custom perf-overlay library using Choreographer + Compose layout hooks + memory sampling)
- [ ] Day 30: Write and publish one deep-dive blog post ([ashu-blog.vercel.app](http://ashu-blog.vercel.app/)) explaining one internals topic end-to-end — this is your proof of mastery, not another private note

</details>


---


# 📊 Daily Rhythm Template


| Block          | Duration   | Focus                                                 |
| -------------- | ---------- | ----------------------------------------------------- |
| Source reading | 60–90 min  | Read AOSP/androidx source for the day's topic         |
| Hands-on build | 90–120 min | Reproduce, decompile, or instrument — never just read |
| Synthesis      | 15–20 min  | One paragraph in your own words, no copy-paste        |


---


# ✅ Weekly Checkpoints

- [ ] End of Week 1: Explain coroutines as CPS state machines, live, no notes
- [ ] End of Week 2: Trace one full app-launch-to-first-frame path from memory
- [ ] End of Week 3: Ship a custom Compose layout with zero Material deps
- [ ] End of Week 4: Publish the capstone blog post + working capstone tool
