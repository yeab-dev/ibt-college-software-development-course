export {};

type Area = "Bole" | "Kazanchis" | "Piassa" | "Megenagna";

interface Dish {
  id: number;
  name: string;
  priceSantim: number;
}

interface Order {
  readonly id: number;
  area: Area;
  totalSantim: number;
  internalNote: string;
}

const menu: Dish[] = [
  { id: 1, name: "Doro Wat", priceSantim: 32000 },
  { id: 2, name: "Tibs", priceSantim: 29000 },
  { id: 3, name: "Shiro", priceSantim: 18000 },
];

// ---- Collections ----

// Map: keys added at runtime, any key type, real .size
const byId = new Map<number, Dish>();
for (const dish of menu) byId.set(dish.id, dish);
console.log(byId.get(2)?.name, byId.get(99), byId.size);

// Set: unique values, fast membership
const areasServed = new Set<string>(["Bole", "Bole", "Piassa"]);
console.log(areasServed.size, areasServed.has("Bole"));

// Record: a fixed, known key set. Every Area must have a fee.
const feeByArea: Record<Area, number> = {
  Bole: 4000,
  Kazanchis: 6000,
  Piassa: 6000,
  Megenagna: 6000,
};
console.log(feeByArea.Piassa);

// ---- Generic functions ----

// T is filled in from the argument; the return type follows it
function first<T>(items: T[]): T | undefined {
  return items[0];
}
const d = first(menu); // Dish | undefined
console.log(d?.name);

// Constraint: T must at least have a name
interface Named {
  name: string;
}
function label<T extends Named>(item: T): string {
  return item.name.toUpperCase();
}
console.log(label({ name: "Kitfo", spicy: true }));

// keyof: K must be one of T's keys; T[K] is that key's type
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}
const names = pluck(menu, "name"); // string[]
const prices = pluck(menu, "priceSantim"); // number[]
console.log(names, prices);

// ---- Generic types ----

interface ApiResponse<T> {
  data: T;
  requestId: string;
}

interface Page<T> {
  items: T[];
  total: number;
  page: number;
}

function emptyPage<T>(): Page<T> {
  return { items: [], total: 0, page: 1 };
}

const menuResponse: ApiResponse<Page<Dish>> = {
  data: { items: menu, total: menu.length, page: 1 },
  requestId: "req-1",
};
const noOrdersYet = emptyPage<Order>(); // no argument to infer T from, so we state it
console.log(menuResponse.data.total, noOrdersYet.items.length);

// ---- Utility types: derive shapes from Order ----

type PublicOrder = Omit<Order, "internalNote">; // hide an internal field
type OrderSummary = Pick<Order, "id" | "totalSantim">; // list view
type UpdateOrder = Partial<Omit<Order, "id">> & { id: number }; // PATCH: id required, rest optional

const order: Order = {
  id: 17,
  area: "Bole",
  totalSantim: 32000,
  internalNote: "VIP",
};

function toPublic({ internalNote, ...rest }: Order): PublicOrder {
  return rest;
}
const summary: OrderSummary = { id: order.id, totalSantim: order.totalSantim };
const patch: UpdateOrder = { id: 17, area: "Piassa" };

console.log(toPublic(order), summary, patch);
