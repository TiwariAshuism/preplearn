---
source: manual
title: "Week 3 — RAG Fundamentals"
slug: "Week_03_RAG_Fundamentals"
parent: "AI_course"
children: []
order: 3
icon: "📚"
cover: null
---
# Week 3 — Retrieval Augmented Generation (RAG)

**Goal by end of week:** you can explain why RAG beats "just fine-tune it" for knowledge problems, you understand the chunking → embedding → indexing → retrieval pipeline end to end, and you've measured retrieval quality yourself instead of eyeballing it.

**From last week:** you now know fine-tuning changes *behavior*, not *knowledge* reliably. RAG is the tool for knowledge: instead of baking facts into weights, you fetch relevant text at query time and hand it to the model as context.

---

## Day 1 — RAG Overview

- **The core idea:** given a user question, first *retrieve* the most relevant chunks of text from a knowledge base, then *generate* an answer with the LLM, having stuffed those chunks into its context window. The model answers from what it's given, not from memory.
- **Why this beats fine-tuning for facts:** updating a RAG knowledge base is instant (add/edit a document) and cheap (no GPU, no training run); updating facts baked into weights requires retraining and doesn't reliably "overwrite" old facts. RAG answers are also more auditable — you can show *which* document an answer came from.
- **The two failure modes RAG has to fight:** retrieving the wrong/irrelevant chunks (a retrieval problem), and the model hallucinating despite good chunks being provided (a generation/prompting problem, addressed more in Week 4/7).
- **RAG vs fine-tuning vs both:** many production systems use RAG for facts and light fine-tuning for format/tone/tool-use — they're complementary, not competing.
- **Self-check:** why would fine-tuning a model on "our product changed its return policy yesterday" be a bad way to keep it up to date, compared to just updating a document in a RAG knowledge base?

