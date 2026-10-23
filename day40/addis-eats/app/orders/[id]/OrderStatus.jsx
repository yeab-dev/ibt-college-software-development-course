"use client";

import { useRouter } from "next/navigation";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { isFinal } from "@/lib/orderStage";

// Day 40. The receipt's live line: where the order is now.
//
// The slides' "order status polled — client fetch" row. It is the one read in
// Addis Eats that belongs in the browser: repeated, on a timer, for as long
// as this tab is open. Everything else is read by a server component.
//
// The first stage arrives as a prop, rendered by the server, so the line is
// right in the first HTML (and without JavaScript). Then every five seconds
// it asks GET /api/orders/[id], until the order is delivered or cancelled.
// When the stage changes it also calls router.refresh(), so the server
// re-renders the receipt around it — the cancel button disappears once the
// rider has the order, without this component knowing the button exists.
const POLL_MS = 5000;

export default function OrderStatus({ orderId, stage: firstStage, label: firstLabel }) {
  const router = useRouter();
  const [status, setStatus] = useState({ stage: firstStage, label: firstLabel, problem: null });

  useEffect(() => {
    if (isFinal(status.stage) || status.problem) return undefined;

    const timer = setInterval(async () => {
      let res;
      try {
        res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      } catch {
        return; // offline for a moment: try again on the next tick
      }
      const body = await res.json().catch(() => ({}));

      // The endpoint's one error shape: whatever went wrong, `error` says it.
      if (!res.ok) {
        setStatus((s) => ({ ...s, problem: body.error ?? `The server answered ${res.status}.` }));
        return;
      }
      if (body.stage !== status.stage) {
        setStatus({ stage: body.stage, label: body.stageLabel, problem: null });
        router.refresh();
      }
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [orderId, status.stage, status.problem, router]);

  return (
    <p className={`order-status order-status--${status.stage}`} role="status">
      <strong>{status.label}</strong>
      {!isFinal(status.stage) && !status.problem && (
        <span className="order-status__hint"> · checking every few seconds</span>
      )}
      {status.problem && <span className="order-status__hint"> · {status.problem}</span>}
    </p>
  );
}

OrderStatus.propTypes = {
  orderId: PropTypes.string.isRequired,
  stage: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};
