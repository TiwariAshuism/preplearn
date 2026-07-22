---
source: manual
title: "11-Week Gen AI + Agentic AI Roadmap"
slug: "AI_course"
parent: null
children: ["Week_00_Deep_Learning_Foundations","Week_01_LLM_Overview","Week_02_Quantization_FineTuning","Week_03_RAG_Fundamentals","Week_04_RAG_Implementation","Week_05_Agents_ToolCalling","Week_06_MCP_ContextEngineering","Week_07_Evals_Production","Week_08_Agentic_System_Design","Week_09_Multimodal_Reasoning","Week_10_Capstone"]
order: 0
icon: "🧠"
cover: null
category: "ai"
estimatedDays: "11 weeks"
---

# 11-Week Gen AI + Agentic AI Roadmap (Beginner → Practitioner)

**Who this is for:** complete beginners who can write basic Python (loops, functions, pip install) but have never trained or fine-tuned a model. Start at **Week 0** if you've never covered neural network basics (backprop, gradient descent, loss functions) — skip straight to Week 1 if you have.

Each week lives in its own folder with a detailed day-by-day breakdown (concepts explained in plain English, papers, blogs, self-check questions) and 3 projects — 🟢 Easy / 🟡 Medium / 🔴 Hard — due on Day 6, plus a Day 7 review.

**Weekly rhythm:** Days 1-5 = one concept/day (45-60 min: read + watch + tiny hands-on snippet). Day 6 = the 3 projects (Easy is mandatory, do Medium/Hard as time allows). Day 7 = review; write a short summary in your own words before moving on.

**Setup once, before Week 1:**
- Python 3.10+, `pip install torch transformers datasets peft bitsandbytes accelerate sentence-transformers faiss-cpu langchain llama-index`
- A free Google Colab or Kaggle account (T4 GPU) — needed from Week 2 onward
- An Anthropic or OpenAI API key (pay-as-you-go, a few dollars covers the whole course)
- Accounts: Hugging Face (models/datasets), GitHub (save your work)

---

## Recommended full courses (span multiple weeks)
Pair these with the week-by-week plan below — they're broad enough to run alongside the whole roadmap rather than fitting one week.

- **YouTube (free) — [freeCodeCamp: Generative AI Full Course](https://www.youtube.com/playlist?list=PLkz_y24mlSJY7hlQ-GyDgUCWz8TyIX_S3)** — a long-form (20-65 hr, several versions exist on the channel) walk through LLMs, LangChain, vector DBs, and RAG; good as a video companion to Weeks 1-6.
- **YouTube (free) — [Andrej Karpathy: Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html)** — builds up from backprop-by-hand to a working GPT; the single best video series spanning Week 0 through Week 1.
- **Udemy — [Complete Generative AI Course With Langchain and Huggingface](https://www.udemy.com/course/complete-generative-ai-course-with-langchain-and-huggingface/)** (Krish Naik) — broad GenAI + LangChain/HuggingFace coverage, overlaps Weeks 1-6.
- **Udemy — [AI Engineer Core Track: LLM Engineering, RAG, QLoRA, Agents](https://www.udemy.com/course/llm-engineering-master-ai-and-large-language-models/)** (Ed Donner) — an 8-week hands-on track covering RAG, QLoRA fine-tuning, and agents together, overlaps Weeks 2, 3, 5.

---

## Weeks

| Week | Folder | Focus |
|---|---|---|
| 0 | [Week_00_Deep_Learning_Foundations](Week_00_Deep_Learning_Foundations) | Neurons, activations, forward/backward pass, loss, gradient descent, overfitting/regularization *(prerequisite — skip if you already know DL basics)* |
| 1 | [Week_01_LLM_Overview](Week_01_LLM_Overview) | Tokenization, vectorization, attention, pre-/post-training, LLM evals |
| 2 | [Week_02_Quantization_FineTuning](Week_02_Quantization_FineTuning) | LoRA, QLoRA, quantization (FP16/INT8/INT4), fine-tune vs. prompt vs. RAG |
| 3 | [Week_03_RAG_Fundamentals](Week_03_RAG_Fundamentals) | Chunking, embeddings, vector DBs, ANN search (HNSW/IVF), reranking |
| 4 | [Week_04_RAG_Implementation](Week_04_RAG_Implementation) | Query rewriting, HyDE, guardrails, prompt injection, safety |
| 5 | [Week_05_Agents_ToolCalling](Week_05_Agents_ToolCalling) | LLM vs. agent vs. multi-agent, tool calling, ReAct, orchestration |
| 6 | [Week_06_MCP_ContextEngineering](Week_06_MCP_ContextEngineering) | Context engineering, agent memory, MCP, multi-agent systems |
| 7 | [Week_07_Evals_Production](Week_07_Evals_Production) | Hallucinations, LLM-as-judge, eval datasets, production tradeoffs |
| 8 | [Week_08_Agentic_System_Design](Week_08_Agentic_System_Design) | Agents at scale, MCP vs. API wrappers, caching, observability |
| 9 | [Week_09_Multimodal_Reasoning](Week_09_Multimodal_Reasoning) | CLIP, ViT, diffusion models, video models, CoT, RLHF |
| 10 | [Week_10_Capstone](Week_10_Capstone) | Production-grade capstone combining GenAI + Agentic AI |

---

## Quick reference — general resources used throughout
- Hugging Face — [NLP Course](https://huggingface.co/learn/nlp-course) (free, covers Weeks 1-3 deeply)
- Andrej Karpathy — [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) (video series, great for Weeks 1-2)
- DeepLearning.AI — [short courses on RAG, agents, LangChain](https://www.deeplearning.ai/short-courses/) (free, 1-2 hrs each, map well onto Weeks 3-6)
- Anthropic — [Applied AI engineering blog](https://www.anthropic.com/engineering) (Weeks 5-8)
- Lilian Weng's blog — [lilianweng.github.io](https://lilianweng.github.io/) (deep, well-referenced posts across almost every week's topic)

