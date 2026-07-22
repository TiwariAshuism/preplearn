---
source: manual
title: "Week 5 — Agents & Tool Calling"
slug: "Week_05_Agents_ToolCalling"
parent: "AI_course"
children: []
order: 5
icon: "🤖"
cover: null
---
# Week 5 — AI Agents and Tool Calling

**Goal by end of week:** you can explain precisely what makes something an "agent" rather than a plain LLM call, implement tool/function calling, build a ReAct loop from scratch, and ship a multi-step customer support agent.

**From last week:** you've built systems that retrieve-then-generate in one pass. This week introduces *loops* — a model that takes an action, observes the result, and decides what to do next, potentially many times before answering.

---

## Day 1 — LLM vs Agent vs Multi-Agent

- **Plain LLM call:** input → single forward pass → output. No memory of taking actions, no ability to check its own work or gather new information mid-task.
- **Agent, the defining property:** the model runs in a *loop* — it can decide to take an action (call a tool, query a database, run code), observe the result, and decide the *next* step based on that observation, continuing until it decides the task is done.
- **What actually changed vs. a plain LLM:** not the model itself — it's the same underlying LLM — but the *scaffolding* around it: a loop, a set of tools it can invoke, and a way to feed tool results back in as new context.
- **Single agent vs. multi-agent:** a single agent handles the whole loop itself with one system prompt and one toolset; multi-agent systems split responsibilities across specialized agents (e.g. a "planner" agent and a "researcher" agent) that hand off work to each other — useful when one agent's context/toolset would get too cluttered or the task benefits from specialization (Week 6 goes deep on this).
- **The honest tradeoff:** agents are slower and more expensive than a single LLM call (multiple round-trips) and can fail in more complex ways (wrong tool choice, infinite loops, compounding errors across steps) — only reach for an agent when the task genuinely needs multi-step action-taking, not just longer output.
- **Self-check:** would you build "summarize this document" as an agent? Would you build "find and book the cheapest flight matching these constraints"? Why the difference?

