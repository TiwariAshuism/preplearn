---
source: manual
title: "Week 8 — Agentic System Design"
slug: "Week_08_Agentic_System_Design"
parent: "AI_course"
children: []
order: 8
icon: "🏗️"
cover: null
---
# Week 8 — Agentic System Design

**Goal by end of week:** you can reason about what breaks when an agent system moves from "works on my laptop" to "handles real traffic," make an informed MCP-vs-plain-API-wrapper call, and design (and partially implement) a system with an explicit cost/latency budget and observability built in.

**From last week:** you know how to measure whether an agent system is *good*. This week is about whether it *scales* and stays operable once real users depend on it.

---

## Day 1 — Agents at Scale

- **What changes between "one user, occasionally" and "many users, concurrently":** rate limits (both yours to the LLM provider, and any external APIs your tools call), cost that scales linearly (or worse, for multi-step agents) with traffic, and the fact that failures which were rare in testing become routine at volume.
- **Cost explosion in multi-step agents specifically:** each agent loop iteration is a full LLM call; a task that takes 8 ReAct steps costs roughly 8x a single call, and this multiplies further with multi-agent delegation (Week 6) — cost modeling has to account for *typical* loop length, not just per-call price.
- **Concurrency considerations:** many simultaneous agent sessions competing for the same rate limits/tool APIs; you need queuing, backoff, and possibly prioritization (a paying customer's request shouldn't wait behind a batch job's).
- **The "rare in testing, routine at scale" failure class:** a tool that fails 0.1% of the time is invisible in a 20-example eval set but hits real users constantly at 100,000 requests/day — production agents need retry logic and fallback behavior for failures you may never have personally seen.
- **Self-check:** if your agent averages 5 LLM calls per completed task and you expect 10,000 tasks/day, roughly how many LLM calls/day is that, and what does that imply for your rate-limit and cost planning?

---

## Day 2 — MCP vs. API Wrappers

- **The plain API wrapper approach:** write custom integration code directly calling each external service's API from within your agent's codebase — fast to build for a single, fixed use case, but every new tool is bespoke code, and nothing is reusable outside this specific project.
- **What MCP buys you over that (revisit Week 6):** a standard interface that's reusable across agents/clients, and a clean separation between "what tools exist" (the MCP server) and "which agent uses them" (the MCP client) — valuable when multiple agents/teams will reuse the same tools, or when tools might be swapped/added over time.
- **When a plain wrapper is genuinely the better call:** a single, stable, one-off integration that will never be reused elsewhere — the standardization overhead of building/maintaining an MCP server isn't worth it for something used in exactly one place, forever. Don't reach for MCP by default; reach for it when reuse or multi-client access is a real requirement.
- **Operational difference:** an MCP server is a separate running process/service you now operate (versioning, uptime, auth) — a plain wrapper is just code living inside your one application. MCP trades simplicity for reusability; be honest about whether you need the reusability.
- **Self-check:** you're building a tool that only your one internal support agent will ever use, with no plans to share it. Is MCP earning its overhead here, or is a plain wrapper the more honest choice?

**Resource:** [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — a community-written set of production-agent best practices, several factors directly address this tradeoff

---

## Day 3 — System Design Fundamentals for AI Apps

- **Caching:** identical or near-identical requests (common in support/FAQ-style traffic) don't need a fresh LLM call every time — cache responses keyed on the (normalized) input, and consider semantic caching (cache hit on *similar*, not just identical, queries) for further savings.
- **Latency budgets:** decide upfront what your end-to-end response time target is (e.g. "under 3 seconds for a chat reply"), then allocate that budget across retrieval, generation, guardrail checks, etc. — designing without a budget means you discover your latency problem only after users complain.
- **Streaming:** for user-facing chat, stream tokens as they're generated rather than waiting for the full response — dramatically improves *perceived* latency even when total generation time is unchanged.
- **Async/background processing for non-interactive work:** not everything needs a live response — batch evaluation runs, memory-extraction jobs (Week 6), and long-running research agents are often better as background jobs with a notification/polling pattern than a blocking request.
- **Self-check:** for a customer-facing chatbot, why might streaming the response matter more for perceived quality than actually reducing the total time-to-completion?

---

## Day 4 — Design Tradeoffs: Sync vs. Async, Single- vs. Multi-Agent Cost

- **Synchronous agents:** the user waits for the full loop to complete before seeing anything — simplest to build, but latency is the sum of every step, directly felt by the user.
- **Asynchronous agents:** the agent runs in the background (possibly for minutes), and the user is notified or polls for completion — necessary for genuinely long-running tasks (deep research, multi-hour workflows), at the cost of more complex state management (you need to track and resume in-progress agent state).
- **Single-agent cost vs. multi-agent cost, concretely:** a single well-scoped agent with a focused toolset is usually cheaper and faster than splitting into an orchestrator + multiple workers (each hop is extra LLM calls) — only pay the multi-agent cost when specialization/parallelism genuinely improves quality or speed enough to justify it (echoing Week 6 Day 5).
- **A practical rule of thumb:** start with the simplest design (single agent, synchronous) that could plausibly work, and add complexity (multi-agent, async, caching layers) only once you've measured that simple design falling short — this is the same instinct as not over-engineering code, applied to system architecture.
- **Self-check:** what's a concrete symptom (in latency, cost, or quality) that would tell you "this single-agent synchronous design is no longer enough" — versus just assuming you'll eventually need something fancier?

---

## Day 5 — Best Practices: Observability and Tracing

- **Why observability isn't optional for agentic systems:** a multi-step agent's behavior is much harder to reason about from output alone than a single LLM call — when it gives a wrong answer, you need to see *which* step went wrong (bad retrieval? wrong tool call? bad reasoning step?), not just the final output.
- **What to trace, at minimum:** every LLM call (prompt + response + latency + token cost), every tool call (arguments + result + success/failure), and the overall task outcome (did it complete, fail, get escalated) — ideally all linked under one trace ID per user request.
- **Tools built for this:** LangSmith (tight LangChain/LangGraph integration), Langfuse (open-source, framework-agnostic), or simply structured logging you build yourself if your stack is simple enough — the important thing is having *any* structured trace, not which specific tool you pick.
- **Turning traces into action:** traces aren't just for debugging one-off incidents — aggregate them to find your most common failure patterns, most expensive request types, and slowest steps, and feed that back into the eval set from Week 7.
- **Self-check:** without tracing, if your agent gives a wrong answer only 1 in 50 times in production, how would you even begin to investigate which step is the culprit?

**Docs:** [LangSmith — observability documentation](https://docs.smith.langchain.com/) · [Langfuse — open-source LLM observability](https://langfuse.com/blog)

---

## Day 6-7 — Project

### 🟢 Easy — Add tracing to an existing agent
Instrument one of your earlier agents (Week 5 or 6) with LangSmith or Langfuse. Capture latency and token cost per step across 10 example runs. **Deliverable:** a trace screenshot/export + a one-paragraph summary of which step is the most expensive/slowest and why.

### 🟡 Medium — Design a scaled agent system
Design (diagram + written doc, no need to fully implement) a scalable agent system for a real use case (e.g. e-commerce customer support handling 10,000 requests/day). Include an explicit cost budget (LLM calls x price) and latency budget (per step) and justify your MCP-vs-wrapper and sync-vs-async choices. **Deliverable:** the diagram + doc, 1-2 pages.

### 🔴 Hard — Implement caching + parallel execution
Take your Week 6 multi-agent pipeline and add (1) response caching for repeated/similar queries and (2) parallel/async execution of independent tool calls or worker-agent steps that were previously sequential. Benchmark latency and cost before vs. after on the same set of test tasks. **Deliverable:** a before/after benchmark table (latency, token cost) and an explanation of which optimization contributed more and why.

---

## 📺 Videos & Courses

**YouTube**
- [LangSmith Tutorial: Observability and Tracing for AI Agents](https://www.youtube.com/watch?v=EdzAH5_PppM) — matches Day 5's tracing material and the Day 6 Easy project directly.
- [Langfuse Intro — Observability & Tracing Deep Dive](https://www.youtube.com/watch?v=pTneXS_m1rk) — the open-source alternative to LangSmith, same Day 5 topic from the Langfuse team itself.

**Udemy**
- No single verified course maps cleanly to agent observability/scaling specifically — search Udemy for **"AI agent observability LangSmith Langfuse"**, or [The Complete Agentic AI Engineering Masterclass](https://www.udemy.com/course/agentic-ai-engineering-design-build-deploy-agents/) covers broader agent design/deployment tradeoffs that overlap this week's Days 1-4.

---

## References
**Blogs / Docs**
- Anthropic — [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) (revisit for scaling-relevant design patterns)
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — community production-agent best practices
- LangSmith — [observability docs](https://docs.smith.langchain.com/)
- Langfuse — [open-source LLM observability blog](https://langfuse.com/blog)
- Google Cloud / Kaggle — [Agents whitepaper](https://www.kaggle.com/whitepaper-agents)

