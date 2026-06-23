---
source: notion
title: "Phase 4 — Core Algorithms (Days 56–75)"
slug: "phase-4-core-algorithms-days-56-75"
notionId: "384da883-bddd-8145-90cb-cfff3bf2f871"
notionRootId: "383da883bddd81feae11fbbfc249f450"
parent: "90-day-dsa-roadmap-beginner-to-advanced"
children: []
order: 2
icon: "🔴"
cover: null
---
> **Core insight:** Dynamic programming is just recursion plus memory. The hardest part is not the code — it's recognizing the recurrence relation. This phase builds the recognition skill through 6 canonical DP shapes that cover ~90% of all DP interview problems, plus backtracking and greedy as siblings of the same "explore the state space" idea.

---


## Pattern 16: Recursion and Backtracking (Days 56-60)


### What it is


Explore all possibilities via recursive choice-making, undoing choices ("backtracking") when a path doesn't work. The template is always: choose → explore → unchoose.


```python
# Subsets (the backtracking template)
def subsets(nums):
    result = []
    def backtrack(start, path):
        result.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])       # choose
            backtrack(i + 1, path)     # explore
            path.pop()                  # unchoose
    backtrack(0, [])
    return result

# Permutations
def permute(nums):
    result = []
    def backtrack(path, remaining):
        if not remaining:
            result.append(path[:]); return
        for i in range(len(remaining)):
            path.append(remaining[i])
            backtrack(path, remaining[:i] + remaining[i+1:])
            path.pop()
    backtrack([], nums)
    return result

# Combination Sum (reuse allowed)
def combinationSum(candidates, target):
    result = []
    def backtrack(start, path, remaining):
        if remaining == 0:
            result.append(path[:]); return
        if remaining < 0: return
        for i in range(start, len(candidates)):
            path.append(candidates[i])
            backtrack(i, path, remaining - candidates[i])  # i, not i+1: reuse allowed
            path.pop()
    backtrack(0, [], target)
    return result

# N-Queens (constraint satisfaction backtracking)
def solveNQueens(n):
    result = []
    cols, diag1, diag2 = set(), set(), set()
    board = [['.'] * n for _ in range(n)]

    def backtrack(row):
        if row == n:
            result.append([''.join(r) for r in board]); return
        for col in range(n):
            if col in cols or (row-col) in diag1 or (row+col) in diag2: continue
            cols.add(col); diag1.add(row-col); diag2.add(row+col)
            board[row][col] = 'Q'
            backtrack(row + 1)
            cols.remove(col); diag1.remove(row-col); diag2.remove(row+col)
            board[row][col] = '.'
    backtrack(0)
    return result

# Word Search (grid backtracking)
def exist(board, word):
    rows, cols = len(board), len(board[0])
    def backtrack(r, c, i):
        if i == len(word): return True
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            board[r][c] != word[i]): return False
        temp = board[r][c]
        board[r][c] = '#'
        found = any(backtrack(r+dr, c+dc, i+1) for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)])
        board[r][c] = temp
        return found
    return any(backtrack(r, c, 0) for r in range(rows) for c in range(cols))
```


### Key problems

- LC 78 — Subsets (medium)
- LC 46 — Permutations (medium)
- LC 39 — Combination Sum (medium)
- LC 51 — N-Queens (hard)
- LC 79 — Word Search (medium)
- LC 22 — Generate Parentheses (medium)
- LC 131 — Palindrome Partitioning (medium)

---


## Pattern 17: DP — 1D (Days 61-64)


### The 6 DP shapes you need to recognize


```javascript
1. Linear 1D:        dp[i] depends on dp[i-1], dp[i-2], ...
2. Grid 2D:           dp[i][j] depends on dp[i-1][j], dp[i][j-1]
3. Knapsack (0/1):    dp[i][w] depends on include/exclude item i
4. Unbounded Knapsack: dp[w] depends on dp[w - weight] (item reusable)
5. LCS / Two strings: dp[i][j] depends on dp[i-1][j-1], dp[i-1][j], dp[i][j-1]
6. Interval DP:        dp[i][j] depends on dp[i][k] + dp[k+1][j] for k in (i,j)
```


