export {};
type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

let status: OrderStatus = "PENDING";
status = "PREPARING";

const AREAS_WIDE = ["Bole", "Kazanchis", "Piassa", "Megenagna"];

type Area = (typeof AREAS_WIDE)[number];

const home: Area = "Bole";
const away: Area = "CMC";

console.log(status, home, away, AREAS_WIDE);
