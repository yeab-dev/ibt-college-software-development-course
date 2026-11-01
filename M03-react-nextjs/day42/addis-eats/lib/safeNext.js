// Day 42. Where to go after signing in — only ever somewhere on this site.
//
// `next` arrives in the URL (/login?next=/checkout) and comes back in a
// hidden field, so it is whatever anyone puts in a link. Redirecting to it
// unchecked is an open redirect: a link to our own sign-in page that ends on
// someone else's site, with our domain in the address bar right up to the
// moment it matters.
//
// The slides' one line is `if (!next.startsWith("/")) redirect("/")`. That
// stops https://evil.example, but not three spellings that also start with
// a slash and that a browser reads as another host:
//
//     //evil.example        protocol-relative: "same scheme, host evil.example"
//     /\evil.example        browsers treat \ as /, so it is the line above
//     /<TAB>/evil.example   the URL parser deletes tabs and newlines first
//
// So `next` is not pattern-matched. It is parsed the way a browser will
// parse it, against a stand-in origin, and accepted only if it is still on
// that origin. What is returned is the parsed path, not the string that came
// in, so what the redirect sends is what was checked.
//
// No Node and no React: the sign-in page, the actions and the proxy's own
// redirect can all use it.
const HERE = "http://addis-eats.invalid";

export const DEFAULT_NEXT = "/menu";

export function safeNext(value) {
  if (typeof value !== "string" || !value.startsWith("/")) return DEFAULT_NEXT;
  let url;
  try {
    url = new URL(value, HERE);
  } catch {
    return DEFAULT_NEXT;
  }
  if (url.origin !== HERE) return DEFAULT_NEXT;
  // Signing in only to be sent back to the sign-in page helps nobody.
  if (url.pathname === "/login" || url.pathname === "/signup") return DEFAULT_NEXT;
  return `${url.pathname}${url.search}${url.hash}`;
}
