---
source: notion
title: "Phase 2 — Core Data Structures (Days 16–35)"
slug: "phase-2-core-data-structures-days-16-35"
notionId: "384da883-bddd-8162-a4a8-d7f99e4fb6fd"
notionRootId: "383da883bddd81feae11fbbfc249f450"
parent: "90-day-dsa-roadmap-beginner-to-advanced"
children: []
order: 4
icon: "🐧"
cover: null
---
> **Core insight:** Linked lists, stacks, queues, and trees are not just data structures — they are the substrate for half of all interview questions. The patterns here (fast/slow pointers, monotonic stacks, BFS/DFS) reused across hundreds of problems once internalized.

---


## Pattern 6: Linked Lists — Fast/Slow Pointers (Days 16-19)


### What it is


Two pointers moving at different speeds through a linked list to detect cycles, find midpoints, or find the kth-from-end node — all in O(n) time, O(1) space.


```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Reverse a linked list
def reverseList(head):
    prev = None
    while head:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev

# Find middle node (slow/fast)
def middleNode(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

# Detect cycle (Floyd's algorithm)
def hasCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False

# Find cycle start
def detectCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            ptr = head
            while ptr != slow:
                ptr = ptr.next
                slow = slow.next
            return ptr
    return None

# Merge two sorted lists
def mergeTwoLists(l1, l2):
    dummy = ListNode()
    cur = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            cur.next = l1; l1 = l1.next
        else:
            cur.next = l2; l2 = l2.next
        cur = cur.next
    cur.next = l1 or l2
    return dummy.next
```


### Key problems

- LC 206 — Reverse Linked List (easy)
- LC 141 — Linked List Cycle (easy)
- LC 142 — Linked List Cycle II (medium)
- LC 21 — Merge Two Sorted Lists (easy)
- LC 19 — Remove Nth Node From End (medium)
- LC 143 — Reorder List (medium)
- LC 23 — Merge k Sorted Lists (hard)

---


## Pattern 7: Stacks — Monotonic Stack (Days 20-22)


### What it is


A stack that maintains elements in increasing or decreasing order, used to find "next greater/smaller element" in O(n) instead of O(n²).


```python
# Valid parentheses
def isValid(s):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]: return False
        else:
            stack.append(c)
    return not stack

# Daily Temperatures (next greater element)
def dailyTemperatures(temps):
    res = [0] * len(temps)
    stack = []  # indices, decreasing temps
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res

# Largest Rectangle in Histogram
def largestRectangleArea(heights):
    stack = []  # indices, increasing heights
    max_area = 0
    for i, h in enumerate(heights + [0]):
        while stack and heights[stack[-1]] >= h:
            height = heights[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)
    return max_area

# Min stack (O(1) getMin)
class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []
    def push(self, val):
        self.stack.append(val)
        m = min(val, self.min_stack[-1] if self.min_stack else val)
        self.min_stack.append(m)
    def pop(self):
        self.stack.pop(); self.min_stack.pop()
    def top(self): return self.stack[-1]
    def getMin(self): return self.min_stack[-1]
```


### Key problems

- LC 20 — Valid Parentheses (easy)
- LC 155 — Min Stack (medium)
- LC 739 — Daily Temperatures (medium)
- LC 84 — Largest Rectangle in Histogram (hard)
- LC 150 — Evaluate Reverse Polish Notation (medium)
- LC 232 — Implement Queue using Stacks (easy)

---


## Pattern 8: Hashing (Days 23-25)


### What it is


O(1) average lookup/insert. The single highest-leverage data structure in interviews — turns O(n²) brute force into O(n).


