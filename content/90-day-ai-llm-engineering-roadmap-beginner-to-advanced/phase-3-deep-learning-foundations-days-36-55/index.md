---
source: notion
title: "Phase 3 — Deep Learning Foundations (Days 36–55)"
slug: "phase-3-deep-learning-foundations-days-36-55"
notionId: "384da883-bddd-8176-a38a-cd36ab15ac59"
notionRootId: "384da883bddd81438d21ca87e13a859d"
parent: "90-day-ai-llm-engineering-roadmap-beginner-to-advanced"
children: []
order: 3
icon: "🧠"
cover: null
---
> **Core insight:** A neural network is just stacked linear regressions with non-linear functions between them. Backpropagation is just the chain rule applied automatically. Once you implement these from scratch, PyTorch stops being a black box and becomes a tool that automates math you already understand.

---


## Day 36–39 — Neural Networks from scratch


```python
import numpy as np

# A neural network layer: linear transform + non-linearity
# z = Wx + b      (linear)
# a = activation(z)  (non-linear -- THIS is what lets networks learn non-linear patterns)

def sigmoid(z): return 1 / (1 + np.exp(-z))
def relu(z): return np.maximum(0, z)
def softmax(z):
    exp_z = np.exp(z - np.max(z, axis=1, keepdims=True))  # numerical stability
    return exp_z / np.sum(exp_z, axis=1, keepdims=True)

# Why non-linearity matters: without it, stacking layers is pointless
# (a linear function of a linear function is STILL just linear)
# W2(W1 x + b1) + b2 = (W2 W1) x + (W2 b1 + b2) = just another linear function!

class NeuralNetworkScratch:
    def __init__(self, input_size, hidden_size, output_size):
        self.W1 = np.random.randn(input_size, hidden_size) * 0.01
        self.b1 = np.zeros(hidden_size)
        self.W2 = np.random.randn(hidden_size, output_size) * 0.01
        self.b2 = np.zeros(output_size)

    def forward(self, X):
        self.z1 = X @ self.W1 + self.b1
        self.a1 = relu(self.z1)
        self.z2 = self.a1 @ self.W2 + self.b2
        self.a2 = softmax(self.z2)
        return self.a2

    def backward(self, X, y_onehot, lr=0.01):
        m = X.shape[0]

        # Output layer gradient (derivative of softmax + cross-entropy simplifies beautifully)
        dz2 = self.a2 - y_onehot
        dW2 = self.a1.T @ dz2 / m
        db2 = np.sum(dz2, axis=0) / m

        # Hidden layer gradient (CHAIN RULE in action)
        da1 = dz2 @ self.W2.T
        dz1 = da1 * (self.z1 > 0)  # ReLU derivative: 1 if z>0 else 0
        dW1 = X.T @ dz1 / m
        db1 = np.sum(dz1, axis=0) / m

        # Gradient descent update
        self.W2 -= lr * dW2; self.b2 -= lr * db2
        self.W1 -= lr * dW1; self.b1 -= lr * db1

    def train(self, X, y_onehot, epochs=1000, lr=0.1):
        for epoch in range(epochs):
            self.forward(X)
            self.backward(X, y_onehot, lr)
```


### Key concepts

- A neuron = linear transform + activation function
- Why non-linear activations are mathematically necessary (without them, depth is pointless)
- Forward pass: compute predictions layer by layer
- Backward pass (backpropagation): compute gradients layer by layer, using the chain rule, from output back to input

---


## Day 40–43 — Backpropagation deep dive


