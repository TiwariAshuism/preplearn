---
source: notion
title: "Phase 1 — Mathematical & Statistical Foundations"
slug: "phase-1-mathematical-and-statistical-foundations"
notionId: "37dda883-bddd-81a3-a894-ee94e7277aae"
notionRootId: "37dda883bddd812c8b27d0594933ab2b"
parent: "quant-analyst-roadmap-beginner-to-advanced"
children: []
order: 4
icon: "📐"
cover: null
---
> **Core insight:** Every quant model is built from probability, statistics, linear algebra, and stochastic calculus. You don't need a PhD's worth of pure math — you need working fluency with the specific tools that price options, measure risk, and test strategies. This phase builds that toolkit with code alongside every derivation.

---


## 📚 Topics in order


### Days 1–5 — Probability foundations


**Core distributions you must know cold:**

- Normal (Gaussian): the backbone of Black-Scholes, CLT, most risk models
- Lognormal: stock prices are often modelled as lognormal (returns are normal, prices are not)
- Binomial: discrete option pricing trees
- Poisson: jump processes, default events
- Student's t: fat-tailed returns, small-sample inference

**Key concepts:**

- Expectation, variance, covariance, correlation
- Conditional probability and Bayes' theorem — the foundation of Bayesian updating in trading signals
- Law of large numbers vs Central Limit Theorem — why CLT justifies normal approximations, and why it fails for fat-tailed assets
- Moment generating functions — used to derive distributions of sums of returns

```python
import numpy as np
from scipy import stats

# Simulate returns and check CLT in action
np.random.seed(42)
single_day_returns = np.random.standard_t(df=3, size=100_000)  # fat-tailed
monthly_returns = single_day_returns.reshape(-1, 21).sum(axis=1)  # sum of 21 days

print("Single day kurtosis:", stats.kurtosis(single_day_returns))   # high (fat tails)
print("Monthly kurtosis:", stats.kurtosis(monthly_returns))          # lower (CLT effect)
```


### Days 6–10 — Statistical inference

- Hypothesis testing: t-tests, p-values, confidence intervals — and why p-hacking is rampant (and dangerous) in strategy research
- Maximum likelihood estimation (MLE) — how distribution parameters are fit to data
- Regression: OLS, assumptions (linearity, homoscedasticity, no autocorrelation in residuals), and what happens when these are violated in financial data (they almost always are)
- Multiple regression and multicollinearity — critical for factor models in Phase 5
- Bootstrapping — resampling to estimate the distribution of a statistic without parametric assumptions

```python
import statsmodels.api as sm

# OLS regression: does yesterday's return predict today's? (test for autocorrelation)
returns = np.random.normal(0, 0.01, 1000)
X = sm.add_constant(returns[:-1])  # yesterday's return
y = returns[1:]                     # today's return

model = sm.OLS(y, X).fit()
print(model.summary())
# In efficient markets, the coefficient on lagged return should be ~0
```


### Days 11–15 — Linear algebra for finance

- Vectors, matrices, matrix multiplication — portfolio weights as vectors, covariance as matrices
- Eigenvalues/eigenvectors — PCA for yield curve decomposition and factor extraction
- Covariance matrix: the foundation of portfolio variance, `σ²_p = w^T Σ w`
- Cholesky decomposition — generating correlated random variables for Monte Carlo simulation
- Positive semi-definiteness — why covariance matrices must satisfy this, and what happens (numerically) when they don't

```python
import numpy as np

# Portfolio variance from covariance matrix
weights = np.array([0.4, 0.3, 0.3])
cov_matrix = np.array([
    [0.04, 0.01, 0.02],
    [0.01, 0.09, 0.01],
    [0.02, 0.01, 0.16]
])
portfolio_variance = weights @ cov_matrix @ weights.T
portfolio_vol = np.sqrt(portfolio_variance)
print(f"Portfolio volatility: {portfolio_vol:.4f}")

# Cholesky decomposition: generate correlated random returns for Monte Carlo
L = np.linalg.cholesky(cov_matrix)
uncorrelated = np.random.standard_normal((3, 10000))
correlated_returns = L @ uncorrelated
print("Empirical correlation:\n", np.corrcoef(correlated_returns))
```


### Days 16–22 — Time series analysis


**Why this matters:** asset prices and returns are time series with specific properties — autocorrelation, volatility clustering, non-stationarity — that violate the i.i.d. assumptions of basic statistics.

- Stationarity: a series whose statistical properties don't change over time. Prices are NOT stationary; returns usually are (approximately).
- Augmented Dickey-Fuller (ADF) test — formally test for stationarity
- Autocorrelation (ACF) and partial autocorrelation (PACF) — detect serial dependence in returns
- AR, MA, ARMA, ARIMA models — model the conditional mean of a series
- GARCH models — model the conditional VARIANCE. Volatility clusters: big moves follow big moves. This is THE key stylised fact of financial time series.
- Cointegration — two non-stationary series that move together long-run. Foundation of pairs trading (Phase 5).

