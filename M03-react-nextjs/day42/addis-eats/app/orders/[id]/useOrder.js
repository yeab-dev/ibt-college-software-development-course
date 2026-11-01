import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { isFinal } from "@/lib/orderStage";

// Day 41. The receipt's one client query, shared by the two leaves that read it.
//
// The key is the URL, and the URL is the cache entry. OrderStatus (the live
// line) and CancelOrderButton (shown only while the order is still in the
// kitchen) both call useOrder with the same id, so they share one entry and
// one request: every five seconds the network tab shows one
// GET /api/orders/1001, not two. That is SWR's deduplication, and it needed no
// configuration — the README counts the requests.
export function orderKey(id) {
  return `/api/orders/${id}`;
}

// How often to ask. Five seconds is the slides' number, and it suits the
// stages (lib/orderStage.js): the first change comes after two minutes, so a
// person sees it at most five seconds late, and an open receipt costs twelve
// small requests a minute. Not faster — a stage is minutes long.
export const POLL_MS = 5000;

// `initial` is the order exactly as GET /api/orders/[id] would answer it,
// rendered by the server component (app/orders/[id]/page.js). Passed as
// fallbackData, it is what the hook returns before anything has been fetched,
// so the first paint already says "In the kitchen": no spinner, no
// isLoading branch, and the line is right in the HTML with JavaScript off.
export function useOrder(id, initial) {
  const query = useSWR(orderKey(id), fetcher, {
    fallbackData: initial,

    // Polling, as a function of the latest answer: stop once nothing can
    // change any more. Before the first fetch the cache is empty, so the
    // server's answer decides.
    refreshInterval: (latest) => (isFinal((latest ?? initial).stage) ? 0 : POLL_MS),

    // The server rendered this order a moment ago. Asking again the instant
    // the page hydrates would fetch what is already on screen.
    revalidateOnMount: false,

    // revalidateOnFocus stays on (the default): coming back to the tab asks
    // at once. SWR also pauses the poll while the tab is hidden
    // (refreshWhenHidden is off), so a forgotten receipt costs nothing.

    // A 401, 403 or 404 will not get better by asking again: stop, and let
    // OrderStatus say what the server said. Anything else (the network
    // dropped, a 500) is retried on the poll's rhythm, a few times.
    onErrorRetry(error, key, config, revalidate, { retryCount }) {
      if (error.status >= 400 && error.status < 500) return;
      if (retryCount >= 5) return;
      setTimeout(() => revalidate({ retryCount }), POLL_MS);
    },
  });

  // Whenever the server renders the receipt again — after a cancel (the
  // action revalidates), after router.refresh(), or when the person comes
  // back to this order later — its answer is the newest there is. Put it in
  // the cache, so a value cached on an earlier visit cannot outlive it.
  // No request: revalidate: false.
  const { mutate } = query;
  useEffect(() => {
    mutate(initial, { revalidate: false });
  }, [initial, mutate]);

  return query;
}
