---
source: notion
title: "Phase 2 — Classical Machine Learning (Days 16–35)"
slug: "phase-2-classical-machine-learning-days-16-35"
notionId: "384da883-bddd-8167-9dce-d90527cc6ee9"
notionRootId: "384da883bddd81438d21ca87e13a859d"
parent: "90-day-ai-llm-engineering-roadmap-beginner-to-advanced"
children: []
order: 4
icon: "📊"
cover: null
---
> **Core insight:** Classical ML is not obsolete — it's the right tool for 80% of real business problems (tabular data, smaller datasets, interpretability requirements). It's also where you build the intuition for overfitting, regularization, evaluation, and the bias-variance tradeoff that applies to every model you'll ever train, including LLMs.

---


## Day 16–18 — Linear & Logistic Regression (with sklearn)


```python
from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge, Lasso
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# Linear regression: predicting continuous values
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('model', LinearRegression())
])
pipe.fit(X_train, y_train)

# Logistic regression: predicting probabilities for classification
# sigmoid(Xw + b) squashes output to [0, 1], interpreted as P(class=1)
log_reg = LogisticRegression()
log_reg.fit(X_train, y_train)
probs = log_reg.predict_proba(X_test)  # actual probabilities, not just labels

# Regularization: penalize large weights to prevent overfitting
# L2 (Ridge): adds sum(w^2) to loss -- shrinks weights smoothly
# L1 (Lasso): adds sum(|w|) to loss -- can shrink weights to EXACTLY zero (feature selection)
ridge = Ridge(alpha=1.0)   # alpha controls regularization strength
lasso = Lasso(alpha=0.1)
```


### Key concepts

- Sigmoid function and why it's used for binary classification
- L1 vs L2 regularization (sparse feature selection vs smooth shrinkage)
- Why regularization combats overfitting (it discourages the model from relying too heavily on any one feature)

---


## Day 19–21 — Bias-Variance Tradeoff and Model Evaluation


```python
# The single most important concept in all of ML
#
# High bias (underfitting): model too simple, misses patterns in data
#   - Train error HIGH, test error HIGH (similar to train)
# High variance (overfitting): model too complex, memorizes noise
#   - Train error LOW, test error HIGH (big gap)
#
# Total error = bias^2 + variance + irreducible noise

from sklearn.model_selection import cross_val_score, learning_curve

# K-fold cross-validation: more reliable estimate of generalization than a single split
scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(f"Mean CV accuracy: {scores.mean():.3f} +/- {scores.std():.3f}")

# Classification metrics -- know when to use each
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, classification_report
)

# Accuracy: misleading on imbalanced data (99% accuracy predicting "not fraud" when 1% is fraud)
# Precision: of predicted positives, how many were correct? (minimize false positives)
# Recall: of actual positives, how many did we catch? (minimize false negatives)
# F1: harmonic mean of precision and recall
# ROC-AUC: how well does the model rank positives above negatives, across all thresholds

print(classification_report(y_test, y_pred))

# Regression metrics
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
```


### Key concepts

- Bias-variance tradeoff (THE central tension in all of ML)
- Why a single train/test split is unreliable, and why cross-validation fixes it
- Precision vs recall — know which one matters for fraud detection vs cancer screening vs spam filtering
- Confusion matrix and what each cell means

---


## Day 22–25 — Decision Trees and Ensemble Methods


```python
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import xgboost as xgb

# Decision tree: splits data on features to minimize impurity (Gini or entropy)
tree = DecisionTreeClassifier(max_depth=5)  # max_depth limits overfitting
tree.fit(X_train, y_train)

# Random Forest: bagging (Bootstrap Aggregating)
# Train N trees on random subsets of data + random subsets of features
# Average their predictions -> reduces variance, more robust than a single tree
rf = RandomForestClassifier(n_estimators=100, max_depth=10)
rf.fit(X_train, y_train)

# Feature importance: which features mattered most
importances = rf.feature_importances_

# Gradient Boosting: sequential ensemble
# Each new tree is trained to correct the ERRORS (residuals) of the previous trees
# Much more powerful than bagging, but more prone to overfitting without tuning
gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3)
gb.fit(X_train, y_train)

# XGBoost: the industry-standard gradient boosting implementation
# Wins more Kaggle competitions on tabular data than any other algorithm
model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8
)
model.fit(X_train, y_train, eval_set=[(X_test, y_test)], early_stopping_rounds=10)
```


### Key concepts

- How a decision tree splits (Gini impurity / entropy / information gain)
- Bagging (Random Forest) vs Boosting (XGBoost/GradientBoosting) — parallel independent trees vs sequential error-correcting trees
- Why tree-based ensembles dominate tabular data competitions (handle non-linearity, mixed feature types, missing values, with minimal preprocessing)
- Early stopping to prevent overfitting in boosted models

---


## Day 26–28 — Support Vector Machines and K-Nearest Neighbors


```python
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier

# SVM: find the hyperplane that maximizes the margin between classes
# Kernel trick: project data into higher dimensions to make it linearly separable
svm = SVC(kernel='rbf', C=1.0, gamma='scale')
svm.fit(X_train, y_train)

# KNN: classify a point by majority vote of its K nearest neighbors
# No "training" -- it memorizes the data and computes distances at prediction time
knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)

# Distance metrics matter: Euclidean, Manhattan, Cosine
# Curse of dimensionality: KNN degrades badly in high-dimensional spaces
# (this is part of why embeddings + approximate nearest neighbor search
#  matters so much for vector databases in Phase 5)
```


