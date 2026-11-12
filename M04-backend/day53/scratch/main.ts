import {
  SEED_ORDERS,
  InMemoryOrderRepository,
  OrderService,
  OrderNotFoundError,
} from "./orders/index.ts";

const repository = new InMemoryOrderRepository(SEED_ORDERS);

const service = new OrderService(repository);

console.log("Finding order 4806:");
console.log(service.find(4806));

console.log("Delivery fees by area:");
console.log(service.feesByArea());

console.log("Customer names:");
console.log(service.summarise("customerName"));

console.log("Finding nonexistent order:");

try {
  console.log(service.find(9999));
} catch (error) {
  if (error instanceof OrderNotFoundError) {
    console.error(`Order ${error.orderId} was not found.`);
  } else {
    throw error;
  }
}
