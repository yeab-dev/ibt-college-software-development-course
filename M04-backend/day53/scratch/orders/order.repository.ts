import type { Order } from "./order.types.ts";

export interface OrderRepository {
  byId(id: number): Order | undefined;
  all(): Order[];
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders: Map<number, Order>;

  constructor(orders: Order[]) {
    this.orders = new Map(orders.map((order) => [order.id, order]));
  }

  byId(id: number): Order | undefined {
    return this.orders.get(id);
  }

  all(): Order[] {
    return [...this.orders.values()];
  }
}
