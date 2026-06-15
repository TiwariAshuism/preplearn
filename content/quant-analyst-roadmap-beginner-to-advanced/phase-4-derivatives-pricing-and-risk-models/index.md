---
source: notion
title: "Phase 4 — Derivatives Pricing & Risk Models"
slug: "phase-4-derivatives-pricing-and-risk-models"
notionId: "37eda883-bddd-8150-9bce-c051f3431d4c"
notionRootId: "37dda883bddd812c8b27d0594933ab2b"
parent: "quant-analyst-roadmap-beginner-to-advanced"
children: []
order: 1
icon: "⚖️"
cover: null
---
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