### Key concepts

- SVM margin maximization and the kernel trick
- KNN: a lazy learner, and why it struggles in high dimensions (curse of dimensionality)
- This curse-of-dimensionality intuition directly motivates why vector search in Phase 5 needs approximate methods (HNSW, IVF) instead of brute-force KNN

---


## Day 29–31 — Unsupervised Learning: Clustering and Dimensionality Reduction


```python
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

# K-Means: partition data into K clusters by minimizing within-cluster variance
kmeans = KMeans(n_clusters=3, random_state=42)
labels = kmeans.fit_predict(X)

# Elbow method: choose K by plotting inertia vs K, look for the "elbow"
inertias = [KMeans(n_clusters=k).fit(X).inertia_ for k in range(1, 10)]

# DBSCAN: density-based clustering, finds clusters of arbitrary shape,
# automatically identifies outliers (doesn't force every point into a cluster)
dbscan = DBSCAN(eps=0.5, min_samples=5)

# PCA: project high-dimensional data onto the directions of maximum variance
# Used for: visualization, noise reduction, speeding up downstream models
pca = PCA(n_components=2)
X_reduced = pca.fit_transform(X)
print(f"Variance explained: {pca.explained_variance_ratio_}")

# t-SNE: non-linear dimensionality reduction, great for visualization
# (preserves LOCAL structure, distorts global distances -- don't use for downstream ML)
tsne = TSNE(n_components=2, perplexity=30)
X_tsne = tsne.fit_transform(X)
```


### Key concepts

- K-Means clustering and the elbow method for choosing K
- DBSCAN for arbitrary-shaped clusters and outlier detection
- PCA for dimensionality reduction (and as a stepping stone to understanding embeddings)
- Why t-SNE is great for visualization but should never feed into another model

---


## Day 32–34 — Feature Engineering and the Full ML Pipeline


```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.model_selection import GridSearchCV

# A production-grade preprocessing pipeline
numeric_features = ['age', 'income']
categorical_features = ['city', 'job_type']

numeric_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

preprocessor = ColumnTransformer([
    ('num', numeric_transformer, numeric_features),
    ('cat', categorical_transformer, categorical_features)
])

full_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', xgb.XGBClassifier())
])

# Hyperparameter tuning with grid search + cross-validation
param_grid = {
    'classifier__max_depth': [3, 5, 7],
    'classifier__n_estimators': [100, 200],
    'classifier__learning_rate': [0.01, 0.1]
}
grid_search = GridSearchCV(full_pipeline, param_grid, cv=5, scoring='f1')
grid_search.fit(X_train, y_train)
print(f"Best params: {grid_search.best_params_}")
```


### Key concepts

- Why pipelines matter: prevent data leakage (fitting the scaler on test data is a silent bug that inflates your reported performance)
- Hyperparameter tuning: grid search vs random search vs Bayesian optimization
- Feature engineering: domain-specific transforms (log transforms for skewed data, interaction terms, datetime decomposition)

---


## Day 35 — Phase 2 Capstone: End-to-End ML Pipeline


**Deliverable: a complete Kaggle-style ML project**


```javascript
Dataset: pick any tabular dataset (Titanic, House Prices, or a real business dataset)

Required steps:
1. Exploratory Data Analysis (EDA): distributions, correlations, missing data patterns
2. Feature engineering: handle missing values, encode categoricals, create new features
3. Train/validation/test split (proper, no leakage)
4. Baseline model: simple logistic regression or linear regression
5. Try 3 model families: linear model, tree-based (Random Forest), boosted (XGBoost)
6. Hyperparameter tuning with cross-validation for your best model
7. Final evaluation on held-out test set with appropriate metrics
8. Feature importance analysis: which features actually drove predictions?
9. Write a 1-page report: what worked, what didn't, what you'd try next
```


**Requirements:**

- Use a `Pipeline` + `ColumnTransformer`, not manual preprocessing
- Report cross-validated metrics, not just a single train/test split
- Include a confusion matrix or residual plot as appropriate
- Explicitly discuss bias-variance: is your final model overfitting, underfitting, or well-balanced?

---


## Common mistakes


### Mistake 1


**❌ Data leakage: fitting preprocessing (scaler, imputer) on the full dataset before splitting.**


This lets information from the test set "leak" into training, producing inflated performance metrics that won't hold up in production.


**✅ Correct approach:** Always split FIRST, then fit all preprocessing exclusively on the training set. Use sklearn `Pipeline` objects so this is automatic and can't be accidentally violated.


### Mistake 2


**❌ Using accuracy as the only metric on an imbalanced dataset.**


A model that always predicts "not fraud" achieves 99% accuracy on a dataset where fraud is 1% of cases — while being completely useless.


**✅ Correct approach:** For imbalanced classification, always check precision, recall, F1, and the confusion matrix. Choose the metric that matches the real-world cost of false positives vs false negatives.


### Mistake 3


**❌ Tuning hyperparameters using the test set.**


If you iterate on hyperparameters by checking test set performance, the test set becomes an extension of your training process, and your final reported number is optimistic.


**✅ Correct approach:** Use a separate validation set (or cross-validation) for hyperparameter tuning. Touch the test set exactly once, at the very end, to report final performance.

