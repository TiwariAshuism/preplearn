---
source: manual
title: "Week 0 — Deep Learning Foundations"
slug: "Week_00_Deep_Learning_Foundations"
parent: "AI_course"
children: []
order: 0
icon: "🧠"
cover: null
---
# Week 0 — Deep Learning Foundations (Prerequisite Week)

**Goal by end of week:** before touching anything LLM-specific, you can explain what a neural network actually is, how it learns (forward pass, loss, backward pass, gradient descent), and why techniques like dropout/regularization exist — and you've trained a real (tiny) network yourself, including by hand.

**Why this week exists:** Weeks 1-10 assume you already know "a model learns by adjusting weights to reduce a loss via gradient descent." If that sentence isn't fully clear yet, this week makes it clear before you meet it again in the context of billion-parameter Transformers.

**Prerequisite check:** basic Python (functions, loops, NumPy arrays) and matrix multiplication at a conceptual level. If linear algebra feels shaky, do [3Blue1Brown's Essence of Linear Algebra, ep. 1-4](https://www.3blue1brown.com/topics/linear-algebra) first (this is worth doing before Week 1 regardless).

---

## Day 1 — What Is a Neural Network

- **The building block — a neuron:** takes several numeric inputs, multiplies each by a learned weight, adds a learned bias, sums it all up, and passes the result through an activation function (Day 2) to produce one output number. That's it — the "intelligence" comes from having millions of these and tuning the weights, not from any single neuron being clever.
- **Layers:** a layer is a group of neurons that each look at the same inputs (e.g. the previous layer's outputs) and each produce their own output — stacking layers lets the network build up increasingly abstract representations (raw pixels → edges → shapes → objects, in an image network, by rough analogy).
- **Weights and biases are the only things that get learned:** the *architecture* (how many layers, how many neurons per layer) is a design choice you make; the specific numeric values of every weight and bias are what training actually discovers.
- **Why depth/nonlinearity lets networks approximate almost any function (intuition, not proof):** a network with enough neurons and at least one nonlinear activation function can approximate arbitrarily complex input-output mappings — this is why the same basic recipe (stack of weighted sums + nonlinearities) underlies everything from a digit classifier to a 175-billion-parameter language model.
- **Self-check:** if a neuron only computed a weighted sum with no activation function, and you stacked 10 such layers, could the result do anything a single layer couldn't? (Answer this before Day 2, then check your reasoning after reading it.)

**Watch:** [3Blue1Brown — But what is a neural network?](https://www.youtube.com/watch?v=aircAruvnKk) (the single best 20 minutes you can spend on this topic)

---

## Day 2 — Activation Functions and Why Nonlinearity Matters

- **The problem with no activation function:** stacking purely linear layers (weighted sum, no nonlinearity) collapses mathematically into a single linear layer, no matter how many you stack — depth would buy you nothing. Nonlinear activation functions are what make depth actually meaningful.
- **Sigmoid:** squashes any input into a (0, 1) range — historically popular, still used for outputting a probability, but rarely used in hidden layers of modern networks because it saturates (its gradient goes near-zero for large inputs, slowing/stopping learning — the "vanishing gradient" problem, Day 3).
- **ReLU (Rectified Linear Unit):** outputs the input directly if positive, zero otherwise. Simple, fast to compute, and avoids much of sigmoid's vanishing-gradient problem — the default choice for hidden layers in most modern networks.
- **Softmax:** converts a vector of raw scores into a probability distribution (all values between 0 and 1, summing to 1) — used at the *output* layer of classification networks (including, eventually, the "which token comes next" prediction in an LLM).
- **Where you'll see these again:** softmax is exactly what turns an LLM's raw next-token scores into a probability distribution over the vocabulary (Week 1) — this isn't a new concept for Transformers, it's this same building block reused.
- **Self-check:** why would a network made entirely of layers with no nonlinear activation function be unable to learn something as simple as XOR (output 1 if exactly one of two binary inputs is 1)?

**Read:** [Michael Nielsen — Neural Networks and Deep Learning, Chapter 1](http://neuralnetworksanddeeplearning.com/chap1.html) (free online book, excellent and beginner-paced)

---

## Day 3 — Forward Pass, Backward Pass, and Backpropagation

- **Forward pass:** feed input through the network layer by layer, each layer's output feeding the next, until you get a final prediction — this is just repeated weighted-sum-then-activation, nothing more.
- **The learning problem:** you have a prediction and a "correct" target — you need to know *how to adjust every single weight in the network* to make the prediction closer to correct next time. With millions of weights, you need an efficient way to compute this, not trial and error.
- **Backpropagation, the core idea:** using the chain rule from calculus, compute how much the final error changes with respect to each weight, working *backward* from the output layer to the input layer — each layer's "blame" for the error is computed from the layer after it, reusing computation rather than redoing it from scratch for every single weight.
- **Why this is efficient rather than absurdly expensive:** without the chain-rule reuse, computing the effect of each individual weight on the final error independently would be computationally infeasible for large networks; backpropagation computes all of them in roughly one backward pass, the same cost as one forward pass.
- **What "training" a neural network actually is, in one sentence:** repeat forward pass → compute loss (Day 4) → backward pass (compute gradients) → update weights slightly in the direction that reduces loss, over and over, on batches of training data.
- **Self-check:** why does backpropagation need to run layer-by-layer backward, rather than computing every weight's gradient independently and directly?

**Paper (historical, skim for the concept not the full derivation):** [Learning representations by back-propagating errors](https://www.nature.com/articles/323533a0) — Rumelhart, Hinton, Williams, 1986
**Watch:** [3Blue1Brown — Backpropagation calculus](https://www.youtube.com/watch?v=tIeHLnjs5U8)

---

## Day 4 — Loss Functions and Gradient Descent

- **Loss function:** a single number measuring "how wrong" the network's prediction was — training is entirely about minimizing this number. Different tasks need different loss functions: **Mean Squared Error (MSE)** for regression (predicting a continuous number), **Cross-Entropy** for classification (predicting a category/probability distribution — this is also exactly what trains an LLM's next-token prediction, Week 1).
- **Gradient descent, the core idea:** the gradient of the loss with respect to a weight tells you the direction that *increases* the loss fastest — so you nudge every weight a small step in the *opposite* direction, repeatedly, until the loss stops meaningfully decreasing.
- **Learning rate:** how big a step you take each update — too large and training can overshoot and diverge (loss bounces around or explodes); too small and training crawls, taking forever to converge. Picking this well is one of the most impactful, least glamorous parts of training any model.
- **Stochastic Gradient Descent (SGD) and mini-batches:** computing the exact gradient over your *entire* dataset before every single update is expensive; instead, compute an approximate gradient over a small random batch of examples at a time — noisier per-step, but far more updates per unit of compute, and it works well in practice.
- **Adam optimizer:** an improved update rule that adapts the effective learning rate per-parameter based on recent gradient history — the default optimizer choice for most modern deep learning (including LLM training) because it converges faster and more reliably than plain SGD in most cases.
- **Self-check:** if your training loss is bouncing wildly up and down instead of smoothly decreasing, what's your first hyperparameter suspect, and which direction would you adjust it?

**Paper:** [Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980) — Kingma & Ba, 2014

---

## Day 5 — Overfitting, Underfitting, and Regularization

- **Underfitting:** the model is too simple (or undertrained) to capture the real pattern in the data — high error on both training and validation data. Fix: bigger model, train longer, better features.
- **Overfitting:** the model has effectively "memorized" the training data, including its noise/quirks, instead of learning the general pattern — low training error but high validation error. This is the far more common problem in practice, especially with large models and limited data.
- **Train / validation / test splits, and why you need all three:** train on the training set; use the validation set *during* development to tune hyperparameters and detect overfitting (never train directly on it); use the test set exactly once, at the very end, as an honest, untouched estimate of real-world performance — reusing the test set for tuning quietly turns it into another validation set, defeating its purpose.
- **Common regularization techniques:** **dropout** (randomly disable a fraction of neurons during each training step, preventing the network from over-relying on any single neuron/pathway), **weight decay / L2 regularization** (penalize large weights in the loss function, encouraging simpler solutions), **early stopping** (stop training once validation loss starts getting worse, even if training loss is still improving).
- **Why this connects directly to Week 2:** "catastrophic forgetting" during LLM fine-tuning is a form of overfitting — fine-tuning too aggressively on a narrow dataset overfits to that narrow task at the expense of general capability, and the fixes (fewer epochs, lower learning rate, PEFT methods like LoRA that constrain how much can change) are direct applications of this week's regularization intuition.
- **Self-check:** you train a model and see training loss keep dropping every epoch while validation loss starts rising after epoch 5 — what's happening, and name two different fixes.

**Paper:** [Dropout: A Simple Way to Prevent Neural Networks from Overfitting](https://jmlr.org/papers/v15/srivastava14a.html) — Srivastava et al., 2014
**Read:** [Michael Nielsen — Neural Networks and Deep Learning, Chapter 3 (overfitting section)](http://neuralnetworksanddeeplearning.com/chap3.html)

---

## Day 6 — Projects

### 🟢 Easy — Linear regression from scratch, by hand
Implement linear regression (one weight, one bias) in plain NumPy: write the MSE loss, manually derive and code the gradient, and run gradient descent for N steps on a small synthetic dataset (e.g. `y = 3x + 2 + noise`). **Deliverable:** a plot of the loss decreasing over steps, and your final learned weight/bias compared to the true 3 and 2.

### 🟡 Medium — Train a small image classifier in PyTorch
Build a 2-3 layer feedforward (or small CNN) network in PyTorch to classify MNIST digits. Plot train vs. validation loss/accuracy curves across epochs. Deliberately overfit first (train too long, no regularization), then fix it with dropout and/or weight decay and show the validation curve improve. **Deliverable:** both loss curve plots (overfit vs. regularized) side by side, plus final test-set accuracy.

### 🔴 Hard — Backpropagation from scratch, verified against autograd
Implement a small 2-layer neural network (e.g. 2 inputs → 4 hidden neurons with ReLU → 1 output) entirely in NumPy, including manually coding the backward pass (chain rule, by hand — no autograd). Then build the identical network in PyTorch using `autograd`, initialize both with the *same* weights, run one forward+backward pass on the same input, and compare your manual gradients to PyTorch's computed gradients. **Deliverable:** your from-scratch implementation, and a printed comparison showing your manual gradients match PyTorch's (within floating-point tolerance) — this is the single best exercise for making backpropagation feel real rather than abstract.

---

## Day 7 — Review
Without notes, write 6-8 sentences covering: what a neuron computes, why nonlinear activations matter, what backpropagation computes and why it's efficient, what a loss function and gradient descent do together, and one sentence each on overfitting and one regularization fix. If you can write this cleanly, you're ready for Week 1 — every one of these ideas reappears there, just applied to tokens and attention instead of pixels and digits.

---

## 📺 Videos & Courses

**YouTube**
- [3Blue1Brown — Neural Networks playlist](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi) — start here; chapter 1 ("But what is a neural network?") and chapter 2 (gradient descent) map directly to Days 1 and 4.
- [3Blue1Brown — Backpropagation calculus](https://www.youtube.com/watch?v=tIeHLnjs5U8) — the chain-rule mechanics behind Day 3, visually.
- [StatQuest with Josh Starmer — Neural Networks / Deep Learning playlist](https://www.youtube.com/playlist?list=PLblh5JKOoLUIxGDQs4LFFD--41Vzf-ME1) — a slower, more step-by-step alternative angle on the same Day 1-4 material if 3Blue1Brown's pace is too fast on a first pass.

**Udemy**
- [PyTorch for Deep Learning Bootcamp: Zero to Mastery](https://www.udemy.com/course/pytorch-for-deep-learning-bootcamp-zero-to-mastery/) — hands-on PyTorch from tensors through training loops; pairs well with the Day 6 projects.

---

## References
**Papers**
- [Learning representations by back-propagating errors](https://www.nature.com/articles/323533a0) — Rumelhart, Hinton, Williams, 1986
- [Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980) — Kingma & Ba, 2014
- [Dropout: A Simple Way to Prevent Neural Networks from Overfitting](https://jmlr.org/papers/v15/srivastava14a.html) — Srivastava et al., 2014

**Blogs / Videos / Books**
- 3Blue1Brown — [Neural Networks series](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi) (start here, watch episodes 1-4)
- Michael Nielsen — [Neural Networks and Deep Learning](http://neuralnetworksanddeeplearning.com/) (free online book, Chapters 1-3 cover this whole week)
- Andrej Karpathy — [The spelled-out intro to neural networks and backpropagation: building micrograd](https://www.youtube.com/watch?v=VMj-3S1tku0) (builds backprop from scratch on camera — do this alongside the Hard project)
- PyTorch — [official 60-minute Deep Learning blitz tutorial](https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html)

