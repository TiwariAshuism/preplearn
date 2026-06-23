---
source: notion
title: "Phase 5 — LLMs & Applied GenAI Engineering (Days 71–90)"
slug: "phase-5-llms-and-applied-genai-engineering-days-71-90"
notionId: "385da883-bddd-81b9-88fe-c94ca2e18346"
notionRootId: "384da883bddd81438d21ca87e13a859d"
parent: "90-day-ai-llm-engineering-roadmap-beginner-to-advanced"
children: []
order: 1
icon: "🤖"
cover: null
---
> **Core insight:** Everything before this phase taught you how LLMs work internally. This phase teaches you how to build real products with them: prompting reliably, grounding them in your own data (RAG), making them efficient and customized (fine-tuning), giving them tools (agents), and proving they actually work (evals). This is the layer where most AI engineering jobs actually live.

---


## Day 71–73 — Prompt Engineering and Sampling


```python
# Temperature, top-k, top-p: controlling randomness in generation
#
# The model outputs a probability distribution over the next token.
# Sampling strategy determines HOW you pick from that distribution.

# Temperature: scales the logits before softmax
# temperature -> 0: nearly deterministic, always picks highest-probability token
# temperature = 1: sample exactly from the model's learned distribution
# temperature > 1: flatter distribution, more random/creative, more mistakes

import torch.nn.functional as F

def sample_with_temperature(logits, temperature=1.0):
    scaled_logits = logits / temperature
    probs = F.softmax(scaled_logits, dim=-1)
    return torch.multinomial(probs, num_samples=1)

# Top-k sampling: only consider the K most likely next tokens, renormalize, sample
def top_k_sampling(logits, k=50):
    values, indices = torch.topk(logits, k)
    probs = F.softmax(values, dim=-1)
    sampled_idx = torch.multinomial(probs, num_samples=1)
    return indices[sampled_idx]

# Top-p (nucleus) sampling: consider the smallest set of tokens whose
# cumulative probability exceeds p (more adaptive than fixed top-k)
def top_p_sampling(logits, p=0.9):
    sorted_logits, sorted_indices = torch.sort(logits, descending=True)
    cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
    mask = cumulative_probs <= p
    mask[0] = True  # always keep at least the top token
    filtered_indices = sorted_indices[mask]
    return filtered_indices

# Prompt engineering patterns that actually work (not folklore):
# 1. Few-shot examples: show 2-5 examples of input->output before the real task
# 2. Chain-of-thought: ask the model to "think step by step" before answering
#    -- works because it gives the model more forward passes (tokens) to reason
# 3. System prompts: set persistent behavior/role/constraints
# 4. Structured output: ask for JSON, provide a schema, often with function calling
#    instead of hoping the model formats text correctly
```


### Key concepts

- Temperature, top-k, top-p — the three knobs that control generation randomness, and the actual math behind each
- Few-shot prompting and chain-of-thought — why they work (more relevant context, more "thinking tokens")
- The difference between asking nicely and giving the model structure (schemas, function calling) for reliable output

---


## Day 74–77 — Embeddings and Vector Search


```python
# Embeddings (recap from Phase 4, now applied): represent text as a dense vector
# such that SEMANTICALLY SIMILAR text has vectors that are CLOSE TOGETHER

from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(["The cat sat on the mat", "A feline rested on the rug"])

# Cosine similarity: measures the ANGLE between vectors, ignoring magnitude
# This is THE standard similarity metric for embeddings
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

sim = cosine_similarity(embeddings[0], embeddings[1])
print(sim)  # high, even though no words overlap -- semantic similarity!

# The problem: brute-force search over millions of vectors is O(n) per query, too slow
# Solution: Approximate Nearest Neighbor (ANN) algorithms

# FAISS: Facebook's library for efficient similarity search
import faiss

dimension = 384  # matches the embedding model's output size
index = faiss.IndexFlatL2(dimension)         # exact search, fine for small data
# For large scale: faiss.IndexIVFFlat or faiss.IndexHNSWFlat (approximate, much faster)

index.add(embeddings.astype('float32'))
query_embedding = model.encode(["a cat on a mat"]).astype('float32')
distances, indices = index.search(query_embedding, k=2)  # top-2 nearest

# HNSW (Hierarchical Navigable Small World): the algorithm behind most
# production vector databases (Pinecone, Weaviate, Qdrant, Chroma)
# Builds a multi-layer graph for O(log n) approximate search instead of O(n)
# This directly solves the curse-of-dimensionality problem from Phase 2's KNN
```


