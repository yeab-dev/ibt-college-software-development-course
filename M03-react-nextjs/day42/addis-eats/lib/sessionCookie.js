// Day 42. The session cookie's name and shape — and nothing secret.
//
// Its own file because proxy.js reads it. The proxy runs before any page or
// handler and must stay cheap: it may look at the cookie, never verify it.
// So it gets only what it needs to ask "is there something here that could
// be a session?" — the name, and the shape of the value:
//
//     <43 base64url characters: a random token>.<43: its HMAC-SHA256>
//
// Whether the token is real, unexpired and belongs to an account is
// lib/session.js's question, asked on the server where the page renders and
// the action writes. No Node, no secret, no React in here.
export const SESSION_COOKIE = "addis-eats-session";

const SHAPE = /^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/;

export function looksLikeSession(value) {
  return typeof value === "string" && SHAPE.test(value);
}
