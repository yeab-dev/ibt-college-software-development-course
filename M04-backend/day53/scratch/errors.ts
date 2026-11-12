// Named exports: one name everywhere it's imported

export class OrderNotFoundError extends Error {
  readonly orderId: number;

  constructor(orderId: number) {
    super(`Order ${orderId} not found`);
    this.name = "OrderNotFoundError";
    this.orderId = orderId;
  }
}

export class PaymentDeclinedError extends Error {
  readonly phone: string;
  readonly reason: string;

  constructor(phone: string, reason: string) {
    super(`telebirr declined ${phone}: ${reason}`);
    this.name = "PaymentDeclinedError";
    this.phone = phone;
    this.reason = reason;
  }
}

// For expected, routine failures: return a result instead of throwing
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
