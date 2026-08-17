// ========================================
// 1. textContent + classList.toggle
// ========================================

const title = document.querySelector("#title");
const changeTitleButton = document.querySelector("#change-title");

changeTitleButton.addEventListener("click", () => {
    title.textContent = "DOM Practice Completed!";
    title.classList.toggle("highlight");
});


// ========================================
// 2. createElement + append
// ========================================

const cities = ["Addis Ababa", "Dire Dawa", "Bahir Dar"];

const cityList = document.querySelector("#city-list");

cities.forEach((city) => {
    const li = document.createElement("li");

    li.textContent = city;

    cityList.append(li);
});


// ========================================
// 3. Event bubbling
// ========================================

const eventButton = document.querySelector("#event-button");
const buttonContainer = document.querySelector("#button-container");

eventButton.addEventListener("click", (event) => {
    console.log("Button listener");
    console.log("event.target:", event.target);
});

buttonContainer.addEventListener("click", (event) => {
    console.log("Container listener");
    console.log("event.target:", event.target);
});


// ========================================
// 4. Event delegation
// ========================================

const itemList = document.querySelector("#item-list");

itemList.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
        event.target.parentElement.remove();
    }
});


// ========================================
// 5. Form + preventDefault + input.value
// ========================================

const form = document.querySelector("#add-form");
const input = document.querySelector("#item-input");
const submittedItems = document.querySelector("#submitted-items");

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const value = input.value.trim();

    if (value === "") {
        return;
    }

    const li = document.createElement("li");

    li.textContent = value;

    submittedItems.append(li);

    input.value = "";
});