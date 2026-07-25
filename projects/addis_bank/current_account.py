from account import Account
class CurrentAccount(Account):
    def __init__(self, owner, account_number, balance, overdraft: float= 1000):
        super().__init__(owner, account_number, balance)
        self.overdraft = overdraft
    def withdraw(self, amount):
        if amount < 0:
            raise ValueError("Amount must be non negative")
        if amount > self.balance + self.overdraft:
            raise ValueError("Over limit")
        self._balance -= amount
    
    def statement(self):
        print(
            f"Current Account\n"
            f"{super().statement()}\n"
            f"Overdraft: {self.overdraft}"
        )