```python
# Backpropagation is THE algorithm that makes deep learning computationally feasible.
# It computes the gradient of the loss with respect to EVERY parameter
# using ONE forward pass and ONE backward pass -- not one pass per parameter.

# The chain rule, applied layer by layer:
# loss -> dL/da2 -> dL/dz2 -> dL/dW2, dL/db2 -> dL/da1 -> dL/dz1 -> dL/dW1, dL/db1
#
# Each layer only needs to know:
# 1. The gradient flowing IN from the layer after it
# 2. Its own local derivative
# Multiply them together (chain rule) to get the gradient to pass BACKWARD

# This is exactly what PyTorch's autograd does automatically:
import torch

x = torch.tensor([2.0], requires_grad=True)
y = x ** 2 + 3 * x + 1
y.backward()  # computes dy/dx automatically via the chain rule
print(x.grad)  # tensor([7.]) since dy/dx = 2x + 3 = 2(2)+3 = 7

# Vanishing/exploding gradients: why deep networks are hard to train
# If each layer's derivative is < 1, gradients shrink exponentially with depth (vanishing)
# If each layer's derivative is > 1, gradients grow exponentially (exploding)
# This motivated: ReLU (derivative is 0 or 1, not shrinking), residual connections,
# batch normalization, careful weight initialization (Xavier/He init)
```


### Key concepts

- Backprop = chain rule applied systematically, computed once per layer (not once per parameter)
- Autograd (PyTorch) automates exactly this process — you define the forward pass, it computes the backward pass
- Vanishing/exploding gradients and why architectural choices (ReLU, residual connections, normalization) exist specifically to combat this

---


## Day 44–47 — PyTorch fundamentals


```python
import torch
import torch.nn as nn
import torch.optim as optim

# Tensors: like NumPy arrays, but with GPU support and automatic differentiation
x = torch.randn(3, 4, requires_grad=True)

# Define a model using nn.Module
class MLP(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

model = MLP(input_size=784, hidden_size=128, output_size=10)

# Loss function and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# The standard PyTorch training loop -- memorize this pattern, you'll write it hundreds of times
for epoch in range(num_epochs):
    for X_batch, y_batch in train_loader:
        optimizer.zero_grad()          # clear old gradients
        outputs = model(X_batch)        # forward pass
        loss = criterion(outputs, y_batch)  # compute loss
        loss.backward()                 # backward pass (autograd computes all gradients)
        optimizer.step()                # update weights using gradients

# DataLoader: efficient batching, shuffling, parallel data loading
from torch.utils.data import DataLoader, TensorDataset
dataset = TensorDataset(X_tensor, y_tensor)
train_loader = DataLoader(dataset, batch_size=32, shuffle=True)

# GPU acceleration
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)
X_batch, y_batch = X_batch.to(device), y_batch.to(device)
```


### Key concepts

- `nn.Module` for defining models, `forward()` for the computation graph
- The training loop pattern: zero_grad → forward → loss → backward → step (you will type this thousands of times)
- Optimizers: SGD vs Adam (Adam adapts the learning rate per-parameter, usually converges faster)
- DataLoaders for efficient batching

---


## Day 48–51 — Convolutional Neural Networks (CNNs)


```python
import torch.nn as nn

# Convolution: slide a small filter across the image, computing dot products
# Key insight: the SAME filter is reused across the entire image (parameter sharing)
# This makes CNNs translation-invariant and dramatically more parameter-efficient
# than a fully-connected layer for image data

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels=3, out_channels=32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)  # downsample, keep strongest signal
        self.fc1 = nn.Linear(64 * 8 * 8, 128)
        self.fc2 = nn.Linear(128, num_classes)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))  # conv -> activation -> downsample
        x = self.pool(self.relu(self.conv2(x)))
        x = x.view(x.size(0), -1)  # flatten for fully-connected layers
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# Why CNNs work for images:
# - Local receptive fields: each filter looks at a small patch, builds up
#   from edges -> textures -> parts -> objects across layers
# - Parameter sharing: massively fewer parameters than a fully-connected network
# - Pooling: provides some translation invariance, reduces computation

# Transfer learning: use a pretrained model (ResNet, EfficientNet), fine-tune on your data
import torchvision.models as models
resnet = models.resnet18(pretrained=True)
for param in resnet.parameters():
    param.requires_grad = False  # freeze pretrained weights
resnet.fc = nn.Linear(resnet.fc.in_features, num_classes)  # replace final layer
```


### Key concepts

- Convolution operation: filters, parameter sharing, local receptive fields
- Pooling for downsampling and approximate translation invariance
- Why CNNs are vastly more efficient than fully-connected networks for image data
- Transfer learning: freeze pretrained layers, fine-tune only the final layers on your task

---


## Day 52–54 — Recurrent Neural Networks (RNNs) and sequence modeling


