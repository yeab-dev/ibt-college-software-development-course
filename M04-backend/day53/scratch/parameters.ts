export {};

// Optional: may be omitted, so its type includes undefined
function receipt(id: number, note?: string): string {
  return `Order ${id}: ${note ?? "no note"}`;
}

// Default: supplies a value, so the type stays narrow
function fee(area: string, base: number = 6000): number {
  return area === "Bole" ? 4000 : base;
}

// Rest: collects the remaining arguments into a typed array
function total(...amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + a, 0);
}

// Options object: named, order-free, easy to extend
type CreateOrderInput = {
  customer: string;
  area: string;
  dishes: string[];
  note?: string;
};

function createOrder({
  customer,
  area,
  dishes,
  note,
}: CreateOrderInput): string {
  return `${customer} in ${area}: ${dishes.join(", ")}${note ? ` (${note})` : ""}`;
}

console.log(receipt(17));
console.log(receipt(18, "extra awaze"));
console.log(fee("Piassa"));
console.log(fee("Piassa", 7500));
console.log(total(32000, 18000, 29000));
console.log(total());
console.log(
  createOrder({ area: "Bole", customer: "Hana", dishes: ["Tibs", "Shiro"] }),
);
