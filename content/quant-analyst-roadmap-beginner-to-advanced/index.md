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