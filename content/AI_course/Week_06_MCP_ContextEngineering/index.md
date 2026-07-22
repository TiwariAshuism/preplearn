---
source: manual
title: "Week 6 — MCP & Context Engineering"
slug: "Week_06_MCP_ContextEngineering"
parent: "AI_course"
children: []
order: 6
icon: "🔌"
cover: null
---
# Week 6 — MCP, Context Engineering, Multi-Agent Systems

**Goal by end of week:** you understand what actually goes into an agent's context window and why it matters, how agents remember things across turns/sessions, what MCP standardizes and why, and you can build a small multi-agent system where agents share tools and context sensibly.

**From last week:** you built single agents with hand-wired tools. This week is about making tool access standardized (MCP), giving agents memory beyond one conversation, and coordinating more than one agent.

---

## Day 1 — Context Engineering

- **The core idea:** everything the model sees at inference time — system prompt, conversation history, retrieved documents, tool definitions, tool results — is "the context," and *what you put in it, in what order, in what format* measurably changes output quality. This is a distinct skill from prompt engineering (which focuses on the instruction itself).
- **Why context is a scarce, expensive resource:** longer context costs more, is slower, and — counterintuitively — very long contexts can *dilute* attention on the most relevant parts ("lost in the middle" effects), so "just add more context" isn't free even when the context window technically fits it.
- **Practical context engineering moves:** put the most important instructions at the start and end (not buried in the middle), summarize/compress older conversation turns instead of keeping full history forever, only include tool definitions actually relevant to the current step (not your entire tool library every time), and structure retrieved content clearly (e.g. XML/markdown delimiters) so the model can tell "this is reference material" from "this is an instruction."
- **The tradeoff with agents specifically:** every tool call and observation adds to the context; a long-running agent loop can silently balloon its context until quality degrades or costs spike — deliberate context management (trimming, summarizing) becomes necessary, not optional, past a certain loop length.
- **Self-check:** why would putting your most important instruction in the exact middle of a 20,000-token prompt be a worse choice than putting it at the very start or very end?

