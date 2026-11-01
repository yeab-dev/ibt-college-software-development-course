import { AREAS, NAME_MAX } from "@/lib/validate";

// The "returning customer" cookie: the name and area of the last order, so the
// next checkout can greet you and fill them in.
//
// Day 37 had the browser write it (document.cookie, after a successful
// order). Day 39 moves the write to the server: placeOrder in app/actions.js
// sets it with cookies().set(), in the same response that confirms the order —
// so it is written even when the order was placed with JavaScript switched
// off. The server still reads it on every request to /checkout. It holds
// nothing that pays — no phone number — because a cookie travels with every
// request to this site.
//
// No React and no Node in here: the action and the page both import it.

export const CUSTOMER_COOKIE = "addis-eats-customer";

export const CUSTOMER_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 90, // ninety days
  sameSite: "lax",
};

// cookies().set() URL-encodes the value itself, and cookies().get() decodes
// it, so this is plain JSON on both ends.
export function customerCookieValue({ name, area }) {
  return JSON.stringify({ name, area });
}

// A cookie is input from the outside world: anyone can set it to anything.
// Parse defensively and keep only values the form would itself accept.
export function parseCustomerCookie(raw) {
  if (!raw) return null;
  try {
    const { name, area } = JSON.parse(raw);
    if (typeof name !== "string" || !name.trim() || name.length > NAME_MAX) {
      return null;
    }
    return { name: name.trim(), area: AREAS.includes(area) ? area : AREAS[0] };
  } catch {
    return null;
  }
}
