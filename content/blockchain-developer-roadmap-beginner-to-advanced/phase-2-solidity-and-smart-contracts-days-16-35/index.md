---
source: notion
title: "Phase 2 — Solidity & Smart Contracts (Days 16–35)"
slug: "phase-2-solidity-and-smart-contracts-days-16-35"
notionId: "362da883-bddd-81e7-98d7-c55887ebfe46"
notionRootId: "362da883bddd81cd8c6fd78fe5fec86f"
parent: "blockchain-developer-roadmap-beginner-to-advanced"
children: []
order: 3
icon: "🔷"
cover: null
---
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

