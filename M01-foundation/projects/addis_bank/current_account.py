from account import Account
from bank_config import BankConfig
class CurrentAccount(Account):
    def __init__(self, owner, account_number, balance):
        super().__init__(owner, account_number, balance)
    def withdraw(self, amount):
        config = BankConfig()
        if amount < 0:
            raise ValueError("Amount must be non negative")
        if self.balance - amount >= -config.overdraft_limit:
            self._balance -= amount
            self._notify("Withdrawal")

        else: raise ValueError("Over limit")
    
    def statement(self):
        return (
            f"Current Account\n"
            f"{super().statement()}\n"
            f"Overdraft: {self.overdraft}"
        )

