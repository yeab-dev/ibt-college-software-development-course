import { useSyncExternalStore } from "react";

// Step 6, made visible without leaving the page.
//
// React DevTools' "Highlight updates when components render" is the proper
// tool and you should turn it on. This is the same information as a number you
// can read in a screenshot — and, unlike a flash of green, it is still there
// after you have stopped clicking.
//
// The counts live in a module-level Map rather than a useRef. The usual trick
// is `const n = useRef(0); n.current += 1;`, but writing to and reading from a
// ref during render is exactly what the react-hooks/refs lint rule exists to
// stop, and a rule worth following in your own code is worth following in a
// teaching aid. A Map outside React sidesteps it: this is a diagnostic, not
// state, and nothing renders because of it.
//
// Two caveats worth knowing:
//
// 1. The key is the name you pass, so give each instance a distinct one —
//    `Dish · ${dish.name}`, not `Dish`. Two components sharing a name share a
//    counter.
// 2. <StrictMode> renders every component twice in development, so every
//    number here is doubled. Compare components against each other, not
//    against the number of clicks you made.

const counts = new Map();

//
// Day 36 adds a third: these components are now rendered on the server as
// well, and the browser's first render has to produce exactly the server's
// HTML (hydration). The server is one long-running process, so a Map there
// would keep counting across every visitor; and under <StrictMode> the browser
// renders twice, so its first number is 2. Either way the text would not match
// and React would throw the server's HTML away.
//
// So while hydrating, the hook answers 1 — on the server and in the browser —
// and only starts reporting the real count after that. useSyncExternalStore is
// the one hook that can tell the two apart: during hydration it returns the
// third argument (the "server snapshot"), and afterwards the second.

const noSubscribe = () => () => {};

export function useRenderCount(name) {
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  // The server never counts; only the browser keeps a tally.
  if (typeof window === "undefined") return 1;

  const next = (counts.get(name) ?? 0) + 1;
  counts.set(name, next);

  // import.meta.env.DEV is a Vite feature. Next.js uses Node's convention.
  if (process.env.NODE_ENV !== "production") {
    console.log(`render #${next} · ${name}`);
  }

  return hydrated ? next : 1;
}