```python
# Group Anagrams
def groupAnagrams(strs):
    groups = {}
    for s in strs:
        key = ''.join(sorted(s))
        groups.setdefault(key, []).append(s)
    return list(groups.values())

# Longest Consecutive Sequence (O(n) using a set)
def longestConsecutive(nums):
    num_set = set(nums)
    longest = 0
    for n in num_set:
        if n - 1 not in num_set:  # only start counting from sequence start
            length = 1
            while n + length in num_set:
                length += 1
            longest = max(longest, length)
    return longest

# Design a HashMap from scratch (understand the internals)
class MyHashMap:
    def __init__(self):
        self.size = 1000
        self.buckets = [[] for _ in range(self.size)]
    def _hash(self, key):
        return key % self.size
    def put(self, key, value):
        bucket = self.buckets[self._hash(key)]
        for i, (k, v) in enumerate(bucket):
            if k == key:
                bucket[i] = (key, value); return
        bucket.append((key, value))
    def get(self, key):
        bucket = self.buckets[self._hash(key)]
        for k, v in bucket:
            if k == key: return v
        return -1
```


### Key problems

- LC 1 — Two Sum (easy)
- LC 49 — Group Anagrams (medium)
- LC 128 — Longest Consecutive Sequence (medium)
- LC 706 — Design HashMap (easy)
- LC 347 — Top K Frequent Elements (medium)
- LC 242 — Valid Anagram (easy)

---


## Pattern 9: Trees — DFS and BFS (Days 26-31)


### What it is


DFS (recursive, pre/in/post-order) explores depth-first. BFS (queue-based, level-order) explores breadth-first. Almost every tree problem is one of these two traversals with extra bookkeeping.


```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

# DFS traversals
def inorder(root):
    return inorder(root.left) + [root.val] + inorder(root.right) if root else []

# Maximum depth
def maxDepth(root):
    if not root: return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))

# Validate BST (pass down valid range)
def isValidBST(root, low=float('-inf'), high=float('inf')):
    if not root: return True
    if not (low < root.val < high): return False
    return isValidBST(root.left, low, root.val) and isValidBST(root.right, root.val, high)

# Lowest Common Ancestor (BST)
def lowestCommonAncestor(root, p, q):
    while root:
        if p.val < root.val and q.val < root.val: root = root.left
        elif p.val > root.val and q.val > root.val: root = root.right
        else: return root

# Level order traversal (BFS)
from collections import deque
def levelOrder(root):
    if not root: return []
    result, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result

# Serialize/Deserialize binary tree
def serialize(root):
    vals = []
    def dfs(node):
        if not node: vals.append('#'); return
        vals.append(str(node.val))
        dfs(node.left); dfs(node.right)
    dfs(root)
    return ','.join(vals)

def deserialize(data):
    vals = iter(data.split(','))
    def build():
        val = next(vals)
        if val == '#': return None
        node = TreeNode(int(val))
        node.left = build(); node.right = build()
        return node
    return build()
```


### Key problems

- LC 104 — Maximum Depth of Binary Tree (easy)
- LC 226 — Invert Binary Tree (easy)
- LC 98 — Validate Binary Search Tree (medium)
- LC 235 — Lowest Common Ancestor of BST (medium)
- LC 102 — Binary Tree Level Order Traversal (medium)
- LC 124 — Binary Tree Maximum Path Sum (hard)
- LC 297 — Serialize and Deserialize Binary Tree (hard)
- LC 543 — Diameter of Binary Tree (easy)
- LC 105 — Construct Tree from Preorder/Inorder (medium)

---


## Pattern 10: Queues and Deques (Days 32-33)


```python
from collections import deque

# Sliding window maximum (monotonic deque)
def maxSlidingWindow(nums, k):
    dq = deque()  # indices, decreasing values
    result = []
    for i, n in enumerate(nums):
        while dq and nums[dq[-1]] < n: dq.pop()
        dq.append(i)
        if dq[0] <= i - k: dq.popleft()
        if i >= k - 1: result.append(nums[dq[0]])
    return result

# Design Circular Queue
class MyCircularQueue:
    def __init__(self, k):
        self.queue = [0] * k
        self.head = self.count = 0
        self.capacity = k
    def enqueue(self, value):
        if self.count == self.capacity: return False
        self.queue[(self.head + self.count) % self.capacity] = value
        self.count += 1
        return True
    def dequeue(self):
        if self.count == 0: return False
        self.head = (self.head + 1) % self.capacity
        self.count -= 1
        return True
```


