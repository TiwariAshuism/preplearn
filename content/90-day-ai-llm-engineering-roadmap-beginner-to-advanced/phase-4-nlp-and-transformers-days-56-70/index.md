---
source: notion
title: "Phase 4 — NLP & Transformers (Days 56–70)"
slug: "phase-4-nlp-and-transformers-days-56-70"
notionId: "384da883-bddd-8149-b462-c08a64688b17"
notionRootId: "384da883bddd81438d21ca87e13a859d"
parent: "90-day-ai-llm-engineering-roadmap-beginner-to-advanced"
children: []
order: 2
icon: "⚡"
cover: null
---
> **Core insight:** The Transformer is the architecture behind every modern LLM — GPT, Claude, Gemini, LLaMA. Its core innovation is self-attention: a mechanism that lets every token directly look at every other token in a sequence, in parallel, rather than processing sequentially like an RNN. Understanding attention mathematically is the single highest-leverage thing you can learn in this entire roadmap.

---


## Day 56–58 — Tokenization and embeddings


```python
# Before any text reaches a neural network, it must become numbers.
# Tokenization: splitting text into units (words, subwords, or characters)

from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
tokens = tokenizer("Transformers are powerful", return_tensors='pt')
print(tokenizer.convert_ids_to_tokens(tokens['input_ids'][0]))
# ['[CLS]', 'transformers', 'are', 'powerful', '[SEP]']

# Subword tokenization (BPE - Byte Pair Encoding, used by GPT):
# Solves the out-of-vocabulary problem -- "unhappiness" might split into
# ["un", "happiness"] even if "unhappiness" was never seen as a whole word
# This is WHY LLMs can handle typos, rare words, and even code reasonably well

# BPE algorithm (conceptual): start with characters, repeatedly merge the
# most frequent adjacent pair into a new token, until you reach vocab size

# Embeddings: map a token ID to a dense vector
import torch.nn as nn
embedding_layer = nn.Embedding(num_embeddings=50000, embedding_dim=768)
# vocab_size=50000 (BPE vocab), embedding_dim=768 (GPT-2 small uses this)

# Word2Vec intuition (the original embedding idea, 2013):
# Words that appear in similar CONTEXTS get similar vectors
# "king" - "man" + "woman" ~= "queen" (the famous analogy, works because
# embeddings capture semantic relationships as geometric directions)
```


### Key concepts

- Tokenization: word-level vs subword (BPE) vs character-level, and why BPE won for LLMs
- Embeddings: dense vector representations that capture semantic meaning
- Why "similar words have similar vectors" emerges naturally from training on prediction tasks

---


## Day 59–62 — Self-Attention from first principles


```python
import torch
import torch.nn.functional as F
import math

# Self-attention answers: "for THIS token, how much should I attend to EVERY
# other token in the sequence to understand its meaning in context?"
#
# Example: "The animal didn't cross the street because IT was too tired"
# "it" should attend strongly to "animal", not "street"
# Self-attention LEARNS this from data, with no hand-coded rules

def scaled_dot_product_attention(Q, K, V, mask=None):
    """
    Q (query):  what am I looking for?
    K (key):    what do I contain? (compared against queries)
    V (value):  what information do I actually pass along?

    Each token produces a Q, K, V vector via learned linear projections.
    """
    d_k = Q.size(-1)
    # Attention scores: how much does each query "match" each key
    scores = Q @ K.transpose(-2, -1) / math.sqrt(d_k)  # scale prevents huge values

    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))  # causal masking

    # Softmax: convert scores to a probability distribution (attention weights)
    attention_weights = F.softmax(scores, dim=-1)

    # Weighted sum of values, weighted by attention
    output = attention_weights @ V
    return output, attention_weights

# A minimal self-attention layer
class SelfAttention(nn.Module):
    def __init__(self, embed_dim):
        super().__init__()
        self.W_q = nn.Linear(embed_dim, embed_dim)
        self.W_k = nn.Linear(embed_dim, embed_dim)
        self.W_v = nn.Linear(embed_dim, embed_dim)

    def forward(self, x, mask=None):
        Q = self.W_q(x)
        K = self.W_k(x)
        V = self.W_v(x)
        output, weights = scaled_dot_product_attention(Q, K, V, mask)
        return output

# Causal masking: for language models (GPT-style), a token can only attend
# to PREVIOUS tokens, never future ones (otherwise it would "cheat" during training)
def causal_mask(seq_len):
    return torch.tril(torch.ones(seq_len, seq_len))  # lower triangular matrix
```


