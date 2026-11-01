class Product:
    def __init__(self, name:str, price: float, quantity: int):
        self.name = name
        self.price = price
        self.__quantity = quantity
    
    @property
    def quantity(self):
        return self.__quantity
    

    def restock(self, new_quantity):
        if (new_quantity < 0):
            raise ValueError("quantity attribute cannot be negative")
        self.__quantity = new_quantity
    
    @quantity.setter
    def quantity(self, value):
        if (value >= 0):
            self.__quantity = value
        raise ValueError("quantity attribute cannot be negative")
