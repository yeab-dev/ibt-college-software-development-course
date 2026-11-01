// Where an order is, worked out from when it was placed.
//
// Day 40. A stand-in for a kitchen that would report its own progress: the
// stored status is only "placed" or "cancelled", and the stage a placed order
// has reached is read off the clock. It is the thing that changes on its own,
// which is what makes the receipt worth polling (OrderStatus.jsx →
// GET /api/orders/[id]).
//
// The kitchen board (/orders) deliberately does not show it. The board is a
// static page rebuilt only when an order is written; a stage computed when it
// was built would go on saying "in the kitchen" long after the rider left.
//
// No React and no Node in here: the route handler, the receipt page and the
// action all use it.

export const KITCHEN_SECONDS = 120; // cancellable until the rider takes it
export const DELIVERY_SECONDS = 300;

export const STAGE_LABEL = {
  kitchen: "In the kitchen",
  "on-the-way": "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function orderStage(order, now = Date.now()) {
  if (order.status === "cancelled") return "cancelled";
  const seconds = (now - Date.parse(order.placedAt)) / 1000;
  if (seconds < KITCHEN_SECONDS) return "kitchen";
  if (seconds < DELIVERY_SECONDS) return "on-the-way";
  return "delivered";
}

// The stages after which nothing changes any more — the poller stops.
export function isFinal(stage) {
  return stage === "delivered" || stage === "cancelled";
}
