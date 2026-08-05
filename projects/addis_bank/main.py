from collections import deque
from account import Branch, AccountFactory


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


head = Branch("Head Office")
addis = Branch("Addis")
bole = Branch("Bole")
piassa = Branch("Piassa")

head.add_child(addis)
addis.add_child(bole)
bole.add_child(piassa)

# Create accounts
head.add_account(AccountFactory.create("savings", "Alice", "1001", 10000))
addis.add_account(AccountFactory.create("current", "Bob", "1002", 5000))
bole.add_account(AccountFactory.create("savings", "Charlie", "1003", 7000))
piassa.add_account(AccountFactory.create("current", "David", "1004", 3000))

# Recursive total balance
print("Total balance:", head.total_balance())

# Transfers graph
transfers = {
    "1001": ["1002", "1003"],
    "1002": ["1004"],
    "1003": [],
    "1004": [],
}

print("Reachable accounts:", bfs(transfers, "1001"))