### Key concepts

- Embeddings as the bridge between unstructured text and mathematical similarity search
- Cosine similarity vs Euclidean distance for comparing vectors
- Why brute-force nearest neighbor search doesn't scale, and how approximate methods (HNSW, IVF) solve it
- This is the same curse-of-dimensionality problem from Phase 2's KNN, now solved at scale

---


## Day 78–82 — RAG (Retrieval-Augmented Generation)


```python
# RAG solves: LLMs don't know your private data, and their training data
# has a cutoff date. RAG retrieves relevant documents at query time and
# injects them into the prompt, grounding the LLM's answer in real, current,
# private information instead of relying purely on what it memorized during training.

# The full RAG pipeline:
# 1. INDEXING (offline, done once per document set):
#    documents -> chunk into pieces -> embed each chunk -> store in vector DB
# 2. RETRIEVAL (online, per query):
#    user query -> embed query -> search vector DB -> get top-K relevant chunks
# 3. GENERATION (online, per query):
#    relevant chunks + user query -> prompt template -> LLM -> grounded answer

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI

# Step 1: Chunking -- this is THE most underrated lever in RAG quality
# Too small: loses context. Too large: dilutes relevance, wastes tokens.
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,    # overlap prevents losing context at chunk boundaries
    separators=["\n\n", "\n", ". ", " "]  # try to split on natural boundaries
)
chunks = text_splitter.split_documents(documents)

# Step 2: Embed and store
embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
vectorstore = Chroma.from_documents(chunks, embeddings)

# Step 3: Retrieve + Generate
retriever = vectorstore.as_retriever(search_kwargs={'k': 4})
llm = ChatOpenAI(model='gpt-4', temperature=0)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    return_source_documents=True  # always return sources for verification/citation
)

result = qa_chain.invoke({"query": "What is our refund policy?"})
print(result['result'])
print(result['source_documents'])  # show what the answer was grounded in

# Advanced RAG techniques:
# - Hybrid search: combine dense (embedding) + sparse (BM25/keyword) retrieval
# - Re-ranking: retrieve more candidates than needed, then re-rank with a
#   cross-encoder model for higher precision on the final top-K
# - Query expansion/rewriting: rewrite the user's query before retrieval
#   to improve recall (especially for vague or conversational queries)
# - Parent-child chunking: embed small chunks for precise retrieval,
#   but return the larger parent chunk for full context to the LLM
```


### Key concepts

- The 3-stage RAG pipeline: index → retrieve → generate
- Chunking strategy is the highest-leverage decision in RAG quality — chunk size, overlap, and splitting boundaries all matter
- Hybrid search and re-ranking as techniques to improve retrieval precision beyond naive vector search
- Always returning source documents for verifiability — a RAG system without citations is a black box

---


## Day 83–86 — Fine-tuning LLMs: LoRA and QLoRA


```python
# Full fine-tuning updates ALL parameters of a model (billions of them) --
# expensive in compute and memory, and risks "catastrophic forgetting"
# (the model loses general capabilities while learning the new task)

# LoRA (Low-Rank Adaptation): freeze the original weights, inject small
# trainable "adapter" matrices into each layer. Train only the adapters
# (often <1% of total parameters), then add their effect back to the frozen weights.
#
# Key insight: W_new = W_frozen + (A @ B), where A and B are small
# low-rank matrices (e.g., rank 8 or 16), dramatically fewer parameters
# than the full weight matrix W

from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer

model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-2-7b-hf')
tokenizer = AutoTokenizer.from_pretrained('meta-llama/Llama-2-7b-hf')

lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,                    # rank of the low-rank matrices (lower = fewer params, less capacity)
    lora_alpha=32,           # scaling factor for the LoRA update
    lora_dropout=0.1,
    target_modules=["q_proj", "v_proj"]  # which layers to adapt (usually attention projections)
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# Output: trainable params: 4,194,304 || all params: 6,742,609,920 || trainable%: 0.06%
# This is THE number that makes fine-tuning feasible on consumer GPUs

# QLoRA: LoRA + quantization (load the frozen base model in 4-bit precision)
# Reduces memory footprint further -- enables fine-tuning 7B+ models on a
# single consumer GPU (e.g., 24GB VRAM) that couldn't otherwise fit the model
from transformers import BitsAndBytesConfig
import torch

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16
)
model = AutoModelForCausalLM.from_pretrained(
    'meta-llama/Llama-2-7b-hf',
    quantization_config=bnb_config
)

# Training loop (standard Hugging Face Trainer)
training_args = TrainingArguments(
    output_dir='./lora-output',
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,  # simulates a larger batch size with less memory
    num_train_epochs=3,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=10,
)
trainer = Trainer(model=model, args=training_args, train_dataset=dataset)
trainer.train()
```


