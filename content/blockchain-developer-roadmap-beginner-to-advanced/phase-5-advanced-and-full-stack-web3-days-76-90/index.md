---
source: notion
title: "Phase 5 — Advanced & Full-Stack Web3 (Days 76–90)"
slug: "phase-5-advanced-and-full-stack-web3-days-76-90"
notionId: "362da883-bddd-8131-850d-faedb1303083"
notionRootId: "362da883bddd81cd8c6fd78fe5fec86f"
parent: "blockchain-developer-roadmap-beginner-to-advanced"
children: []
order: 0
icon: "🚀"
cover: null
---
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

