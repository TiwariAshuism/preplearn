---
source: notion
title: "Phase 5 — Advanced & Interview Prep (Days 76–90)"
slug: "phase-5-advanced-and-interview-prep-days-76-90"
notionId: "384da883-bddd-8123-ab85-fcce442328d5"
notionRootId: "383da883bddd81feae11fbbfc249f450"
parent: "90-day-dsa-roadmap-beginner-to-advanced"
children: []
order: 1
icon: "🎯"
cover: null
---
> **Core insight:** The last 15 days are not about learning new fundamentals — they're about handling the questions that combine multiple patterns, recognizing advanced DP shapes (bitmask, interval, state machine), and most importantly, simulating the real interview experience under time pressure with a thinking process you can verbalize.

---


## Pattern 21: Advanced DP — Bitmask DP (Days 76-78)


### What it is


When the state includes "which subset of items have been used," represent that subset as a bitmask (integer where bit i = item i is used/visited). Works well when n ≤ 20.


```python
# Traveling Salesman Problem (bitmask DP)
def tsp(dist):
    n = len(dist)
    dp = [[float('inf')] * n for _ in range(1 << n)]
    dp[1][0] = 0  # start at city 0, only city 0 visited

    for mask in range(1 << n):
        for u in range(n):
            if not (mask & (1 << u)) or dp[mask][u] == float('inf'):
                continue
            for v in range(n):
                if mask & (1 << v): continue  # already visited
                new_mask = mask | (1 << v)
                dp[new_mask][v] = min(dp[new_mask][v], dp[mask][u] + dist[u][v])

    full_mask = (1 << n) - 1
    return min(dp[full_mask][u] + dist[u][0] for u in range(1, n))

# Partition to K Equal Sum Subsets (bitmask DP)
def canPartitionKSubsets(nums, k):
    total = sum(nums)
    if total % k: return False
    target = total // k
    n = len(nums)
    nums.sort(reverse=True)
    if nums[0] > target: return False

    memo = {}
    def backtrack(mask, remaining):
        if mask == (1 << n) - 1: return True
        if remaining == 0: remaining = target
        if (mask, remaining) in memo: return memo[(mask, remaining)]
        for i in range(n):
            if mask & (1 << i) or nums[i] > remaining: continue
            if backtrack(mask | (1 << i), remaining - nums[i]):
                memo[(mask, remaining)] = True
                return True
        memo[(mask, remaining)] = False
        return False
    return backtrack(0, target)

# Shortest Path Visiting All Nodes (BFS + bitmask)
from collections import deque
def shortestPathLength(graph):
    n = len(graph)
    full = (1 << n) - 1
    queue = deque([(i, 1 << i, 0) for i in range(n)])
    visited = {(i, 1 << i) for i in range(n)}
    while queue:
        node, mask, steps = queue.popleft()
        if mask == full: return steps
        for nei in graph[node]:
            new_mask = mask | (1 << nei)
            if (nei, new_mask) not in visited:
                visited.add((nei, new_mask))
                queue.append((nei, new_mask, steps + 1))
    return -1
```


### Key problems

- LC 943 — Find the Shortest Superstring (hard)
- LC 698 — Partition to K Equal Sum Subsets (medium)
- LC 847 — Shortest Path Visiting All Nodes (hard)
- LC 1947 — Maximum Compatibility Score Sum (medium)

---


## Pattern 22: Advanced DP — Interval and State Machine DP (Days 79-81)


```python
# Interval DP: Burst Balloons
def maxCoins(nums):
    nums = [1] + nums + [1]
    n = len(nums)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):
        for left in range(n - length):
            right = left + length
            for k in range(left + 1, right):
                coins = nums[left] * nums[k] * nums[right]
                coins += dp[left][k] + dp[k][right]
                dp[left][right] = max(dp[left][right], coins)
    return dp[0][n-1]

# Interval DP: Matrix Chain Multiplication style (Minimum Cost to Merge Stones)
def mergeStones(stones, k):
    n = len(stones)
    if (n - 1) % (k - 1): return -1
    prefix = [0] * (n + 1)
    for i in range(n): prefix[i+1] = prefix[i] + stones[i]

    dp = [[0] * n for _ in range(n)]
    for length in range(k, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = min(dp[i][m] + dp[m+1][j]
                          for m in range(i, j, k - 1))
            if (length - 1) % (k - 1) == 0:
                dp[i][j] += prefix[j+1] - prefix[i]
    return dp[0][n-1]

# State Machine DP: Best Time to Buy/Sell Stock with Cooldown
def maxProfit(prices):
    sold, held, rest = float('-inf'), float('-inf'), 0
    for p in prices:
        prev_sold = sold
        sold = held + p          # sell today
        held = max(held, rest - p)  # buy today or keep holding
        rest = max(rest, prev_sold)  # cooldown or keep resting
    return max(sold, rest)

# State Machine DP: Buy/Sell Stock with Transaction Fee
def maxProfitFee(prices, fee):
    cash, hold = 0, -prices[0]
    for p in prices[1:]:
        cash = max(cash, hold + p - fee)
        hold = max(hold, cash - p)
    return cash
```


