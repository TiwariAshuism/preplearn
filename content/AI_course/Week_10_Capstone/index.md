---
source: manual
title: "Week 10 — Capstone"
slug: "Week_10_Capstone"
parent: "AI_course"
children: []
order: 10
icon: "🚀"
cover: null
---
# Week 10 — Capstone Project

**Goal:** ship one production-grade project that combines GenAI (Weeks 1-4, 9) and Agentic AI (Weeks 5-8) into something real, with an eval showing it actually works — not just "it ran once."

---

## Day 1 — Recap

Skim your notes/READMEs from Weeks 1-9. For each week, write one sentence: "this week gave me ___, which I'll use in my capstone for ___." If a week doesn't map to anything in your capstone, that's fine — not every project needs everything, but be deliberate about what you're leaving out and why.

## Day 2 — Problem Selection

- Pick a problem that's **real to you** — something you'd actually want to use, not a generic "customer support bot" unless that's genuinely useful to you. Motivation matters more for a week-long solo build than for any other week.
- Scope it to fit one week: cut anything that isn't needed to demonstrate the core idea working end-to-end. A working narrow version beats a half-built ambitious one.
- Write a one-paragraph problem statement: what does the system do, who's it for (even if just you), what does "success" look like.

## Day 3 — Metrics for Evaluation

- Decide **before you build** how you'll know it worked — reuse Week 7's eval methodology: write 10-20 test cases with expected behavior/answers now, while you're not yet attached to a particular implementation's output.
- Pick 2-3 concrete metrics (e.g. retrieval recall@5, task completion rate, LLM-judge score against a rubric, latency) — not "it feels good."
- If your capstone includes an agent, decide your success criteria for multi-step tasks specifically (did it complete the task, not just "did it say something plausible").

## Day 4-6 — Build

- Day 4: core pipeline working end-to-end on the happy path (even if rough).
- Day 5: guardrails, error handling, and the eval pipeline from Day 3 running against your build.
- Day 6: iterate based on eval results — fix the failure category that's costing you the most points, not whichever bug is most annoying to look at.

## Day 7 — Feedback

Get feedback on your completed project — from a peer, a mentor, an online community (e.g. r/LocalLLaMA, relevant Discord communities), or a rigorous self-review using your own Week 7 eval methods against a version of yourself from a week ago who didn't know this material. Write down what you'd change if you had one more week.

---

## Capstone Project Ideas

Pick one, sized to your comfort level — or use these as a menu to mix-and-match pieces into your own idea.

### 🟢 Easy — Personal knowledge RAG chatbot
A RAG chatbot over your own documents (notes, a book, your company's public docs) with input/output guardrails and a 20-question eval set. **Combines:** Week 3 (retrieval), Week 4 (guardrails), Week 7 (evals).
**Done looks like:** a working chatbot, a README explaining your chunking/embedding choices, and an eval report with recall@5 and answer-quality scores.

### 🟡 Medium — Personal tool-using agent with memory
An agent for a real recurring task (e.g. a research assistant, an expense categorizer, a reading-list summarizer) with MCP-based tools, persistent memory across sessions, and tracing/observability. **Combines:** Week 5 (agents/tools), Week 6 (MCP/memory), Week 8 (observability).
**Done looks like:** a working agent, an MCP server you built, a demo of it recalling something from a previous session, and a trace showing per-step latency/cost.

### 🔴 Hard — Multimodal multi-agent pipeline
Example: "upload a receipt image → an agent extracts structured data → validates it → files it → answers questions about your spending." Fine-tune a small model where it genuinely helps (e.g. structured extraction format), include a full eval suite, and design within an explicit cost/latency budget. **Combines:** Week 2 (fine-tuning), Week 3-4 (RAG for spending Q&A), Week 5-6 (agents/MCP/memory), Week 7 (evals), Week 8 (system design), Week 9 (multimodal input).
**Done looks like:** a working end-to-end demo, a fine-tuned component with before/after metrics, a full eval report, and a written cost/latency budget you designed against.

---

## Final Deliverable Checklist
- [ ] Working demo (recording or live)
- [ ] README: problem statement, architecture diagram, design decisions and tradeoffs you made
- [ ] Eval report: your test set, scores, and what you'd fix next
- [ ] Cost/latency notes if your project is agentic
- [ ] One paragraph: what you'd build next if you had another week

**You're done with the roadmap once this exists and works.** That's a real portfolio piece covering both GenAI fundamentals and agentic systems — most people who "learn AI" never build something this complete.

