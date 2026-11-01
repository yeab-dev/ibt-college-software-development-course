import Link from "next/link";

// Day 42. Rendered when a page calls forbidden() — today only /kitchen, for
// someone signed in without the staff role. Next.js answers 403 and adds
// <meta name="robots" content="noindex">.
//
// It says what is true: you are signed in, and this page is not for you.
// Signing in again would not help, which is the difference from a 401.
export default function Forbidden() {
  return (
    <main className="prose">
      <h2>Staff only</h2>
      <p>You are signed in, but this page is for the kitchen staff.</p>
      <p>
        <Link className="cta" href="/orders">
          See your own orders
        </Link>
      </p>
    </main>
  );
}
