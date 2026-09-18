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

export function useRenderCount(name) {
  const next = (counts.get(name) ?? 0) + 1;
  counts.set(name, next);

  if (import.meta.env.DEV) {
    console.log(`render #${next} · ${name}`);
  }

  return next;
}
