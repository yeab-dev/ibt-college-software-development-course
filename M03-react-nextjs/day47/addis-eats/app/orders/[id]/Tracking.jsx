"use client";

import PropTypes from "prop-types";
import { useState } from "react";
import { isFinal } from "@/lib/orderStage";
import DeliveryFacts from "./DeliveryFacts";
import MapPanel from "./MapPanel";

// Day 47. "Where your order is": the map beside the same facts in words.
//
// The one decision here is whether there is a map at all, and it is made
// once, from the order as the page first rendered it:
//
//   - still on its way  → the map and the facts, side by side
//   - already delivered or cancelled → the facts only. No Leaflet download
//     and no tiles fetched from OpenStreetMap's public server for a receipt
//     from last week (its usage policy asks for light use).
//
// Once, and kept in state, because the page does not stay as it first
// rendered. On delivery OrderStatus calls router.refresh(), the server renders
// the receipt again, and this time it sees a delivered order. Had the server
// decided (it did, in a first version), the map vanished at the moment of
// delivery and everything below it jumped up 320 px. router.refresh() keeps
// client state, so useState's first answer survives it: an order delivered
// while you watch keeps its map.
//
// The server's HTML and the browser's first render both compute it from the
// same `initial`, so they agree (no hydration mismatch).
export default function Tracking({ orderId, initial }) {
  const [withMap] = useState(() => !isFinal(initial.stage));

  return (
    <section className={withMap ? "tracking" : "tracking tracking--text"} aria-labelledby="where-heading">
      <h2 id="where-heading" className="visually-hidden">
        Where your order is
      </h2>
      {withMap && <MapPanel orderId={orderId} initial={initial} />}
      <DeliveryFacts orderId={orderId} initial={initial} />
    </section>
  );
}

Tracking.propTypes = {
  orderId: PropTypes.string.isRequired,
  initial: PropTypes.shape({ stage: PropTypes.string.isRequired }).isRequired,
};
