import { OrderNotFoundError, PaymentDeclinedError } from "./errors.ts";
import type { Result } from "./errors.ts";

interface Order {
  id: number;
  totalSantim: number;
}

const orders = new Map<number, Order>([
  [17, { id: 17, totalSantim: 32000 }],
  [18, { id: 18, totalSantim: 60000 }],
]);

// Services THROW: the caller can't sensibly continue without an order
function findOrder(id: number): Order {
  const order = orders.get(id);
  if (!order) throw new OrderNotFoundError(id);
  return order;
}

function pay(phone: string, order: Order): void {
  if (!phone.startsWith("09"))
    throw new PaymentDeclinedError(phone, "not an Ethio telecom number");
  console.log(`  paid ${order.totalSantim} santim from ${phone}`);
}

// Parsers RETURN: bad user input is expected, not exceptional
function parseOrderId(raw: string): Result<number> {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0
    ? { ok: true, value: id }
    : { ok: false, error: `"${raw}" is not an order id` };
}

// The boundary: the one place that turns any error into an HTTP status
function statusFor(err: unknown): number {
  if (err instanceof OrderNotFoundError) return 404;
  if (err instanceof PaymentDeclinedError) return 402;
  return 500;
}

function checkout(rawId: string, phone: string): void {
  const parsed = parseOrderId(rawId);
  if (!parsed.ok) {
    console.log(400, parsed.error);
    return;
  }
  try {
    pay(phone, findOrder(parsed.value));
    console.log(200, "OK");
  } catch (err) {
    // err is unknown: JavaScript lets you throw anything
    const message = err instanceof Error ? err.message : String(err);
    console.log(statusFor(err), message);
  }
}

checkout("17", "0911223344");
checkout("abc", "0911223344");
checkout("99", "0911223344");
checkout("18", "+1 555 0100");

try {
  throw "kitchen on fire"; // legal JavaScript, and why catch can't assume Error
} catch (err) {
  console.log(statusFor(err), err instanceof Error ? err.message : String(err));
}
