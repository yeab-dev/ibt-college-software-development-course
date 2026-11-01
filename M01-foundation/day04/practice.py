from book import *
from product import *

book1 = Book("Atomic Habits", "James Clear", "The NT best seller about how small habits can make big differences", 356)
book2 = Book("The 7 Habits of Highly Effective People", "Stephen Covey", "The 7 Habits of Highly Effective People is a business and self-help book written by Stephen R. Covey. First published in 1989, the book goes over Covey's ideas on how to spur and nurture personal change.", 400)

book1.describe()
book2.describe()



product1 = Product("Mango", 180.0, 50)
product2 = Product("Banana", 100.0, 100)
product3 = Product("Papaya", 120.0, 70)

product1.restock(200)
print(product1.quantity)
print(product2.quantity) # NOt affected
print(product3.quantity) # Not affected