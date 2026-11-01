'use strict';

const subtotal = (...prices) =>
    prices.reduce((sum, price) =>
        sum + price, 0);

const discountBy = rate =>
    n =>
        n * (1 - rate);

const withVat = n => n * 1.15;

const toETB = n => `${n.toFixed(2)} ETB`;

const pipe = (...fns) => x =>
    fns.reduce((acc, fn) => fn(acc), x);

const makeReceipt = (discountRate) => {
    let orderNumber = 0;

    const discount = discountBy(discountRate);

    const calculateTotal = pipe(
        discount,
        withVat,
        toETB
    );

    return (...prices) => {
        orderNumber++;

        const sub = subtotal(...prices);
        const total = calculateTotal(sub);

        return `#${orderNumber}: ${total}`;
    };
};

const receipt = makeReceipt(0.1);

//test
console.log(receipt(100, 80, 30));
console.log(receipt(7500, 510, 300));
console.log(receipt(200, 200, 304));
console.log(receipt(90, 100, 35));