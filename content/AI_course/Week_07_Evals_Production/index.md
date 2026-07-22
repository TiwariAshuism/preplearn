---
source: manual
title: "Week 7 — Evals & Production"
slug: "Week_07_Evals_Production"
parent: "AI_course"
children: []
order: 7
icon: "📊"
cover: null
---
# Week 7 — Evals, AI Applications in Production

**Goal by end of week:** you can explain why "it looked good when I tried it" isn't evidence an AI system works, build a real eval set, build an LLM-as-judge pipeline, and reason clearly about fine-tune vs. prompt vs. RAG tradeoffs for a production decision.

**From last week:** you've built retrieval, agents, and memory systems. This week is about *knowing whether they actually work* — the skill that separates a demo from something you'd trust in production.

---

## Day 1 — Why Evals Matter, and Hallucination Types

- **The core problem with "vibes-based" testing:** trying a system on 5 prompts you thought of yourself will always look good — you unconsciously pick prompts your system handles well. Evals are a *fixed, repeatable* test set you check every version against, so you can see regressions and improvements objectively.
- **Hallucination, more precisely defined:** the model generating confident, plausible-sounding content that is factually wrong or unsupported by the given context. Not one failure mode but several: **intrinsic** (contradicts the given source/context directly), **extrinsic** (adds unsupported information not in the source, even if not directly contradicting it), and **closed-domain vs open-domain** (fabricating within a RAG context you gave it, vs. fabricating from its own possibly-outdated training knowledge).
- **Why RAG doesn't eliminate hallucination by itself:** even with perfect retrieval, the model can still ignore the retrieved context and answer from its own (possibly wrong or outdated) internal knowledge, or subtly misstate what the source actually said — retrieval quality and generation faithfulness are separate things to measure.
- **Why "it answered correctly" isn't the whole eval story:** you also want to measure *faithfulness* (did it actually use the given context, or get lucky), *relevance* (did it answer what was asked), and *calibration* (does it say "I don't know" when it should, rather than confabulating).
- **Self-check:** give an example of a RAG answer that is factually correct but still a hallucination in the "faithfulness" sense (hint: correct by coincidence, not because it read the source).

**Blog:** [Hamel Husain — Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) (read in full — the most practical eval intro available)

---

## Day 2 — LLM-as-a-Judge

- **The core idea:** use a (usually stronger) LLM to score another LLM's outputs against a rubric, instead of relying purely on manual human grading — scales far better than humans reading every output, especially once you have hundreds of test cases and are iterating frequently.
- **Rubric design — the make-or-break detail:** vague criteria ("is this a good answer?") produce noisy, inconsistent judge scores; specific, checklist-style criteria ("does it cite a source?", "does it avoid claims not in the provided context?", "is the tone professional?") produce far more reliable, reproducible scores.
- **Known biases to correct for:** judges tend to prefer longer answers regardless of quality (length bias), prefer whichever answer they see first when comparing two (position bias — fix by randomizing/swapping order), and can favor answers stylistically similar to their own outputs (self-preference bias, especially when judge and generator are the same model family).
- **Pairwise comparison vs. absolute scoring:** pairwise ("which of these two responses is better?") tends to be more reliable than asking a judge to output an absolute score (e.g. 1-10) directly, because relative judgments are an easier, less arbitrary task for the judge model.
- **Validating your judge:** periodically check judge scores against a small set of human-labeled examples — if the judge disagrees with humans often, your rubric needs work before you trust it at scale.
- **Self-check:** why would asking a judge "rate this 1-10" tend to produce noisier results than asking it "which of these two answers is better, A or B, and why"?

**Paper:** [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) — Zheng et al., 2023

---

## Day 3 — Building an Eval Dataset

- **Where good eval questions come from:** real user queries/logs (once you have any traffic), edge cases you know are hard (ambiguous phrasing, questions with no good answer, adversarial phrasing), and deliberately-constructed "golden" examples covering your system's core use cases.
- **What a good eval example needs:** the input, and either a golden/reference answer, a rubric to score against, or (for retrieval specifically) the known-correct source passage — without one of these, "scoring" is just re-reading output with no ground truth to compare against.
- **Sizing your eval set realistically:** even 20-30 well-chosen examples covering your main use cases + known edge cases is far more useful than zero; you don't need thousands to start catching regressions, you need *representative* coverage more than volume.
- **Categorizing failures, not just pass/fail:** track *why* something failed (wrong retrieval, faithful-but-incomplete answer, hallucinated fact, wrong tone, tool-call error) — a bare pass rate tells you something's wrong but not what to fix.
- **Self-check:** if your eval set is built only from questions you personally think to ask, what kind of real-world failure is it guaranteed to miss?

