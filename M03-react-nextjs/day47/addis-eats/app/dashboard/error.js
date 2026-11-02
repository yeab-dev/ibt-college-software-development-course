"use client";

import Link from "next/link";

// Day 46. The dashboard's error state: what failed, and a way to retry.
//
// Next.js wraps this segment's page in it, so a throw replaces the page body
// and the site's header and tabs stay. A server error arrives with its
// message hidden in production and a `digest` that names the entry in the
// server's log.
//
// Only a throw *after* the role check lands here: page.js checks the session
// and the role before the Suspense boundary, so a customer still gets a
// real 403, never this.
//
// `retry` asks the server for the segment again — right for a store that
// could not be read a moment ago. Forced with ?state=error (lib/demoState.js)
// it fails again, by design; the second link is the way out of the demo.
export default function DashboardError({ error, retry }) {
  return (
    <main className="wide">
      <h1>Dashboard</h1>
      <div className="state state--error" role="alert">
        <p>
          The order figures could not be loaded, so there is nothing to chart. No order was
          changed.
          {error?.digest && <> (Reference {error.digest}.)</>}
        </p>
        <button type="button" className="state__retry" onClick={() => retry()}>
          Try again
        </button>{" "}
        <Link href="/dashboard">Reload the dashboard</Link> ·{" "}
        <Link href="/kitchen">Today&apos;s kitchen board</Link>
      </div>
    </main>
  );
}
