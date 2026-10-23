import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// A stand-in session: who is signed in, in one signed cookie.
//
// Day 31 kept the "session" in localStorage, where the browser could write
// anything it liked — fine for a guard that only steered the UI. Today the
// session decides who may cancel an order, so the server has to be able to
// trust it. The cookie is
//
//     base64url({"phone":"0911223344","name":"Guest 3344"}) . HMAC-SHA256
//
// signed with SESSION_SECRET. Change one character of the payload and the
// signature no longer matches; without the secret nobody can make a new one.
// httpOnly, so no script in the page can read or steal it.
//
// It is still a stand-in. There is no password: any TeleBirr-shaped number
// signs you in as its owner, exactly as on Day 31. Day 42 brings real
// authentication; what it will replace is this file, not its callers.
//
// SESSION_SECRET comes from .env.local, which is gitignored. It has no
// NEXT_PUBLIC_ prefix, so it exists only on the server — and "server-only"
// above makes the build fail if a client file ever imports this module.

export const SESSION_COOKIE = "addis-eats-session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // a week

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32 || value.startsWith("replace-me")) {
    // Loud, and only on the server log: a missing secret is our mistake, and
    // a session signed with a guessable one would be worse than none.
    throw new Error("SESSION_SECRET is not set. Copy .env.example to .env.local and give it a random value.");
  }
  return value;
}

function sign(payload) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(user) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(raw) {
  if (typeof raw !== "string") return null;
  const [payload, signature, extra] = raw.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  // Compare in constant time, so the response time says nothing about how
  // many characters of a forged signature were right.
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  try {
    const user = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof user?.phone === "string" && typeof user?.name === "string"
      ? { phone: user.phone, name: user.name }
      : null;
  } catch {
    return null;
  }
}

// Who is asking, or null. Reading cookies() makes whatever calls this
// dynamic — which is why only the checkout, the sign-in page, the receipt
// and the actions call it, and never the shared layout. One call in the
// header would turn every route in the build into ƒ.
export async function getSession() {
  const cookieStore = await cookies();
  return decode(cookieStore.get(SESSION_COOKIE)?.value);
}

// Only from a server action or a route handler: those are the places
// Next.js lets you set a cookie.
export async function startSession(phone) {
  const user = { phone, name: `Guest ${phone.slice(-4)}` };
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encode(user), {
    httpOnly: true,
    sameSite: "lax",
    // Sent over HTTPS only, in production. Browsers count http://localhost
    // as secure, so `npm run start` on this machine still works.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return user;
}

export async function endSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Where to go after signing in. `next` arrives in the URL (/login?next=…) and
// in a hidden field, so it is user input: only a path on this site is
// followed. "//evil.example" is a URL to another host, so it is refused too.
export function safeNext(value) {
  return typeof value === "string" && /^\/(?![/\\])/.test(value) ? value : "/menu";
}
