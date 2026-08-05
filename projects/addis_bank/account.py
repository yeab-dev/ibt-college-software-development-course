from collections import deque
class Account:
    def __init__(self, owner: str, account_number: str, balance: float):
        self.owner = owner
        self.account_number = account_number
        self._balance = balance
        self._observers = []
    @property
    def balance(self):
        return self._balance

    def subscribe(self, obs):
        self._observers.append(obs)
    def _notify(self, event):
        for obs in self._observers:
            obs.update(event)

    def deposit(self, amount):
        if amount < 0:
            raise ValueError("Amount must be non negative")

        self._balance += amount

        self._notify(f"Deposited {amount}. New balance: {self.balance}")

    def withdraw(self, amount):
        if amount < 0:
            raise ValueError("Amount must be non negative")

        if amount > self.balance:
            raise ValueError("Insufficient balance")

        self._balance -= amount

        self._notify(f"Withdraw {amount}. New balance: {self.balance}")
    def statement(self):
        return f'{self.owner}: {self.balance} ETB'

    def bfs(transfers, start):
        visited = set()
        queue = deque([start])
        reachable = []

        while queue:
            account = queue.popleft()

            if account in visited:
                continue

            visited.add(account)
            reachable.append(account)

            for neighbor in transfers.get(account, []):
                if neighbor not in visited:
                    queue.append(neighbor)

        return reachable

class Branch:
    def __init__(self, name):
        self.name = name
        self.children = []      # Sub-branches
        self.accounts = []      # Accounts in this branch

    def add_child(self, branch):
        self.children.append(branch)

    def add_account(self, account):
        self.accounts.append(account)

    # Recursive function
    def total_balance(self):
        total = sum(account.balance for account in self.accounts)

        for child in self.children:
            total += child.total_balance()

        return total