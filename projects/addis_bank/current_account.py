from account import Account
from savings_account import SavingsAccount
class CurrentAccount(Account):
    def __init__(self, owner, account_number, balance, overdraft: float= 1000):
        super().__init__(owner, account_number, balance)
        self.overdraft = overdraft
    def withdraw(self, amount):
        if amount > self.balance + self.overdraft:
            raise ValueError("Over limit")
        if amount < 0:
            raise ValueError("Amount must be non negative")
        self._deduct(amount)
    
    def statement(self):
        print(f'current: {self.owner}\noverdraft: {self.overdraft} ETB\nbalance: {self.balance}')

