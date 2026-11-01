"use client";

import Link from "next/link";

// Shown when anything in the menu segment's pages throws — press
// "Simulate a broken kitchen" on /menu.
//
// This is Day 34's error boundary, declared by file name. It has to be a
// client component: an error boundary is state ("has something failed?") plus
// an event handler to try again, and both only exist in the browser. Day 38
// explains the rule in full.
//
// Where it sits matters. Next.js nests it *inside* app/menu/layout.js and
// around the page, so a failure replaces the page and leaves the sidebar — its
// category, its counter — exactly as it was. An error thrown by the layout
// itself would skip this file and go to the boundary above it.
//
// Next.js hands it two props:
//   error  — what was thrown. A server component's message is replaced in
//            production (it might contain a secret) and `digest` names the
//            server log entry; today's failure happens in the browser, so its
//            message is shown as written.
//   reset  — clears the boundary and renders the segment again.
export default function MenuError({ error, reset }) {
  // Day 36 had to change the URL before calling reset(): its failure came
  // from ?fail=1 on the server, and re-rendering the same address failed the
  // same way. Today's switch is state inside the component that threw. That
  // component was thrown away with the error, so reset() mounts a fresh one,
  // switch off — nothing else to undo.
  return (
    <main className="menu">
      <h2>The menu</h2>
      <div className="state state--error" role="alert">
        <p>
          Could not load the menu. {error.message || "The kitchen is not answering."}
          {error.digest && <> (Reference {error.digest}.)</>}
        </p>
        <button type="button" className="state__retry" onClick={() => reset()}>
          Try again
        </button>{" "}
        <Link href="/">Back to the home page</Link>
      </div>
    </main>
  );
}