**Blog:** [Eugene Yan — Patterns for Building LLM-based Systems (evals section)](https://eugeneyan.com/writing/llm-patterns/)

---

## Day 4 — Fine-tuning vs. Prompting vs. RAG — Revisited with Data

- **The Week 2/3 framework, now with an eval lens:** you can actually *test* each option against your eval set rather than guessing — try prompting alone, try prompting + RAG, try fine-tuning, and compare eval scores plus cost/latency for each, on the same test set.
- **Prompting's ceiling:** cheap and instant to iterate on, but bounded by what the base model can already do — great for format/tone nudges and few-shot pattern-following, weak for injecting facts the model has never seen or hasn't retained precisely.
- **RAG's ceiling:** great for facts and freshness, but adds retrieval latency/cost and is only as good as your retrieval quality (Week 3) — a perfect generator with bad retrieval still fails.
- **Fine-tuning's ceiling:** great for consistent behavior/format/style at scale (and can reduce prompt length/cost per request at high volume), but slow/expensive to iterate on and doesn't solve "the model doesn't know this fact" reliably or keep up with fast-changing information.
- **In practice:** most production systems combine at least two — RAG for facts + a well-crafted prompt for behavior, sometimes + fine-tuning for a narrow, high-volume behavior (like consistent tool-call formatting from Week 2's hard project).
- **Self-check:** for a support bot where policies change weekly, why is "fine-tune it every week" a bad plan, even if it technically works?

---

## Day 5 — Design Decisions for Production AI Apps

- **Quality vs. cost vs. latency, the eternal triangle:** a bigger/smarter model or a longer agent loop generally improves quality but costs more and is slower — production decisions are about picking a point on this tradeoff deliberately, not "always use the best model everywhere."
- **Where to spend your quality budget:** not every step in a pipeline needs your best model — e.g. routing/classification steps can often use a small, cheap model, reserving your best model for the step that actually determines final answer quality.
- **Designing for graceful degradation:** what happens when a tool call fails, the retrieved context is empty, or the judge/guardrail flags something? A production system needs a defined fallback for each, not just a happy-path implementation.
- **Instrumentation from day one:** log inputs, outputs, retrieved context, tool calls, and eval/guardrail results for every real request — you cannot debug or improve what you don't have visibility into (this sets up Week 8's observability topic directly).
- **Self-check:** name one place in a RAG-with-guardrails-and-an-agent-router pipeline where you'd deliberately use a cheap/small model instead of your best one, and justify why quality there matters less.

---

## Day 6-7 — Project: Build Your Own LLM Judge

### 🟢 Easy — Manual eval set
Write a 20-30 question eval set for your Week 4 RAG chatbot (mix of easy factual questions, ambiguous ones, and at least a few your system should refuse/say "I don't know" to). Score it manually. **Deliverable:** the eval set + scores + a short breakdown of failure categories you observed.

### 🟡 Medium — LLM-as-judge pipeline
Build an automated LLM-as-judge pipeline that scores your chatbot's responses against a written rubric (faithfulness, relevance, tone). Run it on the same eval set from the Easy project, and compare judge scores against your manual scores. **Deliverable:** a comparison table (manual vs. judge score per question) + your analysis of where they disagreed and why.

### 🔴 Hard — Continuous eval / regression pipeline
Build a lightweight pipeline that reruns your full eval set automatically whenever you change a prompt, model, or retrieval setting, and outputs a pass/fail regression report (did any previously-passing case start failing?). **Deliverable:** two runs — one on your current system, one after a deliberate change (e.g. a prompt tweak) — showing the regression report catching (or confirming no) quality change.

---

## 📺 Videos & Courses

**YouTube**
- [LLM as a Judge: Evaluating AI with AI for Hallucination Detection & Beyond](https://www.youtube.com/watch?v=wYibF4aezZ4) — covers Day 2's LLM-as-judge methodology and hallucination detection together.

**Udemy**
- No single verified course maps cleanly to this week specifically — search Udemy for **"LLM evaluation testing"** or **"LLM observability evals"** and check recent reviews before enrolling, since this is a fast-moving niche with fewer established courses than RAG/agents.

---

## References
**Papers**
- [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) — Zheng et al., 2023
- [TruthfulQA: Measuring How Models Mimic Human Falsehoods](https://arxiv.org/abs/2109.07958) — Lin et al., 2021
- [HELM: Holistic Evaluation of Language Models](https://arxiv.org/abs/2211.09110) — Liang et al., 2022

**Blogs**
- Hamel Husain — [Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/)
- Eugene Yan — [Patterns for Building LLM-based Systems & Products](https://eugeneyan.com/writing/llm-patterns/)
- OpenAI — [Evals framework (GitHub)](https://github.com/openai/evals)

