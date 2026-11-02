"use client";

import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { BASKET_COOKIE, basketCookieString } from "@/cart/basketCookie";
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

// The basket cookie's value as this browser last saw it: undefined when there
// is no such cookie, "" when it is present and empty.
function readBasketCookie() {
  const prefix = `${BASKET_COOKIE}=`;
  const entry = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return entry === undefined ? undefined : entry.slice(prefix.length);
}

// Day 39. The server empties the basket cookie when it places an order
// (placeOrder in app/actions.js), but it cannot reach into localStorage. This
// browser writes the cookie after every change to its cart, so the cookie can
// only be empty while the cart is not if the server emptied it — an order went
// through, perhaps placed with JavaScript off. Then the cart follows.
function followServer(cartStore) {
  if (readBasketCookie() === "" && cartStore.getState().items.length > 0) {
    cartStore.getState().clear();
  }
}

export function Providers({ children }) {
  // One cart store per mount: per request on the server, per tab in the
  // browser. useState's initialiser runs once, so re-renders keep the same
  // store (see cart/cartStore.js for why the store is no longer a module).
  const [cartStore] = useState(createCartStore);

  // Was components/CartHydrator.jsx. The store is created with skipHydration,
  // so the server and the browser's first render agree on an empty basket;
  // the saved one is read from localStorage here, after hydration.
  //
  // Day 39: then the cart and the basket cookie are put in step, and kept in
  // step — every change to the store rewrites the cookie.
  useEffect(() => {
    let unsubscribe = () => {};
    Promise.resolve(cartStore.persist.rehydrate()).then(() => {
      followServer(cartStore);
      document.cookie = basketCookieString(cartStore.getState().items);
      unsubscribe = cartStore.subscribe((state) => {
        document.cookie = basketCookieString(state.items);
      });
    });
    return () => unsubscribe();
  }, [cartStore]);

  // After every navigation — the checkout's action redirects to the receipt —
  // look again: did the server just empty the basket?
  const pathname = usePathname();
  useEffect(() => {
    followServer(cartStore);
  }, [cartStore, pathname]);

  return <CartStoreContext value={cartStore}>{children}</CartStoreContext>;
}

Providers.propTypes = {
  children: PropTypes.node.isRequired,
};
