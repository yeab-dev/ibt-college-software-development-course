from account import Account
from savings_account import SavingsAccount
class CurrentAccount(Account):
    def __init__(self, owner, account_number, balance, overdraft: float= 1000):
        super().__init__(owner, account_number, balance)
        self.overdraft = overdraft
    def withdraw(self, amount):
        if (self.balance < amount + self.overdraft):
            raise ValueError("Over limit")
    
    def statement(self):
        print(f'current: {self.owner}\noverdraft: {self.overdraft} ETB\nbalance: {self.balance}')

bank = [
    SavingsAccount('Bekele', '10005', 3000, 0.08),
    CurrentAccount('Betty', '10005', 10000, 2000),
]

for account in bank:
    account.deposit(200)
    account.statement()