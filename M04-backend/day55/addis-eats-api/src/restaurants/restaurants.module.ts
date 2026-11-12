import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller.js';
import { RestaurantsService } from './restaurants.service.js';
import {
  RESTAURANT_REPOSITORY,
  InMemoryRestaurantRepository,
} from './restaurants.repository.js';

@Module({
  controllers: [RestaurantsController],
  providers: [
    RestaurantsService,
    {
      provide: RESTAURANT_REPOSITORY,
      useClass: InMemoryRestaurantRepository,
    },
  ],
})
export class RestaurantsModule {}
