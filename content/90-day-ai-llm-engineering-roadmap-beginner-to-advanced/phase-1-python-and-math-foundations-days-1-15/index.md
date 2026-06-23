---
source: notion
title: "Phase 1 — Python & Math Foundations (Days 1–15)"
slug: "phase-1-python-and-math-foundations-days-1-15"
notionId: "384da883-bddd-8127-87f8-e45df64f3782"
notionRootId: "384da883bddd81438d21ca87e13a859d"
parent: "90-day-ai-llm-engineering-roadmap-beginner-to-advanced"
children: []
order: 5
icon: "📐"
cover: null
---
> **Core insight:** Every ML model is a function with parameters, fit to data by minimizing a loss using calculus (gradients) and linear algebra (matrix operations). If you understand `y = Xw + b` and how to adjust `w` to reduce error, you understand the seed from which every neural network and LLM grows.

---


## Day 1–3 — NumPy and vectorized computation


```python
import numpy as np

# Everything in ML is array operations. Never loop over data points in Python.
X = np.array([[1, 2], [3, 4], [5, 6]])  # 3 samples, 2 features
w = np.array([0.5, -0.2])

# Matrix-vector multiply: this IS what a neural network layer does
predictions = X @ w  # shape (3,)

# Broadcasting: operations on different-shaped arrays without explicit loops
X_normalized = (X - X.mean(axis=0)) / X.std(axis=0)

# Vectorized vs loop (ALWAYS vectorize)
# SLOW:
result = []
for i in range(len(X)):
    result.append(X[i] @ w)
# FAST:
result = X @ w

# Random number generation with seeds (reproducibility)
rng = np.random.default_rng(42)
X = rng.normal(loc=0, scale=1, size=(100, 5))

# Key operations you'll use constantly
np.dot(a, b)        # dot product / matrix multiply
np.linalg.norm(v)   # vector magnitude
np.exp(x)           # used in sigmoid, softmax
np.argmax(x, axis=1)  # predicted class from logits
```


### Key skills

- Array creation, indexing, slicing, boolean masking
- Broadcasting rules (shapes must be compatible)
- `axis` parameter (0=down columns, 1=across rows) — the #1 source of bugs
- Matrix multiplication `@` vs element-wise `*`

---


## Day 4–6 — Pandas for data manipulation


```python
import pandas as pd

df = pd.read_csv('data.csv')

# Inspect
df.head(); df.info(); df.describe()
df.isnull().sum()  # missing values per column

# Selection
df[df['age'] > 30]                    # filter
df.groupby('category')['price'].mean()  # aggregate
df['new_col'] = df['a'] + df['b']      # feature engineering

# Handling missing data
df['col'].fillna(df['col'].median(), inplace=True)
df.dropna(subset=['important_col'])

# Encoding categorical variables (you'll do this before every ML model)
pd.get_dummies(df, columns=['category'])  # one-hot encoding

# Train/test split prep
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```


### Key skills

- Loading, cleaning, filtering, grouping data
- Handling missing values (drop vs impute — know the tradeoff)
- Encoding categorical features (one-hot, label encoding)
- Merging/joining dataframes

---


## Day 7–10 — Linear algebra for ML


```python
# Vectors and dot products
# Dot product measures alignment: a . b = |a||b|cos(theta)
# This is THE operation inside every neuron, every attention score
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
dot = np.dot(a, b)  # = 1*4 + 2*5 + 3*6 = 32

# Matrices as linear transformations
# A matrix multiply ROTATES, SCALES, and SHEARS vectors
A = np.array([[2, 0], [0, 3]])  # scales x by 2, y by 3
v = np.array([1, 1])
transformed = A @ v  # [2, 3]

# Eigenvalues and eigenvectors (foundation of PCA)
# Eigenvector: a direction that the matrix only SCALES, doesn't rotate
A = np.array([[4, 1], [2, 3]])
eigenvalues, eigenvectors = np.linalg.eig(A)

# PCA from scratch (dimensionality reduction)
def pca(X, n_components):
    X_centered = X - X.mean(axis=0)
    cov_matrix = np.cov(X_centered.T)
    eigenvalues, eigenvectors = np.linalg.eigh(cov_matrix)
    idx = np.argsort(eigenvalues)[::-1]
    top_vectors = eigenvectors[:, idx[:n_components]]
    return X_centered @ top_vectors

# Matrix rank, determinant, inverse (used in normal equation, covariance)
np.linalg.det(A)
np.linalg.inv(A)
np.linalg.matrix_rank(A)
```


### Key skills

- Vectors, dot product, vector norms
- Matrix multiplication and what it geometrically represents
- Eigenvalues/eigenvectors (used in PCA, and conceptually in understanding what neural network layers do)
- Why a neural network layer is just `Wx + b` (a matrix multiply plus a shift)

---


## Day 11–13 — Calculus: derivatives and gradients


```python
# A derivative tells you: if I nudge x slightly, how much does f(x) change?
# This is THE concept that makes all of ML/DL work: gradient descent

# Numerical derivative (for intuition, never used in practice)
def numerical_derivative(f, x, h=1e-7):
    return (f(x + h) - f(x - h)) / (2 * h)

f = lambda x: x**2
print(numerical_derivative(f, 3))  # approx 6, matches df/dx = 2x at x=3

# Chain rule: THE most important rule in all of deep learning
# If y = f(g(x)), then dy/dx = f'(g(x)) * g'(x)
# This is literally what backpropagation computes, layer by layer

# Gradient descent: the core training algorithm of ALL of ML
def gradient_descent(f, grad_f, x0, lr=0.1, steps=100):
    x = x0
    history = [x]
    for _ in range(steps):
        grad = grad_f(x)
        x = x - lr * grad   # move OPPOSITE the gradient (downhill)
        history.append(x)
    return x, history

# Minimize f(x) = (x - 3)^2, whose minimum is at x=3
f = lambda x: (x - 3)**2
grad_f = lambda x: 2 * (x - 3)
x_min, history = gradient_descent(f, grad_f, x0=0, lr=0.1, steps=50)
print(x_min)  # converges to ~3.0

# Partial derivatives: gradient of a multi-variable function
# grad f(x, y) = [df/dx, df/dy] -- points in direction of steepest ASCENT
# Gradient descent moves in the OPPOSITE direction
```


