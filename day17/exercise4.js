const applyToAll = (list, fn) =>
    list.reduce((results, item) => {
        results.push(fn(item));
        return results;
    }, []);

const prices = [100, 500, 1000, 2000];

const pricesWithVat = applyToAll(
    prices,
    price => price * 1.15
);

console.log(pricesWithVat);