---
source: notion
title: "Phase 3 — Financial Markets & Instruments"
slug: "phase-3-financial-markets-and-instruments"
notionId: "37dda883-bddd-81ad-bc5b-f8a377e2d5a0"
notionRootId: "37dda883bddd812c8b27d0594933ab2b"
parent: "quant-analyst-roadmap-beginner-to-advanced"
children: []
order: 2
icon: "🏦"
cover: null
---
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