### Key concepts

- Query, Key, Value: the three learned projections that make attention work
- The attention formula: `softmax(QK^T / sqrt(d_k)) V` — memorize and derive this
- Why scaling by `sqrt(d_k)` matters (prevents softmax saturation for large dimensions)
- Causal masking: why GPT-style models can't "see the future" during training

---


## Day 63–65 — Multi-Head Attention and the full Transformer block


```python
class MultiHeadAttention(nn.Module):
    """
    Instead of one attention computation, run H attention computations in
    parallel (each with its own Q/K/V projections), then combine.
    Each "head" can learn to focus on different types of relationships
    (e.g., one head for syntax, another for coreference, another for topic).
    """
    def __init__(self, embed_dim, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.W_q = nn.Linear(embed_dim, embed_dim)
        self.W_k = nn.Linear(embed_dim, embed_dim)
        self.W_v = nn.Linear(embed_dim, embed_dim)
        self.W_o = nn.Linear(embed_dim, embed_dim)

    def forward(self, x, mask=None):
        B, T, C = x.shape  # batch, sequence length, embed_dim
        Q = self.W_q(x).view(B, T, self.num_heads, self.head_dim).transpose(1, 2)
        K = self.W_k(x).view(B, T, self.num_heads, self.head_dim).transpose(1, 2)
        V = self.W_v(x).view(B, T, self.num_heads, self.head_dim).transpose(1, 2)

        out, _ = scaled_dot_product_attention(Q, K, V, mask)
        out = out.transpose(1, 2).contiguous().view(B, T, C)
        return self.W_o(out)

class TransformerBlock(nn.Module):
    """A single Transformer block: the repeating unit stacked N times in GPT/BERT."""
    def __init__(self, embed_dim, num_heads, ff_dim):
        super().__init__()
        self.attn = MultiHeadAttention(embed_dim, num_heads)
        self.ln1 = nn.LayerNorm(embed_dim)
        self.ff = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Linear(ff_dim, embed_dim)
        )
        self.ln2 = nn.LayerNorm(embed_dim)

    def forward(self, x, mask=None):
        # Residual connections ("x +") are CRITICAL for training deep networks
        # -- they give gradients a direct path backward, combating vanishing gradients
        x = x + self.attn(self.ln1(x), mask)   # pre-norm + attention + residual
        x = x + self.ff(self.ln2(x))            # pre-norm + feedforward + residual
        return x

# Positional encoding: attention has NO inherent sense of order
# (unlike RNNs which process sequentially). We must INJECT position information.
def sinusoidal_positional_encoding(seq_len, embed_dim):
    position = torch.arange(seq_len).unsqueeze(1)
    div_term = torch.exp(torch.arange(0, embed_dim, 2) * -(math.log(10000.0) / embed_dim))
    pe = torch.zeros(seq_len, embed_dim)
    pe[:, 0::2] = torch.sin(position * div_term)
    pe[:, 1::2] = torch.cos(position * div_term)
    return pe
```


### Key concepts

- Multi-head attention: parallel attention computations let the model learn different types of relationships simultaneously
- Residual connections and LayerNorm: why they're essential for training deep transformers (gradient flow)
- Positional encoding: attention has no inherent notion of sequence order, so position must be explicitly injected
- The full Transformer block: attention + residual + feedforward + residual, stacked N times

---


## Day 66–68 — Encoder vs Decoder architectures: BERT vs GPT


