"use client";

import { useEffect } from "react";
import { useCartStore } from "@/cart/cartStore";

// Loads the saved order from localStorage — once, after the first render.
//
// The store is created with skipHydration (see cart/cartStore.js), so the
// server and the browser both start with an empty cart and agree on the HTML.
// Effects never run on the server, so this is the earliest safe moment to read
// localStorage. It renders nothing; it only has to be mounted once, which is
// why it sits in app/layout.js.
function CartHydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}

export default CartHydrator;
