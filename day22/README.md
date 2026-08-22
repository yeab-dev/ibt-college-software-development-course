# Birr Budget 💰

A simple, lightweight personal finance tracker for managing everyday income and expenses in Ethiopian Birr (ETB).

Birr Budget is a browser-based project built with **HTML, CSS, and vanilla JavaScript**. It stores transactions locally in the browser and provides a simple interface for tracking spending and understanding your financial activity.

## ✨ Features

* 💵 Track income and expenses
* 📊 View your financial summary
* 🧾 Add and manage transactions
* 💾 Persist transactions using browser `localStorage`
* 🌙 Light and dark theme support
* 🌍 Language/localization support
* 🇪🇹 Designed around Ethiopian Birr (ETB)
* 📱 Responsive interface for different screen sizes
* 📦 Load initial transaction data from JSON

## 🛠️ Built With

* **HTML5** — Application structure
* **CSS3** — Styling and responsive design
* **JavaScript (ES6+)** — Application logic and interactivity
* **LocalStorage API** — Client-side data persistence
* **JSON** — Initial transaction data

## 📁 Project Structure

```text
birr-budget/
├── index.html
├── css/
│   └── ...
├── js/
│   └── ...
├── data/
│   └── transactions.json
├── assets/
│   └── ...
└── README.md
```

> The exact CSS/JavaScript files may vary depending on the project version.

## 🚀 Getting Started

No build tools or dependencies are required.

### 1. Clone the repository

```bash
git clone <repository-url>
cd birr-budget
```

### 2. Run the project

Because the application loads JSON data, it is recommended to run it through a local development server rather than opening `index.html` directly.

For example, with VS Code, use **Live Server** or another local HTTP server.

### 3. Start managing your budget

Open the application in your browser and start adding transactions.

Your transaction data and preferences are stored locally in your browser.

## 💾 Data Storage

Birr Budget uses the browser's `localStorage` to persist user data.

This means:

* Your transactions remain available after refreshing the page.
* Data is stored locally on your device.
* No backend or database is required.
* Clearing the browser's site data will remove the stored transactions.

Initial transaction data is provided through:

```text
data/transactions.json
```

## 🌍 Localization

The application includes language support and stores the selected language locally so the preference can persist between sessions.

## 🎨 Themes

Birr Budget supports theme switching and remembers the selected theme using browser storage.

## 🔒 Privacy

Birr Budget does not require an account or send financial data to a server. Transaction data is stored locally in the browser.

## 📚 Project Purpose

This project was built as a practical JavaScript project to practice:

* DOM manipulation
* Event handling
* Working with arrays and objects
* LocalStorage
* JSON data
* Application state
* Localization
* Theme management
* Modular frontend development

## 📄 License

This project is available for learning and personal use.
