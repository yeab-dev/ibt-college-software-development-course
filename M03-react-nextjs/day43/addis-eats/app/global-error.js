"use client";

// Day 40: the last boundary — for a throw in app/layout.js itself, where
// app/error.js cannot help because it renders inside that layout.
//
// It replaces the root layout, so it brings its own <html> and <body>, and
// Next.js does not apply globals.css to it: the little styling it has is
// inline. The header and the cart are gone in this case — they were in the
// layout that failed — which is why every other failure is caught lower down.
export default function GlobalError({ error, retry }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "40rem" }}>
        <title>Addis Eats — something went wrong</title>
        <h1>Addis Eats</h1>
        <p role="alert">
          The site could not be shown. Please try again in a moment.
          {error?.digest && <> (Reference {error.digest}.)</>}
        </p>
        <button type="button" onClick={() => retry()}>
          Try again
        </button>
      </body>
    </html>
  );
}
