from account import Account
class SavingsAccount(Account):
    def __init__(self, owner: str, account_number: str, balance: float, rate: float):
        super().__init__(owner, account_number, balance)
        self.rate = rate
    
    def add_interest(self):
        self.deposit(self.balance * self.rate)

    def statement(self):
        print(
            f"Saving Account\n"
            f"{super().statement()}\n"
        )