import { createContext } from "react";

// The context object lives in a file of its own so that CartProvider.jsx
// exports nothing but a component. A module that mixes components with plain
// values makes Vite's fast refresh give up and reload the whole page.
//
// null — not {} — is the default. A component that reads the cart without a
// provider above it then gets something obviously wrong rather than a
// plausible-looking empty cart. Day 32 turns that into a proper error message.
export const CartContext = createContext(null);
