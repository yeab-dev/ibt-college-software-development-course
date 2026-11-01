stock = {}

try:
    with open('day03/stock.txt') as f:
        for line in f:
            item, qty = line.strip().split(',')
            stock[item] = int(qty)

except FileNotFoundError:
    print('No stock file yet - starting empty')


def adjust(item, amount):
    stock[item] = stock.get(item, 0) + amount


adjust('apple', -10)
adjust('banana', 4)

low = [item for item, qty in stock.items() if qty < 10]
print('Low stock:', low)

with open('day03/stock.txt', 'w') as f:
    for item, qty in stock.items():
        f.write(f'{item},{qty}\n')
