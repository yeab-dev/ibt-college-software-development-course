
class AccountRegistry:
    def __init__(self):
        self.by_number = {}
        self.order = []

    def add(self, account):
        self.by_number[account.account_number] = account
        self.order.append(account.account_number)

    def find(self, number):
        return self.by_number.get(number)

    def list_all(self):
        return [
            self.by_number[number]
            for number in self.order
        ]

    # -----------------------------------------
    # 1. Leaderboard
    # -----------------------------------------

    def top_by_balance(self, n):
        accounts = sorted(
            self.by_number.values(),
            key=lambda account: account.balance,
            reverse=True
        )

        return accounts[:n]

    # -----------------------------------------
    # 2. Binary Search
    # -----------------------------------------

    def binary_search(self, numbers, target):
        left = 0
        right = len(numbers) - 1

        while left <= right:
            mid = (left + right) // 2

            if numbers[mid] == target:
                return mid

            elif numbers[mid] < target:
                left = mid + 1

            else:
                right = mid - 1

        return -1

    def find_by_number(self, number):
        numbers = sorted(self.by_number.keys())

        index = self.binary_search(numbers, number)

        if index == -1:
            return None

        return self.by_number[numbers[index]]

    # -----------------------------------------
    # 3. Recursive Sum
    # -----------------------------------------

    def total_transactions(self, number):
        account = self.find(number)

        if account is None:
            return 0

        return self._sum_history(account.history)

    def _sum_history(self, history):
        if not history:
            return 0

        return history[0][1] + self._sum_history(history[1:])