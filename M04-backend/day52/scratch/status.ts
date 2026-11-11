export {};
type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

function message(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Waiting for the restaurant to accept";
    case "PREPARING":
      return "Your food is being cooked";
    case "ON_THE_WAY":
      return "The rider has left the restaurant";
    case "DELIVERED":
      return "Delivered - enjoy your meal";
    case "CANCELLED":
      return "This order was cancelled";
    case "REFUNDED":
      return "This order has been refunded";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

function badge(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "⏳";
    case "DELIVERED":
      return "✅";
    default:
      return "•";
  }
}
function canCancel(status: OrderStatus): boolean {
  switch (status) {
    case "PENDING":
    case "PREPARING":
      return true;
    case "ON_THE_WAY":
    case "DELIVERED":
    case "CANCELLED":
    case "REFUNDED":
      return false;
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

console.log(message("PENDING"), badge("CANCELLED"), canCancel("PREPARING"));
