from savings_account import *
from current_account import *
bank = [
    SavingsAccount('Bekele', '10005', 3000, 0.08),
    CurrentAccount('Betty', '10005', 10000, 2000),
]

for account in bank:
    account.deposit(200)
    account.statement()