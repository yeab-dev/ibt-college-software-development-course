from savings_account import SavingsAccount
from current_account import CurrentAccount
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

class AccountFactory:
    @staticmethod
    def create(kind: str, owner: str, number: str, balance=0):
        if kind == 'savings':
            return SavingsAccount(owner, number, balance)
        if kind == "current":
            return CurrentAccount(owner, number, balance)
        raise ValueError(f'unknown type {kind}')


account = AccountFactory.create("savings", 'YB', '1001', 5000)
