class Account:
    def __init__(self, owner: str, account_number: str, balance: float):
        self.owner = owner
        self.account_number = account_number
        self._balance = balance

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        if amount < 0:
            raise ValueError("Amount must be non negative")

        self._balance += amount

    def withdraw(self, amount):
        if amount < 0:
            raise ValueError("Amount must be non negative")

        if amount > self.balance:
            raise ValueError("Insufficient balance")

        self._deduct(amount)

    def _deduct(self, amount):
        self._balance -= amount

    def statement(self):
        print(f'{self.owner}: {self.balance} ETB')