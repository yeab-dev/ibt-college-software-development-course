// 1
const prices = [200, 500, 850, 1200, 300, 1500];

const grandTotal = prices
  .map(price => price * 1.15)
  .filter(price => price < 1000)
  .reduce((sum, price) => sum + price, 0);

console.log(grandTotal);

// 2
const customer = {
  name: "Hanna",
  city: "Bole",
  balance: 2500
};

for (const [key, value] of Object.entries(customer)) {
  console.log(`${key}: ${value}`);
}

// 3
const customer = {
  name: "Hanna",
  city: "Bole"
};

const { name, city } = customer;

function greet({ name }) {
  console.log(`Hello, ${name}!`);
}

greet(customer);

// 4.
const customer = {
  name: "Hanna",
  city: "Bole",
  balance: 2500
};

const updatedCustomer = {
  ...customer,
  city: "Kazanchis",
  phone: "0912345678"
};

console.log(customer);
console.log(updatedCustomer);

// 5. 
export const VAT = 0.15;
export const addVat = amount => amount * (1 + VAT);