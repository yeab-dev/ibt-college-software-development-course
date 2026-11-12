import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
} from '@nestjs/common';
import type { Response } from 'express';
import { RestaurantNotFoundError } from '../restaurants/restaurant-not-found.error.js';
import { DishNotFoundError } from '../dishes/dish-not-found.error.js';

@Catch(RestaurantNotFoundError, DishNotFoundError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(err: RestaurantNotFoundError | DishNotFoundError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(404).json({
      statusCode: 404,
      message: err.message,
    });
  }
}
