export {};
type LatLng = [lat: number, lng: number];

const bole: LatLng = [8.9806, 38.7578];
// const wrong: LatLng = [8.9806];
// const swapped: LatLng = [38.7578, "8.9806"];

const [lat, lng] = bole;
// const third = bole[2];

// bole.push[0];
console.log(bole);

type Result<T> = [T, null] | [null, Error];

function parseTotal(raw: string): Result<number> {
  const n = Number(raw);
  return Number.isNaN(n) ? [null, new Error("not a number")] : [n, null];
}

const [total, error] = parseTotal("2400");
// console.log(total + 100);

if (error === null) {
  console.log(total + 100);
}

// console.log(lat, lng, wrong, swapped, third);
