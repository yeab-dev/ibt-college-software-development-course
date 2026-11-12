import { SEED_ORDERS } from "./orders/index.ts";

export function groupBy<T, K extends keyof T>(
  items: T[],
  key: K,
): Map<T[K], T[]> {
  const groups = new Map<T[K], T[]>();

  for (const item of items) {
    const value = item[key];
    const group = groups.get(value);

    if (group) {
      group.push(item);
    } else {
      groups.set(value, [item]);
    }
  }

  return groups;
}

// Group orders by area
const ordersByArea = groupBy(SEED_ORDERS, "area");

console.log("Orders grouped by area:");

for (const [area, orders] of ordersByArea) {
  console.log(`${area} → ${orders.map((order) => order.id).join(", ")}`);
}

// Group orders by status
const ordersByStatus = groupBy(SEED_ORDERS, "status");

console.log("\nOrders grouped by status:");

for (const [status, orders] of ordersByStatus) {
  console.log(`${status} → ${orders.map((order) => order.id).join(", ")}`);
}
