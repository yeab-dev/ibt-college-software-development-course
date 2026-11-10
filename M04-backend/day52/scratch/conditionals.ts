export {};

type Order = {
  totalSantim: number;
  area: string;
  note?: string;
  feeOverrideSantim?: number;
};

function deliveryFee(order: Order): number {
  if (order.totalSantim >= 50000) return 0;
  if (order.area === "Bole") return 4000;
  return 6000;
}

function chargedFee(order: Order): number {
  return order.feeOverrideSantim ?? deliveryFee(order);
}

function noteLength(order: Order): number {
  return order.note?.length ?? 0;
}

const promo: Order = {
  totalSantim: 24000,
  area: "Piassa",
  feeOverrideSantim: 0,
};
const big: Order = { totalSantim: 6000, area: "Piassa" };
const note = promo.note ?? "No special instructions";

console.log(chargedFee(promo), deliveryFee(big), note, noteLength(big));
