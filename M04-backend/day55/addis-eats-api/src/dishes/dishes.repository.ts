import { Injectable } from '@nestjs/common';
import type { Dish } from './dish.types.js';
import { DISH_SEED } from './dishes.seed.js';

export const DISH_REPOSITORY = Symbol('DISH_REPOSITORY');

export interface DishRepository {
  all(): Dish[];
  byId(id: number): Dish | undefined;
  save(d: Dish): Dish;
}

@Injectable()
export class InMemoryDishRepository implements DishRepository {
  private readonly rows = new Map<number, Dish>(
    DISH_SEED.map((d) => [d.id, d]),
  );

  all(): Dish[] {
    return [...this.rows.values()];
  }

  byId(id: number): Dish | undefined {
    return this.rows.get(id);
  }

  save(d: Dish): Dish {
    this.rows.set(d.id, d);
    return d;
  }
}
