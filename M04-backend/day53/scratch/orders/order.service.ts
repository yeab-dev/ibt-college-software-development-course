import type { Area, Order } from "./order.types.ts";
import type { OrderRepository } from "./order.repository.ts";
import { OrderNotFoundError } from "./order.errors.ts";

export class OrderService {
  private readonly cache = new Map<number, Order>();
  private readonly repository: OrderRepository;

  constructor(repository: OrderRepository) {
    this.repository = repository;
  }

  find(id: number): Order {
    const cachedOrder = this.cache.get(id);

    if (cachedOrder) {
      return cachedOrder;
    }

    const order = this.repository.byId(id);

    if (!order) {
      throw new OrderNotFoundError(id);
    }

    this.cache.set(id, order);

    return order;
  }

  feesByArea(): Record<Area, number> {
    const fees: Record<Area, number> = {
      Bole: 0,
      Kazanchis: 0,
      Piassa: 0,
      Megenagna: 0,
    };

    for (const order of this.repository.all()) {
      if (order.status === "CANCELLED") {
        continue;
      }

      const total = order.dishes.reduce(
        (sum, dish) => sum + dish.priceSantim,
        0,
      );

      const fee = total >= 50000 ? 0 : order.area === "Bole" ? 4000 : 6000;

      fees[order.area] += fee;
    }

    return fees;
  }

  summarise<K extends keyof Order>(key: K): Order[K][] {
    return this.repository.all().map((order) => order[key]);
  }
}
