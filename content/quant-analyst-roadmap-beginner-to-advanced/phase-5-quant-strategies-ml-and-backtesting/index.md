---
source: notion
title: "Phase 5 — Quant Strategies, ML & Backtesting"
slug: "phase-5-quant-strategies-ml-and-backtesting"
notionId: "37eda883-bddd-8133-865b-e20f39da48d0"
notionRootId: "37dda883bddd812c8b27d0594933ab2b"
parent: "quant-analyst-roadmap-beginner-to-advanced"
children: []
order: 0
icon: "🤖"
cover: null
---
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
