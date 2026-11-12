import { Inject, Injectable } from '@nestjs/common';
import type { Dish } from './dish.types.js';
import {
  DISH_REPOSITORY,
  type DishRepository,
} from './dishes.repository.js';
import type { CreateDishDto } from './dto/create-dish.dto.js';
import { DishNotFoundError } from './dish-not-found.error.js';

@Injectable()
export class DishesService {
  constructor(
    @Inject(DISH_REPOSITORY)
    private readonly repo: DishRepository,
  ) {}

  findAll(restaurantId?: number): Dish[] {
    const rows = this.repo.all();
    return restaurantId
      ? rows.filter((d) => d.restaurantId === restaurantId)
      : rows;
  }

  findOne(id: number): Dish {
    const hit = this.repo.byId(id);
    if (!hit) throw new DishNotFoundError(id);
    return hit;
  }

  create(dto: CreateDishDto): Dish {
    const id = Math.max(0, ...this.repo.all().map((d) => d.id)) + 1;
    return this.repo.save({ ...dto, id });
  }
}
