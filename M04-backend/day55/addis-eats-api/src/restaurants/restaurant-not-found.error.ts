export class RestaurantNotFoundError extends Error {
  constructor(public readonly restaurantId: number) {
    super(`Restaurant ${restaurantId} not found`);
    this.name = 'RestaurantNotFoundError';
  }
}