```python
import pandas as pd
from statsmodels.tsa.stattools import adfuller
from arch import arch_model

# Test for stationarity
prices = pd.Series(np.cumsum(np.random.normal(0, 1, 1000)) + 100)
returns = prices.pct_change().dropna()

price_adf = adfuller(prices)
return_adf = adfuller(returns)
print(f"Price series ADF p-value: {price_adf[1]:.4f}")   # likely > 0.05 (non-stationary)
print(f"Return series ADF p-value: {return_adf[1]:.4f}")  # likely < 0.05 (stationary)

# GARCH(1,1) for volatility clustering
model = arch_model(returns * 100, vol='GARCH', p=1, q=1)
result = model.fit(disp='off')
print(result.summary())
# Conditional volatility forecast
forecast = result.forecast(horizon=5)
print(forecast.variance.tail())
```


### Days 23–30 — Stochastic calculus essentials


**The minimum stochastic calculus toolkit for derivatives pricing:**

- Brownian motion (Wiener process): `W(t)`, the building block of continuous-time finance. Properties: `W(0)=0`, independent increments, `W(t)-W(s) ~ N(0, t-s)`.
- Geometric Brownian Motion (GBM): the standard model for stock prices. `dS = μS dt + σS dW`. This is WHY stock prices are lognormally distributed.
- Itô's Lemma: the chain rule for stochastic processes. Essential for deriving the Black-Scholes PDE.
- Itô integral vs ordinary integral — why `∫ dW ≠ 0` in the way you'd expect from ordinary calculus
- Risk-neutral pricing intuition — why derivatives can be priced "as if" the world were risk-neutral, using the no-arbitrage argument

```python
import numpy as np
import matplotlib.pyplot as plt

# Simulate Geometric Brownian Motion paths
def simulate_gbm(S0, mu, sigma, T, n_steps, n_paths):
    dt = T / n_steps
    Z = np.random.standard_normal((n_paths, n_steps))
    increments = (mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z
    log_paths = np.log(S0) + np.cumsum(increments, axis=1)
    return np.exp(np.hstack([np.full((n_paths, 1), np.log(S0)), log_paths]))

paths = simulate_gbm(S0=100, mu=0.05, sigma=0.2, T=1, n_steps=252, n_paths=10)
plt.plot(paths.T)
plt.title("Simulated GBM Stock Price Paths")
plt.xlabel("Trading days")
plt.ylabel("Price")
plt.show()

# Verify: log returns should be approximately normal with mean (mu - 0.5*sigma^2)*dt
log_returns = np.diff(np.log(paths), axis=1)
print(f"Empirical mean: {log_returns.mean():.6f}")
print(f"Theoretical mean: {(0.05 - 0.5*0.2**2) * (1/252):.6f}")
```


---


## 🔨 Phase 1 Project: Statistical Analysis of Real Market Data


**Deliverable: A Jupyter notebook analysing real equity data**


Using free data (yfinance), for SPY and 4 individual stocks across different sectors:

1. Download 5 years of daily price data
2. Compute log returns. Test for stationarity (ADF test) on prices vs returns
3. Plot return distributions vs fitted normal — visually demonstrate fat tails (Q-Q plot)
4. Compute and interpret: mean, std, skewness, kurtosis, Jarque-Bera test for normality
5. Plot ACF/PACF of returns AND squared returns — show returns are uncorrelated but squared returns are autocorrelated (volatility clustering)
6. Fit a GARCH(1,1) model. Plot conditional volatility vs realised volatility
7. Build the covariance matrix for all 5 assets. Compute portfolio variance for an equal-weight portfolio. Run PCA on the covariance matrix — how much variance does PC1 explain? (This is the "market factor")
8. Write a 1-page summary: what stylised facts did you observe, and which textbook assumptions do they violate?

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Assuming returns are normally distributed without checking.**


Most intro finance courses use normal returns for simplicity. Real returns have fat tails (excess kurtosis) and are slightly left-skewed (crashes are bigger than rallies).


**✅ Correct approach:** Always plot the empirical distribution against a fitted normal. Run a Jarque-Bera test. If kurtosis > 3 (excess kurtosis > 0), your tail-risk models based on normality will UNDERESTIMATE extreme moves. Consider Student's t or empirical/historical distributions for tail risk.


### Mistake 2


**❌ Testing for stationarity on price levels and concluding the series is "predictable" because of high autocorrelation.**


Price levels are almost always non-stationary (they have a trend/random walk component) and will show high autocorrelation purely as an artifact. This is meaningless for trading.


**✅ Correct approach:** Always work with returns (or log-differences) for statistical testing. Test for stationarity with ADF before doing time series modelling. Non-stationary inputs to regression produce spurious (meaningless but statistically "significant") relationships — the classic spurious regression problem.


### Mistake 3


**❌ Treating correlation as constant.**


Correlations between assets are NOT stable — they tend to increase sharply during market crashes ("correlation goes to 1 in a crisis"). A covariance matrix estimated from calm-period data underestimates portfolio risk during stress.


**✅ Correct approach:** Compute rolling correlations and visualise how they change over time, especially during known stress periods (2008, 2020). For risk management, consider stress-period covariance matrices or models that explicitly account for regime changes (Phase 4-5).


### Mistake 4


**❌ Confusing statistical significance with economic significance.**


With enough data, even a tiny, economically meaningless coefficient (e.g., 0.0001 predictive power) can be "statistically significant" at p<0.05.


**✅ Correct approach:** Always ask: does this effect size matter after transaction costs? A regression coefficient that predicts 0.01% of next-day return is statistically detectable with enough data but completely useless once you account for bid-ask spread and commissions.

