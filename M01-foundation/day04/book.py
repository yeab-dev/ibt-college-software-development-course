class Book:
    def __init__(self, title: str, author: str, description: str, pages: int):
        self.title = title
        self.author = author
        self.pages = pages
        self.description = description

    def describe(self):
        print(self.description)