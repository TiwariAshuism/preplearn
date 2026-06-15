---
source: notion
title: "⛓️ Blockchain Developer Roadmap — Beginner to Advanced"
slug: "blockchain-developer-roadmap-beginner-to-advanced"
notionId: "362da883bddd81cd8c6fd78fe5fec86f"
notionRootId: "362da883bddd81cd8c6fd78fe5fec86f"
parent: null
children: ["phase-5-advanced-and-full-stack-web3-days-76-90","phase-4-security-and-auditing-days-56-75","phase-3-defi-and-protocol-design-days-36-55","phase-2-solidity-and-smart-contracts-days-16-35","phase-1-blockchain-foundations-days-1-15"]
order: 6
icon: "⛓️"
cover: null
---
> ⛓️ **Zero to production blockchain engineer.** From how Bitcoin works to deploying DeFi protocols, writing audited smart contracts, and building full-stack dApps.

---


## 📌 How to use this template

- Work phases **in strict order** — each phase is a prerequisite for the next
- Daily ritual: study the concept → write code → deploy something → break it intentionally → log one insight
- **Building > reading.** Every lesson has a coding component. Never just read — always ship.
- Use the **Daily Tracker** to stay consistent
- Open each **Phase page** for full breakdowns, projects, real-world references, and mistake corrections
> 💡 **The #1 rule of blockchain engineering:** Code is law. A bug in a smart contract can permanently lose millions of dollars with no recourse. Every pattern here exists because someone lost real money without it.

---


## 🗺️ Roadmap at a glance


| Phase                                | Days       | Focus                                                  | Key Output                              |
| ------------------------------------ | ---------- | ------------------------------------------------------ | --------------------------------------- |
| Phase 1 — Blockchain Foundations     | Days 1–15  | Cryptography, consensus, Bitcoin, Ethereum             | Deep mental model of how chains work    |
| Phase 2 — Solidity & Smart Contracts | Days 16–35 | Solidity language, EVM, contract patterns              | Deploy your first real contracts        |
| Phase 3 — DeFi & Protocol Design     | Days 36–55 | AMMs, lending, oracles, tokenomics                     | Understand and fork real DeFi protocols |
| Phase 4 — Security & Auditing        | Days 56–75 | Attack vectors, audit methodology, formal verification | Find bugs before hackers do             |
| Phase 5 — Advanced & Full-Stack Web3 | Days 76–90 | L2s, ZK proofs, cross-chain, dApp frontend             | Ship a production-grade dApp            |


---


## ⚡ The blockchain engineering decision framework


Ask these questions for every system you design:

1. **Does this need a blockchain?** — Most systems don't. Blockchain adds value only when trustlessness, censorship-resistance, or permissionlessness is the core requirement.
2. **What is the trust model?** — Who controls upgrades? Who controls the admin keys? Who can pause or drain funds?
3. **What are the economic attack surfaces?** — Flash loans? Price manipulation? Sandwich attacks? Frontrunning?
4. **What is the worst-case exploit?** — Assume adversarial users with unlimited capital and perfect information.
5. **Is this upgradeable? Should it be?** — Upgradeable = trusted admin. Immutable = no bug fixes ever. Choose explicitly.
6. **What happens when an oracle fails?** — Every external dependency is an attack vector.

---


## 📊 My progress

- Current phase: **Phase 1**
- Current day: **Day 1 of 90**
- Smart contracts deployed: **0**
- Protocols studied: **0**
- Audits completed: **0**

---


## 🔖 Quick links

- ⛓️ Phase 1 — Blockchain Foundations
- 🔷 Phase 2 — Solidity & Smart Contracts
- 🏦 Phase 3 — DeFi & Protocol Design
- 🔐 Phase 4 — Security & Auditing
- 🚀 Phase 5 — Advanced & Full-Stack Web3

---


## 🛠️ Core tech stack this roadmap builds


| Layer                   | Technology                          |
| ----------------------- | ----------------------------------- |
| Blockchain              | Ethereum (EVM-compatible)           |
| Smart contract language | Solidity 0.8.x                      |
| Development framework   | Foundry (primary) + Hardhat         |
| Testing                 | Forge (Foundry), Echidna (fuzzing)  |
| Frontend                | Next.js + wagmi + viem + RainbowKit |
| Indexing                | The Graph (subgraphs)               |
| Oracles                 | Chainlink                           |
| L2s                     | Optimism, Arbitrum, zkSync          |
| Storage                 | IPFS + Filecoin                     |
| Node providers          | Alchemy / Infura / Quicknode        |


---


## 📚 Essential reading list


