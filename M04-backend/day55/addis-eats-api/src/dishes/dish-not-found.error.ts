export class DishNotFoundError extends Error {
  constructor(public readonly dishId: number) {
    super(`Dish ${dishId} not found`);
    this.name = 'DishNotFoundError';
  }
}
