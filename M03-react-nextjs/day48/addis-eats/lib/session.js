import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { getAccount, publicAccount } from "./accounts";
import { jsonStore } from "./jsonStore";
import { looksLikeSession, SESSION_COOKIE } from "./sessionCookie";

// Day 42. Who is asking — the one helper every server surface calls.
//
//     const user = await getSession();   // { id, name, phone, role } or null
//
// A page that renders, an action that writes and a handler that answers all
// ask the same way, so there is one place to change if the scheme does. On
// Days 39–41 this file was a stand-in: a signed cookie holding a phone
// number, and any number signed you in. Today it holds a real session.
//
// Which kind. The slides offer two: a database session (the cookie holds an
// id, the server holds the truth) or a signed token (the cookie holds the
// claims). This is a database session, for the trade the slides name:
// revocation. Signing out deletes the session row, so a copied cookie stops
// working the moment its owner signs out — a signed token would stay valid
// until it expired.
//
// The cookie holds
//
//     <token: 32 random bytes, base64url> . <HMAC-SHA256 of the token>
//
// The token is the session's key. The HMAC (with SESSION_SECRET) means a
// made-up or altered value is refused before the session table is even
// read. The table stores only sha256(token), so a copy of .data/sessions.json
// holds no cookie anyone could use.
//
// SESSION_SECRET comes from .env.local, which is gitignored. It has no
// NEXT_PUBLIC_ prefix, so it exists only on the server, and "server-only"
// above makes the build fail if a client file imports this module.

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // a week

const sessions = jsonStore("sessions");

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32 || value.startsWith("replace-me")) {
    // Loud, and only on the server log: a missing secret is our mistake, and
    // sessions signed with a guessable one would be worse than none.
    throw new Error("SESSION_SECRET is not set. Copy .env.example to .env.local and give it a random value.");
  }
  return value;
}

function sign(token) {
  return createHmac("sha256", secret()).update(token).digest("base64url");
}

function digest(token) {
  return createHash("sha256").update(token).digest("base64url");
}

// The token from the cookie, if the cookie is well-formed and its signature
// is ours. Null for anything else.
function tokenFrom(raw) {
  if (!looksLikeSession(raw)) return null;
  const [token, signature] = raw.split(".");
  const expected = Buffer.from(sign(token));
  const given = Buffer.from(signature);
  // Constant time: the response time says nothing about how many characters
  // of a forged signature were right.
  return expected.length === given.length && timingSafeEqual(expected, given) ? token : null;
}

// Who is asking, or null: no cookie, a forged or altered one, a session that
// was signed out or has expired, or an account that no longer exists.
//
// cache(): a page, its layout and the components inside it may each ask
// during one request; the table is read once. Reading cookies() makes the
// caller dynamic, which is right — a page that depends on who is asking
// cannot be prerendered (STRATEGY.md says which pages do).
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  return sessionFromCookie(cookieStore.get(SESSION_COOKIE)?.value);
});

// Day 47. The same question, asked of a cookie value the caller already has
// — and not cached. getSession() answers once per request; the order stream
// (app/api/orders/[id]/stream/route.js) is one request that lasts minutes,
// and asks again every few seconds with the cookie it was opened with, so
// signing out in another tab ends the stream instead of leaving it running
// until the order is delivered. Same checks, in the same order: signature,
// session row, expiry, account.
export async function sessionFromCookie(raw) {
  const token = tokenFrom(raw);
  if (!token) return null;

  const id = digest(token);
  const row = (await sessions.load()).find((s) => s.id === id);
  if (!row || Date.parse(row.expiresAt) <= Date.now()) return null;

  const account = await getAccount(row.userId);
  return account ? publicAccount(account) : null;
}

// Step 3 of the six: create a session and set it as a cookie. Only from a
// server action or a route handler — those are where Next.js lets you set
// one. Always a new token, never one the browser brought: a session id
// chosen before sign-in (session fixation) is never promoted to a signed-in
// one.
export async function startSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await sessions.mutate((rows) => {
    // Expired rows are dropped whenever a new one is written.
    const live = rows.filter((s) => Date.parse(s.expiresAt) > now);
    live.push({
      id: digest(token),
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + MAX_AGE_SECONDS * 1000).toISOString(),
    });
    rows.splice(0, rows.length, ...live);
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${token}.${sign(token)}`, {
    // JavaScript in the page cannot read it: a script injected into the page
    // cannot steal the session.
    httpOnly: true,
    // Sent over HTTPS only, so it cannot be read off an open network.
    // Browsers count http://localhost as secure, so `npm run start` on this
    // machine still works.
    secure: true,
    // Not sent with requests that another site starts (a form posting here,
    // an image, a fetch), so another site cannot act as the person. It is
    // still sent when they follow a link here, so a link to /orders works.
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

// Step 6: clear the cookie *and* invalidate the session. Deleting only the
// cookie would leave a copy of it working for a week.
export async function endSession() {
  const cookieStore = await cookies();
  const token = tokenFrom(cookieStore.get(SESSION_COOKIE)?.value);
  if (token) {
    const id = digest(token);
    await sessions.mutate((rows) => {
      const index = rows.findIndex((s) => s.id === id);
      if (index !== -1) rows.splice(index, 1);
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}