**Blog:** [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) (read this in full today — it's the clearest framing available)

---

## Day 2 — Tool Calling / Function Calling

- **The mechanism:** you describe available tools to the model as structured schemas (name, description, parameters with types) alongside the prompt; the model, instead of (or in addition to) writing a text response, can output a structured request to call one of those tools with specific arguments.
- **What actually happens under the hood:** the model doesn't *execute* anything — it only outputs "call `get_weather` with `{city: "Mumbai"}`" as structured text/JSON. Your code is responsible for actually running that function and feeding the result back to the model as a new message.
- **Why good tool descriptions matter enormously:** the model chooses which tool to call and how to fill in arguments based purely on the name, description, and parameter docs you wrote — vague descriptions cause wrong tool selection or malformed arguments, this is a real engineering skill (prompt engineering applied to schemas).
- **Parallel vs. sequential tool calls:** some APIs let the model request multiple tool calls in one turn (e.g. "get weather in 3 cities" → 3 parallel calls) rather than one at a time — faster when calls don't depend on each other.
- **Self-check:** if you give a model a `search_web` tool and a `search_internal_docs` tool with near-identical descriptions, what failure mode would you expect, and how would you fix it?

**Docs:** [Anthropic — Tool use documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) · [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling)

---

## Day 3 — The ReAct Pattern

- **The core loop:** Reason (the model writes out its thinking about what to do next) → Act (it calls a tool) → Observe (the tool's result is fed back in) → repeat, until it reasons that it has enough information to give a final answer.
- **Why interleaving reasoning with acting helps (vs. just acting):** writing out "I should check X because Y" before acting measurably improves tool selection and reduces compounding errors — it's the same benefit chain-of-thought gives plain reasoning, applied to action-taking.
- **What a ReAct trace actually looks like:** `Thought: I need the current weather to answer this → Action: get_weather(city="Mumbai") → Observation: 31°C, humid → Thought: Now I can answer → Final Answer: ...` — this whole trace happens across multiple model calls, with your code parsing "Action" lines and injecting "Observation" lines.
- **Failure modes to watch for:** looping forever without converging (needs a max-steps cutoff), hallucinating a tool result instead of waiting for the real observation (needs clear prompt structure separating "you propose, we execute, then you see the real result"), and picking the wrong tool early which derails everything downstream.
- **Self-check:** why does writing "Thought: ..." before every action, rather than just calling tools silently, actually change what tools the model picks — the model isn't "thinking" in a human sense, so why would this help?

**Paper:** [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) — Yao et al., 2022

---

## Day 4 — Prompt Chaining

- **The idea:** instead of one big prompt trying to do everything, break the task into a fixed sequence of smaller LLM calls, each handling one sub-task, with the output of one feeding into the next.
- **Why chaining can beat one giant prompt:** each step has a narrower job (easier for the model to do well, easier for you to debug/validate), and you can insert validation/guardrail checks between steps.
- **Chaining vs. agentic looping:** chaining is a *fixed* sequence of steps you define in code ahead of time (step 1 always leads to step 2); an agent *decides* its own next step dynamically based on what it observes. Chaining is simpler, more predictable, and often good enough — don't reach for a full agent loop when a fixed chain solves the problem.
- **A concrete chain example:** "extract key entities" → "look up each entity" → "draft an answer" → "check the answer against the sources" — four fixed LLM calls, no dynamic branching, much easier to test than a freeform agent.
- **Self-check:** for a task with a well-known, always-the-same sequence of steps, why would you choose prompt chaining over building a full ReAct agent?

**Blog:** [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) (revisit the "workflows vs. agents" section specifically)

---

## Day 5 — Orchestration and Routing

- **Routing:** a classification step (often a small/cheap LLM call) that decides *which* downstream handler — a specific tool, prompt, or sub-agent — should handle a given request, before the expensive work happens.
- **Why routing matters for cost and quality:** not every request needs your most expensive model or your most complex tool loop — routing lets simple requests take a cheap fast path while complex ones get the full agent treatment.
- **Orchestration frameworks:** LangChain (broad ecosystem, chains + agents + tool integrations), LlamaIndex (RAG-first, strong retrieval/agent integration), LangGraph (graph-based, explicit state machines for more complex/branching agent flows) — pick based on how much control over the flow you need; frameworks add convenience but also abstraction you'll eventually want to peek under.
- **Building it yourself vs. a framework:** for learning, implement a basic ReAct loop by hand first (Day 6 project) before reaching for a framework — you'll understand what the framework is actually doing for you, and debug it far more effectively.
- **Self-check:** why might a support system route "what are your hours" to a simple lookup, but route "my payment failed twice and I was charged" to a full multi-step agent?

**Docs:** [LangChain — Agents conceptual guide](https://python.langchain.com/docs/concepts/agents/)

---

## Day 6-7 — Coding Assignment + Projects
The umbrella deliverable this week is a **customer support agent**; the tiers below build up to it.

### 🟢 Easy — Single-tool agent
Build an agent with exactly one tool (e.g. a calculator, or a weather API call) using native function calling from the Anthropic or OpenAI API — no framework, hand-roll the loop. **Deliverable:** working code + a transcript of 3 example runs showing the tool being called and its result used correctly.

### 🟡 Medium — Multi-tool ReAct agent
Build a ReAct agent with 3 tools (e.g. web search + calculator + a small local DB lookup) that must chain multiple steps to answer one question (e.g. "what's the population of the capital of the country with the highest GDP in [dataset], divided by 1000?"). **Deliverable:** full ReAct trace (Thought/Action/Observation) for one multi-step example, plus the max-steps safeguard you added.

### 🔴 Hard — Customer support agent with routing
Build a support agent that routes incoming requests between 2-3 specialized flows (e.g. billing questions, technical troubleshooting, refund requests), each with its own tools/prompt, plus escalation-to-human logic triggered when the agent's confidence is low or a request matches a "sensitive" pattern (e.g. anger, legal threats). **Deliverable:** a routing accuracy check (10 test requests, did they route correctly?) and a written explanation of your escalation trigger logic.

---

## 📺 Videos & Courses

**YouTube**
- [Build AI Agents (ReAct Agent) From Scratch Using LangChain!](https://www.youtube.com/watch?v=VoWGD4mvKjU) — hand-builds the exact ReAct loop from Day 3, good companion for the Day 6 Medium project.

**Udemy**
- [AI Agents Bootcamp: Build with LangChain, RAG & ANY LLM](https://www.udemy.com/course/ai-agents-bootcamp-build-with-langchain-rag-langflow-gpt/) — covers tool calling, ReAct-style agents, and orchestration matching this week's Days 2-5.

---

## References
**Papers**
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) — Yao et al., 2022
- [Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/abs/2302.04761) — Schick et al., 2023
- [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) — Shinn et al., 2023

**Blogs / Docs**
- Anthropic — [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- Anthropic — [Tool use documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- OpenAI — [Function calling guide](https://platform.openai.com/docs/guides/function-calling)
- LangChain — [Agents conceptual guide](https://python.langchain.com/docs/concepts/agents/)

