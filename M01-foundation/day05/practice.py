from abc import ABC, abstractmethod

class Vehicle(ABC):
    def __init__(self, make:str, model:str,):
        self.make = make
        self.model = model

    @abstractmethod
    def describe(self)-> str:
        ...
    @abstractmethod
    def wheels(self) -> int:
        ...

class Car(Vehicle):
    def __init__(self, make, model):
        super().__init__(make, model)

    def describe(self) -> str:
        return f"Car: {self.make} {self.model}."
    def wheels(self)-> int:
        return 4

class Truck(Vehicle):
    def __init__(self, make: str, model: str, capacity: float):
        self.capacity = capacity
        super().__init__(make, model)

    def describe(self)-> str:
        return (
            f"Truck: {self.make} {self.model}, "
            f"with a payload capacity of {self.capacity} tons."
        )
    def wheels(self):
        return 8


vehicles = [Car("Toyota", "Corolla",), Car("Ford", "Mustang"), Truck("Ford", "F-150", 1800.0), Truck("Nissan", "Navara", 1000)]

for vehicle in vehicles:
    print(vehicle.describe())