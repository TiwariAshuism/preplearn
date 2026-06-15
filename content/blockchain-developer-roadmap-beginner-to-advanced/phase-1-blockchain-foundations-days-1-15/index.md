---
source: notion
title: "Phase 1 — Blockchain Foundations (Days 1–15)"
slug: "phase-1-blockchain-foundations-days-1-15"
notionId: "362da883-bddd-81d9-822b-e0f08c6b7ea0"
notionRootId: "362da883bddd81cd8c6fd78fe5fec86f"
parent: "blockchain-developer-roadmap-beginner-to-advanced"
children: []
order: 4
icon: "⛓️"
cover: null
---
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

