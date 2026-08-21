
# Country Facts

A simple JavaScript project that fetches live country information from the REST Countries API.

## Features


- Search for a country by name
- Displays the country's capital
- Displays population with comma formatting
- Displays region
- Displays currencies
- Displays the country's flag
- Shows a loading state while fetching data
- Shows an error message when a country cannot be found
- Defaults to Ethiopia when the page first loads

## Technologies

- HTML
- CSS
- JavaScript
- Fetch API
- Async/Await
- REST API
- DOM manipulation

## API

This project uses the free REST Countries API:

https://restcountries.com/

The endpoint used is:

https://restcountries.com/v3.1/name/{country}

For example:

https://restcountries.com/v3.1/name/ethiopia

## How to Run

1. Clone the repository.

2. Open the `index.html` file in a browser.

3. Enter a country name in the search box.

4. Click Search.

You can also use VS Code's Live Server extension to run the project.

## Error Handling

The application checks `res.ok` after fetching the API.

Network errors and HTTP errors are handled using `try/catch`.

## Example

Searching for:

Ethiopia

will display:

- Capital: Addis Ababa
- Population: ...
- Region: Africa
- Currencies: Ethiopian birr (Br)
- Ethiopian flag

## Project Files

- [index.html](./index.html)
- [styles.css](./styles.css)
- [app.js](./app.js)