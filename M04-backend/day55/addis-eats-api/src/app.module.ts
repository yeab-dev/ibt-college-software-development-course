import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RestaurantsModule } from './restaurants/restaurants.module.js';
import { DishesModule } from './dishes/dishes.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';

@Module({
  imports: [RestaurantsModule, DishesModule, OrdersModule, PaymentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