```python
# RNNs process sequences by maintaining a HIDDEN STATE that carries
# information forward through time -- this is the direct ancestor of
# how transformers (Phase 4) handle sequences, just without attention

class SimpleRNN(nn.Module):
    def __init__(self, vocab_size, embed_size, hidden_size):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_size)
        self.rnn = nn.LSTM(embed_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, vocab_size)

    def forward(self, x, hidden=None):
        x = self.embedding(x)             # token IDs -> dense vectors
        out, hidden = self.rnn(x, hidden)  # process sequence, maintain hidden state
        out = self.fc(out)                 # hidden state -> vocabulary logits
        return out, hidden

# Why LSTM/GRU instead of vanilla RNN:
# Vanilla RNNs suffer badly from vanishing gradients over long sequences
# (the same chain rule problem from Day 40, but compounded over EVERY timestep)
# LSTM/GRU use "gates" to control what information to keep/forget,
# creating a more direct gradient path through time

# The CRITICAL limitation of RNNs that motivated Transformers (Phase 4):
# - Sequential processing: must process token 1, then token 2, then token 3...
#   cannot parallelize across the sequence dimension during training
# - Long-range dependencies still degrade, even with LSTM, over very long sequences
# - This is THE reason transformers (parallel, attention-based) replaced RNNs for NLP
```


### Key concepts

- Hidden state: how RNNs carry information across a sequence
- Why vanilla RNNs suffer vanishing gradients over long sequences, and how LSTM/GRU gates address this
- The fundamental limitation (sequential, not parallelizable) that directly motivated the Transformer architecture in Phase 4

---


## Day 55 — Phase 3 Capstone: Image Classifier + Char-Level Language Model


**Deliverable: two complete PyTorch projects**


```javascript
Project 1: CNN Image Classifier
  - Dataset: CIFAR-10 or a custom image dataset
  - Build a CNN from scratch (not just transfer learning)
  - Train with proper train/val split, track loss and accuracy curves
  - Add data augmentation (random crop, flip) and show it improves generalization
  - Compare your from-scratch CNN to a fine-tuned pretrained ResNet
  - Target: document the accuracy difference and explain why

Project 2: Character-level Language Model (the Karpathy classic)
  - Dataset: any text corpus (Shakespeare, your own writing, code)
  - Build an LSTM-based character-level language model
  - Train it to predict the next character given previous characters
  - Generate text by sampling from the model's output distribution
  - This is conceptually a tiny ancestor of GPT -- same next-token prediction
    objective, just character-level instead of subword-level, and LSTM
    instead of Transformer
```


**Requirements:**

- Both projects must show training/validation loss curves
- Document any overfitting observed and what you did about it (dropout, regularization, more data)
- For the language model: show 3 generated text samples at different "temperature" settings and explain the difference qualitatively (this sets up Phase 5 sampling concepts)

---


## Common mistakes


### Mistake 1


**❌ Forgetting** **`optimizer.zero_grad()`** **before** **`loss.backward()`****.**


PyTorch ACCUMULATES gradients by default. Without zeroing them each step, gradients from previous batches corrupt the current update.


**✅ Correct approach:** Always call `optimizer.zero_grad()` at the start of each training iteration, before computing the new gradients.


### Mistake 2


**❌ Not putting the model in** **`eval()`** **mode during validation/inference.**


Layers like Dropout and BatchNorm behave differently during training vs evaluation. Forgetting `model.eval()` means dropout is still randomly zeroing activations during validation, giving misleadingly noisy/poor validation metrics.


**✅ Correct approach:** Always call `model.eval()` before validation/inference, and `model.train()` before resuming training. Wrap inference in `with torch.no_grad():` to save memory by not tracking gradients.


### Mistake 3


**❌ Using a learning rate that's too high or too low without diagnosing it.**


Too high: loss oscillates or diverges (NaN). Too low: loss decreases extremely slowly, training seems "stuck."


**✅ Correct approach:** Always plot the loss curve. If it's spiky/diverging, lower the learning rate. If it's barely moving after many epochs, raise it. Learning rate schedulers (`torch.optim.lr_scheduler`) that decay the LR over training are standard practice.

