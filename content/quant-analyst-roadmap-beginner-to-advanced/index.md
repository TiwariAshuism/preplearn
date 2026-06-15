---
source: notion
title: "📈 Quant Analyst Roadmap — Beginner to Advanced"
slug: "quant-analyst-roadmap-beginner-to-advanced"
notionId: "37dda883bddd812c8b27d0594933ab2b"
notionRootId: "37dda883bddd812c8b27d0594933ab2b"
parent: null
children: ["phase-5-quant-strategies-ml-and-backtesting","phase-4-derivatives-pricing-and-risk-models","phase-3-financial-markets-and-instruments","phase-2-programming-and-data-infrastructure","phase-1-mathematical-and-statistical-foundations"]
order: 9
icon: "📈"
cover: null
---
> 📈 **From statistics fundamentals to building production trading systems.** Math, programming, financial markets, derivatives pricing, statistical/ML models, backtesting, and risk management — the complete path to working as a quantitative analyst.

---


## 📌 How to use this template

- Work phases **in order** — each builds on the math/code of the previous one
- Every concept has a corresponding **implementation** (Python/Go). Quant work is computational — derivations without code are half-finished
- Use the **Daily Tracker** to log study + code + one market insight per day
- Each phase ends with a **project** that ties theory to a working artifact (pricer, backtester, model)
> 💡 **The core skill being built:** translating a real-world financial question into a mathematical model, implementing it correctly, and knowing exactly where the model breaks down.

---


## 🗺️ Roadmap at a glance


| Phase                                            | Focus                                                                     | Key Outcome                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Phase 1 — Mathematical & Statistical Foundations | Probability, statistics, linear algebra, stochastic calculus, time series | Build the math toolkit every quant model rests on |
| Phase 2 — Programming & Data Infrastructure      | Python for quant (NumPy/Pandas), SQL, market data, performance            | Clean, fast, production-grade data pipelines      |
| Phase 3 — Financial Markets & Instruments        | Equities, fixed income, FX, derivatives, market microstructure            | Understand what you're actually modelling         |
| Phase 4 — Derivatives Pricing & Risk Models      | Black-Scholes, binomial trees, Monte Carlo, Greeks, VaR                   | Price and hedge real instruments                  |
| Phase 5 — Quant Strategies, ML & Backtesting     | Factor models, statistical arbitrage, ML in finance, backtesting engines  | Build and rigorously test a trading strategy      |


---


## ⚡ The quant decision framework


For every model or strategy, ask:

1. **What is the economic intuition?** — if you can't explain it in one sentence to a non-quant, you don't understand it yet
2. **What are the assumptions, and which ones are false in practice?** — every model is wrong; know HOW it's wrong
3. **What does the data actually look like?** — plot it before modelling it. Fat tails, autocorrelation, regime shifts
4. **How does this fail?** — what market conditions break this model (2008, 2020, flash crashes)?
5. **What's the simplest version that captures 80% of the value?** — start simple, add complexity only when justified by out-of-sample performance
6. **Is this overfit?** — in-sample Sharpe of 3.0 with 10 parameters on 2 years of data is a red flag, not a strategy

---


## 📊 My progress

- Current phase: **Phase 1**
- Current day: **Day 1**
- Models implemented: **0**
- Backtests run: **0**
- Papers read: **0**

---


## 🔖 Quick links

- 📐 Phase 1 — Mathematical & Statistical Foundations
- 💻 Phase 2 — Programming & Data Infrastructure
- 🏦 Phase 3 — Financial Markets & Instruments
- ⚖️ Phase 4 — Derivatives Pricing & Risk Models
- 🤖 Phase 5 — Quant Strategies, ML & Backtesting

---


## 🛠️ Core tech stack


| Layer                 | Tools                                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| Language              | Python (primary), with Go for production systems                         |
| Numerical computing   | NumPy, SciPy, Pandas                                                     |
| Statistical modelling | statsmodels, scikit-learn                                                |
| Visualization         | Matplotlib, Seaborn, Plotly                                              |
| Backtesting           | vectorbt, backtrader, or custom event-driven engine                      |
| Data sources          | yfinance, Quandl, Alpha Vantage, IEX, Bloomberg/Refinitiv (if available) |
| Databases             | PostgreSQL/TimescaleDB for tick/OHLCV data                               |
| Notebooks             | Jupyter for research, scripts for production                             |
| Performance           | NumPy vectorization, Numba/Cython for hot loops                          |


---


## 📘 Essential reading list (by phase)


| Book                                                             | Use for                               |
| ---------------------------------------------------------------- | ------------------------------------- |
| _Introduction to Probability_ — Blitzstein & Hwang               | Phase 1 probability foundation        |
| _A First Course in Stochastic Processes_ — Karlin & Taylor       | Phase 1 stochastic processes          |
| _Python for Data Analysis_ — Wes McKinney                        | Phase 2 Pandas mastery                |
| _Options, Futures, and Other Derivatives_ — John Hull            | Phase 3–4 the quant bible             |
| _Paul Wilmott Introduces Quantitative Finance_                   | Phase 4 derivatives intuition         |
| _Advances in Financial Machine Learning_ — Marcos López de Prado | Phase 5 ML pitfalls in finance        |
| _Quantitative Trading_ — Ernest Chan                             | Phase 5 strategy design + backtesting |
| _Active Portfolio Management_ — Grinold & Kahn                   | Phase 5 factor models                 |


📅 Quant Daily Tracker


## Phase 1 — Mathematical & Statistical Foundations
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


## Phase 2 — Programming & Data Infrastructure
> **Core insight:** A quant who can derive Black-Scholes but can't pull, clean, and process real market data is unemployable. This phase builds the engineering muscle: Pandas at speed, SQL for market data, and the performance habits that separate a 2-second backtest from a 2-hour one.

---


## 📚 Topics in order


### Days 1–6 — NumPy & vectorization


**The golden rule: never write a Python** **`for`** **loop over array data.** Vectorized NumPy operations are 10-100x faster because they run in compiled C, not the Python interpreter.


```python
import numpy as np
import time

prices = np.random.uniform(90, 110, 1_000_000)

# SLOW: Python loop
start = time.time()
returns_loop = []
for i in range(1, len(prices)):
    returns_loop.append((prices[i] - prices[i-1]) / prices[i-1])
print(f"Loop: {time.time() - start:.4f}s")

# FAST: vectorized
start = time.time()
returns_vec = np.diff(prices) / prices[:-1]
print(f"Vectorized: {time.time() - start:.4f}s")
# Vectorized is typically 50-100x faster
```


**Essential NumPy patterns for quant work:**

- Broadcasting — operations on arrays of different shapes without explicit loops
- `np.where`, boolean masking — conditional logic without loops (e.g., "long if signal > 0")
- `np.cumsum`, `np.cumprod` — cumulative returns, running P&L
- Rolling window operations via `np.lib.stride_tricks` or pandas `.rolling()`
- Random number generation with seeds — reproducible Monte Carlo simulations

### Days 7–14 — Pandas mastery for time series


