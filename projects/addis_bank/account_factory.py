from savings_account import SavingsAccount
from current_account import CurrentAccount
from bank_config import BankConfig
class AccountFactory:
    @staticmethod
    def create(kind: str, owner: str, number: str, balance=0):
        config = BankConfig()
        if kind == 'savings':
            return SavingsAccount (owner, number, balance, config._instance.interest_rate)
        if kind == "current":
            return CurrentAccount(owner, number, balance)
        raise ValueError(f'unknown type {kind}')

