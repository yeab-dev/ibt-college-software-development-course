import "server-only";
import { randomBytes } from "node:crypto";
import { jsonStore } from "./jsonStore";
import { hashPassword } from "./password";

// Day 42. Who can sign in: one row per person, in .data/accounts.json.
//
//   { id: "usr_almaz", name: "Almaz Bekele", phone: "0911223344",
//     role: "customer", passwordHash: "scrypt$…", createdAt }
//
// `id` is what everything else points at — an order's owner, a session's
// person. Not the phone number, which Day 39–41 used: a person may change
// their number, and an id that is not a phone number can be put in a log
// without putting a phone number in the log.
//
// `role` is "customer" or "staff". Two coarse roles, as the slides advise; it
// is a claim the server reads, never something the browser sends.
//
// The first read copies data/accounts.seed.json (committed: names, phones and
// scrypt hashes, no passwords) into .data/. The README lists the three demo
// accounts and their passwords.

export const ROLES = ["customer", "staff"];

const store = jsonStore("accounts", { seed: "accounts.seed.json" });

// What the rest of the app may know about a person. Never the hash.
export function publicAccount({ id, name, phone, role }) {
  return { id, name, phone, role };
}

export async function findAccountByPhone(phone) {
  const accounts = await store.load();
  return accounts.find((a) => a.phone === phone) ?? null;
}

export async function getAccount(id) {
  if (typeof id !== "string") return null;
  const accounts = await store.load();
  return accounts.find((a) => a.id === id) ?? null;
}

// Sign-up. Every new account is a customer: nobody can make themselves staff
// from a form, whatever fields they add to it.
export async function createAccount({ name, phone, password }) {
  const passwordHash = await hashPassword(password);
  return store.mutate((accounts) => {
    if (accounts.some((a) => a.phone === phone)) {
      return { ok: false };
    }
    const account = {
      id: `usr_${randomBytes(6).toString("hex")}`,
      name,
      phone,
      role: "customer",
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    accounts.push(account);
    return { ok: true, account };
  });
}
