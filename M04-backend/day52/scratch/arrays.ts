export {};
type Dish = { name: string; priceSantim: number };
const menu: Array<Dish> = [
  { name: "Doro Wat", priceSantim: 32000 },
  { name: "Shiro", priceSantim: 18000 },
  { name: "Tibs", priceSantim: 29000 },
];

// menu.push({ name: "Kitfo" });

const cheap = menu.filter((d) => d.priceSantim < 30000).map((d) => d.name);
const bill = menu.reduce((sum, d) => (sum += d.priceSantim), 0);

const kitfo = menu.find((d) => d.name === "Kitfo");
console.log(kitfo?.priceSantim);

const tenth = menu[10];
console.log(tenth.name);

const featured: readonly Dish[] = menu;
// featured.push({ name: "Firfir", priceSantim: 15000 });

const orderIds = [];
orderIds.push(1);
orderIds.push("two");

console.log(cheap, bill, orderIds);
