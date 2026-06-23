---
source: notion
title: "🗓️ All 90 Days Reference — AI/LLM Roadmap"
slug: "all-90-days-reference-aillm-roadmap"
notionId: "385da883-bddd-81e4-90bb-e8694f9d1806"
notionRootId: "384da883bddd81438d21ca87e13a859d"
parent: "90-day-ai-llm-engineering-roadmap-beginner-to-advanced"
children: []
order: 0
icon: "🗓️"
cover: null
---
> Every day has a specific deliverable: build something from scratch, then verify it against the library version. Mark Done only when you can explain the mechanism, not just call the function.

---


## Phase 1 — Python & Math Foundations (Days 1–15)


| Day | Topic                             | Daily Milestone                                                                                     |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | NumPy vectorization               | Replace 3 loop-based computations with vectorized NumPy. Benchmark speedup.                         |
| 2   | NumPy broadcasting                | Normalize a dataset using broadcasting. Explain axis=0 vs axis=1.                                   |
| 3   | NumPy linear algebra ops          | Matrix multiply, dot product, norm. Implement cosine similarity from scratch.                       |
| 4   | Pandas basics                     | Load CSV, inspect, filter, groupby on a real dataset.                                               |
| 5   | Pandas missing data               | Handle missing values 3 ways (drop, median impute, flag). Compare results.                          |
| 6   | Pandas encoding                   | One-hot encode categoricals. Prep a train/test split with no leakage.                               |
| 7   | Vectors and dot products          | Compute dot product by hand and with NumPy. Explain geometric meaning.                              |
| 8   | Matrices as transformations       | Visualize a matrix scaling/rotating vectors. Explain what Wx does.                                  |
| 9   | Eigenvalues and eigenvectors      | Implement PCA from scratch using eigendecomposition. Compare to sklearn PCA.                        |
| 10  | Matrix rank, determinant, inverse | Compute all 3 for a 3x3 matrix by hand and with NumPy.                                              |
| 11  | Derivatives and gradients         | Implement numerical derivative. Compare to analytical derivative for x^2.                           |
| 12  | Chain rule                        | Derive d/dx of a composed function by hand. Verify with PyTorch autograd.                           |
| 13  | Gradient descent                  | Implement gradient descent to minimize (x-3)^2. Plot convergence.                                   |
| 14  | Probability distributions + Bayes | Implement Bayes theorem on a concrete example (medical test scenario).                              |
| 15  | **Phase 1 Capstone**              | **Linear regression from scratch with gradient descent. Match sklearn's weights. Plot loss curve.** |


---


## Phase 2 — Classical Machine Learning (Days 16–35)


| Day | Topic                          | Daily Milestone                                                                                    |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| 16  | Linear regression with sklearn | Fit on a real dataset with a Pipeline + StandardScaler.                                            |
| 17  | Logistic regression            | Fit a binary classifier. Inspect predict_proba outputs.                                            |
| 18  | L1 vs L2 regularization        | Train Ridge and Lasso on the same data. Compare which features Lasso zeros out.                    |
| 19  | Bias-variance tradeoff         | Train models of increasing complexity. Plot train vs test error. Identify overfit point.           |
| 20  | Cross-validation               | Replace single train/test split with 5-fold CV. Report mean +/- std.                               |
| 21  | Classification metrics         | Compute precision, recall, F1, confusion matrix on an imbalanced dataset.                          |
| 22  | Decision trees                 | Train and visualize a decision tree. Explain a split using Gini impurity.                          |
| 23  | Random Forest (bagging)        | Train Random Forest. Compare variance to a single decision tree.                                   |
| 24  | Gradient Boosting              | Train XGBoost with early stopping. Compare to Random Forest.                                       |
| 25  | Feature importance             | Extract and plot feature importances from your best tree model.                                    |
| 26  | SVM                            | Train SVM with RBF kernel. Explain the kernel trick conceptually.                                  |
| 27  | KNN                            | Train KNN classifier. Demonstrate performance degradation in high dimensions.                      |
| 28  | Curse of dimensionality        | Simulate: compute average distance between random points as dimensions increase.                   |
| 29  | K-Means clustering             | Implement elbow method. Cluster a dataset and visualize.                                           |
| 30  | DBSCAN                         | Compare DBSCAN to K-Means on a non-spherical dataset.                                              |
| 31  | PCA for visualization          | Reduce a high-dim dataset to 2D with PCA. Plot and interpret.                                      |
| 32  | t-SNE                          | Compare PCA vs t-SNE visualization on the same dataset.                                            |
| 33  | Feature engineering pipeline   | Build a ColumnTransformer handling numeric + categorical features.                                 |
| 34  | Hyperparameter tuning          | GridSearchCV on your best model. Report best params and CV score.                                  |
| 35  | **Phase 2 Capstone**           | **End-to-end ML pipeline: EDA, 3 model families, tuning, final eval, feature importance, report.** |