### Key problems

- LC 312 — Burst Balloons (hard)
- LC 1000 — Minimum Cost to Merge Stones (hard)
- LC 309 — Best Time to Buy/Sell Stock with Cooldown (medium)
- LC 714 — Best Time to Buy/Sell Stock with Transaction Fee (medium)
- LC 1335 — Minimum Difficulty of a Job Schedule (hard)

---


## Pattern 23: Advanced Graphs — MST, Advanced Dijkstra (Days 82-84)


```python
import heapq

# Minimum Spanning Tree: Prim's Algorithm
def minimumSpanningTreePrim(n, edges):
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((w, v))
        graph[v].append((w, u))

    visited = set([0])
    heap = graph[0][:]
    heapq.heapify(heap)
    total_cost = 0

    while heap and len(visited) < n:
        w, node = heapq.heappop(heap)
        if node in visited: continue
        visited.add(node)
        total_cost += w
        for nw, nv in graph[node]:
            if nv not in visited:
                heapq.heappush(heap, (nw, nv))

    return total_cost if len(visited) == n else -1

# Minimum Spanning Tree: Kruskal's Algorithm (with Union-Find)
def minimumSpanningTreeKruskal(n, edges):
    edges.sort(key=lambda x: x[2])  # sort by weight
    uf = UnionFind(n)
    total_cost = 0
    edges_used = 0
    for u, v, w in edges:
        if uf.union(u, v):
            total_cost += w
            edges_used += 1
            if edges_used == n - 1: break
    return total_cost if edges_used == n - 1 else -1

# Dijkstra with state (e.g., "at most K stops")
def findCheapestPrice(n, flights, src, dst, k):
    graph = defaultdict(list)
    for u, v, w in flights:
        graph[u].append((v, w))

    # state: (cost, node, stops_used)
    heap = [(0, src, 0)]
    best = {}

    while heap:
        cost, node, stops = heapq.heappop(heap)
        if node == dst: return cost
        if stops > k: continue
        if (node, stops) in best and best[(node, stops)] <= cost: continue
        best[(node, stops)] = cost
        for nei, w in graph[node]:
            heapq.heappush(heap, (cost + w, nei, stops + 1))
    return -1
```


### Key problems

- LC 1584 — Min Cost to Connect All Points (MST, medium)
- LC 1135 — Connecting Cities With Minimum Cost (MST, medium)
- LC 787 — Cheapest Flights Within K Stops (Dijkstra+state, medium)
- LC 1631 — Path With Minimum Effort (Dijkstra/Binary Search, medium)
- LC 778 — Swim in Rising Water (Dijkstra/Union-Find, hard)

---


## Day 85: System design adjacent — LRU/LFU Cache


```python
# LRU Cache: hashmap + doubly linked list (O(1) get/put)
class Node:
    def __init__(self, key, val):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.cache = {}
        self.left, self.right = Node(0, 0), Node(0, 0)
        self.left.next, self.right.prev = self.right, self.left

    def _remove(self, node):
        prev, nxt = node.prev, node.next
        prev.next, nxt.prev = nxt, prev

    def _insert(self, node):
        prev, nxt = self.right.prev, self.right
        prev.next = nxt.prev = node
        node.prev, node.next = prev, nxt

    def get(self, key):
        if key in self.cache:
            self._remove(self.cache[key])
            self._insert(self.cache[key])
            return self.cache[key].val
        return -1

    def put(self, key, value):
        if key in self.cache:
            self._remove(self.cache[key])
        self.cache[key] = Node(key, value)
        self._insert(self.cache[key])
        if len(self.cache) > self.cap:
            lru = self.left.next
            self._remove(lru)
            del self.cache[lru.key]
```


### Key problems

