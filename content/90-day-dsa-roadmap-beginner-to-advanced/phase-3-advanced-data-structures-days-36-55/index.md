---
source: notion
title: "Phase 3 — Advanced Data Structures (Days 36–55)"
slug: "phase-3-advanced-data-structures-days-36-55"
notionId: "384da883-bddd-81d0-84be-ed0078340d60"
notionRootId: "383da883bddd81feae11fbbfc249f450"
parent: "90-day-dsa-roadmap-beginner-to-advanced"
children: []
order: 3
icon: "⚫"
cover: null
---
> **Core insight:** Heaps, graphs, tries, and union-find are the data structures that separate "I can solve LeetCode easy/medium" from "I can handle a senior-level system design coding round." These power priority scheduling, shortest paths, autocomplete, and connectivity problems.

---


## Pattern 11: Heaps — Top-K and Priority (Days 36-40)


### What it is


A heap gives O(log n) insert/extract-min(or max). Use it whenever you need the "top K", "kth largest", or need to repeatedly extract the min/max element.


```python
import heapq

# Kth Largest Element (min-heap of size k)
def findKthLargest(nums, k):
    heap = nums[:k]
    heapq.heapify(heap)
    for n in nums[k:]:
        if n > heap[0]:
            heapq.heapreplace(heap, n)
    return heap[0]

# Top K Frequent Elements
def topKFrequent(nums, k):
    from collections import Counter
    count = Counter(nums)
    return heapq.nlargest(k, count.keys(), key=count.get)

# Merge K Sorted Lists
def mergeKLists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node: heapq.heappush(heap, (node.val, i, node))
    dummy = cur = ListNode()
    while heap:
        val, i, node = heapq.heappop(heap)
        cur.next = node; cur = cur.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next

# Find Median from Data Stream (two heaps)
class MedianFinder:
    def __init__(self):
        self.small = []  # max-heap (negated)
        self.large = []  # min-heap
    def addNum(self, num):
        heapq.heappush(self.small, -num)
        heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))
    def findMedian(self):
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2

# Task Scheduler (greedy + heap)
def leastInterval(tasks, n):
    from collections import Counter
    count = Counter(tasks)
    max_heap = [-c for c in count.values()]
    heapq.heapify(max_heap)
    time = 0
    q = []  # (available_time, count)
    while max_heap or q:
        time += 1
        if max_heap:
            cnt = 1 + heapq.heappop(max_heap)
            if cnt: q.append((time + n, cnt))
        if q and q[0][0] == time:
            heapq.heappush(max_heap, q.pop(0)[1])
    return time
```


### Key problems

- LC 215 — Kth Largest Element in Array (medium)
- LC 347 — Top K Frequent Elements (medium)
- LC 23 — Merge K Sorted Lists (hard)
- LC 295 — Find Median from Data Stream (hard)
- LC 621 — Task Scheduler (medium)
- LC 973 — K Closest Points to Origin (medium)

---


## Pattern 12: Graphs — BFS, DFS, Topological Sort (Days 41-46)


