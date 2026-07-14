class Account:
    def __init__(self, owner: str, account_number: str,  balance: float):
        self.owner = owner
        self.account_number = account_number
        self.__balance = balance
    
    @property
    def balance(self):
        return self.__balance
    
    def deposit(self, amount):
        if amount < 0:
            raise ValueError("Amount must be non negative")
        self.__balance += amount


    def withdraw(self, amount):
        if amount < 0:
            raise ValueError("Amount must be non negative")
        if amount > self.balance:
            raise ValueError("Amount must not exceed the account balance")
        self.__balance -= amount
        