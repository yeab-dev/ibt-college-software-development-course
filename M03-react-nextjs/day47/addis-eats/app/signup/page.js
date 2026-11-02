import Link from "next/link";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safeNext";
import { getSession } from "@/lib/session";
import { privatePage } from "@/lib/site";
import SignUpForm from "./SignUpForm";

// "/signup" — a new customer account. Dynamic (ƒ), like /login: it reads the
// session (someone signed in has nothing to do here) and ?next=, which is
// checked exactly as /login checks it.
// Day 44: noindex, like the private pages — a sign-in form is nothing
// anyone searches for. Unlike them it is *not* disallowed in robots.js, so a
// crawler can still read this tag. And a canonical, because the page takes
// ?next=: /signup?next=/checkout and /signup?next=/orders are one page.
export const metadata = {
  ...privatePage({
    title: "Create an account",
    description: "Make an Addis Eats account with your phone number, so your orders and receipts are kept together.",
  }),
  alternates: { canonical: "/signup" },
};

export default async function SignUpPage({ searchParams }) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  if (await getSession()) {
    redirect(destination);
  }

  return (
    <main className="prose">
      <h1>Create an account</h1>
      <p>
        Already have one? <Link href={`/login?next=${encodeURIComponent(destination)}`}>Sign in</Link>.
      </p>
      <SignUpForm next={destination} />
    </main>
  );
}
