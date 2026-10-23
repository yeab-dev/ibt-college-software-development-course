import Link from "next/link";
import { signOut } from "@/app/actions";
import { getSession, safeNext } from "@/lib/session";
import LoginForm from "./LoginForm";

// "/login" — Day 31's sign-in screen, back because cancelOrder needs to know
// who is asking. Dynamic (ƒ): it reads the session cookie, and the query
// string's ?next=, to say who you are and where you are going.
//
// A stand-in, as on Day 31: any TeleBirr-shaped number signs you in as its
// owner. What is real now is where the session lives — a signed, httpOnly
// cookie the server checks (lib/session.js) — not how you got it. Day 42
// brings real authentication.
export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  const destination = safeNext(next);
  const user = await getSession();

  if (user) {
    return (
      <main className="prose">
        <h2>Already signed in</h2>
        <p>
          You are <strong>{user.name}</strong> ({user.phone}).
        </p>
        <p>
          <Link className="cta" href={destination}>
            Continue to {destination}
          </Link>
        </p>
        {/* A server component rendering a form whose action is a server
            action: no JavaScript involved anywhere. */}
        <form action={signOut}>
          <button type="submit" className="tabs__signout">
            Sign out
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="prose">
      <h2>Sign in</h2>
      <p>
        Any 09… number will do — this is a stand-in until Day 42. Your orders
        belong to the number you sign in with.
      </p>
      <LoginForm next={destination} />
    </main>
  );
}