```python
from collections import deque, defaultdict

# Number of Islands (DFS flood fill)
def numIslands(grid):
    if not grid: return 0
    rows, cols = len(grid), len(grid[0])
    visited = set()
    def dfs(r, c):
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            grid[r][c] == '0' or (r, c) in visited): return
        visited.add((r, c))
        for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
            dfs(r + dr, c + dc)
    islands = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1' and (r, c) not in visited:
                dfs(r, c); islands += 1
    return islands

# Clone Graph (DFS + hashmap)
def cloneGraph(node):
    if not node: return None
    old_to_new = {}
    def dfs(n):
        if n in old_to_new: return old_to_new[n]
        copy = Node(n.val)
        old_to_new[n] = copy
        for nei in n.neighbors:
            copy.neighbors.append(dfs(nei))
        return copy
    return dfs(node)

# Course Schedule (topological sort, cycle detection)
def canFinish(numCourses, prerequisites):
    graph = defaultdict(list)
    for course, prereq in prerequisites:
        graph[course].append(prereq)
    state = {}  # 0=unvisited, 1=visiting, 2=done
    def dfs(course):
        if state.get(course) == 1: return False  # cycle
        if state.get(course) == 2: return True
        state[course] = 1
        for prereq in graph[course]:
            if not dfs(prereq): return False
        state[course] = 2
        return True
    return all(dfs(c) for c in range(numCourses))

# Topological sort via Kahn's algorithm (BFS, in-degree)
def topologicalSort(numCourses, prerequisites):
    graph = defaultdict(list)
    in_degree = [0] * numCourses
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    queue = deque([c for c in range(numCourses) if in_degree[c] == 0])
    order = []
    while queue:
        c = queue.popleft()
        order.append(c)
        for nxt in graph[c]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0: queue.append(nxt)
    return order if len(order) == numCourses else []

# Word Ladder (BFS shortest path)
def ladderLength(beginWord, endWord, wordList):
    wordSet = set(wordList)
    if endWord not in wordSet: return 0
    queue = deque([(beginWord, 1)])
    while queue:
        word, steps = queue.popleft()
        if word == endWord: return steps
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                next_word = word[:i] + c + word[i+1:]
                if next_word in wordSet:
                    wordSet.remove(next_word)
                    queue.append((next_word, steps + 1))
    return 0
```


### Key problems

- LC 200 — Number of Islands (medium)
- LC 133 — Clone Graph (medium)
- LC 207 — Course Schedule (medium)
- LC 210 — Course Schedule II (medium)
- LC 127 — Word Ladder (hard)
- LC 994 — Rotting Oranges (medium)
- LC 417 — Pacific Atlantic Water Flow (medium)
- LC 130 — Surrounded Regions (medium)

---


## Pattern 13: Graphs — Shortest Path Algorithms (Days 47-49)


```python
import heapq

# Dijkstra's algorithm (single-source shortest path, non-negative weights)
def dijkstra(graph, start, n):
    dist = [float('inf')] * n
    dist[start] = 0
    heap = [(0, start)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist[node]: continue
        for neighbor, weight in graph[node]:
            new_dist = d + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(heap, (new_dist, neighbor))
    return dist

# Network Delay Time (Dijkstra applied)
def networkDelayTime(times, n, k):
    graph = defaultdict(list)
    for u, v, w in times:
        graph[u].append((v, w))
    dist = dijkstra(graph, k, n + 1)
    max_dist = max(dist[1:n+1])
    return max_dist if max_dist != float('inf') else -1

# Bellman-Ford (handles negative weights, detects negative cycles)
def bellmanFord(edges, n, start):
    dist = [float('inf')] * n
    dist[start] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    # Check for negative cycle
    for u, v, w in edges:
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            return None  # negative cycle detected
    return dist
```


### Key problems

- LC 743 — Network Delay Time (medium)
- LC 787 — Cheapest Flights Within K Stops (medium)
- LC 1631 — Path with Minimum Effort (medium)
- LC 1514 — Path with Maximum Probability (medium)

---


## Pattern 14: Union-Find / Disjoint Set (Days 50-52)


### What it is


A structure that tracks which elements belong to the same group, supporting near-O(1) union and find with path compression and union by rank.


```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False
        if self.rank[px] < self.rank[py]: px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]: self.rank[px] += 1
        return True

# Number of Connected Components
def countComponents(n, edges):
    uf = UnionFind(n)
    components = n
    for u, v in edges:
        if uf.union(u, v): components -= 1
    return components

# Redundant Connection (find the extra edge causing a cycle)
def findRedundantConnection(edges):
    uf = UnionFind(len(edges) + 1)
    for u, v in edges:
        if not uf.union(u, v):
            return [u, v]
    return []

# Number of Islands II (union-find for dynamic connectivity)
# Accounts (group emails belonging to the same person via union-find)
```


### Key problems

