---
source: notion
title: "Phase 4 — Security & Auditing (Days 56–75)"
slug: "phase-4-security-and-auditing-days-56-75"
notionId: "362da883-bddd-811a-ab5e-c944dce53f5b"
notionRootId: "362da883bddd81cd8c6fd78fe5fec86f"
parent: "blockchain-developer-roadmap-beginner-to-advanced"
children: []
order: 1
icon: "🔐"
cover: null
---
> **Core insight:** In traditional software, a bug causes downtime or data corruption. In smart contracts, a bug causes irreversible loss of funds from users who trusted your code. There is no patch server, no customer support line, no rollback. Security is not a feature you add at the end — it is the entire design discipline.

---


## 📚 Topics in order


### Day 56–57 — The attacker mindset


**How to think like an attacker:**


Every function in your contract is a potential attack surface. For every function ask:

1. What is the worst thing someone can do if they call this?
2. What if they call it with extreme values? (0, uint256.max, address(0))
3. What if they call it multiple times in the same transaction?
4. What if they are a smart contract with a malicious fallback function?
5. What if they frontrun this transaction?
6. What if they control the oracle price?
7. What if they have unlimited capital (flash loans)?

**The four categories of smart contract vulnerabilities:**

1. **Logic errors:** incorrect business logic. Hard to detect with automated tools.
2. **Improper access control:** functions callable by anyone that should be restricted.
3. **Unsafe external calls:** reentrancy, unchecked return values, arbitrary calls.
4. **Economic design flaws:** flash loan attacks, oracle manipulation, incentive misalignment.

### Day 58–60 — Top vulnerability classes


**1. Reentrancy**


```solidity
// ATTACK VECTOR:
// Attacker contract has fallback() that calls back into victim.withdraw()
// State not updated before external call -> attacker drains repeatedly

contract Attack {
    Victim victim;
    function attack() external payable {
        victim.deposit{value: 1 ether}();
        victim.withdraw(1 ether);
    }
    fallback() external payable {
        if (address(victim).balance >= 1 ether) {
            victim.withdraw(1 ether);  // re-enters before state update
        }
    }
}

// CROSS-FUNCTION REENTRANCY: re-enter a DIFFERENT function
// Read-only reentrancy: re-enter a view function while state is inconsistent
// ERC-777 reentrancy: transfer hooks trigger before state updates

// DEFENCES:
// 1. CEI pattern (primary)
// 2. nonReentrant modifier (secondary)
// 3. Never assume external code is safe
```


**2. Access Control**


```solidity
// Missing auth: function should be onlyOwner but isn't
// Wrong auth: checks msg.sender but should check tx.origin (or vice versa)
// Initialiser not protected: initialize() callable by anyone (proxy pattern bug)

// tx.origin attack:
// User calls MaliciousContract, which calls Victim using tx.origin check
// tx.origin = User (who is authorised). Victim thinks User called it directly.
// NEVER use tx.origin for authorisation. Always use msg.sender.

// Real exploit: Parity Multisig hack ($30M) - unprotected initWallet function
// Anyone could call initWallet and become the owner of any Parity wallet
```


**3. Integer arithmetic**


```solidity
// Solidity 0.8+: overflow/underflow reverts automatically
// But: unchecked blocks, type casting, and division can still cause issues

// Type casting precision loss:
uint256 a = 300;
uint8 b = uint8(a);  // b = 44 (300 % 256). No revert. Silent truncation.

// Division rounding:
// 1 / 2 = 0 in Solidity (always rounds down)
// This can cause dust accumulation or protocol insolvency over many operations

// Multiplication overflow in unchecked:
unchecked {
    uint256 x = type(uint256).max;
    uint256 y = x * 2;  // silently overflows to a smaller number
}
```


**4. Flash loan attacks**


```javascript
Attack pattern:
1. Flash loan $100M of token X
2. Deposit X into a protocol (moves price or passes governance threshold)
3. Exploit the protocol (liquidate positions at wrong price, pass malicious proposal)
4. Withdraw X
5. Repay flash loan + fee
6. Profit: everything extracted in step 3

Defences:
- Use time-weighted prices (TWAP) not spot prices for critical operations
- Use governance snapshots (token balance at proposal block, not current block)
- Require a delay between deposit and any privileged action
```


**5. Frontrunning and MEV**


```javascript
Scenario: you submit a profitable arbitrage transaction
MEV searcher sees it in mempool, copies it with higher gas
MEV transaction executes first, takes your profit

Sandwich attack:
1. Bot sees your large swap: 1000 ETH for USDC
2. Bot buys ETH (pushing price up) - frontrun
3. Your swap executes at worse price
4. Bot sells ETH - backrun. Profit from your slippage.

Defences:
- Set tight slippage tolerances (amountOutMinimum)
- Use Flashbots Protect or private RPC for sensitive transactions
- Commit-reveal for randomness and auctions
```


**6. Unchecked return values**


