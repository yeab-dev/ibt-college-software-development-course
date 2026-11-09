export {};
type Restaurant = {
  readonly id: number;
  name: string;
  area: string;
  phone?: string;
};

type Order = {
  id: number;
  restaurant: Restaurant;
  totalSantim: number;
  telebirrPhone: string | null;
};

const yod: Restaurant = { id: 1, name: "Yod Abyssinia", area: "Bole" };

const kategna: Restaurant = { id: 2, name: "Kategna", area: "Bole" };

console.log(yod.phone?.trim());
// or
yod.phone ? console.log(yod.phone.trim()) : "number is missing";

const order: Order = {
  id: 4821,
  restaurant: yod,
  totalSantim: 24000,
  telebirrPhone: "",
};

const fromSomewhere = {
  id: 3,
  name: "Habesha 2000",
  area: "Kazanchis",
  rating: 4,
};
const ok: Restaurant = fromSomewhere;
console.log(order, ok, kategna);
