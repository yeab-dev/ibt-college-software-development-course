'use strict';

function vat(amount, rate = 0.15) {
    return amount * (1 + rate);
}

// Arrow function with implicit return
const vatArrow = (amount, rate = 0.15) => amount * (1 + rate);

console.log(vat(1000));       // 1150
console.log(vatArrow(1000));  // 1150