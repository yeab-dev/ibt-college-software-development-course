def distinct_cities():
    cities = ["Addis Ababa", "Gondar", "Hawasa", "Gondar", "Dire Dawa", "Addis Ababa"]
    print(set(cities))

def price_report():
    groceries_with_prices = {"Apples": 200, "Oranges": "150", "Banana": 100}
    for grocery, price in groceries_with_prices.items():
        print(f"{grocery}: {price}")

def tax_comprehension():
    prices = [100, 250, 400, 80]
    prices_with_taxes = [p + p*0.15 for p in prices]
    print(prices_with_taxes)

def cheap_items():
    prices = [100, 250, 400, 80]
    cheap_prices = [p for p in prices if p < 200]


def write_and_read():
    with open("day03/names.txt", 'w') as f:
        f.write('Abebe\n')
        f.write('Bekele\n')
        f.write('Shimelis')
    
    with open('day03/names.txt', 'r') as f:
        for name in f:
            print(name.strip())

def safe_division():
    try:
        number = int(input("Enter a number: "))
        result = 1000 / number
        print("Result:", result)

    except ValueError:
        print("Please enter a valid number.")

    except ZeroDivisionError:
        print("Cannot divide by zero.")
