# ==========================================================
# Exercise 1 - Name the Big-O
# ==========================================================

# O(1) - List index access
numbers = [10, 20, 30, 40, 50]
print(numbers[3])

# O(n) - Single loop
for number in numbers:
    print(number)

# O(n²) - Nested loops
for i in numbers:
    for j in numbers:
        print(i, j)

# O(1) - Dictionary lookup
accounts = {
    "1001": "Alice",
    "1002": "Bob",
    "1003": "Charlie"
}

print(accounts["1002"])

# O(log n) - Binary Search
def binary_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1


nums = list(range(1, 101))
print(binary_search(nums, 87))

# ==========================================================
# Exercise 2 - List vs Dict Lookup
# ==========================================================

import time

accounts_list = [f"ACC{i}" for i in range(100000)]

accounts_dict = {
    f"ACC{i}": f"User {i}"
    for i in range(100000)
}

target = "ACC99999"

# List lookup
start = time.perf_counter()

found = target in accounts_list

end = time.perf_counter()

print("List lookup:", end - start)

# Dictionary lookup
start = time.perf_counter()

found = target in accounts_dict

end = time.perf_counter()

print("Dict lookup:", end - start)

# ==========================================================
# Exercise 3 - Stack
# ==========================================================

class Stack:

    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        return self.items.pop()

    def peek(self):
        return self.items[-1]


stack = Stack()

names = ["Alice", "Bob", "Charlie", "David"]

for name in names:
    stack.push(name)

reversed_names = []

while stack.items:
    reversed_names.append(stack.pop())

print(reversed_names)

# ==========================================================
# Exercise 4 - Queue
# ==========================================================

from collections import deque

queue = deque()

queue.append("Alice")
queue.append("Bob")
queue.append("Charlie")
queue.append("David")
queue.append("Eve")

while queue:
    customer = queue.popleft()
    print(f"Serving {customer}")

# ==========================================================
# Exercise 5 - Singly Linked List
# ==========================================================

class Node:

    def __init__(self, value):
        self.value = value
        self.next = None


class LinkedList:

    def __init__(self):
        self.head = None

    def push_front(self, value):
        new_node = Node(value)
        new_node.next = self.head
        self.head = new_node

    def print_all(self):
        current = self.head

        while current:
            print(current.value)
            current = current.next


linked_list = LinkedList()

linked_list.push_front("Charlie")
linked_list.push_front("Bob")
linked_list.push_front("Alice")

linked_list.print_all()