### Key concepts

- Full fine-tuning vs LoRA: train all parameters vs train a small low-rank adapter, freeze the base
- QLoRA: LoRA + 4-bit quantization of the frozen base model, enabling fine-tuning of large models on consumer hardware
- When to fine-tune vs when to use RAG vs when to just prompt engineer (a decision framework, not a default)
- Pretraining vs fine-tuning vs RLHF vs prompting: four distinct ways to shape model behavior, at decreasing cost and decreasing depth of change

---


## Day 87–88 — Agents and Tool Use


```python
# An LLM agent: a model that can decide to call external TOOLS (functions,
# APIs, code execution, search) to accomplish a task, rather than relying
# purely on its internal knowledge.

# Function calling: the model outputs a structured request to call a specific
# function with specific arguments, instead of free-text
import openai

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get the current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "City name"}
            },
            "required": ["location"]
        }
    }
}]

response = openai.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "What's the weather in Bangalore?"}],
    tools=tools
)

# The model returns a tool_call instead of text. YOUR code executes the
# actual function, then sends the result back to the model for a final answer.
if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    args = json.loads(tool_call.function.arguments)
    result = get_weather(args['location'])  # your actual implementation
    # Send result back to the model to generate the final natural-language response

# The ReAct pattern (Reasoning + Acting): the model alternates between
# "thinking" (reasoning about what to do) and "acting" (calling a tool),
# observing results, and repeating until it has enough information to answer
#
# Thought: I need to find the current weather in Bangalore
# Action: get_weather(location="Bangalore")
# Observation: 28C, partly cloudy
# Thought: I now have enough information to answer
# Final Answer: It's 28C and partly cloudy in Bangalore.

# Multi-agent systems: specialized agents (researcher, coder, reviewer)
# collaborate, each with different tools/prompts/responsibilities
# Frameworks: LangGraph, CrewAI, AutoGen
```


### Key concepts

- Function calling: structured tool invocation instead of hoping the model formats text correctly
- The ReAct pattern: alternating reasoning and acting, with observations feeding back into the next reasoning step
- Why agents are powerful (extend the model beyond its training data, enable real-world actions) and where they're fragile (compounding errors across multi-step chains, unpredictable tool selection)

---


## Day 89 — Evaluation: Proving Your LLM System Actually Works


```python
# "It looks good when I tried it" is not evaluation. LLM applications need
# systematic evals just like classical ML models need test set metrics.

# RAG-specific evaluation dimensions (using a framework like Ragas):
# - Faithfulness: is the generated answer actually supported by the retrieved context?
#   (catches hallucination even when retrieval was correct)
# - Answer relevance: does the answer actually address the question asked?
# - Context precision: are the retrieved chunks actually relevant?
# - Context recall: did retrieval find ALL the relevant information needed?

from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset

eval_dataset = Dataset.from_dict({
    'question': [...],
    'answer': [...],            # your system's generated answers
    'contexts': [...],          # retrieved chunks for each question
    'ground_truth': [...]       # the correct/reference answer
})

results = evaluate(
    eval_dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall]
)
print(results)

# LLM-as-judge: use a strong LLM to score outputs against a rubric
# (common when there's no single "correct" answer to compare against)
judge_prompt = """
Rate the following response on a scale of 1-5 for helpfulness and accuracy.
Question: {question}
Response: {response}
Reference: {reference}
Provide a score and brief justification.
"""

# Building a golden eval set: curate 50-200 representative question/answer
# pairs covering edge cases, ambiguous queries, and common failure modes
# Re-run this eval set EVERY time you change a prompt, model, or retrieval
# parameter -- this is your regression test suite for an LLM application
```


### Key concepts

- Why "it looks good" is not evaluation — the same rigor classical ML applies to test metrics must apply to LLM systems
- RAG-specific metrics: faithfulness (hallucination detection), relevance, precision, recall
- LLM-as-judge for evaluating open-ended outputs without a single correct answer
- A golden eval set as a regression test suite — re-run on every change

---


## Day 90 — Phase 5 Capstone: Production RAG Application with Evals


**Deliverable: a complete, deployable RAG application**