### Key skills

- What a derivative means (rate of change)
- The chain rule (this IS backpropagation, conceptually)
- Gradient descent: the single algorithm that trains linear regression, logistic regression, neural networks, and LLMs
- Partial derivatives and gradients (vectors of partial derivatives)

---


## Day 14–15 — Probability and statistics fundamentals


```python
# Distributions you'll see everywhere
from scipy import stats

# Normal distribution: weight initialization, noise modeling
stats.norm.pdf(x=0, loc=0, scale=1)

# Bernoulli/Binomial: binary classification outputs
stats.bernoulli.pmf(k=1, p=0.7)

# Bayes' theorem: P(A|B) = P(B|A) * P(A) / P(B)
# Foundation of Naive Bayes classifiers, and conceptually of how LLMs
# can be seen as learning P(next_token | previous_tokens)

# Maximum Likelihood Estimation (MLE)
# The principle behind almost EVERY loss function in ML:
# "find parameters that make the observed data most probable"

# Cross-entropy loss DERIVED from MLE for classification:
def cross_entropy(y_true, y_pred_probs):
    # y_true: one-hot encoded true labels
    # y_pred_probs: predicted probabilities
    return -np.sum(y_true * np.log(y_pred_probs + 1e-9))

# This is the loss function used to train:
# - logistic regression
# - neural network classifiers
# - LLMs (next-token prediction is literally cross-entropy over vocabulary)

# Mean Squared Error (MSE) -- derived from MLE assuming Gaussian noise
def mse(y_true, y_pred):
    return np.mean((y_true - y_pred) ** 2)
```


### Key skills

- Probability distributions (normal, bernoulli, categorical)
- Bayes' theorem and conditional probability
- Maximum Likelihood Estimation — the principle behind every loss function
- Why cross-entropy is THE loss function for classification (and for LLMs)

---


## Phase 1 Capstone Project: Linear Regression From Scratch


**Deliverable: implement linear regression with gradient descent, no sklearn**


```python
import numpy as np

class LinearRegressionScratch:
    def __init__(self, lr=0.01, n_iters=1000):
        self.lr = lr
        self.n_iters = n_iters
        self.weights = None
        self.bias = None
        self.loss_history = []

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0

        for _ in range(self.n_iters):
            y_pred = X @ self.weights + self.bias

            # Loss: Mean Squared Error
            loss = np.mean((y_pred - y) ** 2)
            self.loss_history.append(loss)

            # Gradients (derived by hand using calculus -- do this derivation yourself!)
            dw = (2 / n_samples) * X.T @ (y_pred - y)
            db = (2 / n_samples) * np.sum(y_pred - y)

            # Gradient descent update
            self.weights -= self.lr * dw
            self.bias -= self.lr * db

    def predict(self, X):
        return X @ self.weights + self.bias


# Compare against sklearn to verify correctness
from sklearn.linear_model import LinearRegression
from sklearn.datasets import make_regression

X, y = make_regression(n_samples=200, n_features=3, noise=10, random_state=42)

model = LinearRegressionScratch(lr=0.01, n_iters=2000)
model.fit(X, y)

sklearn_model = LinearRegression()
sklearn_model.fit(X, y)

print("Scratch weights:", model.weights)
print("Sklearn weights:", sklearn_model.coef_)
# These should match closely
```


**Requirements:**

1. Implement gradient descent by hand — derive the gradient of MSE with respect to weights yourself on paper first
2. Plot the loss curve over iterations — it should monotonically decrease
3. Compare your weights to sklearn's `LinearRegression` — they should match within a small tolerance
4. Implement logistic regression from scratch as a bonus (sigmoid + cross-entropy loss + gradient descent)
5. Write a short explanation: why does the learning rate matter? Try `lr=0.5` and `lr=0.0001` and explain what happens to each

---


## Common mistakes


### Mistake 1


**❌ Looping over data points instead of vectorizing.**


A Python for-loop over 1 million data points is 100-1000x slower than the equivalent NumPy vectorized operation.


**✅ Correct approach:** Always ask "can this be expressed as a matrix operation?" before writing a loop. `X @ w` replaces a loop computing dot products row by row.


### Mistake 2


**❌ Not normalizing/scaling features before gradient descent.**


If one feature ranges 0-1 and another ranges 0-100,000, gradient descent will oscillate wildly or converge very slowly because the loss surface is badly distorted.


**✅ Correct approach:** Standardize features (subtract mean, divide by std) before training any gradient-based model. This is why `StandardScaler` exists in sklearn.


### Mistake 3


**❌ Treating "I can call** **`.fit()`****" as understanding the model.**


This is the single biggest gap between people who can use ML libraries and people who can debug, improve, or explain why a model isn't working.


**✅ Correct approach:** For every model in this roadmap, implement a simplified version from scratch BEFORE using the library version. The library version becomes the convenient tool; the scratch version is the understanding.

