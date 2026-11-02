"use client";

import { useRouter } from "next/navigation";
import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import { isFinal } from "@/lib/orderStage";
import { useOrder } from "./useOrder";
import { useOrderStream } from "./useOrderStream";

// The receipt's live line: where the order is now, and (Day 47) whether this
// screen is still being kept up to date.
//
// Day 40 wrote this with a setInterval, a useState for the stage, a
// useState for the problem, a cleanup, and a dependency array to restart the
// timer. Day 41 deleted all of it: the poll became one option on a query
// (useOrder.js), the stage the query's data, the problem the query's error.
//
// Day 47: this leaf also owns the receipt's one EventSource
// (useOrderStream.js). The stream writes into the same query, so this line,
// the cancel button, the map and the text beside it all update from one
// connection. If the stream cannot be held open, this is also where the
// fallback poll is switched on: useOrder(…, { poll: true }).
//
// No loading branch, and none is needed: the server component passes the
// order it has just read as `initial`, which the hook returns until the first
// frame arrives. The first paint is the real stage.

// What the indicator says, in words — never a coloured dot alone.
const CONNECTION = {
  connecting: "connecting…",
  live: "live",
  reconnecting: "reconnecting…",
  polling: "checking every few seconds",
  closed: "updates finished",
};

export default function OrderStatus({ orderId, initial }) {
  const connection = useOrderStream(orderId, initial);
  const { data: order, error } = useOrder(orderId, initial, { poll: connection === "polling" });

  // When the stage moves on, ask the server to render the receipt again, so
  // anything it prints from the stage (the "Cancelled at …" line, whether
  // TeleBirr will be charged) catches up. The cancel button does not wait for
  // this: it reads the same query and hides itself.
  const router = useRouter();
  const shownStage = useRef(initial.stage);
  useEffect(() => {
    if (order.stage !== shownStage.current) {
      shownStage.current = order.stage;
      router.refresh();
    }
  }, [order.stage, router]);

  // Delivered or cancelled is "finished" whatever the connection last did:
  // the stream closes itself on the last frame, and a poll stops.
  const state = isFinal(order.stage) ? "closed" : connection;

  return (
    <p className={`order-status order-status--${order.stage}`} role="status">
      <strong>{order.stageLabel}</strong>
      {/* The connection indicator: a dot for the eye, and the same thing in
          words. data-connection is what the README's checks read. */}
      <span className={`live live--${state}`} data-connection={state}>
        <span className="live__dot" aria-hidden="true" />
        {CONNECTION[state]}
      </span>
      {/* The fetcher turned the endpoint's { error } into this message. The
          last good stage stays on screen beside it. */}
      {error && <span className="order-status__hint"> · {error.message}</span>}
    </p>
  );
}

OrderStatus.propTypes = {
  orderId: PropTypes.string.isRequired,
  initial: PropTypes.shape({
    id: PropTypes.string.isRequired,
    stage: PropTypes.string.isRequired,
    stageLabel: PropTypes.string.isRequired,
  }).isRequired,
};
