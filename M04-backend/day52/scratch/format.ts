export {};

type Dish = { name: string; priceSantim: number };

const menu: Dish[] = [
  { name: "Doro Wat", priceSantim: 32000 },
  { name: "Shiro", priceSantim: 18050 },
];

for (const [i, dish] of menu.entries()) {
  console.log(`${i + 1}. ${dish.name}`);
}

const etb = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
});

function formatEtb(santim: number): string {
  return etb.format(santim / 100);
}

console.log(formatEtb(menu[1].priceSantim));

console.log(`Order: ${JSON.stringify(menu[0])}`);

const total = menu.reduce((sum, dish) => sum + dish.priceSantim, 0);
console.log(`Total: ${formatEtb(total)}`);
