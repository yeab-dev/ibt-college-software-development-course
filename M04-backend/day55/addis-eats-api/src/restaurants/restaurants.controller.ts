import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service.js';
import type { Area } from './restaurant.types.js';
import type { CreateRestaurantDto } from './dto/create-restaurant.dto.js';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  @Get()
  findAll(@Query('area') area?: Area) {
    return this.restaurants.findAll(area);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.restaurants.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRestaurantDto) {
    return this.restaurants.create(dto);
  }
}
