// The basket, as the server sees it: ids and quantities in one cookie.
//
// Day 39. The cart store still lives in localStorage (cart/cartStore.js), and
// localStorage never leaves the browser. That was fine while placing an order
// meant a fetch() from the browser, carrying the items in its body. A server
// action reached by a plain <form> carries only the form's fields — and with
// JavaScript off there is no code to add the basket to them. So the server
// needs its own copy, and a cookie is the one thing a browser sends with every
// request, script or no script.
//
//   Written by  app/providers.jsx, after every change to the store
//   Read by     app/checkout/page.js (to show the lines) and
//               app/actions.js placeOrder (to price them)
//   Emptied by  placeOrder, after the order is written
//
// Only ids and quantities. Names and prices are looked up on the server from
// the menu, so a forged cookie can choose dishes but never set a price. The
// format is "1.2-5.1" (dish 1 ×2, dish 5 ×1): digits, dots and dashes, which
// need no escaping in a cookie.
//
// No React and no Node in here, so both sides can import it.

export const BASKET_COOKIE = "addis-eats-basket";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // as long as the customer cookie
const MAX_LINES = 50;
const MAX_QUANTITY = 99;

export function encodeBasket(items) {
  return items.map(({ id, quantity }) => `${id}.${quantity}`).join("-");
}

export function basketCookieString(items) {
  return `${BASKET_COOKIE}=${encodeBasket(items)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

// A cookie is input from the outside world. Anything that is not a positive
// whole id and quantity is dropped, not trusted.
export function parseBasket(raw) {
  if (!raw) return [];
  const lines = [];
  for (const part of raw.split("-").slice(0, MAX_LINES)) {
    const match = /^(\d{1,6})\.(\d{1,2})$/.exec(part);
    if (!match) continue;
    const id = Number(match[1]);
    const quantity = Math.min(Number(match[2]), MAX_QUANTITY);
    if (quantity > 0 && !lines.some((line) => line.id === id)) {
      lines.push({ id, quantity });
    }
  }
  return lines;
}

// The server writes "" (present, empty) rather than deleting the cookie. That
// is how the browser can tell "an order emptied this" from "this browser has
// never written one" — see app/providers.jsx.
export const BASKET_COOKIE_OPTIONS = {
  path: "/",
  maxAge: MAX_AGE_SECONDS,
  sameSite: "lax",
};
