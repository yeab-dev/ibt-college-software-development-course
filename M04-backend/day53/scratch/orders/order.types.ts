export const AREAS = ["Bole", "Kazanchis", "Piassa", "Megenagna"] as const;
export type Area = (typeof AREAS)[number];

export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

export interface Dish {
  name: string;
  priceSantim: number;
}

export interface Order {
  readonly id: number;
  customerName: string;
  area: Area;
  status: OrderStatus;
  dishes: Dish[];
  telebirrPhone?: string;
  totalSantim: number;
}
