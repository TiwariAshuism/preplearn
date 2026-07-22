---
source: manual
title: "Week 2 — Quantization & Fine-Tuning"
slug: "Week_02_Quantization_FineTuning"
parent: "AI_course"
children: []
order: 2
icon: "⚙️"
cover: null
---
# Week 2 — Quantization and Fine-Tuning

**Goal by end of week:** you understand what fine-tuning actually changes inside a model, why LoRA/QLoRA make it affordable on a single GPU, what quantization trades away, and you can decide "should I fine-tune, or is prompting enough?" for a real scenario.

**From last week:** you should be comfortable with "a model is a big pile of weight matrices trained to predict the next token." This week is about *adjusting* those weights cheaply, and *shrinking* them for fast inference.

---

## Day 1 — Fine-tuning Fundamentals

- **Full fine-tuning:** update every weight in the model on your new data. Works well but requires storing gradients + optimizer state for every parameter — for a 7B model that's 100+ GB of GPU memory, out of reach on consumer hardware.
- **Catastrophic forgetting:** fine-tune too aggressively (too high a learning rate, too many epochs, too narrow a dataset) and the model can lose general capabilities it had before — it overfits to your narrow task.
- **Parameter-Efficient Fine-Tuning (PEFT):** freeze the original weights, add a small number of new trainable parameters, train only those. Far less memory, far less risk of forgetting, and you can swap adapters in/out like plugins.
- **When fine-tuning is the right tool at all:** you need a *behavior* change (tone, format, a narrow skill) that's hard to specify reliably with a prompt — not a *knowledge* problem (that's what RAG is for, Week 3).
- **Self-check:** why would fine-tuning a model to always answer in strict JSON be a good fit for fine-tuning, but "know today's stock prices" be a bad fit no matter how you fine-tune?

