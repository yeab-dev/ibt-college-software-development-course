import { useContext } from "react";
import { CartContext } from "./CartContext";

// Step 1. A friendlier front door to the context.
//
// Without the guard, forgetting the provider hands you `null` and the crash
// lands somewhere unrelated — `Cannot destructure property 'items' of null`,
// in a component that did nothing wrong. This throws immediately and says
// exactly what is missing.
//
// It also hides the context object: every consumer imports this hook, nobody
// imports CartContext, and the context stays private to the module. That is
// what lets Day 32 swap the whole implementation without touching a single
// consumer's import.
export function useCart() {
  const ctx = useContext(CartContext);

  if (ctx === null) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return ctx;
}
