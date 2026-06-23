---
source: notion
title: "Phase 1 — Foundations (Days 1–15)"
slug: "phase-1-foundations-days-1-15"
notionId: "383da883-bddd-816e-8e2a-e578febd1591"
notionRootId: "383da883bddd81feae11fbbfc249f450"
parent: "90-day-dsa-roadmap-beginner-to-advanced"
children: []
order: 5
icon: "🌱"
cover: null
---
> **Core insight:** Every hard algorithm problem is a combination of simpler patterns applied in the right order. Phase 1 builds the four patterns that appear in 40% of all interview problems: prefix sum, two pointer, sliding window, and binary search. Master these and you have a systematic approach to most array and string problems.

---


## Pattern 1: Prefix Sum (Days 1-3)


### What it is


Precompute cumulative sums so any range sum query is answered in O(1) instead of O(n).


### When to reach for it

- "Sum of elements from index i to j" appearing multiple times
- "Subarray with sum equal to k"
- "Balance point" or "pivot index"

```python
# Build prefix sum
def prefix_sum(nums):
    prefix = [0] * (len(nums) + 1)
    for i in range(len(nums)):
        prefix[i+1] = prefix[i] + nums[i]
    # Sum from l to r (inclusive) = prefix[r+1] - prefix[l]
    return prefix

# Subarray sum equals k (use hashmap of prefix sums)
def subarraySum(nums, k):
    count = 0
    prefix = 0
    seen = {0: 1}  # prefix_sum -> frequency
    for n in nums:
        prefix += n
        count += seen.get(prefix - k, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return count
```


### Key problems

- LC 303 — Range Sum Query (easy)
- LC 560 — Subarray Sum Equals K (medium)
- LC 724 — Find Pivot Index (easy)
- LC 1480 — Running Sum of 1D Array (easy)
- LC 238 — Product of Array Except Self (medium)

---


## Pattern 2: Two Pointers (Days 4-6)


### What it is


Two indices moving through an array (or two arrays) to reduce O(n²) brute force to O(n).


### When to reach for it

- Sorted array + target sum
- Palindrome checking
- Remove duplicates in-place
- "Container with most water" type problems

```python
# Two sum in sorted array
def twoSumSorted(nums, target):
    l, r = 0, len(nums) - 1
    while l < r:
        s = nums[l] + nums[r]
        if s == target: return [l+1, r+1]
        elif s < target: l += 1
        else: r -= 1
    return []

# 3Sum (sort + two pointer for inner loop)
def threeSum(nums):
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]: continue  # skip duplicates
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s == 0:
                result.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]: l += 1
                while l < r and nums[r] == nums[r-1]: r -= 1
                l += 1; r -= 1
            elif s < 0: l += 1
            else: r -= 1
    return result

# Valid palindrome
def isPalindrome(s):
    s = ''.join(c.lower() for c in s if c.isalnum())
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]: return False
        l += 1; r -= 1
    return True
```


### Key problems

- LC 167 — Two Sum II Sorted (medium)
- LC 15 — 3Sum (medium)
- LC 11 — Container with Most Water (medium)
- LC 42 — Trapping Rain Water (hard)
- LC 125 — Valid Palindrome (easy)

---


## Pattern 3: Sliding Window (Days 7-9)


### What it is


A window of fixed or variable size that slides through the array, maintaining a running state so you don't recompute from scratch each step.


### When to reach for it

- "Longest/shortest subarray/substring with condition X"
- "Max/min of a window of size k"
- Subarray/substring problems where the answer is contiguous

```python
# Fixed window: max sum of k consecutive elements
def maxSumFixedWindow(nums, k):
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]  # slide
        max_sum = max(max_sum, window_sum)
    return max_sum

# Variable window: longest substring without repeating characters
def lengthOfLongestSubstring(s):
    char_set = set()
    l = max_len = 0
    for r in range(len(s)):
        while s[r] in char_set:   # shrink window until valid
            char_set.remove(s[l])
            l += 1
        char_set.add(s[r])
        max_len = max(max_len, r - l + 1)
    return max_len

# Variable window with hashmap: minimum window substring
def minWindow(s, t):
    need = {}
    for c in t: need[c] = need.get(c, 0) + 1
    have, total = 0, len(need)
    window = {}
    l = 0
    res = ""
    for r in range(len(s)):
        c = s[r]
        window[c] = window.get(c, 0) + 1
        if c in need and window[c] == need[c]: have += 1
        while have == total:
            if not res or r - l + 1 < len(res):
                res = s[l:r+1]
            window[s[l]] -= 1
            if s[l] in need and window[s[l]] < need[s[l]]: have -= 1
            l += 1
    return res
```


### Key problems

- LC 121 — Best Time to Buy and Sell Stock (easy)
- LC 3 — Longest Substring Without Repeating Characters (medium)
- LC 76 — Minimum Window Substring (hard)
- LC 567 — Permutation in String (medium)
- LC 239 — Sliding Window Maximum (hard)