```python
# Climbing Stairs (the simplest 1D DP)
def climbStairs(n):
    if n <= 2: return n
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev1 + prev2
    return prev1

# House Robber
def rob(nums):
    prev2 = prev1 = 0
    for n in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + n)
    return prev1

# Coin Change (unbounded knapsack, min coins)
def coinChange(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if a - c >= 0:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1

# Longest Increasing Subsequence (O(n^2) DP, then O(n log n) with binary search)
def lengthOfLIS(nums):
    dp = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)

# O(n log n) version using patience sorting
import bisect
def lengthOfLIS_fast(nums):
    tails = []
    for n in nums:
        i = bisect.bisect_left(tails, n)
        if i == len(tails): tails.append(n)
        else: tails[i] = n
    return len(tails)

# Word Break
def wordBreak(s, wordDict):
    words = set(wordDict)
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True; break
    return dp[len(s)]
```


### Key problems

- LC 70 — Climbing Stairs (easy)
- LC 198 — House Robber (medium)
- LC 213 — House Robber II (medium)
- LC 322 — Coin Change (medium)
- LC 300 — Longest Increasing Subsequence (medium)
- LC 139 — Word Break (medium)
- LC 91 — Decode Ways (medium)
- LC 152 — Maximum Product Subarray (medium)

---


## Pattern 18: DP — 2D Grid and Knapsack (Days 65-68)


```python
# Unique Paths (grid DP)
def uniquePaths(m, n):
    dp = [[1] * n for _ in range(m)]
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = dp[i-1][j] + dp[i][j-1]
    return dp[m-1][n-1]

# 0/1 Knapsack
def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            dp[i][w] = dp[i-1][w]  # exclude item i
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i][w], dp[i-1][w - weights[i-1]] + values[i-1])  # include
    return dp[n][capacity]

# Partition Equal Subset Sum (0/1 knapsack variant)
def canPartition(nums):
    total = sum(nums)
    if total % 2: return False
    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for n in nums:
        for s in range(target, n - 1, -1):  # reverse: avoid reuse
            dp[s] = dp[s] or dp[s - n]
    return dp[target]

# Longest Common Subsequence (two-string DP)
def longestCommonSubsequence(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]

# Edit Distance
def minDistance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i-1] == word2[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]
```


### Key problems

- LC 62 — Unique Paths (medium)
- LC 64 — Minimum Path Sum (medium)
- LC 416 — Partition Equal Subset Sum (medium)
- LC 1143 — Longest Common Subsequence (medium)
- LC 72 — Edit Distance (hard)
- LC 518 — Coin Change II (medium)
- LC 97 — Interleaving String (medium)

---


## Pattern 19: Greedy Algorithms (Days 69-71)


### What it is


Make the locally optimal choice at each step, trusting it leads to a globally optimal solution. Works only when the problem has the "greedy choice property" — always prove this before assuming greedy works.


```python
# Jump Game
def canJump(nums):
    max_reach = 0
    for i, n in enumerate(nums):
        if i > max_reach: return False
        max_reach = max(max_reach, i + n)
    return True

# Gas Station
def canCompleteCircuit(gas, cost):
    if sum(gas) < sum(cost): return -1
    total = start = 0
    for i in range(len(gas)):
        total += gas[i] - cost[i]
        if total < 0:
            start = i + 1; total = 0
    return start

# Non-overlapping Intervals (interval scheduling)
def eraseOverlapIntervals(intervals):
    intervals.sort(key=lambda x: x[1])  # sort by END time
    count = 0
    prev_end = float('-inf')
    for start, end in intervals:
        if start >= prev_end:
            prev_end = end
        else:
            count += 1
    return count

# Greedy vs DP: when greedy FAILS
# Coin change with denominations [1, 3, 4], target 6
# Greedy picks 4+1+1 = 3 coins. Optimal is 3+3 = 2 coins.
# This is WHY coin change generally requires DP, not greedy.
```


### Key problems

- LC 55 — Jump Game (medium)
- LC 45 — Jump Game II (medium)
- LC 134 — Gas Station (medium)
- LC 435 — Non-overlapping Intervals (medium)
- LC 763 — Partition Labels (medium)
- LC 122 — Best Time to Buy/Sell Stock II (medium)

---


## Pattern 20: Divide and Conquer (Days 72-73)


