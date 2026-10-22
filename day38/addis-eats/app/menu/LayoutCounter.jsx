"use client";

import { useState } from "react";

// Step 3 — the proof that a layout persists.
//
// Plain useState, nothing clever. It lives in the menu layout, so its value
// survives every navigation that stays under /menu: tap it three times, open
// Kitfo, and it still says 3. Only the page beside it is replaced. Leave the
// menu (Cart, Home) and the layout unmounts, so coming back starts at 0 — the
// root layout persists for the whole visit, this one only for its segment.
//
// Had this been app/menu/template.js instead of layout.js, every navigation
// would mount a fresh copy and the count would reset each time.
function LayoutCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="layout-counter">
      <p>
        Sidebar counter: <strong data-testid="layout-count">{count}</strong>
      </p>
      <button
        type="button"
        className="categories__button"
        onClick={() => setCount((n) => n + 1)}
      >
        Count +1
      </button>
      <p className="layout-counter__hint">
        Open a dish: the number stays, because the layout is not remounted.
      </p>
    </div>
  );
}

export default LayoutCounter;