```python
import pandas as pd
import yfinance as yf

# Download and structure data
data = yf.download(['AAPL', 'MSFT', 'GOOGL'], start='2019-01-01', end='2024-01-01')
close_prices = data['Close']

# Resampling: daily -> weekly/monthly
weekly = close_prices.resample('W').last()
monthly_returns = close_prices.resample('M').last().pct_change()

# Rolling statistics — the bread and butter of quant signals
rolling_vol = close_prices.pct_change().rolling(window=21).std() * np.sqrt(252)  # annualized
rolling_corr = close_prices['AAPL'].pct_change().rolling(60).corr(close_prices['MSFT'].pct_change())

# Multi-index for panel data (multiple assets x multiple dates)
returns = close_prices.pct_change().dropna()
stacked = returns.stack()  # MultiIndex: (date, ticker) -> return
stacked.index.names = ['date', 'ticker']

# Groupby for cross-sectional operations (critical for factor models)
daily_rank = returns.rank(axis=1, pct=True)  # percentile rank of each stock, each day

# merge_asof: the CORRECT way to join data with different timestamps
# (e.g., joining trade data with the most recent quote BEFORE the trade)
trades = pd.DataFrame({'time': pd.to_datetime(['09:30:01', '09:30:05']), 'price': [100.1, 100.3]})
quotes = pd.DataFrame({'time': pd.to_datetime(['09:30:00', '09:30:03']), 'bid': [100.0, 100.2], 'ask': [100.2, 100.4]})
merged = pd.merge_asof(trades, quotes, on='time', direction='backward')
print(merged)
```


**Common pandas pitfalls:**

- `.loc` vs `.iloc` vs chained indexing (`df['a']['b']` creates copies and triggers `SettingWithCopyWarning`)
- Timezone handling — market data often spans multiple exchanges with different timezones; always work in UTC internally
- `pct_change()` vs `diff()` vs `np.log().diff()` (simple vs log returns) — log returns are additive across time, simple returns are additive across assets

### Days 15–20 — Market data sources & cleaning


```python
# Free data sources for learning
import yfinance as yf

# OHLCV data
data = yf.download('SPY', start='2020-01-01', interval='1d')

# Common data quality issues to handle:
# 1. Stock splits and dividends -> use adjusted close, not raw close
# 2. Survivorship bias -> delisted stocks disappear from "current" universe data
#    (a backtest using only TODAY's S&P 500 constituents overstates historical returns)
# 3. Missing data / holidays -> different exchanges have different holiday calendars
# 4. Outliers / bad ticks -> a price of $0.01 or $10,000 for a $100 stock is a data error

def clean_returns(prices: pd.Series, max_daily_move: float = 0.5) -> pd.Series:
    """Remove obviously erroneous price moves (likely data errors)."""
    returns = prices.pct_change()
    bad_ticks = returns.abs() > max_daily_move
    if bad_ticks.any():
        print(f"Removing {bad_ticks.sum()} suspected bad ticks")
        prices = prices.copy()
        prices[bad_ticks] = np.nan
        prices = prices.ffill()
    return prices.pct_change()
```


### Days 21–24 — Time series databases for market data


```sql
-- PostgreSQL + TimescaleDB for tick/OHLCV data
CREATE TABLE ohlcv (
    time        TIMESTAMPTZ NOT NULL,
    symbol      TEXT NOT NULL,
    open        DOUBLE PRECISION,
    high        DOUBLE PRECISION,
    low         DOUBLE PRECISION,
    close       DOUBLE PRECISION,
    volume      BIGINT,
    PRIMARY KEY (time, symbol)
);

-- Convert to TimescaleDB hypertable for performance at scale
SELECT create_hypertable('ohlcv', 'time');

-- Index for fast symbol lookups
CREATE INDEX idx_ohlcv_symbol_time ON ohlcv (symbol, time DESC);

-- Query: 20-day rolling average close price per symbol
SELECT
    time,
    symbol,
    close,
    AVG(close) OVER (
        PARTITION BY symbol
        ORDER BY time
        ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) AS sma_20
FROM ohlcv
WHERE symbol = 'AAPL'
ORDER BY time;

-- Window functions for cross-sectional ranking (factor models)
SELECT
    time,
    symbol,
    close,
    PERCENT_RANK() OVER (PARTITION BY time ORDER BY close) AS price_percentile
FROM ohlcv
WHERE time = '2024-01-15';
```


```python
# Go: high-performance market data ingestion service
# pkg/marketdata/ingest.go
package marketdata

import (
    "context"
    "github.com/jackc/pgx/v5/pgxpool"
)

type OHLCVBar struct {
    Time   time.Time
    Symbol string
    Open, High, Low, Close float64
    Volume int64
}

func BatchInsertBars(ctx context.Context, pool *pgxpool.Pool, bars []OHLCVBar) error {
    batch := &pgx.Batch{}
    for _, bar := range bars {
        batch.Queue(
            `INSERT INTO ohlcv (time, symbol, open, high, low, close, volume)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (time, symbol) DO NOTHING`,
            bar.Time, bar.Symbol, bar.Open, bar.High, bar.Low, bar.Close, bar.Volume,
        )
    }
    return pool.SendBatch(ctx, batch).Close()
}
```


### Days 25–28 — Performance: Numba & vectorized backtesting prep


```python
# When even vectorized NumPy isn't enough: Numba JIT compilation
from numba import njit
import numpy as np

@njit
def compute_ema(prices, span):
    """EMA requires sequential dependence -> can't fully vectorize, but Numba compiles to machine code."""
    alpha = 2 / (span + 1)
    ema = np.empty_like(prices)
    ema[0] = prices[0]
    for i in range(1, len(prices)):
        ema[i] = alpha * prices[i] + (1 - alpha) * ema[i-1]
    return ema

# First call compiles (~slow), subsequent calls are C-speed
prices = np.random.uniform(90, 110, 1_000_000)
ema = compute_ema(prices, span=20)  # ~100x faster than pure Python loop
```


### Days 29–30 — Phase 2 Project: Market Data Pipeline


**Deliverable: A production-grade data pipeline**

1. Python script that downloads daily OHLCV for 100 S&P 500 stocks, handles missing data and adjusts for splits/dividends
2. Loads into a TimescaleDB hypertable with proper indexing
3. SQL views computing: 20/50/200-day moving averages, 20-day realised volatility, daily cross-sectional return rank — all via window functions
4. Python data access layer with a clean API: `get_returns(symbols, start, end) -> pd.DataFrame`
5. Benchmark: compare loop vs vectorized vs Numba for computing rolling Sharpe ratio across 100 stocks × 5 years of data. Report the speedup.
6. Document known data quality issues found (gaps, outliers, survivorship considerations)

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Using raw** **`Close`** **price instead of** **`Adj Close`** **for return calculations.**


A stock that does a 2-for-1 split shows a 50% "crash" in raw close price that never actually happened to an investor's wealth.


**✅ Correct approach:** Always use dividend- and split-adjusted prices for return calculations. `yfinance`'s `Close` with `auto_adjust=True` (default in recent versions) or explicitly using `Adj Close` handles this. Verify by checking that a known split date doesn't show a spurious return spike.


### Mistake 2


**❌ Iterating over DataFrame rows with** **`.iterrows()`****.**


`.iterrows()` is one of the slowest operations in pandas — it boxes every value into a Python object and creates a new Series per row. On 1M rows this can take minutes.


