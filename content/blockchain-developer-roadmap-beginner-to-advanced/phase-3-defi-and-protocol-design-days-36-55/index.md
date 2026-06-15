---
source: notion
title: "Phase 3 — DeFi & Protocol Design (Days 36–55)"
slug: "phase-3-defi-and-protocol-design-days-36-55"
notionId: "362da883-bddd-81ac-acfc-f10b01573b52"
notionRootId: "362da883bddd81cd8c6fd78fe5fec86f"
parent: "blockchain-developer-roadmap-beginner-to-advanced"
children: []
order: 2
icon: "🏦"
cover: null
---
> **Core insight:** DeFi is not just finance on a blockchain. It is a new class of financial system where the rules are code, the enforcement is cryptographic, and the participants include both humans and adversarial smart contracts with flash loans and MEV bots. Designing correct DeFi protocols requires simultaneously thinking like an economist, a cryptographer, and an attacker.

---


## 📚 Topics in order


### Day 36–38 — Automated Market Makers (AMMs)


**The problem AMMs solve:** traditional order books require market makers and matching engines. In a fully on-chain system, this is too expensive and slow. AMMs replace the order book with a mathematical invariant.


**Uniswap v2 — constant product formula:**


```javascript
x * y = k
```

- `x` = reserve of token A, `y` = reserve of token B, `k` = constant
- When you trade token A for token B: `(x + Δx) * (y - Δy) = k`
- Solving: `Δy = y * Δx / (x + Δx)`
- Price of A in terms of B: `y/x` (instantaneous). Changes continuously with each trade.
- Liquidity providers (LPs): deposit both tokens in equal value. Receive LP tokens representing their share.
- LP fee: 0.3% on every swap. Accrues to the pool, proportional to LP share.
- Impermanent loss: the loss LPs incur vs simply holding when prices diverge. Permanent when LPs withdraw.

**Price impact and slippage:**

- Large trades move the price significantly (high price impact)
- Slippage: difference between expected price and execution price
- `amountOutMinimum` parameter: transaction reverts if output < minimum. Protects against frontrunning.

**Uniswap v3 innovations:**

- Concentrated liquidity: LPs choose a price range `[pa, pb]`. Capital only earns fees when price is in range.
- Multiple fee tiers: 0.01%, 0.05%, 0.3%, 1% (for different volatility profiles)
- Non-fungible LP positions (ERC-721 instead of ERC-20 LP tokens)
- Virtual reserves: price math uses `L` (liquidity) and `sqrt(P)` (square root price). More complex but capital efficient.
- Tick system: price space divided into discrete ticks. Liquidity transitions at tick boundaries.

**Key Uniswap v2 code to study:**


```solidity
// The core swap math:
function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
    internal pure returns (uint amountOut) {
    uint amountInWithFee = amountIn * 997;  // 0.3% fee
    uint numerator = amountInWithFee * reserveOut;
    uint denominator = reserveIn * 1000 + amountInWithFee;
    amountOut = numerator / denominator;
}

// Flash swaps: receive tokens, do anything, return tokens + fee in same tx
function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external;
```


### Day 39–40 — Lending protocols


**Compound / Aave model:**

- Deposit assets → earn interest (supply APY)
- Borrow assets → pay interest (borrow APY). Must be overcollateralised.
- Collateral factor: how much you can borrow against deposited collateral. ETH CF = 80% means $100 ETH lets you borrow $80 of other assets.
- Health factor: `(collateral value * CF) / borrow value`. If health factor < 1 → liquidation.

**Interest rate models:**

- Utilisation rate: `borrows / (borrows + supply)`. As utilisation rises, interest rates rise.
- Jump rate model: low base rate below kink, steep rise above kink. Incentivises repayment when utilisation is high.

**Liquidation mechanism:**


```javascript
Health factor drops below 1:
→ Anyone can call liquidate(borrower, debtToken, collateralToken)
→ Liquidator repays up to 50% of borrower's debt
→ Liquidator receives collateral worth repaid debt + liquidation bonus (5-15%)
→ Borrower's position is partially or fully closed
→ Liquidation is profitable for liquidators = protocol always solvable
```


**Flash loans:**

- Borrow any amount with zero collateral, use it, repay in same transaction
- If repayment fails → entire transaction reverts (no loss to protocol)
- Gas cost: one transaction. Fee: 0.05-0.09% (Aave), zero (dYdX)
- Legitimate uses: arbitrage, collateral swaps, self-liquidation
- Attack uses: flash loan price manipulation, governance attacks

**cToken / aToken mechanics:**


```solidity
// Compound cTokens: interest-bearing tokens
// exchangeRate increases over time as interest accrues
// balanceOf(user) in underlying = cTokenBalance * exchangeRate / 1e18

function exchangeRateCurrent() public returns (uint) {
    return (totalCash + totalBorrows - totalReserves) * 1e18 / totalSupply;
}
```


### Day 41–42 — Oracles


