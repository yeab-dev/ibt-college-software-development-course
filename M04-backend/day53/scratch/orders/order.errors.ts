export class OrderNotFoundError extends Error {
  public readonly orderId: number;

  constructor(orderId: number) {
    super(`Order ${orderId} was not found`);
    this.name = "OrderNotFoundError";
    this.orderId = orderId;
  }
}

export class PaymentDeclinedError extends Error {
  public readonly phone: string;
  public readonly reason: string;

  constructor(phone: string, reason: string) {
    super(`Payment declined for ${phone}: ${reason}`);
    this.name = "PaymentDeclinedError";
    this.phone = phone;
    this.reason = reason;
  }
}
