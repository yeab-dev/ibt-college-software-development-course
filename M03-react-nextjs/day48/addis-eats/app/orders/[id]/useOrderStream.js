import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { isFinal } from "@/lib/orderStage";
import { orderKey } from "./useOrder";

// Day 47. The receipt's live connection: GET /api/orders/[id]/stream, read
// with EventSource.
//
// It owns no order state of its own. Each frame the server pushes is the
// whole order (lib/orders.js orderView), and it goes straight into the SWR
// cache entry the receipt has read since Day 41 — mutate(key, frame,
// { revalidate: false }), no request. Seeded, then live: before the first
// frame arrives every reader already has the order the server rendered
// (useOrder's fallbackData), so nobody watches a spinner for a value the page
// already had.
//
// What it returns is the state of the connection, for the indicator in
// OrderStatus.jsx — a screen that quietly stops updating looks exactly like
// one where nothing is happening:
//
//   "connecting"    the EventSource is being opened
//   "live"          open, frames arriving
//   "reconnecting"  the line dropped; the browser is retrying by itself
//                   (every 3 s: the stream's `retry:` field)
//   "polling"       the stream was refused or kept failing: fall back to the
//                   Day 41 poll (the reading sheet's "nothing arrives at all")
//   "closed"        the order is delivered or cancelled, and the stream was
//                   closed on purpose
//
// The slides' version closes the EventSource on any error
// (`es.onerror = () => es.close()`). That throws away the one thing SSE does
// for free — reconnecting — and contradicts the slides' own next table
// ("SSE reconnects; show the state"). So an error here is only fatal when the
// browser itself has given up (readyState CLOSED: the server answered 401,
// 403 or 404 instead of a stream) or after three failed retries in a row.
const GIVE_UP_AFTER = 3;

export function streamUrl(id) {
  return `${orderKey(id)}/stream`;
}

export function useOrderStream(id, initial) {
  const { mutate } = useSWRConfig();
  // An order the server already rendered as delivered or cancelled will not
  // change: no connection at all. This is also false again after the
  // router.refresh() that follows delivery, which runs the cleanup below.
  const live = !isFinal(initial.stage);
  const [connection, setConnection] = useState(live ? "connecting" : "closed");

  useEffect(() => {
    if (!live) return undefined;

    const source = new EventSource(streamUrl(id));
    let failures = 0;

    // Delivered or cancelled: close it deliberately. If only the server
    // ended the stream, the browser would reconnect to it — EventSource
    // treats a closed connection as a dropped one.
    function finish() {
      source.close();
      setConnection("closed");
    }

    source.onopen = () => {
      failures = 0;
      setConnection("live");
    };

    source.onmessage = (event) => {
      const order = JSON.parse(event.data);
      mutate(orderKey(id), order, { revalidate: false });
      if (isFinal(order.stage)) finish();
    };

    // The server says so too, with a named event after the last frame.
    source.addEventListener("end", finish);

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        // Refused (a status other than 200) or not a stream at all. The
        // browser will not retry; the poll will, and its first answer says
        // why (the fetcher turns a 401/403 body into the error message).
        setConnection("polling");
        return;
      }
      failures += 1;
      if (failures >= GIVE_UP_AFTER) {
        source.close();
        setConnection("polling");
      } else {
        setConnection("reconnecting");
      }
    };

    // Day 29's cleanup, and not optional: an EventSource that is not closed
    // outlives the component. Leave the receipt five times without this and
    // the server holds five connections, each reading the order every 3 s
    // for nobody (TRACKING.md has the count).
    return () => source.close();
  }, [id, live, mutate]);

  return connection;
}
