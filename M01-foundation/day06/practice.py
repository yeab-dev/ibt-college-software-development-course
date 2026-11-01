import math

# ==========================================================
# Exercise 1 - Single Responsibility Principle (SRP)
# ==========================================================

class ReportBuilder:
    def build(self):
        return "Monthly Sales Report"


class ReportSaver:
    def save(self, report):
        print(f"Saving {report} to disk...")


class ReportEmailer:
    def email(self, report):
        print(f"Emailing {report}...")


# Example
builder = ReportBuilder()
report = builder.build()

saver = ReportSaver()
emailer = ReportEmailer()

saver.save(report)
emailer.email(report)


# ==========================================================
# Exercise 2 - Open/Closed Principle (OCP)
# ==========================================================

class Shape:
    def area(self):
        raise NotImplementedError


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2


class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side ** 2


class Triangle(Shape):
    def __init__(self, base, height):
        self.base = base
        self.height = height

    def area(self):
        return 0.5 * self.base * self.height


# Example
shapes = [
    Circle(5),
    Square(4),
    Triangle(10, 6)
]

for shape in shapes:
    print(shape.area())


# ==========================================================
# Exercise 3 - Singleton Pattern
# ==========================================================

class AppSettings:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.currency = "ETB"
        return cls._instance


settings1 = AppSettings()
settings2 = AppSettings()

print(settings1.currency)
print(settings1 is settings2)   # True


# ==========================================================
# Exercise 4 - Factory Pattern
# ==========================================================

class Shape:
    def draw(self):
        raise NotImplementedError


class Circle(Shape):
    def draw(self):
        print("Drawing Circle")


class Square(Shape):
    def draw(self):
        print("Drawing Square")


class Triangle(Shape):
    def draw(self):
        print("Drawing Triangle")


class ShapeFactory:
    def create(self, kind):
        if kind == "circle":
            return Circle()
        elif kind == "square":
            return Square()
        elif kind == "triangle":
            return Triangle()
        else:
            raise ValueError("Unknown shape")


factory = ShapeFactory()

shape = factory.create("circle")
shape.draw()

shape = factory.create("square")
shape.draw()

shape = factory.create("triangle")
shape.draw()


# ==========================================================
# Exercise 5 - Observer Pattern
# ==========================================================

class Subscriber:
    def update(self, news):
        raise NotImplementedError


class EmailSubscriber(Subscriber):
    def update(self, news):
        print(f"Email received: {news}")


class MobileSubscriber(Subscriber):
    def update(self, news):
        print(f"Mobile notification: {news}")


class NewsAgency:
    def __init__(self):
        self.subscribers = []

    def subscribe(self, subscriber):
        self.subscribers.append(subscriber)

    def unsubscribe(self, subscriber):
        self.subscribers.remove(subscriber)

    def notify(self, news):
        for subscriber in self.subscribers:
            subscriber.update(news)


agency = NewsAgency()

email = EmailSubscriber()
mobile = MobileSubscriber()

agency.subscribe(email)
agency.subscribe(mobile)

agency.notify("Breaking News: Python 4 Released!")