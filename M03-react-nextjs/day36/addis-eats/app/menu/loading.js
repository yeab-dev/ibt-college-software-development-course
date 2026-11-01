// Shown the moment someone opens /menu (or a dish under it), for as long as
// page.js is still awaiting its data.
//
// This is Day 34's <Suspense fallback={…}>, declared by file name. Next.js
// wraps the menu segment's page in a Suspense boundary and uses this component
// as the fallback; the header and nav from the layout are already on screen
// above it, so only the part that is actually waiting shows that it is.
//
// No hooks, no props, no "use client": a loading screen is plain markup, so it
// can be sent in the very first bytes of the response.
export default function MenuLoading() {
  return (
    <main className="menu" aria-busy="true">
      <h2>The menu</h2>
      <p className="state" role="status">
        Warming the mitad &mdash; loading the menu&hellip;
      </p>
    </main>
  );
}
