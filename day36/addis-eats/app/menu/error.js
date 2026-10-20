"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";

// Shown when anything in the menu segment throws — try /menu?fail=1.
//
// This is Day 34's error boundary, declared by file name. It has to be a
// client component: an error boundary is state ("has something failed?") plus
// an event handler to try again, and both only exist in the browser. Day 38
// explains the rule in full.
//
// Next.js hands it two props:
//   error  — what was thrown. In a production build the message from a server
//            component is replaced with a generic one (the real message might
//            contain a secret); `digest` is the id to look up in the server log.
//   reset  — clears the boundary and renders the segment again.
export default function MenuError({ error, reset }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function handleRetry() {
    // reset() alone re-renders what is already in the browser, and the menu
    // was rendered on the server — so it would just show this screen again.
    // The address has to change first: drop ?fail=1 (keeping any category),
    // ask the server for that, and clear the boundary in the same transition so
    // the menu replaces this message in one step.
    const next = new URLSearchParams(params);
    next.delete("fail");
    const query = next.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
      reset();
    });
  }

  return (
    <main className="menu">
      <h2>The menu</h2>
      <div className="state state--error" role="alert">
        <p>
          Could not load the menu. The kitchen is not answering right now.
          {error.digest && <> (Reference {error.digest}.)</>}
        </p>
        <button type="button" className="state__retry" onClick={handleRetry}>
          Try again
        </button>{" "}
        <Link href="/">Back to the home page</Link>
      </div>
    </main>
  );
}