```solidity
// ERC-20 tokens: some return false instead of reverting on failure
// If you don't check the return value, the transfer silently fails

// WRONG:
token.transfer(recipient, amount);  // if transfer returns false, we don't know

// CORRECT:
require(token.transfer(recipient, amount), "Transfer failed");
// OR:
token.safeTransfer(recipient, amount);  // OpenZeppelin handles this

// Low-level calls always return (bool success, bytes memory data)
(bool success,) = recipient.call{value: amount}("");
require(success, "ETH transfer failed");
```


**7. Timestamp and block number manipulation**


```solidity
// block.timestamp: validators can manipulate by up to ~12 seconds in PoS
// Never use for precise timing of financial operations
// Use block numbers for rough timing. Use off-chain systems for precise timing.

// ACCEPTABLE: time-based vesting with multi-minute granularity
require(block.timestamp >= vestingStart + 365 days);

// DANGEROUS: using timestamp as randomness source
uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
// Validator can choose which timestamp to use within the valid range
```


**8. Signature replay attacks**


```solidity
// If you use ecrecover for authorisation, an attacker can replay the signature
// on a different chain, different contract, or for a different operation

// ALWAYS include in your signed hash:
// 1. chainId (prevents cross-chain replay)
// 2. contract address (prevents cross-contract replay)
// 3. nonce (prevents same-contract replay)
// 4. expiry (prevents stale signature use)

// EIP-712 structured data signing handles all of this:
bytes32 domainSeparator = keccak256(abi.encode(
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
    keccak256(bytes(name)),
    keccak256(bytes("1")),
    block.chainid,
    address(this)
));
```


### Day 61–63 — Audit methodology


**Step 1: Understand the protocol (2-3 hours)**

- Read ALL documentation: whitepaper, README, natspec comments
- Draw an architecture diagram: all contracts, their relationships, external dependencies
- List all external calls (to tokens, oracles, other protocols)
- Map all trust assumptions: who can do what?
- Identify the critical invariants: what MUST always be true?

**Step 2: Manual review (systematic)**

1. Read every state variable: what does it track? Who can modify it?
2. Read every modifier: does it actually protect what it claims?
3. Read every external/public function: what are the preconditions? Postconditions?
4. Follow the money: trace ETH and token flows through every path
5. Check CEI compliance: every state-modifying function
6. Check every arithmetic operation: overflow? Precision loss? Division before multiply?
7. Check every external call: return value checked? Reentrancy possible?
8. Check every access control: is the correct modifier applied?

**Step 3: Threat modelling**

- Enumerate actors: normal user, malicious user, admin, MEV bot, flash loan attacker
- For each actor: what is their maximum rational harm?
- For each valuable state: how can it be manipulated?

**Step 4: Automated tools**


```bash
# Slither: static analysis
slither . --detect all
slither . --detect reentrancy-eth,reentrancy-no-eth
slither . --detect arbitrary-send-eth

# Mythril: symbolic execution
myth analyze src/Contract.sol --execution-timeout 300

# Echidna: fuzzing
# Write property functions (invariants) that should never be false
# Echidna tries to find inputs that break them
function echidna_balance_invariant() public returns (bool) {
    return totalSupply == sumOfAllBalances();
}

# Foundry fuzzing:
function testFuzz_Invariant(uint256 amount) public {
    amount = bound(amount, 1, type(uint128).max);
    // property that should always hold
}
```


**Step 5: Write a report**

- Severity: Critical (funds at risk immediately), High (funds at risk under conditions), Medium (protocol malfunction), Low (best practices), Informational
- For each finding: description, impact, proof of concept (code), recommendation
- Proof of concept: a working Foundry test that demonstrates the exploit

### Day 64–66 — Advanced attack patterns


**Price manipulation via donation:**


```solidity
// If share price = totalAssets() / totalShares
// and totalAssets() reads token.balanceOf(address(this))
// attacker can donate tokens directly to inflate share price
// New depositors get fewer shares than expected -> effectively robbed

// Fix: track totalAssets internally, don't rely on balanceOf
```


**Inflation attack (first depositor):**


```javascript
1. Attacker is first LP: deposits 1 wei, receives 1 share
2. Attacker donates 1000e18 tokens directly (not through deposit)
3. Now: 1 share represents 1000e18 + 1 wei of assets
4. Victim deposits 1999e18 tokens: receives floor(1999e18 * 1 / (1000e18 + 1)) = 1 share
5. Attacker withdraws 1 share: gets half of all assets
6. Attacker stole ~500e18 from the victim

Fix: Virtual shares/assets (add 1000 to both numerator and denominator)
```


**Storage collision in proxies:**


```solidity
// Transparent proxy stores admin at slot:
// keccak256("eip1967.proxy.admin") - 1 = 0xb53127...

// If implementation has a mapping at slot 0 and a user's key hashes
// to the same slot as the admin storage -> they can overwrite the admin

// EIP-1967: standardised storage slots for proxy variables
// Always use EIP-1967 slots for proxy variables
bytes32 constant IMPLEMENTATION_SLOT =
    0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
```


### Day 67–70 — CTF and real exploit analysis


**Day 67-68: Ethernaut (OpenZeppelin CTF)**


Complete levels 1-20. Each level is a vulnerable contract you must exploit. Key levels:

