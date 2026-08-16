const PHONE = /^(?:\+251|0)9\d{8}$/;

const themeToggle = document.querySelector("#themeToggle");
const form = document.querySelector("#signupForm");
const nameInput = document.querySelector("#name");
const phoneInput = document.querySelector("#phone");
const error = document.querySelector("#error");
const count = document.querySelector("#count");

// ---------- Storage ----------

function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function load(key) {
    try {
        const data = localStorage.getItem(key);

        if (data === null) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// ---------- Theme ----------

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const theme = document.body.classList.contains("dark")
        ? "dark"
        : "light";

    localStorage.setItem("theme", theme);
});

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
}

// ---------- Validation ----------

function validate(name, phone) {
    if (name.length < 2) {
        return "Enter your full name.";
    }

    if (!PHONE.test(phone)) {
        return "Enter a valid Ethiopian phone number.";
    }

    return "";
}

// ---------- Signup ----------

function updateCount() {
    const people = load("people");

    count.textContent = `${people.length} people have signed up.`;
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    const message = validate(name, phone);

    if (message) {
        error.textContent = message;
        return;
    }

    const people = load("people");

    people.push({
        name,
        phone
    });

    save("people", people);

    error.textContent = "";
    form.reset();

    updateCount();
});

updateCount();