```python
# BERT (encoder-only): bidirectional attention, sees the WHOLE sequence at once
# Trained on: Masked Language Modeling (predict randomly masked words using
#   BOTH left and right context) + Next Sentence Prediction
# Best for: understanding tasks -- classification, NER, sentence similarity
# Cannot generate text naturally (no causal masking, sees the future)

# GPT (decoder-only): causal (masked) attention, only sees PREVIOUS tokens
# Trained on: Next Token Prediction (predict the next word given everything before it)
# Best for: generation tasks -- chat, completion, summarization, code generation
# This is the architecture behind ChatGPT, Claude, and virtually all modern LLMs

# Original Transformer (encoder-decoder): used for translation
# Encoder processes the source language (bidirectional)
# Decoder generates the target language (causal, with cross-attention to encoder)
# Less common now for general LLMs; T5 and original translation models use this

from transformers import AutoModel, AutoModelForCausalLM, AutoModelForSequenceClassification

# BERT for classification
bert = AutoModelForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)

# GPT-2 for text generation
gpt2 = AutoModelForCausalLM.from_pretrained('gpt2')
input_ids = tokenizer.encode("The future of AI is", return_tensors='pt')
output = gpt2.generate(input_ids, max_length=50, do_sample=True, temperature=0.8)
print(tokenizer.decode(output[0]))
```


### Key concepts

- BERT (encoder, bidirectional, understanding tasks) vs GPT (decoder, causal, generation tasks)
- Masked Language Modeling vs Next Token Prediction as pretraining objectives
- Why virtually all modern LLMs (GPT-4, Claude, LLaMA) are decoder-only: generation is the more general capability (you can do classification via generation/prompting, but not vice versa)

---


## Day 69–70 — Phase 4 Capstone: Transformer From Scratch + Fine-tuned BERT


**Deliverable: two projects**


```javascript
Project 1: GPT-style Transformer from scratch (Karpathy's "nanoGPT" approach)
  - Implement: token embedding + positional encoding + N transformer blocks
    + final linear layer to vocabulary logits
  - Train on a small text corpus (character or small-vocab BPE level)
  - Implement causal masking correctly -- verify by checking the model
    can't "cheat" (test: does changing a FUTURE token change a PAST prediction?
    It should NOT.)
  - Generate text with temperature and top-k sampling
  - Compare quality/coherence to your Phase 3 LSTM language model

Project 2: Fine-tune a pretrained BERT for a real task
  - Pick a task: sentiment classification, NER, or text similarity
  - Use Hugging Face Transformers + a small labeled dataset
  - Fine-tune (not feature extraction -- actually update BERT's weights)
  - Evaluate with appropriate metrics (F1 for NER, accuracy for classification)
  - Document: how much did fine-tuning improve over zero-shot/frozen BERT?
```


**Requirements:**

- Your from-scratch Transformer must NOT use `nn.TransformerEncoder` or `nn.MultiheadAttention` — implement attention yourself
- Verify your causal mask works correctly with an explicit test
- For BERT fine-tuning: use the Hugging Face `Trainer` API or write your own training loop with proper learning rate scheduling (warmup + decay, standard for transformers)

---


## Common mistakes


### Mistake 1


**❌ Forgetting to scale attention scores by** **`sqrt(d_k)`****.**


Without scaling, dot products grow large in magnitude as dimension increases, pushing softmax into regions with extremely small gradients (saturation), making training unstable.


**✅ Correct approach:** Always divide `QK^T` by `sqrt(d_k)` before the softmax. This is not optional — it's in the original "Attention Is All You Need" formula for a precise mathematical reason.


### Mistake 2


**❌ Implementing causal masking incorrectly (off-by-one, or masking the wrong positions).**


A subtle masking bug lets the model see future tokens during training, which won't show up as an error — it'll just produce a model that performs great in training/validation but fails mysteriously at actual generation time (because at generation time, future tokens genuinely don't exist yet).


**✅ Correct approach:** Test explicitly: feed a sequence, change a future token, verify the logits for past positions are UNCHANGED. If they change, your masking is broken.


### Mistake 3


**❌ Using BERT for text generation, or GPT for bidirectional understanding tasks, without realizing the architectural mismatch.**


BERT cannot generate coherent text token-by-token (it was never trained with causal masking). GPT can technically be used for classification via prompting, but it's not as parameter-efficient as a purpose-built encoder for that task.


**✅ Correct approach:** Match the architecture to the task: encoder-only (BERT-style) for understanding/classification tasks where you have the full input upfront; decoder-only (GPT-style) for generation tasks where output is produced incrementally.