---


## Pattern 4: Binary Search (Days 10-12)


### What it is


Repeatedly halving the search space. Works on ANY monotonic condition, not just sorted arrays.


### When to reach for it

- Sorted array + find target
- "Find the minimum X that satisfies condition Y"
- Search in rotated array
- Answer is a value with a monotonic feasibility function

```python
# Classic binary search
def search(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        mid = l + (r - l) // 2  # avoid overflow
        if nums[mid] == target: return mid
        elif nums[mid] < target: l = mid + 1
        else: r = mid - 1
    return -1

# Find leftmost position
def searchLeft(nums, target):
    l, r = 0, len(nums)
    while l < r:
        mid = (l + r) // 2
        if nums[mid] < target: l = mid + 1
        else: r = mid
    return l

# Search in rotated sorted array
def searchRotated(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        mid = (l + r) // 2
        if nums[mid] == target: return mid
        if nums[l] <= nums[mid]:  # left half is sorted
            if nums[l] <= target < nums[mid]: r = mid - 1
            else: l = mid + 1
        else:                     # right half is sorted
            if nums[mid] < target <= nums[r]: l = mid + 1
            else: r = mid - 1
    return -1

# Binary search on answer: minimum capacity to ship packages in D days
def shipWithinDays(weights, days):
    def canShip(capacity):
        ships, cur = 1, 0
        for w in weights:
            if cur + w > capacity:
                ships += 1; cur = 0
            cur += w
        return ships <= days

    l, r = max(weights), sum(weights)
    while l < r:
        mid = (l + r) // 2
        if canShip(mid): r = mid
        else: l = mid + 1
    return l
```


### Key problems

- LC 704 — Binary Search (easy)
- LC 153 — Find Minimum in Rotated Sorted Array (medium)
- LC 33 — Search in Rotated Sorted Array (medium)
- LC 74 — Search a 2D Matrix (medium)
- LC 1011 — Capacity to Ship Packages (medium)
- LC 410 — Split Array Largest Sum (hard)

---


## Pattern 5: Sorting patterns (Days 13-15)


```python
# Custom sort
nums.sort(key=lambda x: (-x[0], x[1]))  # sort by first desc, second asc

# Merge intervals
def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

# Meeting rooms II (min heap)
import heapq
def minMeetingRooms(intervals):
    intervals.sort()
    heap = []  # end times
    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)
        else:
            heapq.heappush(heap, end)
    return len(heap)
```


---


## Phase 1 problem list (solve all 30)


| #  | Problem                            | Pattern                 | Difficulty |
| -- | ---------------------------------- | ----------------------- | ---------- |
| 1  | Running Sum of 1D Array            | Prefix Sum              | Easy       |
| 2  | Find Pivot Index                   | Prefix Sum              | Easy       |
| 3  | Subarray Sum Equals K              | Prefix Sum + HashMap    | Medium     |
| 4  | Product of Array Except Self       | Prefix Product          | Medium     |
| 5  | Range Sum Query                    | Prefix Sum              | Easy       |
| 6  | Two Sum II                         | Two Pointer             | Medium     |
| 7  | Valid Palindrome                   | Two Pointer             | Easy       |
| 8  | 3Sum                               | Sort + Two Pointer      | Medium     |
| 9  | Container With Most Water          | Two Pointer             | Medium     |
| 10 | Trapping Rain Water                | Two Pointer             | Hard       |
| 11 | Best Time to Buy Stock             | Sliding Window          | Easy       |
| 12 | Longest Substring No Repeat        | Sliding Window          | Medium     |
| 13 | Permutation in String              | Sliding Window          | Medium     |
| 14 | Minimum Window Substring           | Sliding Window          | Hard       |
| 15 | Sliding Window Maximum             | Sliding Window + Deque  | Hard       |
| 16 | Binary Search                      | Binary Search           | Easy       |
| 17 | Find Minimum in Rotated Array      | Binary Search           | Medium     |
| 18 | Search in Rotated Array            | Binary Search           | Medium     |
| 19 | Koko Eating Bananas                | Binary Search on Answer | Medium     |
| 20 | Capacity to Ship Packages          | Binary Search on Answer | Medium     |
| 21 | Merge Intervals                    | Sort                    | Medium     |
| 22 | Meeting Rooms II                   | Sort + Heap             | Medium     |
| 23 | Non-Overlapping Intervals          | Sort + Greedy           | Medium     |
| 24 | Sort Colors                        | Two Pointer             | Medium     |
| 25 | Find All Anagrams                  | Sliding Window          | Medium     |
| 26 | Maximum Average Subarray           | Fixed Window            | Easy       |
| 27 | Longest Repeating Char Replacement | Sliding Window          | Medium     |
| 28 | Check Array Formation              | HashMap                 | Easy       |
| 29 | Two Sum                            | HashMap                 | Easy       |
| 30 | Split Array Largest Sum            | Binary Search on Answer | Hard       |