---


## Phase 3 — Deep Learning Foundations (Days 36–55)


| Day | Topic                         | Daily Milestone                                                                                   |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| 36  | Neural network forward pass   | Implement forward pass (2-layer) in pure NumPy.                                                   |
| 37  | Activation functions          | Implement sigmoid, ReLU, softmax. Plot each. Explain why non-linearity matters.                   |
| 38  | Backprop derivation           | Derive gradients for a 2-layer network by hand on paper.                                          |
| 39  | Backprop implementation       | Implement backward pass in NumPy. Train on a toy classification dataset.                          |
| 40  | Chain rule in backprop        | Trace gradient flow through 3 layers by hand. Verify against autograd.                            |
| 41  | PyTorch autograd              | Use torch.autograd to compute gradients. Compare to your NumPy implementation.                    |
| 42  | Vanishing/exploding gradients | Train a deep network with sigmoid vs ReLU. Compare gradient magnitudes.                           |
| 43  | PyTorch nn.Module             | Build an MLP using nn.Module. Train on MNIST.                                                     |
| 44  | PyTorch training loop         | Write the full loop: zero_grad, forward, loss, backward, step. Train to convergence.              |
| 45  | Optimizers: SGD vs Adam       | Train the same model with SGD and Adam. Compare convergence speed.                                |
| 46  | DataLoaders and batching      | Use DataLoader with batching + shuffling. Explain why batching matters.                           |
| 47  | model.eval() and dropout      | Add Dropout. Show different behavior in train() vs eval() mode.                                   |
| 48  | CNN: convolution operation    | Implement a conv layer forward pass conceptually. Explain parameter sharing.                      |
| 49  | CNN: build and train          | Build a CNN in PyTorch. Train on CIFAR-10 or similar.                                             |
| 50  | CNN: pooling and architecture | Add pooling layers. Compare model size vs a fully-connected equivalent.                           |
| 51  | Transfer learning             | Fine-tune a pretrained ResNet. Compare to your from-scratch CNN.                                  |
| 52  | RNN basics                    | Build a simple RNN. Explain the hidden state mechanism.                                           |
| 53  | LSTM/GRU                      | Replace RNN with LSTM. Explain why it handles long sequences better.                              |
| 54  | RNN limitations               | Document why RNNs can't parallelize across sequence length (sets up Phase 4).                     |
| 55  | **Phase 3 Capstone**          | **CNN image classifier + LSTM char-level language model with text generation at 3 temperatures.** |


---


## Phase 4 — NLP & Transformers (Days 56–70)


