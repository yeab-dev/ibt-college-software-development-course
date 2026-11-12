import { Injectable } from '@nestjs/common';
import type { Restaurant } from './restaurant.types.js';
import { SEED } from './restaurants.seed.js';

export const RESTAURANT_REPOSITORY = Symbol('RESTAURANT_REPOSITORY');

export interface RestaurantRepository {
  all(): Restaurant[];
  byId(id: number): Restaurant | undefined;
  save(r: Restaurant): Restaurant;
}

@Injectable()
export class InMemoryRestaurantRepository implements RestaurantRepository {
  private readonly rows = new Map<number, Restaurant>(
    SEED.map((r) => [r.id, r]),
  );

  all(): Restaurant[] {
    return [...this.rows.values()];
  }

  byId(id: number): Restaurant | undefined {
    return this.rows.get(id);
  }

  save(r: Restaurant): Restaurant {
    this.rows.set(r.id, r);
    return r;
  }
}
