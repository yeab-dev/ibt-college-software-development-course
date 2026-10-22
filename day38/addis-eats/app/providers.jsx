"use client";

import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { CartStoreContext, createCartStore } from "@/cart/cartStore";

// Step 5. Every app-wide provider, in one client component.
//
// A provider holds state, and state lives in the browser, so this file is a
// client component. Putting it in its own file is what lets app/layout.js stay
// a server component: the layout imports <Providers> and hands it children,
// and "use client" stops at this file.
//
// It also does not drag the pages onto the client. `children` arrives already
// rendered — the layout's owner is the server — so every page inside the
// provider is still a server component. Providers only places that output;
// it never imports the pages' code.
export function Providers({ children }) {
  // One cart store per mount: per request on the server, per tab in the
  // browser. useState's initialiser runs once, so re-renders keep the same
  // store (see cart/cartStore.js for why the store is no longer a module).
  const [cartStore] = useState(createCartStore);

  // Was components/CartHydrator.jsx. The store is created with skipHydration,
  // so the server and the browser's first render agree on an empty basket;
  // the saved one is read from localStorage here, after hydration.
  useEffect(() => {
    cartStore.persist.rehydrate();
  }, [cartStore]);

  return <CartStoreContext value={cartStore}>{children}</CartStoreContext>;
}

Providers.propTypes = {
  children: PropTypes.node.isRequired,
};
