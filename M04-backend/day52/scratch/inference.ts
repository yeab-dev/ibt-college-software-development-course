export {};

// 1 - inference: hover each name in VS Code and read its type
const restaurant = "Yod Abyssinia";
let city = "Addis Ababa";
const dishCount = 14;

// 2 - annotate what inference can't see
function deliveryFee(area: string): number {
  return area === "Bole" ? 4000 : 6000;
}
console.log(deliveryFee("Bole"));

const raw = '{"totalSantim": 24000}';

// 3 - any: the typo below compiles fine...
const payload: any = JSON.parse(raw);
console.log(payload.totlaSantim.toFixed(2));

// 4 - unknown: the compiler makes you check first
const body: unknown = JSON.parse(raw);
if (
  typeof body === "object" &&
  body !== null &&
  "totalSantim" in body &&
  typeof body.totalSantim === "number"
) {
  console.log(body.totalSantim / 100);
}

type Restaurante = {
  readonly id: number;
  name: string;
  area: string;
  phone?: string;
};
