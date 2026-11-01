async function getUsdToEtbRate() {
    const res = await fetch(
        "https://open.er-api.com/v6/latest/USD"
    );

    if (!res.ok) {
        throw new Error("Failed to fetch exchange rate");
    }

    const data = await res.json();

    return data.rates.ETB;
}

getUsdToEtbRate()
    .then(rate => {
        console.log(`1 USD = ${rate} ETB`);
    })
    .catch(error => {
        console.error(error.message);
    });