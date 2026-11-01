import Link from "next/link";
import { signOut } from "@/app/actions";
import { safeNext } from "@/lib/safeNext";
import { getSession } from "@/lib/session";
import LoginForm from "./LoginForm";

// "/login" — sign in with a phone number and a password. Dynamic (ƒ): it
// reads the session cookie, and the query string's ?next=, to say who you
// are and where you are going.
//
// The slides call this page app/signin/page.js. Addis Eats has had /login
// since Day 31, and the proxy, the checkout and every link already send
// people here, so the name stays.
//
// `next` is checked here *and* in the action. Here, so that the link the
// page prints ("Continue to …", the form's hidden field) is never somewhere
// else; in the action, because the hidden field is just as easy to change
// as the URL.
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
        {/* The role decides what this page *shows*. Whether /kitchen lets
            them in is decided by /kitchen, on the server, separately. */}
        {user.role === "staff" && (
          <p>
            <Link href="/kitchen">Open the kitchen board</Link>
          </p>
        )}
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
        Your orders belong to your account. New here?{" "}
        <Link href={`/signup?next=${encodeURIComponent(destination)}`}>Create an account</Link>.
      </p>
      <LoginForm next={destination} />
    </main>
  );
}