**The oracle problem:** smart contracts cannot access off-chain data. But DeFi needs asset prices. How do you bring prices on-chain trustlessly?


**Chainlink price feeds:**

- Decentralised oracle network. Multiple independent nodes report prices.
- Aggregator contracts: median of node responses. Heartbeat update + deviation threshold.
- Interface:

```solidity
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,        // price * 10^decimals
        uint256 startedAt,
        uint256 updatedAt,    // timestamp of last update
        uint80 answeredInRound
    );
}

// ALWAYS check for stale prices:
(, int256 price, , uint256 updatedAt,) = oracle.latestRoundData();
require(updatedAt >= block.timestamp - MAX_DELAY, "Stale price");
require(price > 0, "Invalid price");
```


**TWAP (Time-Weighted Average Price) oracles:**

- Uniswap v2/v3 TWAP: average price over a time window
- Resistant to single-block manipulation (requires sustained capital over multiple blocks)
- v2: `priceCumulative` accumulators. Difference / time = TWAP.
- v3: `observe()` function. Returns tick cumulatives for any time window.
- Trade-off: resistant to manipulation but lags real price. Not suitable for fast-moving markets.

**Oracle manipulation attacks:**

- Spot price manipulation: take a flash loan, dump tokens in a pool to move price, exploit a protocol using that spot price as an oracle, repay loan. All in one transaction.
- Never use spot prices from a DEX as an oracle without TWAPs or multiple sources.
- Real attacks: Mango Markets ($114M), Cream Finance ($130M), Synthetix (sETH depeg), bZx ($1M)

### Day 43—44 — Stablecoins and tokenomics


**Stablecoin designs:**


**Fiat-backed (USDC, USDT):**

- 1:1 backed by USD held by a custodian
- Trust: you trust the issuer holds the reserves
- Censorship: issuer can blacklist addresses (USDC has done this)

**Crypto-collateralised (DAI, MakerDAO):**

- Backed by ETH and other crypto (overcollateralised)
- Collateralisation ratio: 150%+ of collateral for 100% DAI
- Stability fee (interest) controls supply
- Liquidation if collateral drops too far
- Decentralised but complex. Vulnerable to correlated collateral crashes.

**Algorithmic (UST, Frax):**

- Uses a sister token (LUNA) or fractional reserves to maintain the peg
- UST/LUNA: death spiral. Depeg → LUNA minted to restore peg → LUNA inflation → further depeg. Lost $40B in a week.
- Pure algorithmic stablecoins have mostly failed. Hybrid (Frax) more stable.

**Tokenomics fundamentals:**

- Emission schedule: fixed supply (BTC) vs inflationary (ETH slightly, many DeFi tokens heavily)
- Vesting: team/investor tokens locked and released over time. Prevents immediate dumping.
- Utility: what creates demand for the token? Governance, fee capture, staking rewards, access.
- veTokenomics (Curve model): lock CRV for veCRV → voting power + boosted rewards. Incentivises long-term alignment.
- Token distribution: 70%+ to community is good. 30%+ to team/investors → centralisation risk.

### Day 45—46 — Governance and DAOs


**On-chain governance:**

- Governor Bravo / OpenZeppelin Governor: propose → voting period → timelock → execute
- Proposal threshold: minimum tokens to create a proposal (prevents spam)
- Quorum: minimum votes needed for a proposal to pass
- Voting delay: blocks between proposal creation and voting start (allows token holders to acquire tokens)
- Timelock: mandatory delay between vote passing and execution (gives users time to exit)

**Governance attack vectors:**

- Flash loan governance attack: borrow enough tokens to pass a proposal in one block. Mitigated by: snapshot voting (token balance at proposal block), voting delay.
- Sybil attacks: many wallets, one controller
- Voter apathy: low participation lets small groups control outcomes
- Real attack: Beanstalk ($182M) — attacker used flash loan to pass a malicious proposal that drained the treasury in one transaction (no timelock)

### Day 47—50 — Protocol design patterns


**Factory pattern:**


```solidity
// Deploy many instances of the same contract
// Uniswap v2: UniswapV2Factory creates UniswapV2Pair contracts
contract PairFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair);

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "Identical addresses");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(getPair[token0][token1] == address(0), "Pair exists");
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly { pair := create2(0, add(bytecode, 32), mload(bytecode), salt) }
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair);
    }
}
```


**Router pattern:** thin contracts that orchestrate calls to core contracts. Do not hold state. Manage slippage + deadlines. Uniswap router wraps UniswapV2Pair calls.


**Vault / 4626 pattern:**


```solidity
// ERC-4626: standard for yield-bearing vaults
// shares represent proportional ownership of assets
function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
    shares = previewDeposit(assets);  // assets * totalShares / totalAssets
    asset.safeTransferFrom(msg.sender, address(this), assets);
    _mint(receiver, shares);
    emit Deposit(msg.sender, receiver, assets, shares);
}

function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares) {
    shares = previewWithdraw(assets);
    _burn(owner, shares);
    asset.safeTransfer(receiver, assets);
    emit Withdraw(msg.sender, receiver, owner, assets, shares);
}
```