**Blog:** [Anthropic — Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (read this in full today)

---

## Day 2 — Memory in Agents

- **Why memory is a separate problem from context:** context is what's in *this* model call; memory is how information persists *across* calls, conversations, or sessions — a memory system decides what to write down, how to store it, and what to retrieve back into context later.
- **Short-term memory:** the current conversation's turn history — the simplest form, but bounded by context window size and cost; usually just the recent N turns, or a running summary of older ones.
- **Long-term memory:** facts/preferences/events that should persist across sessions (e.g. "this user prefers metric units," "we discussed X last week") — typically stored externally (a database, a vector store) and retrieved via search when relevant, much like RAG but over the agent's own history rather than external documents.
- **Episodic vs. semantic memory (borrowing cognitive-science terms):** episodic = specific past events/interactions ("last Tuesday the user asked about refunds"); semantic = general facts distilled from those events ("this user often asks about refunds — flag as billing-sensitive"). Good agent memory systems often extract semantic facts from episodic logs rather than just replaying raw transcripts.
- **The core risk — memory poisoning/drift:** if an agent writes incorrect or stale information to long-term memory, it can compound over time (acting confidently on a wrong "remembered" fact); memory systems need some notion of confidence, recency, or contradiction-checking, not just append-only storage.
- **Self-check:** why would storing "just the raw chat transcript" as long-term memory work poorly compared to storing extracted, summarized facts?

**Paper:** [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) — Park et al., 2023 · [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) — Packer et al., 2023

---

## Day 3 — Model Context Protocol (MCP)

- **The problem MCP solves:** before MCP, every agent framework had its own bespoke way of wiring up tools/data sources — connecting an agent to Slack, a database, and a filesystem meant three different custom integrations, and switching agent frameworks meant rebuilding all of them.
- **MCP's core idea:** a standard client-server protocol. An **MCP server** exposes tools, resources (data), and prompts in a standard format; an **MCP client** (e.g. Claude Desktop, Claude Code, or your own agent) can connect to *any* MCP server and immediately use what it exposes, without custom integration code per server.
- **The three primitives MCP servers expose:** *Tools* (functions the model can call, like Week 5's function calling, but standardized), *Resources* (data the client can read, like files or DB rows), and *Prompts* (reusable prompt templates the server provides).
- **Why this matters practically:** anyone can write one MCP server for, say, "your company's internal ticketing system," and it becomes usable from any MCP-compatible client/agent immediately — it's an integration built once, reusable everywhere, analogous to what USB-C did for device charging/data cables.
- **Self-check:** before MCP existed, if you wanted the same "search internal docs" capability available in both a LangChain agent and Claude Desktop, what would you have had to build twice? What does MCP let you build once instead?

**Spec/Docs:** [Model Context Protocol specification](https://modelcontextprotocol.io/) · **Blog:** [Anthropic — Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)

---

## Day 4 — Building an MCP Server

- **Minimal anatomy of an MCP server:** define one or more tools (name, description, input schema — same shape as Week 5's function-calling schemas), implement the handler that actually executes each tool, and run the server over the MCP transport (stdio for local tools, HTTP/SSE for remote ones).
- **Local vs. remote MCP servers:** a local server (stdio transport) runs as a subprocess on your machine — great for filesystem access, local scripts, personal tools; a remote server (HTTP-based) can be hosted centrally and shared across a team/org.
- **Good tool design carries over directly from Week 5:** clear names, clear descriptions, tightly-typed input schemas — the model's ability to use your MCP server well depends entirely on how well you describe what it exposes.
- **Security consideration specific to MCP:** an MCP server you connect to can potentially read/act on a lot of context depending on what tools/resources it exposes — only connect to (and expose, if building your own) MCP servers you trust, since a malicious server is a similar risk surface to the prompt-injection concerns from Week 4.
- **Self-check:** if you're building an MCP server for your team's internal wiki, what's the minimum viable tool set (probably just "search" and "get_page"), and what would you deliberately leave out to keep the scope tight?

**Docs:** [MCP — Build a server (quickstart)](https://modelcontextprotocol.io/quickstart/server)

---

## Day 5 — Multi-Agent Systems

- **Why split work across multiple agents at all:** a single agent's context/toolset can get cluttered as scope grows (too many tools confuse tool selection, too much unrelated history dilutes context); splitting by responsibility keeps each agent's job narrow and its context focused.
- **Orchestrator/worker pattern:** one "orchestrator" agent breaks a task into sub-tasks and delegates each to a specialized "worker" agent (e.g. a research worker, a writing worker), then assembles their outputs — the orchestrator itself typically doesn't have direct access to every tool, just the ability to delegate.
- **Sequential vs. parallel multi-agent flows:** sequential = each agent's output feeds the next (like a chain, but with agents instead of single calls); parallel = independent sub-agents work simultaneously on different parts of a task, then results are merged — parallel is faster but only works when sub-tasks are genuinely independent.
- **Agent-to-agent communication:** what gets passed between agents matters as much as what's passed between LLM calls within one agent — typically a structured handoff (task description + relevant context), not the full raw conversation history of the delegating agent (that would blow up context for no benefit).
- **The honest cost:** more agents = more LLM calls = more latency and cost; multi-agent design is justified when task specialization/parallelism gains outweigh that overhead, not by default for anything that *could* be split up.
- **Self-check:** for "research a topic and write a 2-page summary," would you split this into a research agent + a writing agent, or keep it one agent? What would make you choose the split?

**Docs:** [LangGraph — Multi-agent architectures](https://langchain-ai.github.io/langgraph/concepts/multi_agent/)

---

## Day 6-7 — Coding Assignment + Projects
The umbrella deliverable is **MCP with memory and context optimization**.

### 🟢 Easy — Build and connect an MCP server
Build an MCP server exposing 2-3 simple tools (e.g. a file search tool, a calculator, a simple notes lookup) and connect it to Claude Desktop or Claude Code. **Deliverable:** working server + a screenshot/transcript of it being used successfully from the client.

### 🟡 Medium — Add persistent memory
Add long-term memory to an agent: store extracted facts from past conversations in a vector store, and retrieve relevant ones into context at the start of new conversations. **Deliverable:** a demo showing the agent correctly recalling a fact from a previous (separate) session.

### 🔴 Hard — Multi-agent system over MCP
Build a multi-agent system (1 orchestrator + 2 worker agents) where all tool access goes through MCP servers, and you deliberately manage context (summarize/trim handoffs between agents rather than passing full history). **Deliverable:** a trace of one full task showing the orchestrator delegating to both workers, plus a note on what context you trimmed at each handoff and why.

---

## 📺 Videos & Courses

**YouTube**
- [Learn MCP in ONE Video | Model Context Protocol Crash Course](https://www.youtube.com/watch?v=rwOYK8hk7yo) — a complete practical crash course matching Days 3-4.
- [How Model Context Protocol (MCP) actually works](https://www.youtube.com/watch?v=cGuyrANVi4A) — a deeper look at the client/server architecture from Day 3.

**Udemy**
- [Complete MCP Bootcamp: Build Next-Gen AI Agents with MCP](https://www.udemy.com/course/complete-mcp-bootcamp-build-next-gen-ai-agents-with-mcp/) — a dedicated MCP course, directly matching this week's Days 3-4 and the Day 6-7 project.

---

## References
**Papers**
- [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) — Park et al., 2023
- [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) — Packer et al., 2023

**Blogs / Docs**
- Anthropic — [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Anthropic — [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
- Model Context Protocol — [official specification](https://modelcontextprotocol.io/) and [server quickstart](https://modelcontextprotocol.io/quickstart/server)
- LangGraph — [Multi-agent architectures docs](https://langchain-ai.github.io/langgraph/concepts/multi_agent/)