| Day | Topic                            | Daily Milestone                                                                              |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| 56  | Tokenization                     | Tokenize text with a BPE tokenizer. Inspect subword splits on rare words.                    |
| 57  | BPE algorithm                    | Implement a simplified BPE merge algorithm conceptually on a tiny corpus.                    |
| 58  | Embeddings                       | Use nn.Embedding. Explore word similarity using cosine distance on embeddings.               |
| 59  | Self-attention derivation        | Derive the QKV attention formula on paper. Explain each matrix's role.                       |
| 60  | Self-attention implementation    | Implement scaled dot-product attention from scratch in PyTorch.                              |
| 61  | Causal masking                   | Implement causal masking. Verify: changing a future token doesn't affect past outputs.       |
| 62  | Attention scaling                | Explain why sqrt(d_k) scaling matters. Show softmax saturation without it.                   |
| 63  | Multi-head attention             | Implement multi-head attention from scratch (no nn.MultiheadAttention).                      |
| 64  | Residual connections + LayerNorm | Add both to your transformer block. Explain why they help gradient flow.                     |
| 65  | Positional encoding              | Implement sinusoidal positional encoding. Explain why attention needs it.                    |
| 66  | Full Transformer block           | Assemble: attention + residual + FFN + residual + norm. Stack N blocks.                      |
| 67  | BERT architecture                | Load a pretrained BERT. Explain encoder-only + bidirectional + MLM pretraining.              |
| 68  | GPT architecture                 | Load GPT-2. Generate text. Explain decoder-only + causal + next-token pretraining.           |
| 69  | BERT vs GPT decision             | Write up: when would you use an encoder vs decoder architecture? With examples.              |
| 70  | **Phase 4 Capstone**             | **GPT-style transformer from scratch (no nn.Transformer) + fine-tuned BERT on a real task.** |


---


## Phase 5 — LLMs & Applied GenAI Engineering (Days 71–90)


| Day | Topic                       | Daily Milestone                                                                                              |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 71  | Temperature sampling        | Implement temperature scaling. Generate text at temp 0.1, 1.0, 2.0. Compare.                                 |
| 72  | Top-k and top-p sampling    | Implement both from scratch. Explain when to use each.                                                       |
| 73  | Prompt engineering patterns | Write few-shot and chain-of-thought prompts. Compare output quality to zero-shot.                            |
| 74  | Embeddings for retrieval    | Embed a small document set. Compute cosine similarity for a query.                                           |
| 75  | FAISS vector search         | Build a FAISS index. Run nearest-neighbor search. Explain HNSW conceptually.                                 |
| 76  | Vector DB comparison        | Compare FAISS vs Chroma vs Pinecone tradeoffs (local vs managed, scale).                                     |
| 77  | RAG: chunking strategy      | Chunk a document 3 ways (size/overlap). Compare retrieval quality qualitatively.                             |
| 78  | RAG: full pipeline          | Build index -> retrieve -> generate pipeline with LangChain or from scratch.                                 |
| 79  | RAG: source citations       | Modify your pipeline to always return source documents with the answer.                                      |
| 80  | RAG: hybrid search          | Add BM25 keyword search alongside vector search. Compare results.                                            |
| 81  | RAG: re-ranking             | Add a cross-encoder re-ranker. Measure precision improvement on top-K.                                       |
| 82  | RAG: failure modes          | Test your RAG on a question with no good answer in your docs. Does it say "I don't know"?                    |
| 83  | LoRA concept and config     | Set up a LoraConfig. Print trainable params %. Explain the low-rank math.                                    |
| 84  | LoRA fine-tuning            | Fine-tune a small model with LoRA on a custom dataset.                                                       |
| 85  | QLoRA and quantization      | Load a model in 4-bit. Fine-tune with QLoRA. Compare memory usage to full fine-tune.                         |
| 86  | Fine-tune vs RAG decision   | Write a decision framework: when to fine-tune, when to RAG, when to just prompt.                             |
| 87  | Function calling / tool use | Implement a function-calling agent with 2 tools. Test multi-step tool use.                                   |
| 88  | ReAct agent pattern         | Build a ReAct loop: thought -> action -> observation -> repeat until answer.                                 |
| 89  | Evaluation harness          | Build a 20-question golden eval set. Run faithfulness + relevance metrics.                                   |
| 90  | **Phase 5 Capstone**        | **Production RAG app: ingestion + retrieval + generation + evals + FastAPI + UI + README with limitations.** |


---


## Daily ritual

1. Open this table. Find today's row.
2. Read the concept explanation in the phase page.
3. Implement the "from scratch" version first — resist reaching for the library immediately.
4. Verify correctness against the library/pretrained version.
5. Log in tracker: tick **Built from scratch** and **Used the library version**.
6. Write one **Key insight** in your own words — not copied from the explanation.
7. Mark **Done** only if you could explain today's mechanism to someone else without notes.
