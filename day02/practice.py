def temperature_label(temperatureInC: int)-> str:
    if temperatureInC < 15:
        return "cold"
    elif temperatureInC < 28:
        return "warm"
    else:
        return "hot"

def receipts():
    for i in range(1, 11, 1):
        print(f"Receipt {i}")
def evenNumbers():
    for i in range(0, 21, 1):
        if (i%2 == 0):
            print(i)
def apply_discount(price: float, percent = 10) -> float:
    return price - (price * percent/100)
def countDown():
    i = 5
    while(i > 0):
        print(i)
        i -= 1