**Commit-reveal scheme:**

- Prevents frontrunning in auctions, games, governance
- Phase 1 (commit): submit `keccak256(secret + salt)`. Value hidden.
- Phase 2 (reveal): submit `secret + salt`. Contract verifies hash matches. Uses value.

### Day 51–55 — Study real protocols


**Day 51: Uniswap v2 deep dive**

- Read every line of `UniswapV2Pair.sol` and `UniswapV2Router02.sol`
- Understand: mint/burn LP tokens, swap math, flash swaps, TWAP accumulator
- Fork on Foundry mainnet fork. Execute a swap. Trace with `-vvvv`.

**Day 52: Compound v2 deep dive**

- Read `CToken.sol`, `Comptroller.sol`, `JumpRateModel.sol`
- Understand: cToken exchange rate, borrow index, liquidation math, interest accrual
- Fork mainnet. Supply USDC, borrow ETH. Check health factor.

**Day 53: Curve stableswap**

- StableSwap invariant: hybrid between constant sum and constant product
- `A` parameter: controls how flat the bonding curve is near the peg
- Used for stablecoin-to-stablecoin swaps (much less slippage than Uniswap)
- veTokenomics: Curve Wars, gauge voting, bribe markets

**Day 54: Aave v3 deep dive**

- Read: `Pool.sol`, `LiquidationLogic.sol`, `InterestRateStrategy.sol`
- New features vs Aave v2: portals (cross-chain liquidity), efficiency mode (higher LTV for correlated assets), isolation mode

**Day 55: Fork and modify Uniswap v2**

- Clone the repo. Add a protocol fee switch. Add a whitelist for LPs.
- Deploy the modified version to Anvil. Write tests proving the modifications work correctly.

---


## 🔨 Projects


### Project 1 — AMM from scratch


**Deliverable:** A constant product AMM in Solidity with: `addLiquidity`, `removeLiquidity`, `swapExactTokensForTokens`, `swapTokensForExactTokens`. LP tokens as ERC-20. 0.3% fee. TWAP oracle accumulator. Full test suite with: edge cases (zero liquidity, single-sided drain), fuzz tests on swap amounts, gas snapshot. Compare gas cost to Uniswap v2 reference.


### Project 2 — Lending protocol


**Deliverable:** A simplified lending protocol: deposit ETH as collateral, borrow a stablecoin against it (80% LTV), interest accrual (simple interest rate model), liquidation function with 10% bonus for liquidators. Mock Chainlink oracle for ETH price. Fuzz test health factor calculation. Write a test that simulates a price crash and successfully liquidates an undercollateralised position.


### Project 3 — Damn Vulnerable DeFi challenges


**Deliverable:** Complete challenges 1–10 from `damnvulnerabledefi.xyz`. For each: write the attack in a Foundry test (proving you can drain the contract), then document the fix. Focus on: Unstoppable (flash loan), Naive Receiver (force ETH), Truster (arbitrary call), Side Entrance (reentrancy with lending).


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Using spot DEX price as a price oracle.**


Any protocol reading `reserve1/reserve0` from a Uniswap pool as a price can be manipulated with a flash loan in a single block.


**✅ Correct approach:** Use Chainlink price feeds for production. Use Uniswap v3 TWAP (minimum 30-minute window) as a sanity check or fallback. Never use spot prices for anything that controls capital.


### Mistake 2


**❌ Integer precision loss in financial calculations.**


`(userBalance / totalSupply) * totalAssets` loses massive precision due to integer division first. With small balances, this rounds to zero.


**✅ Correct approach:** Always multiply first: `(userBalance * totalAssets) / totalSupply`. Scale values by 1e18 for maximum precision. Use a dedicated fixed-point library (PRBMath, FixedPointMathLib) for complex calculations.


### Mistake 3


**❌ Not protecting against donation attacks.**


If your vault calculates share price as `totalAssets / totalSupply` and total assets can be manipulated by sending tokens directly to the contract (not through `deposit`), an attacker can inflate the share price and steal from subsequent depositors.


**✅ Correct approach:** EIP-4626 recommends virtual shares/assets approach: add a small initial deposit (dead shares) that prevents the first depositor from manipulating the price. Or use a `totalAssets()` function that only counts tracked deposits, not raw `balanceOf`.


### Mistake 4


**❌ No slippage protection on swaps.**


A swap with `amountOutMinimum = 0` will execute at any price. A sandwich bot sees your transaction in the mempool, dumps tokens to move the price, your swap executes at a terrible price, the bot buys back and profits at your expense.


**✅ Correct approach:** Always set a reasonable `amountOutMinimum` (typically 0.5-2% below expected output). For protocols, use TWAP to set the minimum. Never pass 0 as the minimum output.

