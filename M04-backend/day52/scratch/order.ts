export {};

const AREAS = ["Bole", "Kazanchis", "Piassa", "Megenagna"] as const;
type Area = (typeof AREAS)[number];

type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

type Dish = { name: string; priceSantim: number };

type Order = {
  readonly id: number;
  customerName: string;
  area: Area;
  status: OrderStatus;
  dishes: Dish[];
  telebirrPhone?: string;
  totalSantim: number;
};

function deliveryFee(order: Order): number {
  if (order.totalSantim >= 50000) {
    return 0;
  }
  return order.area === "Bole" ? 4000 : 6000;
}

function statusMessage(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Waiting for the restaurant to accept";
    case "PREPARING":
      return "Your food is being cooked";
    case "ON_THE_WAY":
      return "The rider has left the restaurant";
    case "DELIVERED":
      return "Delivered - enjoy your meal";
    case "CANCELLED":
      return "This order was cancelled";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

const etb = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
});

function formatEtb(santim: number): string {
  return etb.format(santim / 100);
}

function receipt(order: Order): string {
  const fee = deliveryFee(order);
  const grandTotal = order.totalSantim + fee;

  const items = order.dishes
    .map((dish) => `- ${dish.name}: ${formatEtb(dish.priceSantim)}`)
    .join("\n");

  return `
========== ORDER #${order.id} ==========
Customer: ${order.customerName}
Area: ${order.area}
Status: ${statusMessage(order.status)}

Items:
${items}

Subtotal: ${formatEtb(order.totalSantim)}
Delivery: ${fee === 0 ? "FREE" : formatEtb(fee)}
Total: ${formatEtb(grandTotal)}
${order.telebirrPhone ? `\nTeleBirr: ${order.telebirrPhone}` : ""}
================================
`;
}

// Sample orders
const order1: Order = {
  id: 101,
  customerName: "Abel",
  area: "Bole",
  status: "PENDING",
  dishes: [
    { name: "Burger", priceSantim: 25000 },
    { name: "Pizza", priceSantim: 20000 },
  ],
  telebirrPhone: "0912345678",
  totalSantim: 45000,
};

const order2: Order = {
  id: 102,
  customerName: "Sara",
  area: "Kazanchis",
  status: "PREPARING",
  dishes: [
    { name: "Chicken Burger", priceSantim: 30000 },
    { name: "Pasta", priceSantim: 25000 },
  ],
  totalSantim: 55000,
};

console.log(receipt(order1));
console.log(receipt(order2));