- LC 146 — LRU Cache (medium)
- LC 460 — LFU Cache (hard)
- LC 432 — All O`one Data Structure (hard)

---


## Days 86-90: Mock Interview Week


### How to run a proper mock interview on yourself


```javascript
1. Pick a problem you HAVEN'T seen (random from a curated 75/150 list)
2. Set a 35-minute timer
3. Read the problem ONCE. State the problem back in your own words out loud.
4. Ask yourself clarifying questions (constraints, edge cases, input size)
5. Think of brute force FIRST. State its time complexity.
6. Identify the pattern. Say it out loud: "this looks like sliding window because..."
7. Code it. Talk through your code as you write it (practice narrating).
8. Trace through 1-2 examples by hand before declaring done.
9. State final time/space complexity.
10. If stuck after 20 min: look at ONE hint, not the solution. Try again.
```


### Day 86: Mock Interview 1 (Arrays/Strings/Two Pointer mix)


Pick 2 medium problems from Phase 1. Full mock process. Record yourself if possible.


### Day 87: Mock Interview 2 (Trees/Graphs mix)


Pick 2 medium problems from Phase 2-3. Full mock process.


### Day 88: Mock Interview 3 (DP mix)


Pick 2 medium-hard DP problems from Phase 4. Full mock process.


### Day 89: Mock Interview 4 (Mixed bag — simulate real interview)


Pick 1 easy (warmup) + 1 hard (main). Full 45-min interview simulation.


### Day 90: Final review

- Go back through every problem marked "Revisit" in your tracker
- Re-solve 10 problems cold (no notes) across different patterns
- Write a 1-page "pattern recognition cheat sheet" in your own words
- Review time/space complexity for every data structure operation

---


## The pattern recognition decision tree (memorize this)


```javascript
Is it about a SUBARRAY/SUBSTRING (contiguous)?
  -> Sliding Window or Prefix Sum

Is the array SORTED or can be sorted?
  -> Two Pointers or Binary Search

Is it about finding pairs/duplicates/grouping?
  -> HashMap

Is it a TREE problem?
  -> DFS (recursive) for most. BFS for level-order/shortest path.

Is it a GRAPH problem?
  -> BFS for shortest unweighted path
  -> Dijkstra for shortest weighted path (non-negative)
  -> Union-Find for connectivity/components
  -> Topological sort for dependency ordering

Does it ask for ALL possible combinations/permutations/subsets?
  -> Backtracking

Does it ask for MIN/MAX/COUNT of ways, with OVERLAPPING subproblems?
  -> Dynamic Programming
  -> Identify: 1D, 2D grid, knapsack, two-string, or interval shape

Does greedy choice seem to obviously work? PROVE it first.
  -> Greedy (sort + single pass usually)

Does it need TOP-K or repeatedly extract min/max?
  -> Heap

Is it about STRING PREFIXES (autocomplete, word search)?
  -> Trie
```


---


## Phase 5 problem list (20 problems)


| #  | Problem                             | Pattern                | Difficulty |
| -- | ----------------------------------- | ---------------------- | ---------- |
| 1  | Partition to K Equal Sum Subsets    | Bitmask DP             | Medium     |
| 2  | Shortest Path Visiting All Nodes    | Bitmask DP + BFS       | Hard       |
| 3  | Find the Shortest Superstring       | Bitmask DP             | Hard       |
| 4  | Burst Balloons                      | Interval DP            | Hard       |
| 5  | Minimum Cost to Merge Stones        | Interval DP            | Hard       |
| 6  | Best Time to Buy/Sell with Cooldown | State Machine DP       | Medium     |
| 7  | Best Time to Buy/Sell with Fee      | State Machine DP       | Medium     |
| 8  | Minimum Difficulty of Job Schedule  | Interval DP            | Hard       |
| 9  | Min Cost to Connect All Points      | MST (Prim/Kruskal)     | Medium     |
| 10 | Connecting Cities with Min Cost     | MST                    | Medium     |
| 11 | Cheapest Flights Within K Stops     | Dijkstra + State       | Medium     |
| 12 | Path With Minimum Effort            | Dijkstra/Binary Search | Medium     |
| 13 | Swim in Rising Water                | Dijkstra/Union-Find    | Hard       |
| 14 | LRU Cache                           | Design                 | Medium     |
| 15 | LFU Cache                           | Design                 | Hard       |
| 16 | All O`one Data Structure            | Design                 | Hard       |
| 17 | Design Twitter                      | Design + Heap          | Medium     |
| 18 | Insert Delete GetRandom O(1)        | Design                 | Medium     |
| 19 | Find Median from Data Stream        | Two Heaps              | Hard       |
| 20 | Alien Dictionary                    | Topological Sort       | Hard       |

