"use client";

import PropTypes from "prop-types";
import { clock, relative, when } from "@/lib/format";
import { useOrder } from "./useOrder";

// Day 47. Everything the map shows, in words, beside it.
//
// Tiles and pins mean nothing to a screen reader, to someone on a phone that
// never loaded the map, or to anyone who cannot read a map. So the deck's
// rule: the address, the area and the estimated time, in text, next to the
// map — and here also for a receipt that has no map at all (an order already
// delivered or cancelled draws none, Tracking.jsx).
//
// A client leaf because it is live: it reads the same query the stream
// writes into, so the distance and the "in 2 minutes" move with the courier.
// It is still rendered on the server first, from `initial`, so the facts are
// in the HTML before any JavaScript (and with none).
//
// Every relative time is computed against `tracking.at`, the server's clock
// when that value was made — never this browser's Date.now(). The server's
// HTML and the browser's first render therefore compute the very same
// string, and there is no hydration mismatch (lib/format.js, relative()).
//
// Not an aria-live region on purpose: the distance changes every three
// seconds, and a screen reader announcing each one would be noise. The stage
// changes are announced once, by the status line above (role="status").
export default function DeliveryFacts({ orderId, initial }) {
  const { data: order } = useOrder(orderId, initial);
  const { stage, tracking } = order;
  const { courier, drop, kitchen, remainingKm, etaAt, at } = tracking;

  let courierText;
  let arrivalText;
  if (stage === "kitchen") {
    courierText = `${courier.name} will collect it from ${kitchen.name} at ${kitchen.place}.`;
    arrivalText = `${clock(etaAt)} (${relative(etaAt, at)})`;
  } else if (stage === "on-the-way") {
    // Under 100 m, "0 km from you" reads as a mistake.
    courierText =
      remainingKm < 0.1
        ? `${courier.name} is almost at your door.`
        : `${courier.name} is on the way: ${remainingKm} km from you.`;
    arrivalText = `${clock(etaAt)} (${relative(etaAt, at)})`;
  } else if (stage === "delivered") {
    courierText = `${courier.name} delivered it.`;
    arrivalText = `${when(etaAt)} (${relative(etaAt, at)})`;
  } else {
    courierText = "None: the order was cancelled.";
    arrivalText = "Not coming.";
  }

  return (
    <dl className="facts">
      <dt>Delivering to</dt>
      <dd>
        {order.name}, {drop.area} — around {drop.landmark}
      </dd>
      <dt>Courier</dt>
      <dd>{courierText}</dd>
      <dt>{stage === "delivered" ? "Delivered" : "Estimated arrival"}</dt>
      <dd>
        <time dateTime={etaAt}>{arrivalText}</time>
      </dd>
      <dt>Placed</dt>
      <dd>
        <time dateTime={order.placedAt}>{when(order.placedAt)}</time> ({relative(order.placedAt, at)})
      </dd>
    </dl>
  );
}

DeliveryFacts.propTypes = {
  orderId: PropTypes.string.isRequired,
  initial: PropTypes.shape({
    stage: PropTypes.string.isRequired,
    tracking: PropTypes.object.isRequired,
  }).isRequired,
};
