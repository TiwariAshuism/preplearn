---
source: notion
title: "Phase 2 — Programming & Data Infrastructure"
slug: "phase-2-programming-and-data-infrastructure"
notionId: "37dda883-bddd-81c1-a5b2-c31a95b077c0"
notionRootId: "37dda883bddd812c8b27d0594933ab2b"
parent: "quant-analyst-roadmap-beginner-to-advanced"
children: []
order: 3
icon: "💻"
cover: null
---
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

