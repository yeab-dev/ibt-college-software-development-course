const form = document.querySelector("#searchForm");
const input = document.querySelector("#countryInput");
const out = document.querySelector("#facts");


async function showCountry(name) {
    // Loading state
    out.textContent = "Loading...";

    try {
        const res = await fetch(
            `https://restcountries.com/v3.1/name/${name}`
        );

        // HTTP error
        if (!res.ok) {
            throw new Error("Country not found");
        }

        const [country] = await res.json();

        // Clear loading message
        out.innerHTML = "";

        // Render country information
        render(
            out,
            "Capital",
            country.capital?.[0] ?? "N/A"
        );

        render(
            out,
            "Population",
            country.population.toLocaleString()
        );

        render(
            out,
            "Region",
            country.region ?? "N/A"
        );

        renderCurrencies(
            out,
            country.currencies
        );

        renderFlag(
            out,
            country.flags?.png,
            `${country.name.common} flag`
        );

    } catch (error) {
        // Error state
        out.textContent = error.message;
        out.className = "error";
    }
}


function render(container, label, value) {
    const div = document.createElement("div");
    div.classList.add("fact");

    const strong = document.createElement("strong");
    strong.textContent = `${label}:`;

    const span = document.createElement("span");
    span.textContent = value;

    div.append(strong, span);

    container.appendChild(div);
}


function renderCurrencies(container, currencies) {
    if (!currencies) {
        render(container, "Currencies", "N/A");
        return;
    }

    const currencyNames = Object.values(currencies)
        .map(currency => {
            if (currency.symbol) {
                return `${currency.name} (${currency.symbol})`;
            }

            return currency.name;
        })
        .join(", ");

    render(
        container,
        "Currencies",
        currencyNames
    );
}


function renderFlag(container, flagUrl, altText) {
    if (!flagUrl) {
        return;
    }

    const img = document.createElement("img");

    img.src = flagUrl;
    img.alt = altText;
    img.classList.add("flag");

    container.appendChild(img);
}


form.addEventListener("submit", event => {
    event.preventDefault();

    const country = input.value.trim();

    if (!country) {
        return;
    }

    // Remove error class when searching again
    out.className = "";

    showCountry(country);
});


// Default country on page load
showCountry("ethiopia");