- LC 547 — Number of Provinces (medium)
- LC 323 — Number of Connected Components (medium)
- LC 684 — Redundant Connection (medium)
- LC 721 — Accounts Merge (medium)
- LC 1319 — Number of Operations to Connect Network (medium)

---


## Pattern 15: Tries (Days 53-54)


### What it is


A tree structure optimized for prefix-based string operations: autocomplete, spell-check, IP routing.


```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for c in word:
            if c not in node.children:
                node.children[c] = TrieNode()
            node = node.children[c]
        node.is_end = True

    def search(self, word):
        node = self._find(word)
        return node is not None and node.is_end

    def startsWith(self, prefix):
        return self._find(prefix) is not None

    def _find(self, word):
        node = self.root
        for c in word:
            if c not in node.children: return None
            node = node.children[c]
        return node

# Word Search II (Trie + DFS backtracking on a grid)
def findWords(board, words):
    trie = Trie()
    for w in words: trie.insert(w)
    rows, cols = len(board), len(board[0])
    result = set()

    def dfs(r, c, node, path):
        if r < 0 or r >= rows or c < 0 or c >= cols: return
        char = board[r][c]
        if char == '#' or char not in node.children: return
        node = node.children[char]
        path += char
        if node.is_end: result.add(path)
        board[r][c] = '#'
        for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
            dfs(r + dr, c + dc, node, path)
        board[r][c] = char

    for r in range(rows):
        for c in range(cols):
            dfs(r, c, trie.root, "")
    return list(result)
```


### Key problems

- LC 208 — Implement Trie (medium)
- LC 211 — Design Add and Search Words (medium)
- LC 212 — Word Search II (hard)
- LC implement Autocomplete System (hard, optional)

---


## Day 55: Phase 3 Review and Mock Practice


Solve these timed:

1. LC 1046 — Last Stone Weight (heap)
2. LC 207 — Course Schedule (graph topological sort)
3. LC 200 — Number of Islands (graph DFS)
4. LC 547 — Number of Provinces (union-find)
5. LC 208 — Implement Trie

---


## Phase 3 problem list (25 problems)


| #  | Problem                         | Pattern                | Difficulty |
| -- | ------------------------------- | ---------------------- | ---------- |
| 1  | Kth Largest Element in Array    | Heap                   | Medium     |
| 2  | Last Stone Weight               | Heap                   | Easy       |
| 3  | K Closest Points to Origin      | Heap                   | Medium     |
| 4  | Task Scheduler                  | Heap + Greedy          | Medium     |
| 5  | Find Median from Data Stream    | Two Heaps              | Hard       |
| 6  | Merge K Sorted Lists            | Heap                   | Hard       |
| 7  | Number of Islands               | DFS/BFS                | Medium     |
| 8  | Clone Graph                     | DFS                    | Medium     |
| 9  | Course Schedule                 | Topological Sort       | Medium     |
| 10 | Course Schedule II              | Topological Sort       | Medium     |
| 11 | Pacific Atlantic Water Flow     | DFS                    | Medium     |
| 12 | Word Ladder                     | BFS                    | Hard       |
| 13 | Rotting Oranges                 | BFS                    | Medium     |
| 14 | Surrounded Regions              | DFS                    | Medium     |
| 15 | Graph Valid Tree                | Union-Find             | Medium     |
| 16 | Network Delay Time              | Dijkstra               | Medium     |
| 17 | Cheapest Flights Within K Stops | Bellman-Ford           | Medium     |
| 18 | Path with Minimum Effort        | Dijkstra/Binary Search | Medium     |
| 19 | Number of Connected Components  | Union-Find             | Medium     |
| 20 | Redundant Connection            | Union-Find             | Medium     |
| 21 | Accounts Merge                  | Union-Find             | Medium     |
| 22 | Implement Trie                  | Trie                   | Medium     |
| 23 | Design Add and Search Words     | Trie                   | Medium     |
| 24 | Word Search II                  | Trie + Backtracking    | Hard       |
| 25 | Number of Provinces             | Union-Find             | Medium     |

