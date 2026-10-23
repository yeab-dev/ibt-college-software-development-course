"use client";

import { useRouter } from "next/navigation";
import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import { isFinal } from "@/lib/orderStage";
import { useOrder } from "./useOrder";

// The receipt's live line: where the order is now.
//
// Day 40 wrote this with a setInterval, a useState for the stage, a
// useState for the problem, a cleanup, and a dependency array to restart the
// timer. Day 41 deletes all of it. The poll is one option on a query
// (useOrder.js: refreshInterval), the stage is the query's data, and the
// problem is the query's error. What is left here is what the line shows.
//
// No loading branch, and none is needed: the server component passes the
// order it has just read as `initial`, which the hook returns until the first
// poll answers. The first paint is the real stage.
export default function OrderStatus({ orderId, initial }) {
  const { data: order, error } = useOrder(orderId, initial);

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

  return (
    <p className={`order-status order-status--${order.stage}`} role="status">
      <strong>{order.stageLabel}</strong>
      {!isFinal(order.stage) && !error && (
        <span className="order-status__hint"> · checking every few seconds</span>
      )}
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
