---
source: manual
title: "Week 1 — LLM Overview"
slug: "Week_01_LLM_Overview"
parent: "AI_course"
children: []
order: 1
icon: "🔤"
cover: null
---
# Week 1 — Overview of LLMs & Training

**Goal by end of week:** you can explain, in your own words and without notes, how raw text becomes tokens, how tokens become vectors, how attention lets those vectors "talk to each other," and what happens in pre-training vs post-training.

**Prerequisite check:** comfortable with Python lists/loops, and matrix multiplication at a conceptual level (you don't need to hand-compute one, just know `A @ B` combines rows and columns). If matrices feel shaky, spend 30 min on [3Blue1Brown's Essence of Linear Algebra, ep. 3-4](https://www.3blue1brown.com/topics/linear-algebra) before Day 4.

---

## Day 1 — What is an LLM, and how did we get here?

- **The task underneath everything:** an LLM is a function that predicts the next token given previous tokens. Every capability (chat, code, reasoning) is this one task at scale.
- **Brief history:** n-gram models (count-based, no generalization) → RNNs/LSTMs (sequential, forget long-range context) → Transformers (2017, parallel + attention, no forgetting problem) → GPT-1/2/3 (scaling the same architecture) → ChatGPT/Claude (scaling + post-training for instruction-following).
- **Why Transformers won:** they process all tokens in parallel (fast to train on GPUs) and attention gives every token a direct path to every other token (no long-range forgetting like RNNs had).
- **Where today's models fit:** GPT (OpenAI), Claude (Anthropic), Llama (Meta, open-weight), Gemini (Google) — all decoder-only Transformers, differing mainly in scale, training data, and post-training recipe.
- **Self-check:** Could you explain to a non-technical friend why "predict the next word" is enough to produce something that can write code and answer questions? (Hint: scale + diversity of training data forces the model to internalize patterns of reasoning, not just word statistics.)

**Watch:** [Karpathy — "Intro to Large Language Models"](https://www.youtube.com/watch?v=zjkBMFhNj_g) (1 hr, do this today, it sets up the whole week)

---

## Day 2 — Tokenization

- **Why we can't just use words:** vocabularies would be huge (every inflection, typo, new word = new entry) and can't handle unseen words at all.
- **Why we can't just use characters:** sequences become very long, and the model has to work harder to learn that "c-a-t" means something.
- **The middle ground — subword tokenization:** break text into frequently-occurring chunks. "unbelievable" → `un` + `believ` + `able`. Common words stay whole; rare words split into pieces the model has seen before.
- **Byte-Pair Encoding (BPE):** start with individual characters/bytes, iteratively merge the most frequent adjacent pair into a new symbol, repeat until you hit a target vocabulary size (e.g. 50k). This is what GPT models use.
- **WordPiece (BERT) vs SentencePiece (Llama, T5):** same core idea, different merge criteria and whether whitespace is treated as a normal character (SentencePiece treats raw text as a byte/unicode stream, which is why it works well across languages).
- **Practical quirks this explains:** why LLMs are bad at counting letters (they never see individual letters, only tokens), why non-English languages often cost more tokens (less training data → coarser tokenization), why leading spaces matter (`" the"` and `"the"` can be different tokens).
- **Self-check:** tokenize "unbelievably" and "asdkfj123xyz" with a real tokenizer (Day 6 project) and predict which one uses more tokens per character, before you check.

**Read:** [Hugging Face NLP Course — Tokenizers](https://huggingface.co/learn/nlp-course/chapter2/4) · **Play with:** [OpenAI Tokenizer playground](https://platform.openai.com/tokenizer)

---

## Day 3 — Vectorization / Embeddings

- **The core problem:** neural nets only do math on numbers, not words. Tokens need to become vectors (arrays of numbers).
- **Naive approach — one-hot vectors:** each token gets a vector that's all zeros except a single 1. Works, but every word is equally "far" from every other word — no notion of "cat" and "dog" being similar.
- **Dense embeddings:** each token maps to a short, dense vector (e.g. 768 numbers) learned so that similar-meaning tokens end up close together in that space. This is learned automatically as a side effect of training on the next-token prediction task (or explicitly, as in word2vec).
- **word2vec intuition (historical, but the clearest mental model):** train a small network to predict a word from its neighbors (or vice versa); words that appear in similar contexts end up with similar vectors. Famous result: `king - man + woman ≈ queen`.
- **Cosine similarity:** the standard way to measure "how close" two embedding vectors are — this is the backbone of search/retrieval (you'll use it constantly from Week 3 onward).
- **Self-check:** why does an embedding trained on "the next word is..." end up putting synonyms near each other, even though nobody labeled anything as a synonym?

**Read:** [Jay Alammar — The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/)

---

## Day 4 — Attention

- **The problem attention solves:** a sentence's meaning depends on relationships between words that can be far apart ("The animal didn't cross the street because **it** was too tired" — what does "it" refer to?). Attention lets every token look directly at every other token and decide how much to "pay attention" to each one.
- **Query, Key, Value (Q/K/V):** each token produces three vectors. Query = "what am I looking for," Key = "what do I contain," Value = "what I'll actually contribute." Attention score = how well one token's Query matches another token's Key; the output is a weighted sum of Values, weighted by those scores.
- **Self-attention:** every token computes attention against every other token in the same sequence (including itself) — this is what lets "it" find "animal."
- **Multi-head attention:** run several attention computations in parallel (different learned Q/K/V projections), each free to specialize in a different kind of relationship (e.g. one head tracks grammar, another tracks coreference). Outputs are concatenated.
- **The full Transformer block:** self-attention → add & normalize → feed-forward network → add & normalize, stacked N times (GPT-3 stacks 96 of these).
- **Causal masking:** in a decoder (GPT-style) model, each token is only allowed to attend to itself and earlier tokens, never future ones — this is what makes "predict the next token" a valid training objective.
- **Self-check:** in the sentence above, which token's Key would you expect "it"'s Query to match most strongly — "animal" or "street"? Why would a well-trained model learn that?

**Read:** [Jay Alammar — The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) (the single best resource for this topic — read it slowly)

---

## Day 5 — Pre-training, Post-training, and the End-to-End Lifecycle

- **Pre-training:** train on a huge, mostly-unlabeled text corpus (web text, books, code) with the single objective "predict the next token." This is where the model learns grammar, facts, reasoning patterns, and code — nobody labels any of it, the objective is self-supervised.
- **Why pre-training alone isn't a good chatbot:** a raw pre-trained model just continues text plausibly — asked a question, it might continue with more questions, because that's a statistically plausible continuation of internet text. It has no notion of "be helpful, be concise, refuse harmful requests."
- **Supervised Fine-Tuning (SFT):** fine-tune the pre-trained model on curated (instruction, ideal response) pairs, written or curated by humans, so it learns the "assistant" behavior pattern.
- **RLHF / DPO:** humans (or an AI judge) rank multiple candidate responses; the model is further trained to prefer the response style humans rank higher. RLHF uses a reward model + reinforcement learning; DPO (Direct Preference Optimization) achieves a similar effect more directly, without a separate reward model.
- **The full pipeline in one line:** raw internet text → pre-training (base model) → SFT (instruction-following model) → RLHF/DPO (aligned assistant) → what you chat with.
- **LLM Evaluations:** perplexity (how "surprised" the model is by held-out text — lower is better, but doesn't capture usefulness); benchmark suites like MMLU (knowledge across subjects), HellaSwag (commonsense), HumanEval (code); and increasingly, LLM-as-judge evaluations (Week 7 goes deep here).
- **Self-check:** why would a base (pre-trained-only) model sometimes refuse to stop talking or answer its own question, while an RLHF-tuned model doesn't?

**Read:** [Sebastian Raschka — Understanding the Pre-training → Fine-tuning → RLHF pipeline](https://magazine.sebastianraschka.com/) · **Paper (skim, don't worry about full math yet):** [InstructGPT](https://arxiv.org/abs/2203.02155)

---

## Day 6 — Projects

### 🟢 Easy — Tokenizer comparison
Using `tiktoken` (GPT tokenizer) and `transformers` (BERT tokenizer), tokenize the same 5 sentences (mix in one non-English sentence and one with a typo/rare word). Print token counts and the actual token strings for both. **Deliverable:** a short table comparing counts + one written observation about *why* they differ.

### 🟡 Medium — Self-attention from scratch
In NumPy or plain PyTorch (no `nn.MultiheadAttention`), implement single-head self-attention for a 5-6 word sentence: build random Q/K/V weight matrices, compute attention scores, apply softmax, produce the weighted output. Plot the attention weight matrix as a heatmap (matplotlib). **Deliverable:** working code + heatmap image + one sentence on which word attended most to which.

### 🔴 Hard — Train a tiny GPT end-to-end
Follow Karpathy's [nanoGPT](https://github.com/karpathy/nanoGPT) to train a character-level GPT on a small text file (e.g. Tiny Shakespeare, included in the repo) on Colab's free GPU. Track training loss, compute perplexity on a held-out split, and generate 3 sample continuations. **Deliverable:** loss curve plot, perplexity number, and generated samples — plus one paragraph on what went wrong the first time you ran it (something always does).

---

## Day 7 — Review
Re-read anything that didn't click. Without looking at your notes, write 5-8 sentences covering: what tokenization does, why embeddings are needed, what attention computes, and the 3-stage training pipeline. If you can write this cleanly, you're ready for Week 2.

---

## 📺 Videos & Courses

**YouTube**
- [Andrej Karpathy — Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY) — builds the exact architecture Days 2-4 describe, in live code; this is the Day 6 Hard project's companion video.
- [Andrej Karpathy — Intro to Large Language Models](https://youtu.be/zjkBMFhNj_g) — a higher-level, less code-heavy overview good for Day 1.
- [3Blue1Brown — Attention in transformers, visually explained](https://www.3blue1brown.com/lessons/attention/) — the clearest available visualization of Day 4's Q/K/V mechanics.

**Udemy**
- [Large Language Models (LLMs) Fundamentals](https://www.udemy.com/course/large-language-models-llms-fundamentals/) — covers tokenization, embeddings, and transformer basics at a beginner pace matching this week.

---

## References
**Papers**
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762) — Vaswani et al., 2017
- [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — Sennrich et al., 2016 (BPE)
- [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781) — Mikolov et al., 2013 (word2vec)
- [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) — Brown et al., 2020 (GPT-3)
- [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) — Ouyang et al., 2022

**Blogs / Videos**
- Jay Alammar — [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)
- Jay Alammar — [The Illustrated GPT-2](https://jalammar.github.io/illustrated-gpt2/)
- Jay Alammar — [The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/)
- Andrej Karpathy — [Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g) and [Let's build GPT from scratch](https://www.youtube.com/watch?v=kCc8FmEb1nY)
- Hugging Face — [NLP Course, Chapter 2](https://huggingface.co/learn/nlp-course/chapter2/4)