**Read:** [Hugging Face — PEFT conceptual guide](https://huggingface.co/docs/peft/conceptual_guides/lora)

---

## Day 2 — LoRA (Low-Rank Adaptation)

- **The core insight:** the *change* a fine-tuning task needs to make to a weight matrix tends to be low-rank — i.e., it can be well-approximated by multiplying two small matrices together, rather than a full-size update.
- **How it works mechanically:** for a frozen weight matrix `W` (say 4096×4096), LoRA adds `W + BA`, where `B` is 4096×r and `A` is r×4096, with r (the "rank") typically 4-64. Only `A` and `B` are trained — orders of magnitude fewer parameters than `W`.
- **Key hyperparameters:** `r` (rank — higher = more capacity, more memory), `alpha` (scaling factor for the LoRA update), `target_modules` (which weight matrices get adapters — usually the attention Q/K/V/O projections).
- **Why this is a big deal practically:** you can fine-tune a 7B model's *behavior* by training a few million parameters instead of 7 billion — fits on a single consumer GPU, trains in hours not days, and produces a small adapter file (megabytes) you can swap in/out of the same base model.
- **Self-check:** if LoRA only changes a low-rank slice of each matrix, why doesn't it hurt the model's other, unrelated capabilities much?

**Paper:** [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) — Hu et al., 2021 (read the abstract + Figure 1, the full math can wait)

---

## Day 3 — QLoRA

- **The remaining bottleneck after LoRA:** you still need to load the full base model into GPU memory to fine-tune adapters on top of it — a 7B model in FP16 is ~14GB, tight on a free-tier GPU (T4 has 16GB).
- **QLoRA's trick:** quantize the frozen base model down to 4-bit precision (via a specialized format called NF4, designed to match the actual distribution of neural net weights), keep the LoRA adapters in higher precision, and use "double quantization" + paged optimizers to squeeze memory further.
- **Why accuracy barely suffers:** only the *frozen* base model is quantized (it's not being trained, so precision loss there is a one-time approximation); the *trainable* LoRA adapters stay in full precision, where precision actually matters for learning.
- **What this unlocks:** fine-tuning a 7B-13B model on a single free Colab T4 GPU, or a 65B model on a single high-end consumer GPU — this is why QLoRA (2023) made local fine-tuning mainstream.
- **Self-check:** why is it safe to aggressively quantize the frozen weights but risky to quantize the LoRA adapters being trained?

**Paper:** [QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314) — Dettmers et al., 2023

---

## Day 4 — Quantization Deep-Dive

- **Precision formats:** FP32 (32-bit, rarely used for inference — too much memory), FP16/BF16 (16-bit, standard training/inference precision, BF16 has more exponent range so is more numerically stable), INT8 and INT4 (integer formats used purely to shrink deployed models, with some accuracy loss).
- **Why quantize at all:** memory and speed. A model at INT4 takes ~1/4 the memory and moves ~4x less data through the GPU's memory bus per token — often the actual bottleneck for inference speed, not compute.
- **Post-training quantization methods:** GPTQ (quantizes layer-by-layer, minimizing the reconstruction error against a calibration dataset) and AWQ (identifies which weights are most "salient" to outputs and protects those from precision loss). Both let you take an already-trained FP16 model down to INT4 with modest accuracy loss.
- **The general tradeoff:** lower precision = smaller/faster but noisier weights = some accuracy loss; the loss is usually small (a few % on benchmarks) for 8-bit, more noticeable at 4-bit depending on model size (larger models tolerate quantization better).
- **Self-check:** why does quantization help inference *speed*, not just memory — what's actually the bottleneck in serving an LLM?

**Papers:** [GPTQ](https://arxiv.org/abs/2210.17323) — Frantar et al., 2022 · [AWQ](https://arxiv.org/abs/2306.00978) — Lin et al., 2023
**Blog:** [Tim Dettmers — LLM.int8() and quantization](https://timdettmers.com/2022/08/17/llm-int8-and-emergent-features/)

---

## Day 5 — Inference Optimizations, and When (Not) to Fine-tune

- **KV cache:** during generation, each new token only needs to attend to *previous* tokens' Key/Value vectors — instead of recomputing them every step, cache them. This is the single biggest inference speedup technique and is on by default in every serving stack.
- **FlashAttention:** a way of computing the exact same attention math but restructured to minimize slow GPU memory reads/writes — no accuracy tradeoff, purely an engineering speedup, but a large one (2-4x faster attention).
- **Speculative decoding:** use a small, fast "draft" model to guess several tokens ahead, then have the large model verify them all in one parallel pass instead of one-token-at-a-time — a free speedup when the draft model's guesses are usually right.
- **Fine-tune vs. prompt vs. RAG — the decision framework:**
  - Need the model to know *facts* it doesn't have? → RAG (Week 3), not fine-tuning.
  - Need a specific *format*, *tone*, or *narrow skill* (e.g. always emit valid JSON, a specific coding style, a specific persona)? → fine-tuning is a good fit.
  - Can you get 90% of the way there with a better prompt + a few examples (few-shot)? → try that first, it's free and instant. Fine-tune only once you've hit prompting's ceiling.
  - Need this behavior across a *huge volume* of requests where even small per-request prompt-engineering overhead adds up? → fine-tuning can also reduce prompt length/cost at scale.
- **Self-check:** you want a support bot that always cites its source and never fabricates — is that a fine-tuning problem or a RAG problem? (It's mostly RAG + guardrails — fine-tuning a model to "know more facts" is expensive and doesn't stay current.)

**Blog:** [Sebastian Raschka — Practical Tips for Finetuning LLMs](https://magazine.sebastianraschka.com/p/practical-tips-for-finetuning-llms) · [Philschmid — Fine-tune LLMs in 2024 with QLoRA + TRL](https://www.philschmid.de/fine-tune-llms-in-2024-with-trl)

---

## Day 6 — Projects

### 🟢 Easy — LoRA text classification
Fine-tune DistilBERT (or Llama-3.2-1B) with LoRA on a text-classification dataset (e.g. IMDB sentiment, via `datasets` + `peft`). Compare accuracy against zero-shot prompting the same base model. **Deliverable:** accuracy numbers before/after, and the LoRA adapter size on disk vs the base model size.

### 🟡 Medium — QLoRA instruction fine-tune
Write 100-200 (instruction, response) pairs for a narrow task you care about (e.g. "rewrite text in a specific tone," "convert notes to structured format"). QLoRA fine-tune Mistral-7B or Llama-3-8B on Colab's free GPU. **Deliverable:** 5 before/after response comparisons on held-out prompts, plus your training loss curve.

### 🔴 Hard — Fine-tune an SLM for tool use
Build a dataset of (user request → correct function-call JSON) for 3 custom tools you define. Fine-tune a small model (1-3B) to emit valid tool calls. Benchmark tool-call accuracy (does it pick the right tool + correct arguments) against the same prompt run on the un-tuned base model. **Deliverable:** an accuracy comparison table and 3 failure cases with your analysis of why they failed.

---

## Day 7 — Review
Without notes, write out: what problem LoRA solves, what QLoRA adds on top, the difference between FP16/INT8/INT4, and your own decision rule for fine-tune vs. prompt vs. RAG. If your rule matches Day 5's framework, you're solid for Week 3.

---

## 📺 Videos & Courses

**YouTube**
- [LoRA & QLoRA Explained Simply | Full Fine-Tuning vs PEFT + Intuition + Practical](https://www.youtube.com/watch?v=cO6Ly7mIziQ) — covers Days 1-3 (full fine-tune vs. PEFT vs. LoRA vs. QLoRA) in one sitting.
- [The Complete Guide to End-to-End LLM Fine-Tuning (LoRA, QLoRA & Full)](https://www.youtube.com/watch?v=jrf5vyOEMr8) — a full pipeline walkthrough, good pairing for the Day 6 Medium/Hard projects.

**Udemy**
- [LLM Fine-Tuning with Hugging Face: LoRA, QLoRA, PEFT](https://www.udemy.com/course/fine-tuning-llm-with-hugging-face-transformers/) — hands-on fine-tuning with PEFT/LoRA/QLoRA/4-bit quantization, directly matching this week's Days 2-4.

---

## References
**Papers**
- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) — Hu et al., 2021
- [QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314) — Dettmers et al., 2023
- [GPTQ: Accurate Post-Training Quantization](https://arxiv.org/abs/2210.17323) — Frantar et al., 2022
- [AWQ: Activation-aware Weight Quantization](https://arxiv.org/abs/2306.00978) — Lin et al., 2023
- [FlashAttention](https://arxiv.org/abs/2205.14135) — Dao et al., 2022
- [Toolformer](https://arxiv.org/abs/2302.04761) — Schick et al., 2023

**Blogs**
- Sebastian Raschka — [Practical Tips for Finetuning LLMs](https://magazine.sebastianraschka.com/p/practical-tips-for-finetuning-llms)
- Hugging Face — [PEFT documentation](https://huggingface.co/docs/peft/index)
- Tim Dettmers — [LLM.int8() and Emergent Features blog](https://timdettmers.com/2022/08/17/llm-int8-and-emergent-features/)
- Philschmid — [Fine-tune LLMs in 2024 with QLoRA](https://www.philschmid.de/fine-tune-llms-in-2024-with-trl)

