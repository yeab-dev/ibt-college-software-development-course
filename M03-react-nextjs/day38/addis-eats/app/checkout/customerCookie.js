import { AREAS } from "./validate";

// The "returning customer" cookie: the name and area of the last order, so the
// next checkout can greet you and fill them in.
//
// Written by the browser (Checkout.jsx, after an order succeeds) and read by
// the server (page.js, on every request). It holds nothing that pays — no
// phone number — because a cookie travels with every request to this site.
//
// No React and no Node in here, so both sides can import it.

export const CUSTOMER_COOKIE = "addis-eats-customer";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // ninety days

export function customerCookieString({ name, area }) {
  const value = encodeURIComponent(JSON.stringify({ name, area }));
  return `${CUSTOMER_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

// A cookie is input from the outside world: anyone can set it to anything.
// Parse defensively and keep only values the form would itself accept.
export function parseCustomerCookie(raw) {
  if (!raw) return null;
  try {
    const { name, area } = JSON.parse(decodeURIComponent(raw));
    if (typeof name !== "string" || !name.trim() || name.length > 80) {
      return null;
    }
    return { name: name.trim(), area: AREAS.includes(area) ? area : AREAS[0] };
  } catch {
    return null;
  }
}
