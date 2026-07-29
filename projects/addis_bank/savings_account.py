from account import Account
from bank_config import BankConfig
class SavingsAccount(Account):
    def __init__(self, owner: str, account_number: str, balance: float, rate: float):
        super().__init__(owner, account_number, balance)
    
    def add_interest(self):
        config = BankConfig()

        interest = self._balance * config.interest_rate
        self.deposit(interest)


    def statement(self):
        return (
            f"Saving Account\n"
            f"{super().statement()}\n"
        )