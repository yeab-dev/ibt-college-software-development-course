"use client";

import Link from "next/link";

// Day 40: the boundary for every route that has none of its own — /, /cart,
// /checkout, /login, /orders and the receipts. (The menu keeps its own
// app/menu/error.js, inside its layout, so a broken menu keeps its sidebar.)
//
// It sits inside app/layout.js, so when a page throws, this replaces only the
// page: the header, the tabs and the basket badge stay on screen, with the
// cart intact. A throw in the root layout itself would skip this file and
// land in app/global-error.js.
//
// A thrown server error arrives here with its message replaced (it might hold
// a secret) and a `digest` naming the server log entry. So the screen says
// what the person can do, and gives the reference.
//
// `retry` (stable since Next.js 16.3) re-fetches the segment from the server
// and renders it again — right for a server failure, which is what reaches
// this file. The menu's boundary uses `reset` instead, because its failure is
// state in the browser that a fresh mount clears (see app/menu/error.js).
export default function RootError({ error, retry }) {
  return (
    <main className="prose">
      <h2>Something went wrong</h2>
      <div className="state state--error" role="alert">
        <p>
          This page could not be shown. Your basket is safe — nothing was lost.
          {error?.digest && <> (Reference {error.digest}.)</>}
        </p>
        <button type="button" className="state__retry" onClick={() => retry()}>
          Try again
        </button>{" "}
        <Link href="/menu">Back to the menu</Link>
      </div>
    </main>
  );
}
