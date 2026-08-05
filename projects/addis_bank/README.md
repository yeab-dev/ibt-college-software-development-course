# Bank Account Management System

A simple banking system built in Python to practice Object-Oriented Programming, Design Patterns, Data Structures, and Algorithms.

## Features

- Create Savings and Current accounts
- Deposit and withdraw money
- Calculate interest for savings accounts
- Support overdraft for current accounts
- Store and search accounts
- Branch hierarchy with recursive balance calculation
- Transfer graph traversal using Breadth-First Search (BFS)
- Observer notifications for account events

---

## Project Structure

```
.
├── account.py
├── account_factory.py
├── account_registry.py
├── audit_log.py
├── bank_config.py
├── current_account.py
├── savings_account.py
├── sms_alert.py
├── main.py
└── README.md
```

---

## Design Patterns Used

### Singleton

`BankConfig` ensures there is only one configuration object shared throughout the application.

Configuration includes:

- Interest rate
- Overdraft limit

---

### Factory

`AccountFactory` creates different account types without exposing object creation logic.

Example:

```python
account = AccountFactory.create(
    "savings",
    "Alice",
    "1001",
    1000
)
```

---

### Observer

Accounts can notify observers whenever transactions occur.

Observers include:

- AuditLog
- SMSAlert

Example:

```python
account.subscribe(AuditLog())
account.subscribe(SMSAlert())
```

Whenever a deposit or withdrawal occurs, every observer is notified automatically.

---

## Data Structures

### Dictionary

Used by `AccountRegistry` for fast account lookup.

```python
self.by_number = {}
```

---

### List

Maintains insertion order of accounts.

```python
self.order = []
```

---

### Queue

Breadth-First Search uses a queue (`collections.deque`) to traverse transfer relationships.

---

### Binary Tree

The `Branch` class forms a tree of bank branches.

```
Head Office
    |
  Addis
    |
  Bole
    |
 Piassa
```

The total balance is calculated recursively.

---

## Algorithms

### Recursive Tree Traversal

Calculates the total balance across all branches.

```text
Head Office
    |
    +-- Addis
          |
          +-- Bole
                |
                +-- Piassa
```

---

### Breadth-First Search (BFS)

Finds all accounts reachable through transfers.

Example:

```
1001
├──1002
│   └──1004
└──1003
```

Output:

```
1001
1002
1003
1004
```

---

### Binary Search

Efficiently searches sorted account numbers.

Time Complexity:

```
O(log n)
```

---

### Sorting

Accounts are sorted by balance to produce a leaderboard.

```python
top_by_balance(n)
```

---

### Recursion

Transaction history is summed recursively.

```python
total_transactions(account_number)
```

---

## Running the Project

Clone the repository:

```bash
git clone https://github.com/yeab-dev/ibt-college-software-development-course
cd projects/addis_bank
```

Run:

```bash
python main.py
```

Example output:

```
Total balance: 25000

Reachable accounts:
['1001', '1002', '1003', '1004']
```

---

## Concepts Practiced

- Object-Oriented Programming
- Inheritance
- Encapsulation
- Polymorphism
- Design Patterns
  - Singleton
  - Factory
  - Observer
- Recursion
- Binary Search
- Breadth-First Search
- Sorting
- Trees
- Queues
- Dictionaries

---

## Future Improvements

- Persistent storage (SQLite)
- Transaction history
- User authentication
- Command-line interface
- Unit tests
- Transfer between accounts
- Interest scheduling
- Account deletion