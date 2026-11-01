import heapq
from collections import deque

# =====================================================
# Exercise 1: Binary Search Tree
# =====================================================

class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None


def insert(root, value):
    if root is None:
        return Node(value)

    if value < root.value:
        root.left = insert(root.left, value)
    else:
        root.right = insert(root.right, value)

    return root


def inorder(root):
    if root:
        inorder(root.left)
        print(root.value, end=" ")
        inorder(root.right)


# =====================================================
# Exercise 2: Tree Height
# =====================================================

def height(node):
    if node is None:
        return 0

    return 1 + max(height(node.left), height(node.right))


# =====================================================
# Exercise 3: Graph BFS
# =====================================================

def bfs(graph, start):
    visited = set()
    queue = deque([start])

    while queue:
        vertex = queue.popleft()

        if vertex not in visited:
            visited.add(vertex)

            for neighbor in graph[vertex]:
                if neighbor not in visited:
                    queue.append(neighbor)

    return visited


# =====================================================
# Exercise 4: Graph DFS
# =====================================================

def dfs(graph, start, visited=None):
    if visited is None:
        visited = []

    visited.append(start)

    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)

    return visited


# =====================================================
# Exercise 5: Priority Queue
# =====================================================

def priority_queue_demo():
    tasks = []

    heapq.heappush(tasks, (3, "Laundry"))
    heapq.heappush(tasks, (1, "Homework"))
    heapq.heappush(tasks, (5, "Gaming"))
    heapq.heappush(tasks, (2, "Shopping"))
    heapq.heappush(tasks, (4, "Exercise"))

    while tasks:
        print(heapq.heappop(tasks))


# =====================================================
# Main
# =====================================================

if __name__ == "__main__":

    # Exercise 1
    print("Exercise 1: Binary Search Tree")
    values = [50, 30, 70, 20, 40, 60, 80]

    root = None
    for value in values:
        root = insert(root, value)

    print("In-order traversal:")
    inorder(root)
    print("\n")

    # Exercise 2
    print("Exercise 2: Tree Height")
    print("Height:", height(root))
    print()

    # Exercise 3 & 4
    graph = {
        "A": ["B", "C"],
        "B": ["D"],
        "C": ["E"],
        "D": [],
        "E": []
    }

    print("Exercise 3: BFS")
    print(bfs(graph, "A"))
    print()

    print("Exercise 4: DFS")
    print(dfs(graph, "A"))
    print()

    # Exercise 5
    print("Exercise 5: Priority Queue")
    priority_queue_demo()