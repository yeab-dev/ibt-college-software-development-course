export {};

const customer: string = "Almaz Bekele";
const area: string = "Kazanchis";
let totalSantim: number = 24000;
const paid: boolean = false;
const dishCount = 14;

console.log(
  `${customer} in ${area} owes ${totalSantim / 100} ETB, paid: ${paid}`,
);

const numbers = [1, 2, 3, 4, 5, 6];
const AREAS = ["Bole", "Kazanchis", "Piassa", "Megenagna"] as const;
type Area = (typeof AREAS)[number];
// Area = "Bole" | "Kazanchis" | "Piassa" | "Megenagna"