```javascript
Required components:

1. Document ingestion pipeline
   - Load documents (PDFs, markdown, or scraped web content)
   - Chunk with a documented, justified strategy (explain your chunk_size/overlap choice)
   - Embed and store in a vector database (Chroma or FAISS, locally is fine)

2. Retrieval + Generation pipeline
   - Query embedding + vector search
   - Optional: hybrid search or re-ranking (bonus)
   - Prompt template that includes retrieved context + explicit instructions
     to cite sources and say "I don't know" when context is insufficient
   - LLM call (OpenAI API, Anthropic API, or local model via Ollama)

3. Evaluation harness
   - A golden set of 20-30 question/answer pairs for your document domain
   - Run faithfulness and relevance metrics (Ragas or custom LLM-as-judge)
   - Report a baseline score, then make ONE improvement (better chunking,
     re-ranking, or prompt tweaking) and show the score improvement

4. API and basic UI
   - FastAPI endpoint: POST /query -> returns answer + sources
   - Simple frontend: Streamlit or Gradio (functional, not polished)
   - Basic error handling: what happens when retrieval finds nothing relevant?
     What happens when the LLM API call fails or times out?

5. Documentation
   - README explaining architecture, how to run it, and your eval results
   - A section titled "Known limitations" — every real system has them,
     and naming them explicitly is what separates engineers from demos
```


**This is your portfolio centerpiece.** It demonstrates the full stack: data processing, embeddings, vector search, prompt engineering, LLM integration, evaluation rigor, and basic deployment — everything covered across all 90 days, working together in one system.


---


## Common mistakes


### Mistake 1


**❌ Treating RAG as "just stuff documents into a vector DB and it works."**


RAG quality is dominated by unglamorous details: chunk size, overlap, embedding model choice, and prompt template wording. Teams that skip tuning these ship RAG systems that retrieve irrelevant context and hallucinate confidently.


**✅ Correct approach:** Treat chunking strategy, retrieval k, and prompt template as hyperparameters to be evaluated empirically against your golden eval set — not set-and-forget defaults.


### Mistake 2


**❌ Fine-tuning when the actual problem is retrieval (or vice versa).**


Fine-tuning teaches a model HOW to respond (style, format, task-specific behavior). It does NOT reliably teach a model new FACTS, and it definitely doesn't help with information that changes after training. Using fine-tuning to inject a company's product catalog is almost always the wrong tool — that's a RAG problem.


**✅ Correct approach:** Use RAG for factual/current/private knowledge. Use fine-tuning for behavior, style, format, or domain-specific reasoning patterns. Often the right answer is both: RAG for knowledge, light fine-tuning or prompting for behavior.


### Mistake 3


**❌ Shipping an LLM application with no evaluation, relying on "it seemed fine when I tested it."**


LLM outputs are non-deterministic and a handful of manual tests do not represent the distribution of real user queries. Silent failures (hallucination, irrelevant retrieval, format breaks) ship to production undetected.


**✅ Correct approach:** Build a golden eval set early, even a small one (20-30 examples covering realistic + edge-case queries). Re-run it on every meaningful change. Track faithfulness/relevance scores over time the same way you'd track accuracy for a classical ML model.


---


## You've completed the 90-day AI/LLM Engineering roadmap


**After 90 days you can:**

- Implement linear regression, logistic regression, and a neural network from scratch using only NumPy
- Train and evaluate classical ML models (trees, ensembles, SVMs) with proper cross-validation and avoid data leakage
- Build, train, and debug deep learning models in PyTorch, including CNNs and RNNs
- Implement self-attention and a full Transformer block from scratch, and explain exactly why each architectural choice exists
- Fine-tune pretrained transformer models for real tasks
- Build a production-grade RAG application with proper chunking, retrieval, and generation
- Fine-tune large LLMs efficiently using LoRA/QLoRA on consumer hardware
- Build tool-using agents with function calling and the ReAct pattern
- Design and run rigorous evaluations for LLM applications instead of relying on vibes

**What's next:**

- Read recent papers (arXiv, Hugging Face papers) to stay current — this field moves monthly, not yearly
- Contribute to an open-source LLM tooling project (LangChain, LlamaIndex, vLLM)
- Build a second, more ambitious capstone: a multi-agent system, a fine-tuned domain-specific model, or a production deployment with real users and monitoring
- Study LLM serving and inference optimization (quantization, batching, vLLM/TGI) if you want to go deeper into the infrastructure side
- Pair this roadmap with your Go/backend skills: build the production infrastructure layer around the AI systems you now know how to design
