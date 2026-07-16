from abc import ABC, classmethod
class Account(ABC):
    @classmethod
    def calculateInterest(self):
        ...

#learned about the abc class and @classmethod annotation (never new these exist)