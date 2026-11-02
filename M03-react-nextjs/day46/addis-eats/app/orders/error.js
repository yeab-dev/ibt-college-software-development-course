"use client";

import Link from "next/link";

// Day 46. The error state for /orders and the receipts under it: what
// failed, and a way to retry. Until today the root app/error.js caught these
// too, with a message about the basket; this one says what actually failed.
//
// `retry` re-fetches the segment from the server: right when the order store
// could not be read a moment ago. Forced with ?state=error (lib/demoState.js),
// it fails again on purpose, so the second link leaves the demo.
export default function OrdersError({ error, retry }) {
  return (
    <main className="prose">
      <h1>Your orders</h1>
      <div className="state state--error" role="alert">
        <p>
          Your orders could not be loaded just now. Nothing was changed or cancelled.
          {error?.digest && <> (Reference {error.digest}.)</>}
        </p>
        <button type="button" className="state__retry" onClick={() => retry()}>
          Try again
        </button>{" "}
        <Link href="/orders">Reload your orders</Link> · <Link href="/menu">Back to the menu</Link>
      </div>
    </main>
  );
}
