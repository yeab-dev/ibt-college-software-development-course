const discountBy = rate =>
    price => price * (1 - rate);

const memberPrice = discountBy(0.10);
const salePrice = discountBy(0.30);

console.log(memberPrice(1000)); 
console.log(salePrice(1000));