**Blog:** [Pinecone — What is Retrieval-Augmented Generation?](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

## Day 2 — Chunking Strategies

- **Why chunk at all:** documents are too long to embed as one vector meaningfully (a single embedding for a 50-page PDF loses almost all specific detail), and too long to hand entirely to the model every query (cost, context limits, dilution of relevant info).
- **Fixed-size chunking:** split every N tokens/characters, often with some overlap (e.g. 500 tokens, 50-token overlap) so a fact split across a boundary isn't lost entirely. Simple, fast, but can cut sentences/ideas awkwardly.
- **Recursive chunking:** try splitting on paragraph breaks first; if a chunk is still too big, split on sentences; if still too big, split on fixed size — respects document structure better than naive fixed-size splitting.
- **Semantic / sentence-window chunking:** group sentences based on embedding similarity to each other (a topic shift becomes a chunk boundary) rather than a fixed size — better topical coherence, more expensive to compute.
- **The tradeoff to internalize:** smaller chunks = more precise retrieval (less irrelevant text per chunk) but less context per chunk (an answer needing 2 sentences of surrounding context might lose it); larger chunks = more context but more "dilution" (relevant sentence buried in irrelevant ones, hurting both retrieval score and generation quality).
- **Self-check:** for a FAQ document (short, self-contained Q&A pairs) vs. a legal contract (long, cross-referencing clauses), which chunking strategy would you expect to need, and why?

**Blog:** [Pinecone — Chunking Strategies for LLM Applications](https://www.pinecone.io/learn/chunking-strategies/)

---

## Day 3 — Vector Embeddings Deep-Dive

- **Recap + this week's twist:** Week 1 covered token embeddings; RAG needs *sentence/passage* embeddings — a single vector representing the meaning of a whole chunk, not one vector per token.
- **How sentence embeddings are made:** typically, pool (average or take a special `[CLS]`-like token from) the token embeddings from a Transformer encoder trained specifically so that semantically similar sentences end up close in vector space (via contrastive training on sentence-pair data).
- **Picking an embedding model:** `sentence-transformers` (open-source, run locally, e.g. `all-MiniLM-L6-v2` for speed or `bge-large` for quality), OpenAI's `text-embedding-3`, Cohere's `embed-v3` — differ in dimensionality, cost, multilingual support, and how well they're tuned for retrieval specifically (not all embeddings are optimized for search).
- **Similarity metrics:** cosine similarity (angle between vectors, ignores magnitude — most common for text) vs. dot product (also considers magnitude) vs. Euclidean distance — most embedding models are trained/normalized to work best with one specific metric, check the model card.
- **Self-check:** if you switch embedding models halfway through a project, why do you need to re-embed your *entire* knowledge base, not just new documents?

**Blog:** [Hugging Face — Sentence Transformers documentation](https://www.sbert.net/)

---

## Day 4 — Vector Databases

- **What a vector DB actually adds over "a list of vectors":** fast approximate nearest-neighbor search at scale (Day 5), metadata filtering (e.g. "only search documents tagged `region:EU`"), persistence, and often hybrid search support.
- **FAISS (Facebook AI Similarity Search):** a library, not a full database — extremely fast, runs in-process, great for prototyping and for datasets that fit in memory, but you build persistence/filtering yourself.
- **Chroma:** an open-source vector DB built for LLM apps specifically, easy local setup, good default choice for a first RAG project.
- **Pinecone / Weaviate / Qdrant:** managed or self-hosted vector databases built for production scale — replication, filtering, hybrid search, horizontal scaling. Pinecone is fully managed (no ops); Weaviate/Qdrant can be self-hosted.
- **How to choose:** prototyping alone on your laptop → FAISS or Chroma. Shipping something others will use → a managed option (Pinecone) or a self-hosted one you're prepared to operate (Weaviate/Qdrant).
- **Self-check:** why would "just store embeddings in a Python list and loop through them" work fine for 1,000 documents but fall over at 10 million?

**Docs:** [LlamaIndex — Vector Store integrations](https://docs.llamaindex.ai/en/stable/module_guides/storing/vector_stores/) · [Weaviate blog](https://weaviate.io/blog)

---

## Day 5 — ANN Search Algorithms, Indexing, and Reranking

- **The problem exact search doesn't scale for:** finding the true nearest neighbor among millions of vectors by brute-force comparison is slow. Approximate Nearest Neighbor (ANN) algorithms trade a small amount of accuracy for large speedups.
- **HNSW (Hierarchical Navigable Small World):** builds a multi-layer graph where each vector is a node; search starts at the sparse top layer and "zooms in" through denser layers — very fast, very accurate, high memory use. The default choice in most modern vector DBs.
- **IVF (Inverted File Index):** clusters vectors into buckets (via k-means); a query only searches the closest few buckets instead of everything — faster to build and lower memory than HNSW, slightly less accurate.
- **Product Quantization (PQ):** compresses each vector into a compact code (similar spirit to Week 2's model quantization, but for embeddings) — often combined with IVF (`IVF-PQ`) to handle huge datasets in limited memory.
- **Reranking — why retrieval alone isn't enough:** the fast vector search casts a wide net (e.g. top 50 candidates) using a cheap similarity metric; a reranker (a slower, more accurate cross-encoder model that looks at the query and each candidate *together*, not as separate embeddings) then re-scores just those 50 and picks the true top 5. Cross-encoders are too slow to run over millions of documents, but fine over 50.
- **Self-check:** why can't you just always use a cross-encoder for the *first* retrieval pass over your entire database, skipping vector search entirely?

**Paper:** [Efficient and Robust ANN Search using HNSW](https://arxiv.org/abs/1603.09320) — Malkov & Yashunin, 2016
**Blog:** [Pinecone — HNSW explained](https://www.pinecone.io/learn/series/faiss/hnsw/)

---

## Day 6 — Projects

### 🟢 Easy — Document Q&A bot
Build a Q&A bot over a single PDF using LangChain or LlamaIndex + FAISS, default chunking (fixed-size, ~500 tokens) and a default embedding model (`all-MiniLM-L6-v2` or OpenAI's). **Deliverable:** working bot + 5 example Q&A pairs showing it retrieves the right passage.

### 🟡 Medium — Chunking & embedding comparison
On the same document set, try 3 chunking strategies (fixed, recursive, semantic) × 2 embedding models — 6 combinations. Hand-label 10-15 questions with their correct source passages, and measure recall@5 (is the correct passage in the top 5 retrieved?) for each combo. **Deliverable:** a results table + your pick for "best combo" with reasoning.

### 🔴 Hard — Hybrid search + reranker pipeline
Build a retrieval pipeline combining BM25 (keyword search, e.g. via `rank_bm25`) with vector search, merge results, then rerank the merged candidates with a cross-encoder (e.g. `cross-encoder/ms-marco-MiniLM-L-6-v2`). Benchmark recall@5 and answer quality against your Easy project's vector-only baseline. **Deliverable:** side-by-side comparison + 2 example queries where hybrid search wins and you can explain why.

---

## Day 7 — Review
Without notes, write out: the chunking → embedding → index → retrieve → generate pipeline end to end, one sentence on when you'd pick HNSW vs IVF, and one sentence on why rerankers exist if vector search already returns "similar" results. This sets you up directly for Week 4.

---

## 📺 Videos & Courses

**YouTube**
- [Build RAG Pipeline From Scratch — Data Ingestion to Vector DB Pipeline (Part 1)](https://www.youtube.com/watch?v=MykcjWPJ6T4) — walks through the exact chunking → embedding → vector DB pipeline covered Days 2-4.
- [Vector Database and Retrieval Augmented Generation (RAG)](https://www.youtube.com/watch?v=KQthM8Ij_rw) — a focused explainer on how vector DBs plug into RAG (Day 4).

**Udemy**
- [Gen AI - LLM RAG Two in One - LangChain + LlamaIndex](https://www.udemy.com/course/llm-rag-langchain-llamaindex/) — covers vector databases (ChromaDB, Pinecone) and both major RAG frameworks, matching this week's Days 3-5.

---

## References
**Papers**
- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) — Lewis et al., 2020
- [Dense Passage Retrieval for Open-Domain Question Answering](https://arxiv.org/abs/2004.04906) — Karpukhin et al., 2020
- [Efficient and Robust Approximate Nearest Neighbor Search using HNSW](https://arxiv.org/abs/1603.09320) — Malkov & Yashunin, 2016
- [ColBERT: Efficient and Effective Passage Search via Late Interaction](https://arxiv.org/abs/2004.12832) — Khattab & Zaharia, 2020

**Blogs**
- Pinecone — [Learning Center](https://www.pinecone.io/learn/) (RAG, chunking, HNSW — all covered here)
- LlamaIndex — [Building a RAG pipeline docs](https://docs.llamaindex.ai/)
- Weaviate — [Engineering blog](https://weaviate.io/blog)
- Sentence-Transformers — [official docs](https://www.sbert.net/)