| Resource                                                               | Priority      |
| ---------------------------------------------------------------------- | ------------- |
| Ethereum Yellowpaper                                                   | ⭐⭐⭐ Essential |
| OpenZeppelin Contracts source code                                     | ⭐⭐⭐ Essential |
| Damn Vulnerable DeFi                                                   | ⭐⭐⭐ Essential |
| Uniswap v2/v3 whitepapers                                              | ⭐⭐⭐ Essential |
| Solidity docs ([docs.soliditylang.org](http://docs.soliditylang.org/)) | ⭐⭐⭐ Essential |
| Foundry Book ([book.getfoundry.sh](http://book.getfoundry.sh/))        | ⭐⭐⭐ Essential |
| Trail of Bits blog                                                     | ⭐⭐ Important  |
| [Rekt.news](http://rekt.news/)                                         | ⭐⭐ Important  |
| a16z crypto research                                                   | ⭐ Useful      |


📅 Blockchain Daily Tracker


## Phase 1 — Blockchain Foundations (Days 1–15)
> **Core insight:** Most developers skip blockchain fundamentals and go straight to Solidity tutorials. They end up writing code they don't understand, making security decisions they can't reason about, and debugging issues they have no framework to diagnose. Every hour spent here saves ten hours later.

---


## 🧠 Why this phase first


Blockchain is not a framework or a library — it is a completely different computing paradigm. Code runs in a public, adversarial environment. There is no database administrator, no customer support, no rollback. Understanding why the design decisions were made is what separates engineers who write correct code from engineers who write plausible-looking code that gets drained.


---


## 📚 Topics in order


### Day 1–2 — Cryptographic primitives


**Hash functions:**

- Properties: deterministic, fast to compute, pre-image resistant, collision resistant, avalanche effect
- SHA-256: used in Bitcoin (Proof of Work, Merkle trees). Output: 256-bit fixed-length digest.
- Keccak-256: used in Ethereum (address derivation, storage slots, event topics). NOT the same as SHA3-256.
- `keccak256(abi.encodePacked(data))` is the most common Solidity hash operation
- Merkle trees: a binary tree where each leaf is a hash of data, each node is a hash of its children. Root hash = tamper-evident fingerprint of all data. Used in: Bitcoin transactions, Ethereum state, Merkle proofs (proving inclusion without downloading everything)

**Digital signatures (ECDSA — Elliptic Curve Digital Signature Algorithm):**

- Ethereum uses the secp256k1 curve (same as Bitcoin)
- Private key: a random 256-bit number. Must be kept secret. Controls all funds.
- Public key: derived from private key via elliptic curve point multiplication. Cannot be reversed.
- Ethereum address: `keccak256(publicKey)[12:]` — the last 20 bytes of the Keccak hash of the public key
- Signing: `(v, r, s) = sign(keccak256(message), privateKey)`. Anyone can verify without knowing the private key.
- `ecrecover(hash, v, r, s)` in Solidity: recovers the signer's address from a signature. Foundation of meta-transactions and permit patterns.

**Symmetric vs asymmetric encryption:**

- Symmetric: same key encrypts and decrypts. Fast. Key distribution problem.
- Asymmetric (public-key): public key encrypts, private key decrypts. Solves key distribution. Slower.
- Blockchain uses asymmetric cryptography for identity (signatures), not for encryption (most blockchain data is public)

### Day 3–4 — How Bitcoin works


**The double-spend problem:** digital data can be copied. How do you prevent spending the same digital coin twice without a central bank? Bitcoin's answer: a public, append-only ledger maintained by a distributed network with economic incentives.


**UTXO model:**

- Unspent Transaction Outputs. Bitcoin has no "accounts" or "balances."
- Every transaction consumes previous UTXOs as inputs and creates new UTXOs as outputs.
- Your "balance" = sum of all UTXOs your private key can spend
- Change address: if UTXO value > payment, excess goes to a new UTXO you control

**Proof of Work (PoW):**

- Mining: find a nonce such that `SHA256(SHA256(blockHeader))` starts with N leading zeros
- Difficulty adjusts every 2016 blocks (~2 weeks) to maintain ~10 minute block time
- Longest chain rule: the valid chain with the most accumulated work is the canonical chain
- 51% attack: controlling >50% of hash power lets you rewrite recent history. Cost: enormous hardware + electricity investment
- Why PoW works: making block production expensive makes attacking expensive

**Bitcoin scripting:**

- Bitcoin transactions use a simple stack-based scripting language (Script)
- P2PKH (Pay to Public Key Hash): most common. Lock: `OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG`
- Script is intentionally NOT Turing complete (no loops) — security by simplicity

### Day 5–7 — Ethereum architecture


**Ethereum vs Bitcoin:**

- Bitcoin: optimised for value transfer. Limited scripting.
- Ethereum: general-purpose programmable blockchain. Turing-complete smart contracts. "World computer."
- Account model (not UTXO): two account types:
    - **Externally Owned Accounts (EOA):** controlled by private key. Can initiate transactions. Has nonce + ETH balance.
    - **Contract accounts:** controlled by code. Has nonce + ETH balance + code + storage. Cannot initiate transactions — only respond to calls.

**The Ethereum state:**

- Global state: a Merkle-Patricia Trie mapping addresses to account states
- Account state: nonce, balance, storageRoot (hash of storage trie), codeHash
- Transactions modify state. Every full node maintains a copy of the current state.

**Gas mechanics:**

- Gas: unit of computational work. Every EVM opcode costs a specific amount of gas.
- Gas price (in Gwei): what you pay per unit of gas. Set by the sender.
- Gas limit: maximum gas you're willing to consume. If execution exceeds this, it reverts (but gas is still consumed up to the limit).
- EIP-1559: base fee (burned) + priority fee (to validator). Base fee adjusts per block targeting 50% full blocks.
- Why gas exists: prevent infinite loops from halting the network (halting problem solution). Every computation has a price.

**The EVM (Ethereum Virtual Machine):**

- Stack-based virtual machine. Stack depth: 1024. Word size: 256 bits.
- Every node runs the EVM to execute transactions and reach consensus on the resulting state.
- EVM opcodes: PUSH, POP, ADD, MUL, SLOAD, SSTORE, CALL, DELEGATECALL, CREATE, etc.
- Stack, memory (temporary, per-call), storage (persistent, per-contract), calldata (read-only input)

**Proof of Stake (PoS) — Ethereum's current consensus:**

- Validators stake 32 ETH as collateral
- Validators are pseudo-randomly selected to propose blocks and attest to them
- Slashing: validators who double-sign or violate protocol lose part of their stake
- Finality: after enough attestations, blocks are finalised (cannot be reorged)
- Energy: ~99.95% less energy than PoW

### Day 8–9 — Transactions, blocks, and mempool


**Transaction anatomy:**


```javascript
{
  nonce: 42,              // sender's transaction count (prevents replay)
  to: "0x...",           // recipient (null = contract creation)
  value: "1000000000000000000",  // ETH in wei (1 ETH = 10^18 wei)
  data: "0x...",          // calldata (function selector + arguments)
  gasLimit: 21000,
  maxFeePerGas: "50000000000",    // EIP-1559
  maxPriorityFeePerGas: "2000000000",
  chainId: 1,             // prevents cross-chain replay attacks
  v, r, s                 // ECDSA signature
}
```


**Transaction lifecycle:**

1. User signs transaction with private key
2. Broadcast to mempool (public pool of pending transactions)
3. Validators select transactions (usually highest fee first)
4. Validator includes in a block
5. Block propagated to network
6. Other validators attest to block
7. Block finalised after enough attestations

**MEV (Maximal Extractable Value):**

- Validators/searchers can reorder, insert, or censor transactions within a block to extract profit
- Frontrunning: see a profitable pending tx, submit your own with higher gas to execute first
- Sandwich attacks: frontrun + backrun a large DEX trade
- Flashbots: private mempool system that allows MEV searching without polluting the public mempool
- Critical for DeFi design: any state-changing action visible in mempool can be exploited

### Day 10–11 — Ethereum data structures


**Merkle-Patricia Trie:**

- Combines Merkle tree (tamper-evident) with Patricia trie (efficient key-value lookup)
- Three tries per block: state trie, transactions trie, receipts trie
- Root hashes stored in block header — any state change produces a different root

**ABI (Application Binary Interface):**

- The standard for encoding function calls and return values for the EVM
- Function selector: `bytes4(keccak256("functionName(type1,type2)"))` — first 4 bytes of calldata
- ABI encoding: fixed-size types padded to 32 bytes. Dynamic types (string, bytes, arrays) use offset + length + data.
- This is what tools like ethers.js and wagmi handle automatically — but you must understand it for low-level debugging

**Storage layout:**

- Each contract has a storage trie: 2^256 slots of 32 bytes each (theoretically infinite)
- Slot assignment: state variables assigned sequentially (slot 0, 1, 2...)
- Mappings: `keccak256(key . slot)` — deterministic but sparse (no enumeration)
- Dynamic arrays: length at slot N, elements at `keccak256(N)`, `keccak256(N)+1`, etc.
- This layout is how storage collision attacks (in proxies) work

### Day 12–13 — Wallets, keys, and standards


**HD Wallets (BIP-32/39/44):**

- BIP-39: mnemonic phrase (12-24 words) → seed (512-bit entropy)
- BIP-32: hierarchical deterministic derivation. One seed → infinite key pairs
- BIP-44: derivation path: `m/purpose'/coin_type'/account'/change/index`
- Ethereum path: `m/44'/60'/0'/0/0`, `m/44'/60'/0'/0/1`, etc.
- The mnemonic IS the private key. Never share it. Never enter it online.

**Token standards:**

- **ERC-20:** fungible tokens. `transfer`, `approve`, `transferFrom`, `balanceOf`, `allowance`. All tokens of the same type are identical.
- **ERC-721:** non-fungible tokens (NFTs). Each token has a unique `tokenId`. `ownerOf`, `transferFrom`, `approve`, `setApprovalForAll`.
- **ERC-1155:** multi-token standard. One contract manages both fungible and non-fungible tokens. Batch transfers.
- **ERC-4626:** tokenised vault standard. Deposit assets, receive shares. Withdrawal burns shares, returns assets proportionally.

### Day 14–15 — Development environment setup


**Foundry (primary toolchain):**


```bash
# Install
curl -L https://foundry.paradigm.xyz | bash
foundryup

# New project
forge init my-project
cd my-project

# Project structure
src/          # Solidity contracts
test/         # Forge tests (also Solidity)
script/       # Deployment scripts
lib/          # Dependencies (git submodules)
foundry.toml  # Config
```


**Essential Foundry commands:**


```bash
forge build                    # compile contracts
forge test                     # run all tests
forge test -vvvv               # verbose (shows traces)
forge test --match-test testFoo  # run specific test
forge snapshot                 # gas snapshots
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast  # deploy
cast call $ADDR "balanceOf(address)" $USER  # read contract
cast send $ADDR "transfer(address,uint256)" $TO 1000 --private-key $PK
cast storage $ADDR 0            # read storage slot 0
cast 4byte 0xa9059cbb           # decode function selector
```


**Node providers (to connect to the network):**

- Alchemy: `https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY`
- Infura: `https://mainnet.infura.io/v3/YOUR_KEY`
- Local fork: `anvil --fork-url $MAINNET_RPC --fork-block-number 19000000`

---


## 🔨 Projects


### Project 1 — Cryptography from scratch


**Deliverable:** A Node.js script (no libraries except `noble-curves` for ECDSA) that:

1. Generates a random secp256k1 private key
2. Derives the public key via elliptic curve multiplication
3. Derives the Ethereum address from the public key
4. Signs a message hash with the private key (produces v, r, s)
5. Recovers the signer address from the signature
6. Builds a Merkle tree from 8 leaf values and produces a proof of inclusion for leaf #3

**Why:** When you implement these from scratch, you understand why `ecrecover` works the way it does in Solidity, and why signature malleability attacks exist.


### Project 2 — Bitcoin transaction decoder


**Deliverable:** A script that takes a raw Bitcoin transaction hex string and decodes it into human-readable form: inputs (previous txid + vout + scriptSig), outputs (value + scriptPubKey), locktime. Parse the UTXO model manually without a library.


### Project 3 — Ethereum state explorer


**Deliverable:** Using `cast` and a mainnet fork (`anvil --fork-url`), write a shell script or Foundry test that:

1. Reads the ETH balance of 5 famous Ethereum addresses
2. Reads the USDC balance of Binance's hot wallet (read ERC-20 storage directly at the correct slot)
3. Reads any contract's storage slot 0 manually with `cast storage`
4. Decodes a recent Uniswap transaction from calldata using `cast 4byte-decode`
5. Traces a historical transaction with `cast run <txhash>`

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Confusing ETH amounts — Ether vs Wei.**


`transfer(recipient, 1)` transfers 1 Wei (0.000000000000000001 ETH), not 1 ETH. Engineers new to blockchain consistently get this wrong in production.


**✅ Correct approach:** All EVM values are in Wei. 1 ETH = 10^18 Wei = `1 ether` in Solidity. Always use named units (`1 ether`, `1 gwei`) in Solidity. Never hardcode `10**18` or `1000000000000000000`.


### Mistake 2


**❌ Thinking the mempool is private.**


Developers assume their transactions are private until confirmed. The mempool is public. Any transaction broadcasting a profitable opportunity will be frontrun.


**✅ Correct approach:** Design contracts assuming all pending transactions are visible to adversarial actors with unlimited capital. Commit-reveal schemes, slippage protection, and private mempools (Flashbots Protect) exist for this reason.


### Mistake 3


**❌ Assuming on-chain randomness is safe.**


`block.timestamp`, `block.prevrandao`, and `blockhash` are all manipulable by validators to varying degrees. Any contract that uses these for randomness can be exploited.


**✅ Correct approach:** Use Chainlink VRF (Verifiable Random Function) for any randomness that has economic consequences. It provides cryptographic proof that the random value was not manipulated.


### Mistake 4


**❌ Not understanding that storage is permanent and public.**


Marking a storage variable `private` in Solidity does NOT make it private on-chain. All storage is readable by anyone with `eth_getStorageAt`. Passwords, private keys, and sensitive data must NEVER be stored on-chain.


**✅ Correct approach:** `private` in Solidity only means other contracts cannot read it — it is still fully visible off-chain. Encrypt sensitive data off-chain. Only store the hash or commitment on-chain.


---


## 🏢 How real protocols use these fundamentals


**Uniswap — deterministic contract addresses:** Uniswap v2 uses `CREATE2` to deploy pair contracts at addresses determined by the token addresses alone. This lets routers compute pair addresses off-chain without an on-chain registry lookup — saving one storage read per swap. The address formula uses `keccak256` of the init bytecode hash + factory address + salt (token pair).


**Compound — storage slot manipulation in testing:** Compound's test suite uses `vm.store(contractAddress, slot, value)` in Foundry to directly manipulate storage slots — setting token balances, changing oracle prices, or unlocking governance parameters without going through normal contract flows. This requires deep understanding of storage layout.


**Ethereum Foundation — EIP-1559 burn mechanism:** The base fee burn mechanism was designed using game theory rooted in auction theory. Understanding how validators could game fee markets (they could censor transactions to manipulate base fees) shaped the specific design. Cryptoeconomics and mechanism design are inseparable from protocol engineering.


## Phase 2 — Solidity & Smart Contracts (Days 16–35)
> **Core insight:** Solidity looks familiar — it resembles JavaScript and C++. This is a trap. The execution environment is completely unlike any other programming context. Gas costs, reentrancy, integer overflow, and storage layout have no analogy in web development. Every pattern here exists because someone lost money without it.

---


## 📚 Topics in order


### Day 16–17 — Solidity language fundamentals


**Data types:**


```solidity
// Value types (stored by value, copied on assignment)
bool                          // true / false
uint256, uint128, uint8...    // unsigned integers (uint = uint256)
int256, int128...             // signed integers
address                       // 20-byte Ethereum address
address payable               // address that can receive ETH
bytes32, bytes16, bytes1...   // fixed-size byte arrays

// Reference types (stored by reference, location matters)
string                        // dynamic UTF-8 string
bytes                         // dynamic byte array
T[]                           // dynamic array of type T
T[N]                          // fixed array of type T, length N
mapping(K => V)               // hash map (keys not enumerable)
```


**Storage locations:**


```solidity
// storage: persists on-chain. Expensive reads (SLOAD=100 gas) and writes (SSTORE=20000 gas)
// memory: temporary, per-call. Cheap. Cleared after call.
// calldata: read-only input data. Cheapest for function parameters.
// stack: 1024 slots of 32 bytes. Used implicitly by EVM.

function example(
    uint256[] calldata input  // calldata: read-only, cheapest
) external returns (uint256[] memory result) {  // memory: mutable copy
    uint256 len = input.length;
    result = new uint256[](len);
    // ...
}
```


**Visibility modifiers:**

- `public`: callable externally AND internally. Generates a getter for state variables.
- `external`: callable only from outside the contract. More gas-efficient for large calldata.
- `internal`: callable only within the contract and derived contracts.
- `private`: callable only within the contract. NOT private on-chain.

**Function modifiers:**

- `view`: reads state but does not modify it. No gas cost when called externally (off-chain).
- `pure`: does not read OR modify state. Pure computation.
- `payable`: can receive ETH. Without this, ETH sent to the function is rejected.

### Day 18–19 — Control flow, errors, and events


**Error handling:**


```solidity
// require: validate inputs/conditions. Reverts with message. Gas refunded.
require(amount > 0, "Amount must be positive");
require(balances[msg.sender] >= amount, "Insufficient balance");

// revert: explicit revert. Use custom errors for gas efficiency.
error InsufficientBalance(address user, uint256 requested, uint256 available);
if (balances[msg.sender] < amount) {
    revert InsufficientBalance(msg.sender, amount, balances[msg.sender]);
}

// assert: internal invariants. Should NEVER fail in correct code.
// If it fails, something is seriously wrong. Consumes ALL remaining gas.
assert(totalSupply == expectedSupply);

// try/catch: for calling external contracts that might revert
try externalContract.someCall() returns (uint256 result) {
    // success
} catch Error(string memory reason) {
    // reverted with require/revert + message
} catch (bytes memory lowLevelData) {
    // reverted with custom error or no message
}
```


**Events:**


```solidity
// Events are cheap (LOG opcode). Stored in transaction receipts, not state.
// Indexed parameters (max 3) enable efficient off-chain filtering.
event Transfer(address indexed from, address indexed to, uint256 amount);
event Approval(address indexed owner, address indexed spender, uint256 value);

// Emit in functions:
emit Transfer(msg.sender, recipient, amount);

// Off-chain: filter events with ethers.js:
// const events = await contract.queryFilter(contract.filters.Transfer(userAddress));
```


### Day 20–22 — Key contract patterns


**Ownable pattern:**


```solidity
contract Ownable {
    address public owner;
    error NotOwner();

    constructor() { owner = msg.sender; }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}
```


**Reentrancy guard (CEI pattern and mutex):**


```solidity
// WRONG - Reentrancy vulnerable:
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    (bool success,) = msg.sender.call{value: amount}("");  // external call BEFORE state update
    require(success);
    balances[msg.sender] -= amount;  // state updated AFTER — reentrancy can re-enter here
}

// CORRECT - Checks-Effects-Interactions (CEI):
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);  // CHECK
    balances[msg.sender] -= amount;            // EFFECT (state update FIRST)
    (bool success,) = msg.sender.call{value: amount}("");  // INTERACTION last
    require(success);
}

// Also use ReentrancyGuard (OpenZeppelin) as belt-and-suspenders:
uint256 private _status = 1;
modifier nonReentrant() {
    require(_status == 1, "Reentrant call");
    _status = 2;
    _;
    _status = 1;
}
```


**ERC-20 implementation from scratch:**


```solidity
contract ERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _supply) {
        name = _name;
        symbol = _symbol;
        _mint(msg.sender, _supply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;  // reverts on underflow (Solidity 0.8+)
        return _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(to != address(0), "Zero address");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
```


### Day 23–24 — Inheritance, interfaces, and libraries


**Inheritance:**


```solidity
contract Base {
    function foo() external virtual returns (string memory) { return "Base"; }
}
contract Child is Base {
    function foo() external override returns (string memory) { return "Child"; }
}
// Multiple inheritance: C3 linearisation. Order matters.
contract MyToken is ERC20, Ownable, Pausable { ... }
```


**Interfaces:**


```solidity
// Interface: no implementation. No state variables. All functions external.
// Use for interacting with external contracts (e.g., Uniswap, Chainlink)
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

// Using the interface:
IERC20 token = IERC20(0x...tokenAddress);
token.transfer(recipient, amount);
```


**Libraries:**


```solidity
// Library: reusable logic. Deployed once. Called via DELEGATECALL.
library SafeMath {  // (not needed in 0.8+ but illustrative)
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "Overflow");
        return c;
    }
}

// Using for syntax:
using SafeMath for uint256;
uint256 result = a.add(b);  // becomes SafeMath.add(a, b)
```


### Day 25–27 — Advanced Solidity patterns


**Proxy pattern (upgradeable contracts):**


```javascript
User → Proxy Contract (stores state, delegates calls)
             ↓ DELEGATECALL
         Implementation Contract (contains logic, no state)
```

- DELEGATECALL: runs target contract's code in the CALLER's context. Uses caller's storage, msg.sender, msg.value.
- Storage collisions: proxy and implementation must have compatible storage layouts. If slot 0 in proxy is `address admin` and slot 0 in implementation is `uint256 totalSupply` — writing to totalSupply overwrites admin.
- OpenZeppelin Transparent Proxy: admin can only call proxy admin functions (not implementation). Users always go to implementation.
- UUPS (EIP-1822): upgrade logic in the implementation. More gas-efficient. Implementation must call `_authorizeUpgrade`.

**CREATE2 (deterministic deployment):**


```solidity
// Address = keccak256(0xff ++ deployer ++ salt ++ keccak256(bytecode))[12:]
// Lets you predict a contract's address before deployment
// Used by: Uniswap (pair factory), CREATE2 factories for counterfactual wallets
new ContractType{salt: bytes32(salt)}(constructorArgs);
```


**Multi-sig pattern:**

- M-of-N: require M signatures from N authorised signers
- Used for: DAO treasuries, protocol admin keys, timelocks
- Gnosis Safe: most widely used multi-sig. Study its contract architecture.

**Timelock:**


```solidity
// Critical: all admin actions go through a timelock
// Users have time to exit before a malicious/buggy upgrade takes effect
// Minimum 24h for small protocols, 48-72h for major ones
function queue(address target, bytes calldata data, uint256 eta) external onlyOwner {
    require(eta >= block.timestamp + MINIMUM_DELAY, "Too early");
    queue[keccak256(abi.encode(target, data, eta))] = true;
}
function execute(address target, bytes calldata data, uint256 eta) external onlyOwner {
    require(block.timestamp >= eta, "Not yet");
    (bool success,) = target.call(data);
    require(success);
}
```


### Day 28–30 — OpenZeppelin contracts


**Essential OpenZeppelin contracts to study line by line:**

- `ERC20.sol`: the reference ERC-20 implementation. Read every function.
- `ERC721.sol`: the reference NFT implementation.
- `Ownable.sol`: ownership pattern. Two-step transfer (Ownable2Step) prevents ownership loss.
- `AccessControl.sol`: role-based access. More granular than Ownable.
- `ReentrancyGuard.sol`: mutex for preventing reentrancy.
- `Pausable.sol`: emergency pause mechanism.
- `SafeERC20.sol`: wrapper for ERC-20 calls that handles non-standard tokens (USDT returns nothing on transfer).
- `Address.sol`: utilities for address manipulation. `functionCall`, `sendValue`.

**SafeERC20 — why it matters:**


```solidity
// WRONG: some tokens (USDT) return nothing. This reverts.
bool success = IERC20(token).transfer(recipient, amount);
require(success);

// CORRECT: SafeERC20 handles tokens that return nothing OR return false
using SafeERC20 for IERC20;
token.safeTransfer(recipient, amount);
```


### Day 31–33 — Testing with Foundry


**Writing Forge tests:**


```solidity
contract ERC20Test is Test {  // Test provides: vm, console, assertions
    MyToken token;
    address alice = makeAddr("alice");  // deterministic address from name
    address bob = makeAddr("bob");

    function setUp() public {
        token = new MyToken("Test", "TST", 1_000_000e18);
        token.transfer(alice, 1000e18);
    }

    function test_TransferSuccess() public {
        vm.prank(alice);  // next call is from alice
        token.transfer(bob, 500e18);
        assertEq(token.balanceOf(alice), 500e18);
        assertEq(token.balanceOf(bob), 500e18);
    }

    function test_RevertWhen_InsufficientBalance() public {
        vm.prank(alice);
        vm.expectRevert();  // expect next call to revert
        token.transfer(bob, 2000e18);
    }

    // Fuzz testing: Foundry runs 256 times with random inputs
    function testFuzz_Transfer(uint256 amount) public {
        amount = bound(amount, 0, 1000e18);  // constrain to valid range
        vm.prank(alice);
        token.transfer(bob, amount);
        assertEq(token.balanceOf(alice), 1000e18 - amount);
    }
}
```


**Foundry cheatcodes (vm.*):**


```solidity
vm.prank(address)          // next call from this address
vm.startPrank(address)     // all subsequent calls from this address
vm.stopPrank()             // end prank
vm.deal(address, amount)   // set ETH balance
vm.store(addr, slot, val)  // set storage slot directly
vm.load(addr, slot)        // read storage slot
vm.warp(timestamp)         // set block.timestamp
vm.roll(blockNumber)       // set block.number
vm.expectEmit()            // assert event is emitted
vm.expectRevert(bytes)     // assert specific revert
vm.createFork(url)         // fork mainnet
vm.selectFork(forkId)      // switch between forks
```


### Day 34–35 — Gas optimisation


**Most impactful gas optimisations:**


```solidity
// 1. Pack storage variables into the same slot
// BAD: 3 slots used (96 bytes)
uint256 a;    // slot 0 (32 bytes)
uint128 b;    // slot 1 (only 16 bytes used, 16 wasted)
uint128 c;    // slot 2 (only 16 bytes used, 16 wasted)

// GOOD: 2 slots used (64 bytes)
uint256 a;    // slot 0
uint128 b;    // slot 1, bytes 0-15
uint128 c;    // slot 1, bytes 16-31 (packed!)

// 2. Use calldata instead of memory for external function array params
function sum(uint256[] calldata arr) external pure { ... }  // cheaper than memory

// 3. Cache storage reads in memory
// BAD: reads storage 3 times (300 gas)
return arr[i] + arr[i] + arr[i];
// GOOD: reads storage once (100 gas)
uint256 val = arr[i];
return val + val + val;

// 4. Use custom errors instead of strings
error Unauthorised();  // 4 bytes vs 32+ bytes for string
revert Unauthorised(); // much cheaper than revert("Unauthorised")

// 5. ++i instead of i++ in loops
for (uint256 i; i < len; ++i) { ... }  // saves one PUSH opcode

// 6. unchecked arithmetic when overflow is impossible
for (uint256 i; i < len;) {
    // ... loop body ...
    unchecked { ++i; }  // saves ~40 gas per iteration
}

// 7. Use immutable for values set in constructor
address public immutable WETH;  // reads from bytecode (3 gas), not storage (100 gas)
```


---


## 🔨 Projects


### Project 1 — ERC-20 token from scratch


**Deliverable:** Implement a full ERC-20 token with: standard interface, mint/burn (owner only), pause/unpause (owner only), permit (EIP-2612 — gasless approvals via signature). Full test suite: unit tests for every function, fuzz tests for transfer amounts, fork test checking integration with Uniswap router. Gas snapshot. Deployed to Sepolia testnet.


### Project 2 — ERC-721 NFT collection


**Deliverable:** NFT collection with: merkle-proof allowlist minting (not a mapping), public mint phase, max supply cap, on-chain SVG metadata (no IPFS dependency), royalty support (EIP-2981). Fuzz test the merkle proof verification. Test that max supply cannot be exceeded. Deploy to Sepolia.


### Project 3 — Upgradeable vault (UUPS proxy)


**Deliverable:** A token vault contract with UUPS upgradeability. V1: deposit/withdraw ERC-20 tokens, track share price. V2: add yield strategy (simulate with a yield source contract). Write a Foundry script that deploys V1, deposits funds, upgrades to V2, and verifies the existing deposits are unaffected. Test that a non-owner cannot trigger the upgrade.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Not following Checks-Effects-Interactions.**


Every reentrancy attack in history traces to the same root cause: external calls before state updates. The DAO hack ($60M), [Lendf.me](http://lendf.me/), Cream Finance, and dozens more.


**✅ Correct approach:** Always: CHECK conditions first, EFFECT state changes second, INTERACT with external contracts last. Add `nonReentrant` as a second layer of defence. Never assume an external call is safe.


### Mistake 2


**❌ Dividing before multiplying (precision loss).**


`(a / b) * c` loses precision due to integer division. `(a * c) / b` preserves it.


**✅ Correct approach:** In all financial calculations, multiply before dividing. Use fixed-point arithmetic with sufficient precision (1e18 scale). Study how Uniswap and Compound handle this.


### Mistake 3


**❌ Assuming** **`transfer()`** **and** **`send()`** **are safe for ETH.**


`address.transfer()` and `address.send()` forward only 2300 gas. Many contracts (especially smart contract wallets) need more gas to receive ETH. They will silently fail or revert.


**✅ Correct approach:** Use `address.call{value: amount}("")` and check the return value. This forwards all available gas. Pattern: `(bool success, ) = recipient.call{value: amount}(""); require(success);`


### Mistake 4


**❌ Not handling ERC-20 tokens that don't return a bool.**


USDT, some older tokens return nothing (not `true`) on `transfer`. Calling `require(token.transfer(...))` reverts with these tokens.


**✅ Correct approach:** Always use `SafeERC20.safeTransfer()` from OpenZeppelin. Every protocol that handles arbitrary ERC-20 tokens must use this.


## Phase 3 — DeFi & Protocol Design (Days 36–55)
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


## Phase 4 — Security & Auditing (Days 56–75)
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


## Phase 5 — Advanced & Full-Stack Web3 (Days 76–90)
> **Core insight:** The blockchain landscape in 2025 is not Ethereum mainnet alone. It is a multi-chain ecosystem of L2s, app-chains, and cross-chain protocols. The engineer who understands only L1 Solidity is missing 80% of where the action — and the users — actually are. This phase makes you fluent in the full production stack.

---


## 📚 Topics in order


### Day 76–77 — Layer 2 scaling solutions


**Why L2s:** Ethereum L1 processes ~15 TPS. Costs $5-50 per transaction during congestion. L2s move computation off-chain while inheriting Ethereum’s security.


**Rollups — the dominant L2 paradigm:**

- Execute transactions off-chain in batches
- Post compressed transaction data to L1 (data availability)
- L1 enforces correctness via fraud proofs (optimistic) or validity proofs (ZK)

**Optimistic Rollups (Optimism, Arbitrum):**

- Assume transactions are valid by default (optimistic)
- Fraud proof window: 7 days. Anyone can submit a fraud proof showing a transaction was invalid.
- After 7 days, the state is finalised on L1
- Withdrawal from L2 to L1: 7-day delay (fraud proof window). Bridges can provide fast withdrawals for a fee.
- EVM-equivalent: Arbitrum One and Optimism are nearly identical to EVM. Deploy the same Solidity code.

**ZK Rollups (zkSync Era, Polygon zkEVM, Scroll, StarkNet):**

- Generate a zero-knowledge proof (validity proof) that all transactions in the batch were executed correctly
- L1 verifies the proof: if valid, state transition is final immediately
- No fraud window: withdrawals are fast
- EVM compatibility varies: zkSync Era has minor differences. StarkNet uses Cairo (different language).
- Proof generation is computationally expensive — requires specialized hardware

**Key differences for developers:**


```javascript
Optimistic rollup:
- Finality: 7 days (for L1 finality)
- EVM compatibility: near-perfect
- Complexity: lower
- Trust: cryptoeconomic (fraud proofs)

ZK rollup:
- Finality: minutes (after proof posted to L1)
- EVM compatibility: varies (getting better)
- Complexity: higher
- Trust: cryptographic (math proofs)
```


**Deploying to L2:**


```bash
# Same Solidity code, different RPC URL
forge script script/Deploy.s.sol \
  --rpc-url https://mainnet.optimism.io \
  --broadcast \
  --private-key $PRIVATE_KEY

# Arbitrum
forge script script/Deploy.s.sol \
  --rpc-url https://arb1.arbitrum.io/rpc \
  --broadcast
```


**L2-specific considerations:**

- Gas costs: L2 gas (execution) + L1 data cost. L1 data cost dominates for simple transactions.
- Sequencer centralisation: most L2s have a centralised sequencer today. Risk: censorship, downtime.
- Bridge risk: bridging assets between L1 and L2 is a major attack surface (Ronin: $625M, Nomad: $190M, Wormhole: $320M)
- Chain ID: each L2 has a unique chain ID. Always verify you’re on the right chain.

### Day 78–79 — Zero-knowledge proofs (intuition)


**ZK proofs — what they enable:**


Prove that you know something (or that a computation was done correctly) WITHOUT revealing the underlying data.


**Examples:**

- Prove you are over 18 without revealing your birthdate
- Prove a transaction was valid without revealing the transaction details
- Prove that 1000 transactions all followed the rules without re-executing them on-chain

**zk-SNARKs vs zk-STARKs:**

- SNARK (Succinct Non-interactive ARgument of Knowledge): small proof size (~200 bytes). Requires trusted setup.
- STARK (Scalable Transparent ARgument of Knowledge): larger proofs. No trusted setup. Quantum-resistant.
- Groth16 (SNARK): used in Zcash, Tornado Cash. Very small proofs, fast verification.
- PLONK (SNARK): universal trusted setup. Used in many modern ZK protocols.

**Circom — writing ZK circuits:**


```javascript
// A circuit proves you know a preimage of a hash without revealing the preimage
pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template HashPreimage() {
    signal input preimage;   // private input (secret)
    signal input hash;       // public input (known to verifier)
    signal output valid;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== preimage;
    hash === hasher.out;     // constraint: hash must equal Poseidon(preimage)
    valid <== 1;
}

component main {public [hash]} = HashPreimage();
```


**zkApps and ZK-native applications:**

- Private voting: prove you voted without revealing your vote
- Private DeFi: prove you have enough collateral without revealing your positions
- Identity: prove attributes about yourself without revealing your identity
- Recursive proofs: prove that you correctly verified a proof (enables infinite scalability)

### Day 80–81 — Cross-chain protocols and bridges


**Bridge architectures:**


**Lock-and-mint:**

- Lock asset on chain A → mint synthetic on chain B
- Bridge is custodian of locked assets — massive single point of failure
- Ronin bridge ($625M hack): validator keys compromised

**Liquidity pools:**

- Pools of assets on both chains. User swaps on one side, receives from the other.
- Connext, Hop Protocol
- No lock-and-mint — no synthetic assets. Uses native assets.

**Message passing (general):**

- Arbitrary data (not just assets) sent between chains
- LayerZero, Axelar, Wormhole, Chainlink CCIP
- Risk: the oracle/relayer can lie about the cross-chain message

**Cross-chain security:**

- Bridges are the most exploited category in crypto ($2.5B+ lost in bridge hacks)
- Trust minimisation: use bridges that rely on the destination chain’s consensus (official bridges) where possible
- Amount limits: set maximum bridge amounts per transaction and per time window
- Monitoring: alert on any unusual cross-chain message

**LayerZero (OFT — Omnichain Fungible Token):**


```solidity
// Deploy your token on multiple chains as an OFT
// LayerZero handles cross-chain transfers natively
contract MyOFT is OFT {
    constructor(string memory _name, string memory _symbol, address _lzEndpoint)
        OFT(_name, _symbol, _lzEndpoint) {}
}
// Send tokens cross-chain:
myToken.sendFrom{value: fee}(
    msg.sender,     // from
    dstChainId,     // LayerZero chain ID
    toAddress,      // recipient on destination
    amount,         // tokens to send
    payable(msg.sender), // refund address
    address(0),     // ZRO payment (unused)
    adapterParams   // gas settings for destination chain
);
```


### Day 82–83 — Full-stack dApp development


**Modern Web3 frontend stack:**


```javascript
Next.js 14 (App Router)
  + wagmi v2 (React hooks for Ethereum)
  + viem (TypeScript Ethereum client, replaces ethers.js)
  + RainbowKit (wallet connection UI)
  + TanStack Query (data fetching + caching)
```


**Wagmi v2 + viem setup:**


```typescript
// config.ts
import { createConfig, http } from 'wagmi'
import { mainnet, optimism, arbitrum, sepolia } from 'wagmi/chains'
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, optimism, arbitrum, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'My App' }),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_ID! }),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_KEY!),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [sepolia.id]: http(),
  },
})
```


**Reading from contracts:**


```typescript
import { useReadContract, useReadContracts } from 'wagmi'
import { erc20Abi } from 'viem'

// Read a single value
const { data: balance } = useReadContract({
  address: TOKEN_ADDRESS,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [userAddress],
})

// Read multiple values in one RPC call (multicall)
const { data } = useReadContracts({
  contracts: [
    { address: TOKEN, abi: erc20Abi, functionName: 'name' },
    { address: TOKEN, abi: erc20Abi, functionName: 'symbol' },
    { address: TOKEN, abi: erc20Abi, functionName: 'totalSupply' },
  ]
})
```


**Writing to contracts:**


```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

function TransferButton() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  return (
    <button
      disabled={isPending}
      onClick={() => writeContract({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipient, parseEther('1.0')],
      })}
    >
      {isPending ? 'Confirming...' : isConfirming ? 'Mining...' : 'Send 1 ETH'}
    </button>
  )
}
```


**The Graph — indexing blockchain data:**


```graphql
# schema.graphql
type Transfer @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  amount: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
}

type Account @entity {
  id: ID!
  balance: BigInt!
  transfersOut: [Transfer!]! @derivedFrom(field: "from")
  transfersIn: [Transfer!]! @derivedFrom(field: "to")
}
```


```typescript
// Query from frontend:
const { data } = useQuery(gql`
  query GetTransfers($user: Bytes!) {
    transfers(where: { from: $user }, orderBy: timestamp, orderDirection: desc, first: 20) {
      id
      to
      amount
      timestamp
    }
  }
`, { variables: { user: address } })
```


### Day 84–85 — Account abstraction (ERC-4337)


**The problem with EOAs:**

- Must hold ETH to pay gas
- One private key = total loss if compromised
- Cannot batch transactions
- No programmable spending limits or social recovery

**ERC-4337: Account Abstraction without protocol changes:**


```javascript
UserOperation (meta-transaction)
  ↓
 Bundler (collects UserOps, submits as single L1 transaction)
  ↓
 EntryPoint contract (validates + executes)
  ↓
 Smart Account (validates signature, executes call)
  ↓
 Paymaster (optional: sponsors gas on behalf of user)
```


**Smart account capabilities:**

- Sponsored transactions: protocol pays gas for users (paymaster)
- Social recovery: lose your phone? 3-of-5 guardians can restore access
- Session keys: limited-permission keys for games/dApps
- Batch transactions: approve + swap in one transaction
- Multi-sig natively: require 2-of-3 signatures for large transfers

**Using Biconomy / ZeroDev / Safe:**


```typescript
import { createSmartAccountClient } from "@biconomy/account";

const smartAccount = await createSmartAccountClient({
  signer,
  bundlerUrl: `https://bundler.biconomy.io/api/v2/1/...`,
  biconomyPaymasterApiKey: process.env.PAYMASTER_KEY,
});

// Sponsor gas for user (user pays nothing):
const tx = await smartAccount.sendTransaction(
  { to: CONTRACT, data: calldata },
  { paymasterServiceData: { mode: PaymasterMode.SPONSORED } }
);
```


### Day 86–87 — IPFS and decentralised storage


**IPFS (InterPlanetary File System):**

- Content-addressed storage: files identified by their content hash (CID)
- `CID = multihash(content)`. Same content = same CID. Any change = new CID.
- Not a blockchain. Not permanent by default. Content is served only while someone is pinning it.
- NFT metadata: most NFTs store metadata on IPFS. The NFT contract points to the IPFS URI.

**Pinning services:**

- Pinata, [NFT.Storage](http://nft.storage/), [Web3.Storage](http://web3.storage/): paid services that keep your content available
- Filecoin: blockchain-based storage market. Pay miners to store content with cryptographic proof.

**Using IPFS with Foundry/scripts:**


```javascript
const { create } = require('ipfs-http-client');
const client = create({ url: 'https://api.pinata.cloud' });

// Upload metadata
const metadata = { name: "My NFT #1", image: "ipfs://CID", attributes: [...] };
const result = await client.add(JSON.stringify(metadata));
const uri = `ipfs://${result.cid}`;
```


**On-chain SVG (fully on-chain NFTs):**


```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    string memory svg = string(abi.encodePacked(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
        '<rect width="100" height="100" fill="#', _getColor(tokenId), '"/>',
        '<text x="50" y="50" text-anchor="middle">#', tokenId.toString(), '</text>',
        '</svg>'
    ));

    string memory json = Base64.encode(bytes(string(abi.encodePacked(
        '{"name":"Token #', tokenId.toString(), '",',
        '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
    ))));

    return string(abi.encodePacked('data:application/json;base64,', json));
}
```


### Day 88–90 — Production dApp capstone


**Day 88 — Architecture:**


Design and document a production dApp with:

- Smart contract architecture diagram (all contracts, their relationships, external dependencies)
- Security threat model (who are the actors, what is the worst they can do?)
- Frontend architecture (component tree, data flow, wallet connection flow)
- Indexing strategy (which events to index, The Graph subgraph schema)
- Deployment strategy (which chains, upgrade mechanism, timelock configuration)

**Day 89 — Build and test:**

- Implement all smart contracts with full test coverage
- Deploy to multiple testnets (Sepolia, Optimism Sepolia, Arbitrum Sepolia)
- Build the Next.js frontend with wagmi + RainbowKit
- Deploy The Graph subgraph to The Graph Studio
- Connect frontend to subgraph for historical data

**Day 90 — Security and production hardening:**

- Run Slither on all contracts. Fix all findings.
- Write an Echidna invariant test suite
- Set up a bug bounty scope on Immunefi (testnet)
- Add contract monitoring with Tenderly or OpenZeppelin Defender
- Write a complete README: architecture, security considerations, deployment guide, audit findings

---


## 🔨 Projects


### Project 1 — Multi-chain token deployment


**Stack:** Solidity, Foundry, LayerZero OFT, wagmi


Deploy an OFT (Omnichain Fungible Token) on Ethereum Sepolia, Optimism Sepolia, and Arbitrum Sepolia. Build a frontend with wagmi that lets users bridge tokens between chains. Show live balance on each chain. Handle bridge status (pending, completed). Full error handling for failed bridges.


### Project 2 — Full-stack DeFi dApp


**Stack:** Solidity (AMM from Phase 3), Next.js, wagmi, viem, RainbowKit, The Graph


Build a production-grade frontend for your AMM:

- Swap interface with price impact calculation and slippage settings
- Liquidity management (add/remove liquidity with share calculation)
- Pool analytics dashboard powered by The Graph subgraph
- Transaction history per wallet
- Mobile-responsive. Works on MetaMask mobile.

### Project 3 — The Flagship: Production-grade DeFi protocol


**This is your portfolio centrepiece.**


Build a complete, original DeFi protocol (your choice: AMM, lending, yield aggregator, NFT marketplace). Requirements:

- Smart contracts: 100% test coverage, Echidna invariants, Slither clean
- Frontend: full-stack Next.js + wagmi + The Graph
- Security: timelocked admin, multi-sig required for upgrades, public bug bounty scope
- Deployment: mainnet (if confident) or multi-chain testnet
- Documentation: full technical docs, architecture diagram, security considerations, integration guide
- Open source: public GitHub with clean commit history

**This single project should demonstrate:**

- Deep Solidity knowledge
- Security-first thinking
- Full-stack Web3 engineering
- Protocol design reasoning
- Production engineering practices

---


## ⚠️ Common mistakes


### Mistake 1


**❌ Building on L1 only and ignoring L2s.**


Ethereum L1 has <5% of daily active users compared to L2s combined. Most new users start on Arbitrum, Optimism, or Base. A dApp that only works on L1 is inaccessible to the majority of the market.


**✅ Correct approach:** Deploy to at least one L2 from day one. Use chain-agnostic patterns (wagmi handles multiple chains natively). Consider deploying to Base — it has the most consumer activity in 2025.


### Mistake 2


**❌ Reading all historical data from an RPC node.**


`getPastEvents()` or `queryFilter()` over large block ranges times out on public RPCs and is expensive on paid ones. Fetching all Transfer events for a popular token from block 0 is essentially impossible via RPC.


**✅ Correct approach:** Use The Graph for historical data. Use events (not storage reads) for everything that needs to be queryable. Design your subgraph schema before writing your contracts — events are your database schema.


### Mistake 3


**❌ Not handling transaction states in the frontend.**


A user clicks “Swap,” the transaction is submitted, and… nothing happens visually for 15 seconds until it confirms. They click again. Now two transactions are in-flight.


**✅ Correct approach:** Show state transitions: idle → pending signature → submitted (show tx hash) → confirming (show block confirmations) → confirmed or failed. Disable the button during pending/confirming. Use `useWaitForTransactionReceipt` from wagmi.


### Mistake 4


**❌ Hardcoding chain IDs and contract addresses.**


Your code has `if (chainId === 1) { address = "0x..." } else { address = "0x...other" }` scattered across 20 files. When you add a new chain, you miss 5 of them.


**✅ Correct approach:** Define a single deployment config object:


```typescript
const deployments = {
  [mainnet.id]: { token: '0x...', pool: '0x...' },
  [optimism.id]: { token: '0x...', pool: '0x...' },
} as const;
const addresses = deployments[chainId];
```


Generate this automatically from Foundry broadcast artifacts.

