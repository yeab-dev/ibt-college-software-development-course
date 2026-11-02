import { NextResponse } from "next/server";
import { looksLikeSession, SESSION_COOKIE } from "@/lib/sessionCookie";

// Day 42. The course's middleware.js. Next.js 16 renamed the file convention
// to proxy.js and the export to `proxy`; nothing else changed (see
// node_modules/next/dist/docs/01-app/03-api-reference/file-conventions/
// middleware.md: "deprecated in Next.js 16 and renamed to proxy.js").
//
// One file at the project root, beside app/, that runs before a matching
// request reaches a page, a layout or a handler. It sees the request and
// either lets it through or turns it away. It never renders.
//
// What it checks: that a session cookie is *there* and *shaped* like one.
// Nothing more. It does not check the signature, read the session table or
// look at the account. That is deliberate. The proxy sits in front of every
// matching request, so it must be cheap. And it is not where the security
// is: every page under these paths calls getSession() while it renders, and
// every action and handler calls it again before it writes (AUTH.md lists
// them). A forged cookie of the right shape gets past this file and is
// refused there.
//
// What it saves: a signed-out visitor to /checkout is redirected before any
// layout runs, any cookie is parsed or the basket is priced. Day 31's guard
// had to mount a component first. The page's own check (redirect() in
// app/checkout/page.js) would also send them away, after doing that work.
export function proxy(request) {
  if (looksLikeSession(request.cookies.get(SESSION_COOKIE)?.value)) {
    const response = NextResponse.next();
    // Visible in the response, so a test (or a person with curl) can see
    // which requests went through the proxy and which never touched it.
    response.headers.set("x-addis-eats-proxy", "passed");
    return response;
  }

  // Remember where they were going, in the URL, so it survives a refresh and
  // works before any JavaScript has run. The value is this request's own
  // path, so it is always on this site — and /login checks it again anyway
  // (lib/safeNext.js), because a link can put anything in `next`.
  const signIn = new URL("/login", request.url);
  signIn.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const response = NextResponse.redirect(signIn); // 307
  response.headers.set("x-addis-eats-proxy", "redirected");
  return response;
}

// The matcher decides what the proxy touches, and it is kept narrow: only
// the private pages. Not the menu, not the cart, not /login, not images or
// _next/static — those never wait for this function. Not /api either: a
// fetch that is redirected to an HTML sign-in page is no use to the code
// that called it, so the handlers answer 401 themselves.
//
// Day 46: /dashboard joins /kitchen. Both are staff screens; the proxy cannot
// tell staff from customers (it never reads the session), so for both it
// only turns away the visitor with no session at all, and the page decides
// the role.
//
// A server action is a POST to the page it is used on. The receipt's
// cancelOrder is a POST to /orders/1001, which this matcher covers; the
// same action posted to /menu is not. That is exactly why cancelOrder checks
// the session itself (the README's first attack does this).
export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/kitchen/:path*", "/dashboard/:path*"],
};
