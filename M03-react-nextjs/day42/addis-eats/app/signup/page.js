import Link from "next/link";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safeNext";
import { getSession } from "@/lib/session";
import SignUpForm from "./SignUpForm";

// "/signup" — a new customer account. Dynamic (ƒ), like /login: it reads the
// session (someone signed in has nothing to do here) and ?next=, which is
// checked exactly as /login checks it.
export default async function SignUpPage({ searchParams }) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  if (await getSession()) {
    redirect(destination);
  }

  return (
    <main className="prose">
      <h2>Create an account</h2>
      <p>
        Already have one? <Link href={`/login?next=${encodeURIComponent(destination)}`}>Sign in</Link>.
      </p>
      <SignUpForm next={destination} />
    </main>
  );
}