```python
# Merge Sort
def mergeSort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left, right = mergeSort(arr[:mid]), mergeSort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]: result.append(left[i]); i += 1
        else: result.append(right[j]); j += 1
    return result + left[i:] + right[j:]

# Quick Select (Kth largest, O(n) average)
def quickSelect(nums, k):
    target = len(nums) - k
    def partition(left, right):
        pivot = nums[right]
        i = left
        for j in range(left, right):
            if nums[j] <= pivot:
                nums[i], nums[j] = nums[j], nums[i]; i += 1
        nums[i], nums[right] = nums[right], nums[i]
        return i
    left, right = 0, len(nums) - 1
    while True:
        idx = partition(left, right)
        if idx == target: return nums[idx]
        elif idx < target: left = idx + 1
        else: right = idx - 1

# Maximum Subarray (D&C version, though Kadane's is O(n))
def maxSubArrayDC(nums):
    def helper(l, r):
        if l == r: return nums[l]
        mid = (l + r) // 2
        left_max = helper(l, mid)
        right_max = helper(mid + 1, r)
        # cross-boundary max
        left_cross = float('-inf'); s = 0
        for i in range(mid, l - 1, -1):
            s += nums[i]; left_cross = max(left_cross, s)
        right_cross = float('-inf'); s = 0
        for i in range(mid + 1, r + 1):
            s += nums[i]; right_cross = max(right_cross, s)
        return max(left_max, right_max, left_cross + right_cross)
    return helper(0, len(nums) - 1)
```


### Key problems

- LC 912 — Sort an Array (Merge Sort) (medium)
- LC 215 — Kth Largest Element (Quick Select) (medium)
- LC 53 — Maximum Subarray (easy)
- LC 169 — Majority Element (Boyer-Moore, easy)
- LC 23 — Merge K Sorted Lists (D&C variant) (hard)

---


## Day 74-75: Phase 4 Review and Mock Practice


Solve under timed conditions:

1. LC 39 — Combination Sum
2. LC 322 — Coin Change
3. LC 1143 — Longest Common Subsequence
4. LC 55 — Jump Game
5. LC 416 — Partition Equal Subset Sum
6. LC 300 — Longest Increasing Subsequence

---


## Phase 4 problem list (30 problems)


| #  | Problem                            | Pattern               | Difficulty |
| -- | ---------------------------------- | --------------------- | ---------- |
| 1  | Subsets                            | Backtracking          | Medium     |
| 2  | Permutations                       | Backtracking          | Medium     |
| 3  | Combination Sum                    | Backtracking          | Medium     |
| 4  | N-Queens                           | Backtracking          | Hard       |
| 5  | Word Search                        | Backtracking          | Medium     |
| 6  | Generate Parentheses               | Backtracking          | Medium     |
| 7  | Palindrome Partitioning            | Backtracking          | Medium     |
| 8  | Climbing Stairs                    | DP 1D                 | Easy       |
| 9  | House Robber                       | DP 1D                 | Medium     |
| 10 | House Robber II                    | DP 1D                 | Medium     |
| 11 | Coin Change                        | DP Unbounded Knapsack | Medium     |
| 12 | Longest Increasing Subsequence     | DP 1D                 | Medium     |
| 13 | Word Break                         | DP 1D                 | Medium     |
| 14 | Decode Ways                        | DP 1D                 | Medium     |
| 15 | Maximum Product Subarray           | DP 1D                 | Medium     |
| 16 | Unique Paths                       | DP Grid               | Medium     |
| 17 | Minimum Path Sum                   | DP Grid               | Medium     |
| 18 | Partition Equal Subset Sum         | DP 0/1 Knapsack       | Medium     |
| 19 | Longest Common Subsequence         | DP Two Strings        | Medium     |
| 20 | Edit Distance                      | DP Two Strings        | Hard       |
| 21 | Coin Change II                     | DP Unbounded Knapsack | Medium     |
| 22 | Jump Game                          | Greedy                | Medium     |
| 23 | Jump Game II                       | Greedy                | Medium     |
| 24 | Gas Station                        | Greedy                | Medium     |
| 25 | Non-overlapping Intervals          | Greedy                | Medium     |
| 26 | Partition Labels                   | Greedy                | Medium     |
| 27 | Sort an Array                      | Divide and Conquer    | Medium     |
| 28 | Kth Largest Element (Quick Select) | Divide and Conquer    | Medium     |
| 29 | Maximum Subarray                   | DP / D&C              | Easy       |
| 30 | Majority Element                   | Boyer-Moore           | Easy       |

