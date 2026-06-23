---
source: notion
title: "🧠 90-Day AI / LLM Engineering Roadmap — Beginner to Advanced"
slug: "90-day-ai-llm-engineering-roadmap-beginner-to-advanced"
notionId: "384da883bddd81438d21ca87e13a859d"
notionRootId: "384da883bddd81438d21ca87e13a859d"
parent: null
children: ["all-90-days-reference-aillm-roadmap","phase-5-llms-and-applied-genai-engineering-days-71-90","phase-4-nlp-and-transformers-days-56-70","phase-3-deep-learning-foundations-days-36-55","phase-2-classical-machine-learning-days-16-35","phase-1-python-and-math-foundations-days-1-15"]
order: 2
icon: "🧠"
cover: null
---
> **From Python/math foundations to building and deploying production LLM systems.** A structured, daily-practice roadmap covering classical ML, deep learning, transformers, and modern LLM/GenAI engineering — with code, projects, and the exact concepts interviewers and real systems expect.

---


## How to use this template

- Work phases **in order** — each layer rests on the one below it. You cannot skip to LLMs without understanding what a gradient is.
- Every day: read the concept, **implement it from scratch** at least once (not just call a library), then use the library version
- Use the **Daily Tracker** to log what you built, one key insight, and your confidence
- Every phase ends with a **capstone project** — a working, shippable artifact, not a notebook that only you understand
> **The rule:** if you can use `model.fit()` but can't explain what's happening inside it, you don't understand the model — you understand the API. This roadmap forces the former.

---


## Roadmap at a glance


| Phase                                      | Days  | Focus                                                                     | Capstone                                         |
| ------------------------------------------ | ----- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| Phase 1 — Python & Math Foundations        | 1–15  | NumPy, Pandas, Linear Algebra, Calculus, Probability                      | Linear regression from scratch (no sklearn)      |
| Phase 2 — Classical Machine Learning       | 16–35 | Regression, Classification, Trees, Ensembles, Clustering                  | End-to-end Kaggle-style ML pipeline              |
| Phase 3 — Deep Learning Foundations        | 36–55 | Neural Nets, Backprop, PyTorch, CNNs, RNNs                                | Image classifier + char-level language model     |
| Phase 4 — NLP & Transformers               | 56–70 | Tokenization, Embeddings, Attention, Transformer architecture             | Transformer built from scratch + fine-tuned BERT |
| Phase 5 — LLMs & Applied GenAI Engineering | 71–90 | Prompting, RAG, Vector DBs, Fine-tuning (LoRA), Agents, Evals, Deployment | Production RAG application with evals            |


---


## The core mental model


```javascript
Math (linear algebra, calculus, probability)
        ↓ gives you
Classical ML (a function that maps X -> y, fit by optimization)
        ↓ generalizes to
Deep Learning (the function is a neural network, fit by gradient descent + backprop)
        ↓ specializes to
Transformers (a specific neural architecture using attention, great at sequences)
        ↓ scales to
LLMs (transformers trained on internet-scale text, billions of parameters)
        ↓ is wrapped by
LLM Engineering (prompting, RAG, agents, fine-tuning -- making LLMs useful in production)
```


Every layer is the previous layer plus one new idea. Skipping a layer means the next one feels like magic instead of mechanism.


---


## My progress

- **Current phase:** Phase 1
- **Current day:** Day 1 of 90
- **Projects shipped:** 0 / 5
- **Papers read:** 0
- **Models trained from scratch:** 0

---


## Quick links

- Phase 1 — Python & Math Foundations (Days 1–15)
- Phase 2 — Classical Machine Learning (Days 16–35)
- Phase 3 — Deep Learning Foundations (Days 36–55)
- Phase 4 — NLP & Transformers (Days 56–70)
- Phase 5 — LLMs & Applied GenAI Engineering (Days 71–90)
- All 90 Days Reference

---


## Core tech stack


| Layer               | Tools                                              |
| ------------------- | -------------------------------------------------- |
| Numerical computing | NumPy, Pandas                                      |
| Classical ML        | scikit-learn                                       |
| Visualization       | Matplotlib, Seaborn                                |
| Deep learning       | PyTorch                                            |
| Transformers / NLP  | Hugging Face Transformers, tokenizers, datasets    |
| LLM orchestration   | LangChain or LlamaIndex                            |
| Vector databases    | FAISS, Chroma, Pinecone                            |
| Fine-tuning         | PEFT (LoRA/QLoRA), bitsandbytes                    |
| Experiment tracking | Weights & Biases (wandb)                           |
| LLM APIs            | OpenAI API, Anthropic API, local models via Ollama |
| Evaluation          | Ragas, custom eval harnesses                       |
| Deployment          | FastAPI, Docker, Streamlit/Gradio for demos        |


---


## Essential reading list (by phase)


| Resource                                                     | Use for                                           |
| ------------------------------------------------------------ | ------------------------------------------------- |
| _Mathematics for Machine Learning_ (Deisenroth, Faisal, Ong) | Phase 1 math foundation — free PDF                |
| _Hands-On Machine Learning_ — Aurélien Géron                 | Phase 2 classical ML, very practical              |
| StatQuest (YouTube)                                          | Phase 1–2 intuition for every algorithm           |
| _Neural Networks: Zero to Hero_ — Andrej Karpathy (YouTube)  | Phase 3 backprop and language models from scratch |
| _Dive into Deep Learning_ ([d2l.ai](http://d2l.ai/))         | Phase 3 deep learning, code-first                 |
| "Attention Is All You Need" (2017)                           | Phase 4 the original Transformer paper            |
| "BERT" paper (2018)                                          | Phase 4 encoder-only transformers                 |
| "Language Models are Few-Shot Learners" (GPT-3 paper, 2020)  | Phase 5 scaling and in-context learning           |
| "LoRA: Low-Rank Adaptation" paper                            | Phase 5 efficient fine-tuning                     |
| Hugging Face NLP Course (free)                               | Phase 4–5, hands-on transformers                  |
| Anthropic's Prompt Engineering docs                          | Phase 5 prompting best practices                  |


---


## Final prep checklist

- [ ] Implement linear regression and logistic regression from scratch (gradient descent, no sklearn)
- [ ] Explain bias-variance tradeoff and overfitting with a concrete example
- [ ] Implement backpropagation by hand for a 2-layer neural network
- [ ] Explain what a gradient, loss function, and optimizer actually do
- [ ] Build a CNN and an RNN from scratch in PyTorch
- [ ] Explain self-attention and multi-head attention mathematically
- [ ] Implement a transformer block from scratch (no `nn.TransformerEncoder`)
- [ ] Fine-tune a pretrained model (BERT or similar) on a custom dataset
- [ ] Explain the difference between pretraining, fine-tuning, RLHF, and prompting
- [ ] Build a RAG pipeline with a vector database and evaluate its retrieval quality
- [ ] Fine-tune an LLM with LoRA/QLoRA on consumer hardware
- [ ] Explain temperature, top-k, top-p sampling, and why they matter
- [ ] Build an agent that uses tools (function calling)
- [ ] Design an evaluation harness for an LLM application (not just vibes)
- [ ] Deploy an LLM application behind an API with proper error handling and rate limiting

📅 AI/LLM Daily Tracker