import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Day 42. Passwords are never stored — only something they can be checked
// against.
//
// The reading sheet: "Store a hash produced by bcrypt or argon2, never the
// password itself and never something you encrypted and could decrypt."
// Node has neither of those built in, but it has scrypt, which is the same
// kind of function: deliberately slow and memory-hungry, so that guessing a
// stolen hash costs an attacker real time per guess. It needs no package.
//
// A stored hash carries everything needed to check it later:
//
//     scrypt$16384$8$1$<salt>$<hash>
//
// N=16384, r=8, p=1 are the work factors (OWASP's minimum for scrypt), and the
// salt is 16 random bytes, different for every account, so two people with
// the same password have different hashes and no table of precomputed
// hashes helps. Raising N later only needs new hashes for new passwords:
// old ones still say which N they were made with.

const scryptAsync = promisify(scrypt);

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

export async function verifyPassword(password, stored) {
  const [scheme, n, r, p, salt, expected] = String(stored).split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const want = Buffer.from(expected, "base64url");
  const got = await scryptAsync(password.normalize("NFKC"), Buffer.from(salt, "base64url"), want.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  // Constant time: how long the comparison takes says nothing about how
  // many bytes were right.
  return got.length === want.length && timingSafeEqual(got, want);
}

// A real hash of nothing anyone knows, checked when the phone number has no
// account. Without it, "no such number" would answer in a millisecond and
// "wrong password" in ~50, and the clock would tell a stranger which numbers
// have accounts.
const DUMMY = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export async function burnTime(password) {
  await verifyPassword(password, DUMMY);
}