- Level 5: Token (integer underflow)
- Level 6: Delegation (delegatecall)
- Level 8: Vault (private storage is public)
- Level 10: Re-entrancy (classic reentrancy)
- Level 16: Preservation (delegatecall storage collision)
- Level 20: Denial (gas griefing)

**Day 69: Damn Vulnerable DeFi (advanced levels)**


Complete challenges 10-18:

- Backdoor (Gnosis Safe initialiser exploit)
- Climber (access control + timelock attack)
- Free Rider (flash loan + NFT marketplace)
- Wallet Mining (CREATE2 exploit)

**Day 70: Real exploit recreation**


Choose one of these and recreate the exploit in Foundry:

- Euler Finance hack ($197M, March 2023): donation attack + flash loan
- Nomad Bridge hack ($190M, August 2022): initialisation bug
- Poly Network hack ($611M, August 2021): access control on privileged function

**Required reading for each exploit:**

1. [Rekt.news](http://rekt.news/) writeup
2. Original attacker transaction on Etherscan
3. Post-mortem from the team
4. Trace the transaction with `cast run <txhash> --rpc-url mainnet`

### Day 71–75 — Audit tools and formal verification


**Slither static analysis:**


```bash
# Run all detectors:
slither . 

# Most important detectors:
# reentrancy-eth: reentrancy with ETH transfer
# arbitrary-send-eth: unprotected ETH send
# controlled-delegatecall: delegatecall with untrusted data
# msg-value-loop: msg.value in a loop (always a bug)
# tx-origin: tx.origin for authentication
# suicidal: anyone can call selfdestruct

# Print human-readable contract summary:
slither . --print human-summary
slither . --print call-graph
slither . --print data-dependency
```


**Echidna fuzzing (property-based testing):**


```solidity
// echidna_* functions are properties that must always return true
// Echidna generates random sequences of function calls trying to break them

contract VaultTest is Vault {
    address echidna_caller = address(0x1234);

    function echidna_solvency() public view returns (bool) {
        // Total assets must always equal sum of all deposits
        return totalAssets() >= totalDeposited;
    }

    function echidna_no_free_shares() public view returns (bool) {
        // You cannot get shares without depositing
        return balanceOf[echidna_caller] <= deposited[echidna_caller];
    }
}
```


**Formal verification basics:**

- Certora Prover: specification language (CVL) that proves properties hold for ALL inputs
- Halmos: symbolic execution on Foundry tests. Runs tests symbolically to find counterexamples.
- K framework: formal semantics of EVM. Used to prove properties about the EVM itself.

---


## 🔨 Projects


### Project 1 — Audit your Phase 3 lending protocol


**Deliverable:** Conduct a full audit of the lending protocol you built in Phase 3:

- Run Slither. Fix all high/medium findings.
- Write an Echidna fuzzing suite with 5 invariants (e.g., “total borrows can never exceed total deposits”)
- Write a formal audit report in markdown: executive summary, findings table, detailed findings with PoC, recommendations
- Attempt to exploit your own protocol with flash loans and oracle manipulation

### Project 2 — CTF Portfolio


**Deliverable:** Complete and document solutions to: all 20 Ethernaut levels + Damn Vulnerable DeFi 1-12. For each: working exploit in Foundry test, explanation of the vulnerability, the fix. Host solutions on GitHub with clear READMEs.


### Project 3 — Recreate a real exploit


**Deliverable:** Pick any historical DeFi hack from [rekt.news](http://rekt.news/). Write a complete Foundry test that:

1. Forks mainnet at the exact block before the attack
2. Replicates the attacker's transactions step by step
3. Verifies the funds were drained
4. Documents the fix (what one line of code would have prevented it?)
5. Writes the actual fix and proves it blocks the attack

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Relying only on automated tools for security.**


Slither and Mythril find syntax-level issues well. They completely miss economic attack vectors, incorrect business logic, and novel attack patterns. The Euler Finance exploit ($197M) would not have been caught by any static analysis tool.


**✅ Correct approach:** Automated tools catch the obvious. Manual review by experienced humans catches the subtle. The correct process: automated tools first (to clear known issues) → manual review → CTF-style adversarial thinking → fuzzing with invariants → formal verification for critical math.


### Mistake 2


**❌ Writing exploits without understanding the root cause.**


Some engineers copy CTF solutions without understanding why the exploit works. This means they can’t spot the same class of vulnerability in a different form.


**✅ Correct approach:** For every vulnerability: name the class, explain why it exists, explain why the fix works, find 3 other real-world examples of the same class. Depth over breadth.


### Mistake 3


**❌ Not testing failure paths.**


Tests that only test the happy path miss every security vulnerability. The vulnerability is always in the edge case.


**✅ Correct approach:** For every function: test with zero inputs, maximum inputs, empty arrays, zero address, already-completed state, and the caller being a malicious smart contract. Use fuzz testing to discover edge cases you wouldn’t think of manually.


### Mistake 4


**❌ Trusting comments over code.**


A natspec comment says “only callable by the admin” but the function has no modifier. Comments are for humans; the EVM runs the code.


**✅ Correct approach:** In a security review, the code is the truth. Comments are hints. Verify every security claim by reading the actual modifier implementation and tracing the call path.