### Key problems

- LC 239 — Sliding Window Maximum (hard)
- LC 622 — Design Circular Queue (medium)
- LC 933 — Number of Recent Calls (easy)

---


## Day 34-35: Phase 2 Review and Mock Practice


Solve these 8 problems under timed conditions (mix of patterns from this phase):

1. LC 21 — Merge Two Sorted Lists
2. LC 234 — Palindrome Linked List
3. LC 739 — Daily Temperatures
4. LC 128 — Longest Consecutive Sequence
5. LC 102 — Binary Tree Level Order Traversal
6. LC 230 — Kth Smallest Element in BST
7. LC 199 — Binary Tree Right Side View
8. LC 23 — Merge k Sorted Lists

---


## Phase 2 problem list (35 problems)


| #  | Problem                              | Pattern             | Difficulty |
| -- | ------------------------------------ | ------------------- | ---------- |
| 1  | Reverse Linked List                  | Fast/Slow           | Easy       |
| 2  | Linked List Cycle                    | Fast/Slow           | Easy       |
| 3  | Linked List Cycle II                 | Fast/Slow           | Medium     |
| 4  | Merge Two Sorted Lists               | Two Pointer         | Easy       |
| 5  | Remove Nth Node From End             | Two Pointer         | Medium     |
| 6  | Reorder List                         | Fast/Slow + Reverse | Medium     |
| 7  | Merge k Sorted Lists                 | Heap                | Hard       |
| 8  | Palindrome Linked List               | Fast/Slow + Reverse | Easy       |
| 9  | Add Two Numbers                      | Linked List         | Medium     |
| 10 | Copy List with Random Pointer        | HashMap             | Medium     |
| 11 | Valid Parentheses                    | Stack               | Easy       |
| 12 | Min Stack                            | Stack               | Medium     |
| 13 | Daily Temperatures                   | Monotonic Stack     | Medium     |
| 14 | Largest Rectangle in Histogram       | Monotonic Stack     | Hard       |
| 15 | Evaluate RPN                         | Stack               | Medium     |
| 16 | Implement Queue using Stacks         | Stack               | Easy       |
| 17 | Two Sum                              | HashMap             | Easy       |
| 18 | Group Anagrams                       | HashMap             | Medium     |
| 19 | Longest Consecutive Sequence         | HashMap             | Medium     |
| 20 | Top K Frequent Elements              | HashMap + Heap      | Medium     |
| 21 | Valid Anagram                        | HashMap             | Easy       |
| 22 | Maximum Depth of Binary Tree         | DFS                 | Easy       |
| 23 | Invert Binary Tree                   | DFS                 | Easy       |
| 24 | Validate BST                         | DFS                 | Medium     |
| 25 | Lowest Common Ancestor of BST        | DFS                 | Medium     |
| 26 | Binary Tree Level Order Traversal    | BFS                 | Medium     |
| 27 | Binary Tree Maximum Path Sum         | DFS                 | Hard       |
| 28 | Serialize/Deserialize Binary Tree    | DFS                 | Hard       |
| 29 | Diameter of Binary Tree              | DFS                 | Easy       |
| 30 | Construct Tree from Preorder/Inorder | DFS                 | Medium     |
| 31 | Kth Smallest Element in BST          | DFS                 | Medium     |
| 32 | Binary Tree Right Side View          | BFS                 | Medium     |
| 33 | Sliding Window Maximum               | Monotonic Deque     | Hard       |
| 34 | Design Circular Queue                | Queue               | Medium     |
| 35 | Same Tree                            | DFS                 | Easy       |

