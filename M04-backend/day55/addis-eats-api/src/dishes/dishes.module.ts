import { Module } from '@nestjs/common';
import { DishesController } from './dishes.controller.js';
import { DishesService } from './dishes.service.js';
import {
  DISH_REPOSITORY,
  InMemoryDishRepository,
} from './dishes.repository.js';

@Module({
  controllers: [DishesController],
  providers: [
    DishesService,
    {
      provide: DISH_REPOSITORY,
      useClass: InMemoryDishRepository,
    },
  ],
})
export class DishesModule {}