**✅ Correct approach:** Vectorize with column operations, or use `.itertuples()` (faster but still avoid if possible), or `.apply()` only as a last resort, or Numba/Cython for genuinely sequential logic (like EMA).


### Mistake 3


**❌ Look-ahead bias in data joins.** Using `pd.merge` (not `merge_asof`) to join "current" fundamental data (earnings, P/E ratios) with historical prices — this leaks future information into the past, because the fundamental data wasn't KNOWN at that historical date (reporting lag).


**✅ Correct approach:** Always use `merge_asof` with `direction='backward'` and account for reporting lag (e.g., Q4 earnings aren't public until ~6 weeks after quarter-end). This single bug invalidates more backtests than any other data issue.


### Mistake 4


**❌ Not setting random seeds, making "reproducible" research irreproducible.**


A Monte Carlo simulation or train/test split without a fixed seed gives different results every run — impossible to debug or peer-review.


**✅ Correct approach:** `np.random.seed(42)` (or use `np.random.default_rng(42)` for the modern Generator API) at the start of every script that uses randomness. Document the seed in your research notes.


## Phase 3 — Financial Markets & Instruments
> **Core insight:** You cannot model what you don't understand. Before pricing an option or building a strategy, you need to know how the instrument actually trades, who the participants are, and what makes its price move — mechanically, not just mathematically.

---


## 📚 Topics in order


### Days 1–5 — Equity markets

- Order types: market, limit, stop, stop-limit. Time-in-force: day, GTC, IOC, FOK
- Order book mechanics: bid/ask, depth, the spread as a cost of immediacy
- Market makers vs takers — who provides liquidity and how they’re compensated (spread capture)
- Short selling: borrowing shares, short interest, squeeze dynamics, borrow cost
- Corporate actions: splits, dividends, buybacks — and their mechanical effect on price
- Indices: market-cap weighted (S&P 500) vs price-weighted (Dow) vs equal-weighted — why this changes what "the index return" means

### Days 6–10 — Fixed income

- Bond pricing: present value of cash flows, the relationship between price and yield (inverse)
- Yield to maturity (YTM), coupon rate, face value
- Duration: sensitivity of bond price to interest rate changes. Modified duration ≈ % price change per 1% yield change
- Convexity: the second-order correction to duration — why duration alone underestimates price changes for large rate moves
- The yield curve: normal, flat, inverted — and what each shape signals about market expectations
- Credit spreads: the extra yield for default risk over a risk-free benchmark

```python
import numpy as np

def bond_price(face_value, coupon_rate, ytm, years, freq=2):
    """Price a bond given its yield to maturity."""
    periods = years * freq
    coupon = face_value * coupon_rate / freq
    period_yield = ytm / freq
    cash_flows = np.full(periods, coupon)
    cash_flows[-1] += face_value
    discount_factors = (1 + period_yield) ** -np.arange(1, periods + 1)
    return np.sum(cash_flows * discount_factors)

def modified_duration(face_value, coupon_rate, ytm, years, freq=2, bump=0.0001):
    """Numerically estimate modified duration via small yield bump."""
    p0 = bond_price(face_value, coupon_rate, ytm, years, freq)
    p_up = bond_price(face_value, coupon_rate, ytm + bump, years, freq)
    p_down = bond_price(face_value, coupon_rate, ytm - bump, years, freq)
    return -(p_up - p_down) / (2 * bump * p0)

price = bond_price(1000, 0.05, 0.04, 10)
duration = modified_duration(1000, 0.05, 0.04, 10)
print(f"Bond price: ${price:.2f}, Modified duration: {duration:.2f} years")
# Interpretation: a 1% rise in yields -> approximately -duration% change in price
```


### Days 11–15 — Foreign exchange (FX)

- Currency pairs, quoting conventions (base/quote), pips
- Spot vs forward rates — interest rate parity: forward rate reflects the interest rate differential between two currencies
- Carry trade: borrow in low-yield currency, invest in high-yield currency — profitable until it isn't (crash risk)
- FX as the world's most liquid and most 24-hour market — implications for execution and overnight risk

### Days 16–22 — Derivatives: forwards, futures, swaps, options


**Forwards & Futures:**

- Forward: OTC, customised, counterparty risk. Future: exchange-traded, standardised, margined daily (marking to market)
- Futures pricing: `F = S₀ × e^((r-q)T)` for assets with continuous yield `q` (dividends, storage costs)
- Contango vs backwardation — what the futures curve shape tells you about supply/demand and cost of carry
- Margin mechanics: initial margin, maintenance margin, margin calls — leverage and liquidation risk

**Swaps:**

- Interest rate swaps: exchange fixed for floating cash flows. The core hedging instrument for rate risk.
- Swap pricing intuition: a swap is just a portfolio of forward rate agreements

**Options — the vocabulary you need before Phase 4:**

- Call vs put, strike, expiry, exercise styles (European vs American)
- Intrinsic value vs time value
- Moneyness: ITM, ATM, OTM — and how this changes as the underlying moves
- Put-call parity: `C - P = S - K·e^(-rT)` — a model-free relationship that must hold by no-arbitrage. ANY pricing model must satisfy this.
- Option payoff diagrams — build these for calls, puts, and basic spreads (bull spread, straddle)

```python
import numpy as np
import matplotlib.pyplot as plt

def call_payoff(S, K):
    return np.maximum(S - K, 0)

def put_payoff(S, K):
    return np.maximum(K - S, 0)

S = np.linspace(50, 150, 100)
K = 100

fig, axes = plt.subplots(1, 3, figsize=(15, 4))
axes[0].plot(S, call_payoff(S, K)); axes[0].set_title("Long Call")
axes[1].plot(S, put_payoff(S, K)); axes[1].set_title("Long Put")

# Straddle: long call + long put at same strike -> profits from large moves in EITHER direction
straddle = call_payoff(S, K) + put_payoff(S, K)
axes[2].plot(S, straddle); axes[2].set_title("Long Straddle")
plt.tight_layout()
plt.show()

# Verify put-call parity numerically
C, P, S0, K_, r, T = 10.45, 5.23, 100, 100, 0.05, 1
lhs = C - P
rhs = S0 - K_ * np.exp(-r * T)
print(f"C - P = {lhs:.2f}, S - K*e^(-rT) = {rhs:.2f}")
# These should be approximately equal for correctly priced options
```


### Days 23–27 — Market microstructure

- Bid-ask spread: components are order processing cost, inventory risk, and adverse selection (information asymmetry)
- Market impact: large orders move prices against you — the foundation of execution algorithms (TWAP, VWAP, implementation shortfall)
- Latency and HFT — not because you'll build HFT systems, but because understanding the speed game explains WHY certain strategies (naive arbitrage) don't work for retail/slower participants
- Liquidity: depth, resilience — why "the price" isn't a single number, it's a function of how much you want to trade
- Transaction costs in backtesting: spread cost + market impact + commission — the #1 reason backtests overstate real returns

### Days 28–30 — Phase 3 Project: Instrument Analysis Report


**Deliverable: A research note covering**

1. Pull the current yield curve (US Treasury rates across maturities). Plot it. Identify the current shape (normal/flat/inverted) and discuss what it implies about market expectations.
2. For 3 bonds with different maturities, compute price, duration, and convexity. Show how price sensitivity to a 1% rate move differs across maturities — demonstrate duration numerically with a rate shock.
3. Pull options chain data for one liquid underlying (e.g., SPY) for one expiry. Verify put-call parity holds (within bid-ask spread) for several strikes.
4. Compute the bid-ask spread as a % of price for 5 stocks of different market caps. Discuss the relationship between liquidity and spread.
5. Build payoff diagrams for: covered call, protective put, bull call spread, iron condor. Write one sentence per strategy on the market view it expresses.

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Confusing the futures price with the expected future spot price.**


The futures price `F = S₀ e^((r-q)T)` is a NO-ARBITRAGE relationship, not a forecast. It reflects the cost of carry today, not what traders expect the price to be at expiry.


**✅ Correct approach:** Understand contango/backwardation as reflecting current carry costs (storage, dividends, interest rates) and risk premia, not predictions. A market in contango isn't "predicting" higher future prices.


### Mistake 2


**❌ Ignoring transaction costs in strategy ideas.**


A strategy that captures a 0.05% mispricing is worthless if the bid-ask spread + commission costs 0.10% round-trip.


**✅ Correct approach:** ALWAYS frame the edge in terms of net-of-cost returns. For high-frequency ideas, transaction costs often dominate. For lower-frequency strategies (monthly rebalancing), costs matter less but still erode 1-3% of edge typically.


### Mistake 3


**❌ Treating duration as a precise measure for large rate moves.**


Duration is a LINEAR (first-order) approximation. For a 3% rate move, duration alone can be off by a meaningful amount — this is what convexity corrects for.


**✅ Correct approach:** For moves beyond ~50bps, use duration + convexity: `% price change ≈ -duration × Δy + 0.5 × convexity × Δy²`. For very large moves, full repricing (recompute the bond price at the new yield) is most accurate.


### Mistake 4


**❌ Backtesting options strategies using only end-of-day closing prices.**


Options are illiquid intraday for many strikes — the "price" you'd actually get filled at can be very different from the mid-price used in a naive backtest.


**✅ Correct approach:** Use bid/ask (not mid) for entry/exit in options backtests, and add a realistic slippage assumption (e.g., cross half the spread). Liquidity varies hugely by strike/expiry — a backtest profitable on ATM monthly options may be unexecutable on deep OTM weeklies.


## Phase 4 — Derivatives Pricing & Risk Models
> **Core insight:** Derivatives pricing is an exercise in no-arbitrage logic, not prediction. The Black-Scholes model doesn't predict where the stock goes — it constructs a replicating portfolio that has the SAME payoff as the option, and prices the option as the cost of that portfolio. Once you internalise this, every formula becomes intuitive rather than memorised.

---


## 📚 Topics in order


### Days 1–5 — The binomial model: pricing from first principles


**Why start here:** the binomial model derives risk-neutral pricing with nothing but algebra — no stochastic calculus required. It's the cleanest way to understand WHY risk-neutral probabilities exist and why they're NOT the real-world probabilities.


```python
import numpy as np

def binomial_option_price(S0, K, T, r, sigma, n_steps, option_type='call', american=False):
    """
    Cox-Ross-Rubinstein binomial tree option pricer.
    Demonstrates risk-neutral valuation explicitly.
    """
    dt = T / n_steps
    u = np.exp(sigma * np.sqrt(dt))   # up factor
    d = 1 / u                          # down factor
    # Risk-neutral probability -- NOT the real-world probability of an up move
    p = (np.exp(r * dt) - d) / (u - d)

    # Terminal stock prices at each node
    stock_prices = np.array([S0 * u**(n_steps - i) * d**i for i in range(n_steps + 1)])

    # Terminal option payoffs
    if option_type == 'call':
        values = np.maximum(stock_prices - K, 0)
    else:
        values = np.maximum(K - stock_prices, 0)

    # Backward induction through the tree
    for step in range(n_steps - 1, -1, -1):
        stock_prices = np.array([S0 * u**(step - i) * d**i for i in range(step + 1)])
        values = np.exp(-r * dt) * (p * values[:-1] + (1 - p) * values[1:])
        if american:
            if option_type == 'call':
                exercise = np.maximum(stock_prices - K, 0)
            else:
                exercise = np.maximum(K - stock_prices, 0)
            values = np.maximum(values, exercise)  # American: compare to early exercise

    return values[0]

price_eu = binomial_option_price(S0=100, K=100, T=1, r=0.05, sigma=0.2, n_steps=500, option_type='put', american=False)
price_us = binomial_option_price(S0=100, K=100, T=1, r=0.05, sigma=0.2, n_steps=500, option_type='put', american=True)
print(f"European put: {price_eu:.4f}")
print(f"American put: {price_us:.4f}  (always >= European, due to early exercise value)")
```


**Key insight:** the risk-neutral probability `p` is whatever value makes the EXPECTED return of the stock equal the risk-free rate. It has nothing to do with your view on whether the stock goes up or down — it's a mathematical device that makes the no-arbitrage replicating portfolio argument work.


### Days 6–12 — Black-Scholes-Merton model


**The PDE derivation (conceptual, not full proof):**

1. Assume the stock follows GBM: `dS = μS dt + σS dW`
2. Construct a portfolio: long 1 option, short `Δ` shares (delta-hedging)
3. Apply Itô's Lemma to the option price `V(S,t)`
4. Choose `Δ = ∂V/∂S` to eliminate the random term `dW` — the portfolio becomes RISKLESS
5. A riskless portfolio must earn the risk-free rate `r` — this gives the Black-Scholes PDE
6. Solve the PDE with the option's boundary condition (payoff at expiry) → the closed-form formula

```python
import numpy as np
from scipy.stats import norm

def black_scholes(S, K, T, r, sigma, option_type='call', q=0):
    """
    S: spot price, K: strike, T: time to expiry (years)
    r: risk-free rate, sigma: volatility, q: dividend yield
    """
    d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)

    if option_type == 'call':
        price = S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
    else:
        price = K*np.exp(-r*T)*norm.cdf(-d2) - S*np.exp(-q*T)*norm.cdf(-d1)
    return price

# Verify convergence: binomial tree -> Black-Scholes as n_steps -> infinity
bs_price = black_scholes(S=100, K=100, T=1, r=0.05, sigma=0.2, option_type='call')
binom_price = binomial_option_price(S0=100, K=100, T=1, r=0.05, sigma=0.2, n_steps=1000, option_type='call')
print(f"Black-Scholes: {bs_price:.6f}")
print(f"Binomial (n=1000): {binom_price:.6f}")  # should converge closely
```


**Critical assumptions and where they fail:**

- Constant volatility — reality: volatility is stochastic and exhibits a "smile"/"skew" across strikes
- Continuous trading, no transaction costs — reality: discrete hedging with costs introduces hedging error
- Lognormal price distribution — reality: fat tails, jumps (gap risk)
- No dividends (in basic form) — extended with continuous yield `q` for index options

### Days 13–20 — The Greeks: sensitivities and hedging


```python
def black_scholes_greeks(S, K, T, r, sigma, option_type='call', q=0):
    """Compute all major Greeks analytically."""
    d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    pdf_d1 = norm.pdf(d1)

    if option_type == 'call':
        delta = np.exp(-q*T) * norm.cdf(d1)
        theta = (-S*np.exp(-q*T)*pdf_d1*sigma/(2*np.sqrt(T))
                 - r*K*np.exp(-r*T)*norm.cdf(d2)
                 + q*S*np.exp(-q*T)*norm.cdf(d1)) / 365  # per calendar day
        rho = K*T*np.exp(-r*T)*norm.cdf(d2) / 100  # per 1% rate change
    else:
        delta = -np.exp(-q*T) * norm.cdf(-d1)
        theta = (-S*np.exp(-q*T)*pdf_d1*sigma/(2*np.sqrt(T))
                 + r*K*np.exp(-r*T)*norm.cdf(-d2)
                 - q*S*np.exp(-q*T)*norm.cdf(-d1)) / 365
        rho = -K*T*np.exp(-r*T)*norm.cdf(-d2) / 100

    gamma = np.exp(-q*T) * pdf_d1 / (S * sigma * np.sqrt(T))
    vega = S * np.exp(-q*T) * pdf_d1 * np.sqrt(T) / 100  # per 1% vol change

    return {'delta': delta, 'gamma': gamma, 'theta': theta, 'vega': vega, 'rho': rho}

greeks = black_scholes_greeks(S=100, K=100, T=0.25, r=0.05, sigma=0.2, option_type='call')
for k, v in greeks.items():
    print(f"{k}: {v:.4f}")
```


**What each Greek means in trading terms:**

- **Delta**: hedge ratio. Delta-neutral portfolio has zero first-order exposure to spot moves.
- **Gamma**: how fast delta changes. High gamma = your hedge ratio needs frequent rebalancing. Gamma is highest for ATM options near expiry.
- **Theta**: time decay. Option sellers collect theta; option buyers pay it. This is the "cost of insurance."
- **Vega**: sensitivity to implied volatility. Long options = long vega (benefit from vol increases).
- **Rho**: sensitivity to interest rates. Usually the smallest Greek for short-dated options.

**Delta hedging simulation — the core risk management exercise:**


```python
def simulate_delta_hedge(S0, K, T, r, sigma, n_steps, n_paths=1000):
    """Simulate the P&L of a delta-hedged short call position."""
    dt = T / n_steps
    pnl = np.zeros(n_paths)

    for path in range(n_paths):
        S = S0
        option_price_0 = black_scholes(S0, K, T, r, sigma)
        cash = option_price_0  # received premium
        shares_held = 0

        for step in range(n_steps):
            t_remaining = T - step * dt
            if t_remaining > 0:
                greeks_now = black_scholes_greeks(S, K, t_remaining, r, sigma)
                delta = greeks_now['delta']
            else:
                delta = 1.0 if S > K else 0.0

            # Rebalance hedge
            shares_to_buy = delta - shares_held
            cash -= shares_to_buy * S
            shares_held = delta

            # Simulate next price
            Z = np.random.standard_normal()
            S = S * np.exp((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z)

        # At expiry: settle option payoff, sell shares
        payoff = max(S - K, 0)
        final_value = cash + shares_held * S - payoff
        pnl[path] = final_value

    return pnl

pnl = simulate_delta_hedge(S0=100, K=100, T=0.25, r=0.05, sigma=0.2, n_steps=63)
print(f"Mean P&L: {pnl.mean():.4f} (should be ~0, hedging is theoretically costless)")
print(f"Std of P&L: {pnl.std():.4f} (hedging error from discrete rebalancing)")
# Try n_steps=10 vs n_steps=252: std decreases as you hedge more frequently
```


### Days 21–25 — Implied volatility & the volatility surface


```python
from scipy.optimize import brentq

def implied_volatility(market_price, S, K, T, r, option_type='call'):
    """Solve for the sigma that makes Black-Scholes match the market price."""
    def objective(sigma):
        return black_scholes(S, K, T, r, sigma, option_type) - market_price
    try:
        return brentq(objective, 1e-6, 5.0)
    except ValueError:
        return np.nan  # no solution found (price outside no-arbitrage bounds)

# The volatility "smile"/"skew": IV is NOT constant across strikes
# Equity index options typically show a SKEW: OTM puts have higher IV than OTM calls
# (reflects crash risk premium -- demand for downside protection)
strikes = np.array([80, 90, 95, 100, 105, 110, 120])
# Hypothetical market prices showing skew
market_prices = np.array([21.5, 13.2, 9.1, 5.6, 3.0, 1.4, 0.4])
ivs = [implied_volatility(p, S=100, K=k, T=0.25, r=0.05, option_type='call')
       for p, k in zip(market_prices, strikes)]
for k, iv in zip(strikes, ivs):
    print(f"K={k}: IV={iv:.2%}")
```


**Why the smile exists despite Black-Scholes assuming constant volatility:**

- Market prices reflect the TRUE distribution of returns (fat tails, negative skew for equities)
- Black-Scholes with constant sigma cannot capture fat tails, so the market "corrects" by using different IVs for different strikes
- The IV surface (strike × expiry) is itself a TRADEABLE OBJECT — vol traders trade the SHAPE of the surface, not just direction

### Days 26–32 — Monte Carlo methods for pricing


```python
def monte_carlo_option_price(S0, K, T, r, sigma, option_type='call', n_paths=100_000, n_steps=252):
    """Price a European option via Monte Carlo simulation."""
    dt = T / n_steps
    Z = np.random.standard_normal((n_paths, n_steps))
    log_returns = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
    log_paths = np.log(S0) + np.cumsum(log_returns, axis=1)
    S_T = np.exp(log_paths[:, -1])

    if option_type == 'call':
        payoffs = np.maximum(S_T - K, 0)
    else:
        payoffs = np.maximum(K - S_T, 0)

    price = np.exp(-r*T) * payoffs.mean()
    std_error = np.exp(-r*T) * payoffs.std() / np.sqrt(n_paths)
    return price, std_error

price, se = monte_carlo_option_price(S0=100, K=100, T=1, r=0.05, sigma=0.2, n_paths=500_000)
bs = black_scholes(100, 100, 1, 0.05, 0.2)
print(f"Monte Carlo: {price:.4f} +/- {1.96*se:.4f} (95% CI)")
print(f"Black-Scholes: {bs:.4f}")

# Variance reduction: antithetic variates -- halves the variance for free
def monte_carlo_antithetic(S0, K, T, r, sigma, n_paths=100_000):
    Z = np.random.standard_normal(n_paths // 2)
    Z_anti = np.concatenate([Z, -Z])  # antithetic pairs
    S_T = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_anti)
    payoffs = np.maximum(S_T - K, 0)
    return np.exp(-r*T) * payoffs.mean()
```


**Why Monte Carlo matters beyond vanilla options:**

- Path-dependent options (Asian, barrier, lookback) have no closed-form solution — MC is often the only practical method
- Multi-asset derivatives (basket options) — use Cholesky decomposition (Phase 1) to simulate correlated paths
- Counterparty risk / CVA calculations in large banks rely heavily on MC

### Days 33–40 — Value at Risk (VaR) and risk measures


```python
import numpy as np
import pandas as pd

def historical_var(returns, confidence=0.95):
    """Historical VaR: empirical quantile of historical returns."""
    return -np.percentile(returns, (1 - confidence) * 100)

def parametric_var(returns, confidence=0.95):
    """Parametric (variance-covariance) VaR: assumes normal returns."""
    mu, sigma = returns.mean(), returns.std()
    z = norm.ppf(1 - confidence)
    return -(mu + z * sigma)

def monte_carlo_var(returns, confidence=0.95, n_sims=10_000):
    """Monte Carlo VaR: simulate from fitted distribution."""
    mu, sigma = returns.mean(), returns.std()
    simulated = np.random.normal(mu, sigma, n_sims)
    return -np.percentile(simulated, (1 - confidence) * 100)

def expected_shortfall(returns, confidence=0.95):
    """Expected Shortfall (CVaR): average loss BEYOND the VaR threshold.
    Coherent risk measure -- satisfies subadditivity, unlike VaR."""
    var = historical_var(returns, confidence)
    tail_losses = returns[returns <= -var]
    return -tail_losses.mean()

# Compare methods on real data with fat tails
np.random.seed(1)
fat_tailed_returns = np.random.standard_t(df=4, size=2500) * 0.01

print(f"Historical VaR (95%): {historical_var(fat_tailed_returns):.4f}")
print(f"Parametric VaR (95%): {parametric_var(fat_tailed_returns):.4f}")
print(f"Expected Shortfall (95%): {expected_shortfall(fat_tailed_returns):.4f}")
# Parametric VaR UNDERESTIMATES risk for fat-tailed distributions
# ES is always >= VaR at the same confidence level
```


**Backtesting VaR models (Kupiec test intuition):**

- If your 95% VaR is correctly calibrated, losses should exceed VaR roughly 5% of the time
- Count VaR breaches over a historical period — if breaches cluster (many in 2008, 2020) rather than spreading uniformly, your model fails to capture volatility clustering

---


## 🔨 Phase 4 Project: Options Pricing & Risk Engine


**Deliverable: A Python library + notebook**

1. Implement: binomial tree (European + American), Black-Scholes (with all Greeks), Monte Carlo pricer (with antithetic variates)
2. Validate: show binomial converges to Black-Scholes as steps increase; show Monte Carlo matches Black-Scholes within confidence interval
3. Pull a real options chain (e.g., SPY). Back out implied volatilities for all strikes at one expiry. Plot the volatility smile/skew.
4. Implement delta-hedging simulation. Show empirically that hedging P&L variance decreases with rebalancing frequency, but transaction costs increase — find the "optimal" rebalancing frequency for a hypothetical cost assumption
5. Build a VaR engine: historical, parametric, and Monte Carlo VaR + Expected Shortfall for a multi-asset portfolio (use the covariance matrix from Phase 1)
6. Backtest your VaR model on 2 years of real portfolio returns: count breaches, comment on whether the 95% VaR was breached ~5% of the time

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Treating implied volatility as a forecast of future volatility.**


IV is the market's CURRENT price-implied volatility — it's forward-looking in the sense of being embedded in current prices, but it's not a statistically optimal forecast. IV tends to overstate realized volatility on average (the "volatility risk premium") because option sellers demand compensation for tail risk.


**✅ Correct approach:** Distinguish "implied vol" (market price-derived) from "realized vol" (historical, backward-looking) from "forecast vol" (your model's prediction). The spread between IV and realized vol is itself a tradeable signal (variance risk premium strategies).


### Mistake 2


**❌ Using a single VaR number without understanding its tail behaviour.**


VaR tells you the loss threshold at a confidence level but says NOTHING about how bad losses are BEYOND that threshold. Two portfolios can have identical 95% VaR but vastly different tail risk.


**✅ Correct approach:** Always report Expected Shortfall (CVaR) alongside VaR. ES answers "given that we're in the bad 5% scenario, how bad is it on average?" — this is the question that actually matters for solvency.


### Mistake 3


**❌ Assuming delta-hedging eliminates all risk.**


Delta-hedging eliminates first-order (linear) risk. Gamma risk remains — large moves between rebalancing periods cause hedging error. This error is the SOURCE of the "volatility risk premium" that option sellers try to capture.


**✅ Correct approach:** Understand the relationship: a delta-hedged short option position's P&L is approximately `-0.5 × Gamma × (realized move)² + Theta collected`. You profit if realized volatility < implied volatility (what you sold the option at), and lose if realized > implied. This is THE central relationship in options market making.


### Mistake 4


**❌ Pricing American options with the European Black-Scholes formula.**


American options have early exercise value (always ≥ European). For dividend-paying stocks or puts, this difference can be significant.


**✅ Correct approach:** Use binomial/trinomial trees, finite difference methods, or Least-Squares Monte Carlo (Longstaff-Schwartz) for American-style options. Never apply the closed-form Black-Scholes formula to American options directly — it systematically underprices them.


## Phase 5 — Quant Strategies, ML & Backtesting
> **Core insight:** A profitable backtest is the EASIEST thing in quant finance to produce — and the LEAST meaningful, by default. This phase is about the discipline of going from "this looks like it works" to "this is robust enough to risk real capital on" — factor models, ML done correctly for finance, and a backtesting engine that doesn't lie to you.

---


## 📚 Topics in order


### Days 1–6 — Factor models


**The Capital Asset Pricing Model (CAPM) — the starting point:**


`E[R_i] - R_f = β_i (E[R_m] - R_f)` — a stock's expected excess return is proportional to its sensitivity (beta) to the market


**Fama-French factors — CAPM was incomplete:**

- **Market (MKT)**: the original CAPM factor
- **Size (SMB — Small Minus Big)**: small-cap stocks have historically outperformed large-cap, after adjusting for market beta
- **Value (HML — High Minus Low)**: cheap stocks (high book-to-market) outperform expensive ones
- **Momentum (UMD)**: stocks that have gone up recently tend to keep going up (short-term)
- **Quality, Low-volatility**: more recently identified factors

```python
import pandas as pd
import statsmodels.api as sm

# Fama-French factor regression: decompose a stock's returns into factor exposures
# (Factor data available from Kenneth French's data library)
stock_returns = pd.Series(...)  # your stock's excess returns
factors = pd.DataFrame({
    'MKT': ..., 'SMB': ..., 'HML': ..., 'UMD': ...
})

X = sm.add_constant(factors)
model = sm.OLS(stock_returns, X).fit()
print(model.params)
# alpha (const): return NOT explained by factor exposures -- this is what active managers claim to add
# betas: how much exposure the stock has to each factor
print(f"Alpha (annualized): {model.params['const'] * 252:.2%}")
print(f"R-squared: {model.rsquared:.2%}")  # how much of the variance factors explain
```


**Why factor models matter for strategy research:**

- Before claiming you found "alpha," check if your strategy's returns are just a repackaged factor exposure (e.g., a "stock-picking" strategy that's secretly just long small-caps)
- Factor models are the basis of risk attribution: decompose portfolio risk into factor risk + idiosyncratic risk

### Days 7–14 — Statistical arbitrage & pairs trading


**Cointegration-based pairs trading:**


```python
from statsmodels.tsa.stattools import coint
import numpy as np

def find_cointegrated_pairs(price_df, significance=0.05):
    """Test all pairs for cointegration."""
    n = price_df.shape[1]
    pairs = []
    for i in range(n):
        for j in range(i+1, n):
            asset1, asset2 = price_df.columns[i], price_df.columns[j]
            score, pvalue, _ = coint(price_df[asset1], price_df[asset2])
            if pvalue < significance:
                pairs.append((asset1, asset2, pvalue))
    return sorted(pairs, key=lambda x: x[2])

# Pairs trading signal: z-score of the spread
def pairs_trading_signal(price1, price2, lookback=60, entry_z=2.0, exit_z=0.5):
    """
    Generate long/short signals based on the spread's z-score.
    Spread = price1 - hedge_ratio * price2 (hedge ratio from rolling OLS)
    """
    spread = price1 - price2  # simplified; in practice use rolling OLS hedge ratio
    rolling_mean = spread.rolling(lookback).mean()
    rolling_std = spread.rolling(lookback).std()
    z_score = (spread - rolling_mean) / rolling_std

    signal = pd.Series(0, index=spread.index)
    signal[z_score > entry_z] = -1   # spread too wide: short asset1, long asset2
    signal[z_score < -entry_z] = 1   # spread too narrow: long asset1, short asset2
    signal[z_score.abs() < exit_z] = 0  # close position
    return signal.replace(to_replace=0, method='ffill').fillna(0)  # hold position until exit
```


**Why this works (when it does):** if two assets are economically linked (same sector, ETF and its components, dual-listed shares), their price relationship should mean-revert. Temporary divergences create trading opportunities. **Why it breaks:** the relationship can permanently change (one company gets acquired, sector dynamics shift) — "cointegration breakdown" is the main risk.


### Days 15–22 — Machine learning in finance — done correctly


**The fundamental problem: financial data violates ML's core assumptions**

- Standard ML assumes i.i.d. data. Financial returns are autocorrelated, non-stationary, and have regime changes.
- Standard train/test splits LEAK information through overlapping labels (e.g., a 5-day-forward return label computed for day T uses data through T+5 — if T+3 is in the training set and T+5 in test, there's leakage)

```python
from sklearn.model_selection import TimeSeriesSplit
import numpy as np

# WRONG: random train/test split shuffles time -- catastrophic look-ahead bias
# from sklearn.model_selection import train_test_split
# X_train, X_test, y_train, y_test = train_test_split(X, y, shuffle=True)  # NEVER DO THIS

# CORRECT: time series split -- train always precedes test
tscv = TimeSeriesSplit(n_splits=5)
for train_idx, test_idx in tscv.split(X):
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
    # train and evaluate model here

# BETTER for overlapping labels: purged k-fold cross-validation (Lopez de Prado)
# Removes training samples whose label periods OVERLAP with the test period
def purged_train_test_split(X, y, label_horizon, test_start, test_end):
    """Remove training samples whose label window overlaps with test period."""
    test_mask = (X.index >= test_start) & (X.index <= test_end)
    purge_start = test_start - pd.Timedelta(days=label_horizon)
    train_mask = (X.index < purge_start) | (X.index > test_end)
    return X[train_mask], X[test_mask], y[train_mask], y[test_mask]
```


**Feature engineering for financial ML — fractional differentiation:**


```python
# Problem: raw prices are non-stationary (bad for ML), but full differencing (returns)
# destroys ALL memory/predictive structure.
# Fractional differentiation: achieve stationarity while preserving maximum memory

def frac_diff(series, d, threshold=1e-4):
    """Fractionally differentiate a series (Lopez de Prado method)."""
    weights = [1.0]
    for k in range(1, len(series)):
        w = -weights[-1] / k * (d - k + 1)
        if abs(w) < threshold:
            break
        weights.append(w)
    weights = np.array(weights[::-1])

    result = pd.Series(index=series.index, dtype=float)
    width = len(weights)
    for i in range(width, len(series)):
        result.iloc[i] = np.dot(weights, series.iloc[i-width:i])
    return result.dropna()
```


**Model choices and their financial-specific risks:**

- Linear models (Ridge/Lasso): interpretable, less prone to overfitting on noisy financial data. Often a strong baseline.
- Tree-based (Random Forest, XGBoost, LightGBM): handle non-linearity and interactions, but VERY prone to overfitting on financial data with low signal-to-noise. Need strong regularization and careful CV.
- Neural networks: require large amounts of data; financial time series are relatively short (a few thousand daily observations) — high overfitting risk unless carefully regularized

### Days 23–30 — Building an event-driven backtesting engine


**Why vectorized backtests can be misleading:**


A vectorized backtest (apply signal to entire return series at once) implicitly assumes:

- Perfect, instant execution at the close price you're computing signals from (look-ahead bias if not careful)
- No capacity constraints, no market impact
- Often ignores realistic position sizing, cash management

An event-driven backtester processes data bar-by-bar, simulating what would ACTUALLY happen:


```python
class EventDrivenBacktester:
    """
    Simplified event-driven backtester.
    Processes one bar at a time: signal -> order -> fill -> portfolio update
    """
    def __init__(self, initial_capital=100_000, commission=0.001, slippage=0.0005):
        self.cash = initial_capital
        self.positions = {}  # symbol -> shares
        self.commission = commission
        self.slippage = slippage
        self.equity_curve = []
        self.trades = []

    def execute_order(self, symbol, target_shares, price, timestamp):
        """Execute a trade with realistic costs."""
        current_shares = self.positions.get(symbol, 0)
        shares_to_trade = target_shares - current_shares
        if shares_to_trade == 0:
            return

        # Apply slippage: buys execute at higher price, sells at lower
        execution_price = price * (1 + self.slippage * np.sign(shares_to_trade))
        trade_value = abs(shares_to_trade) * execution_price
        commission_cost = trade_value * self.commission

        self.cash -= shares_to_trade * execution_price + commission_cost
        self.positions[symbol] = target_shares

        self.trades.append({
            'timestamp': timestamp, 'symbol': symbol,
            'shares': shares_to_trade, 'price': execution_price,
            'commission': commission_cost
        })

    def mark_to_market(self, prices: dict, timestamp):
        """Compute total equity given current prices."""
        position_value = sum(
            shares * prices.get(sym, 0)
            for sym, shares in self.positions.items()
        )
        equity = self.cash + position_value
        self.equity_curve.append({'timestamp': timestamp, 'equity': equity})
        return equity

    def run(self, data: pd.DataFrame, strategy_fn):
        """
        data: DataFrame with MultiIndex (timestamp, symbol) and OHLCV columns
        strategy_fn(history, current_positions) -> dict of {symbol: target_shares}
        """
        for timestamp in data.index.get_level_values(0).unique():
            bar = data.loc[timestamp]
            history = data.loc[:timestamp]  # only data UP TO now -- prevents look-ahead

            target_positions = strategy_fn(history, self.positions)

            for symbol, target in target_positions.items():
                if symbol in bar.index:
                    self.execute_order(symbol, target, bar.loc[symbol, 'close'], timestamp)

            prices = {sym: bar.loc[sym, 'close'] for sym in bar.index}
            self.mark_to_market(prices, timestamp)

        return pd.DataFrame(self.equity_curve).set_index('timestamp')
```


### Days 31–36 — Performance metrics & strategy evaluation


```python
def strategy_performance_report(equity_curve: pd.Series, risk_free_rate=0.02):
    """Compute standard performance metrics from an equity curve."""
    returns = equity_curve.pct_change().dropna()
    n_years = len(returns) / 252

    total_return = equity_curve.iloc[-1] / equity_curve.iloc[0] - 1
    cagr = (1 + total_return) ** (1/n_years) - 1
    annual_vol = returns.std() * np.sqrt(252)
    sharpe = (returns.mean() * 252 - risk_free_rate) / annual_vol

    # Sortino: like Sharpe but only penalizes downside volatility
    downside_returns = returns[returns < 0]
    downside_vol = downside_returns.std() * np.sqrt(252)
    sortino = (returns.mean() * 252 - risk_free_rate) / downside_vol

    # Maximum drawdown
    cumulative = (1 + returns).cumprod()
    running_max = cumulative.cummax()
    drawdown = (cumulative - running_max) / running_max
    max_drawdown = drawdown.min()

    # Calmar ratio: CAGR / |max drawdown|
    calmar = cagr / abs(max_drawdown)

    return {
        'CAGR': f"{cagr:.2%}",
        'Annual Volatility': f"{annual_vol:.2%}",
        'Sharpe Ratio': f"{sharpe:.2f}",
        'Sortino Ratio': f"{sortino:.2f}",
        'Max Drawdown': f"{max_drawdown:.2%}",
        'Calmar Ratio': f"{calmar:.2f}",
        'Win Rate': f"{(returns > 0).mean():.2%}"
    }
```


**The overfitting check — Deflated Sharpe Ratio:**

- If you tested 100 strategy variations and picked the best Sharpe ratio, that Sharpe is INFLATED by multiple-testing bias
- Deflated Sharpe Ratio (DSR) adjusts the observed Sharpe for the number of trials, sample length, and skew/kurtosis of returns
- Rule of thumb: an in-sample Sharpe of 2.0 from testing 50 parameter combinations might have a DSR close to 0 — i.e., not statistically distinguishable from luck

### Days 37–40 — Walk-forward optimization & out-of-sample validation


```python
def walk_forward_backtest(data, strategy_class, param_grid, train_window=252*2, test_window=63):
    """
    Walk-forward optimization:
    1. Optimize parameters on a training window
    2. Test (out-of-sample) on the following window
    3. Roll forward, repeat
    This simulates how a strategy would ACTUALLY be deployed and re-tuned over time.
    """
    results = []
    start = 0
    while start + train_window + test_window <= len(data):
        train_data = data.iloc[start : start + train_window]
        test_data = data.iloc[start + train_window : start + train_window + test_window]

        # Find best params on training data ONLY
        best_params, best_sharpe = None, -np.inf
        for params in param_grid:
            strategy = strategy_class(**params)
            train_equity = strategy.backtest(train_data)
            sharpe = strategy_performance_report(train_equity)['Sharpe Ratio']
            if float(sharpe) > best_sharpe:
                best_sharpe, best_params = float(sharpe), params

        # Apply best params to UNSEEN test data
        strategy = strategy_class(**best_params)
        test_equity = strategy.backtest(test_data)
        results.append({
            'period_start': test_data.index[0],
            'params': best_params,
            'oos_performance': strategy_performance_report(test_equity)
        })

        start += test_window  # roll forward

    return results
```


---


## 🔨 Phase 5 Project: Full Strategy Research Pipeline


**Deliverable: A complete, rigorously tested strategy**

1. Choose a strategy idea (momentum, mean-reversion, pairs trading, or a simple ML-based signal)
2. Run Fama-French factor regression on the strategy's returns — confirm the strategy isn't just a repackaged factor exposure (or explicitly note that it is, and discuss)
3. Implement the strategy in your event-driven backtester with realistic transaction costs (commission + slippage)
4. Compute full performance report: CAGR, Sharpe, Sortino, max drawdown, Calmar
5. Run walk-forward optimization — compare in-sample vs out-of-sample Sharpe. Discuss the degradation (there WILL be degradation — the question is how much)
6. If using ML: use purged time-series CV, report feature importances, and discuss what economic story (if any) explains why the features should be predictive
7. Compute an approximate Deflated Sharpe Ratio given the number of parameter combinations tested
8. Write a 2-page "investment memo": strategy thesis, backtest results (in-sample AND out-of-sample), risk factors, capacity constraints (how much capital could this strategy absorb before market impact destroys the edge?), and your honest assessment of whether you'd risk real capital on it

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Survivorship bias in the stock universe.**


Backtesting a strategy using TODAY's S&P 500 constituents over the last 20 years means every "stock" in your backtest SURVIVED to be in the index today. Companies that went bankrupt or were delisted are invisible — systematically inflating historical returns.


**✅ Correct approach:** Use point-in-time index membership data if available. At minimum, acknowledge this bias explicitly and understand it likely inflates your results, especially for strategies that would have been exposed to since-delisted companies (small-caps, distressed stocks).


### Mistake 2


**❌ "Backtest until it works" — iterating on the SAME out-of-sample data.**


If you tweak parameters, check performance on your "test" set, tweak again, check again — your test set has effectively become part of your training process. This is the single most common cause of strategies that work in backtest and fail live.


**✅ Correct approach:** Use walk-forward validation with a TRUE holdout period you only look at ONCE, at the very end. Treat your research process like a pre-registered experiment: decide your methodology BEFORE looking at the final out-of-sample results.


### Mistake 3


**❌ Ignoring capacity and market impact when reporting returns.**


A mean-reversion strategy on micro-cap stocks might show a 50% backtested Sharpe-3 return — on paper trades of $10M each. In reality, a $10M order in an illiquid micro-cap would move the price 10%+ against you, destroying the edge.


**✅ Correct approach:** Always sanity-check: what % of average daily volume does your strategy's typical trade represent? Strategies that look amazing on paper often have capacity of a few million dollars — fine for an individual, meaningless for a fund, and the backtest doesn't reflect this unless you explicitly model market impact.


### Mistake 4


**❌ Treating a high Sharpe ratio as the only thing that matters.**


A strategy with Sharpe 1.5 but a 60% maximum drawdown and a single anomalous month driving 80% of returns is fragile in ways Sharpe alone doesn't show.


**✅ Correct approach:** Always examine: the equity curve visually (does performance come from one lucky period?), drawdown duration (how long underwater?), the distribution of trade P&Ls (is it driven by a few huge wins or consistent small ones?), and performance across different market regimes (bull, bear, high-vol, low-vol).


---


## 🏆 You've completed the Quant Analyst roadmap


**After this roadmap you can:**

- Derive and implement option pricing models from first principles, not just call library functions
- Compute and interpret Greeks for risk management and hedging
- Build a covariance-matrix-based risk framework with VaR and Expected Shortfall
- Run factor regressions to decompose strategy returns into systematic exposures
- Build an event-driven backtester with realistic transaction costs
- Apply ML to financial data WITHOUT the look-ahead and overfitting traps that invalidate most amateur quant research
- Critically evaluate a strategy's robustness, not just its headline Sharpe ratio

**What's next:**

- Study market microstructure and execution algorithms in depth (TWAP/VWAP/POV, optimal execution theory)
- Explore options market making and volatility arbitrage strategies in depth
- Read original papers: Fama-French, Lopez de Prado's "Advances in Financial Machine Learning," and seminal papers on your strategy area of interest
- Paper trade your Phase 5 strategy with a live (but small/simulated) account to compare live performance to backtest — the ultimate test
