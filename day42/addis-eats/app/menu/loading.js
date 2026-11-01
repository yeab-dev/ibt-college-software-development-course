import DishSkeleton from "./DishSkeleton";

// The segment-wide fallback: Next.js wraps every page under /menu in a
// Suspense boundary and shows this while that page is waiting.
//
// Day 37 changed who uses it. /menu no longer waits at the top — its page
// renders at once and holds back only the dish list, with a <Suspense> of its
// own (see page.js). So this file now covers the dish pages. In production
// those are prebuilt (or, for a slug the build did not know, rendered once
// and cached), so the server never streams this fallback; what remains is the
// browser's side: on a client-side navigation to a dish whose payload is not
// in hand yet, the router shows this at once instead of freezing on the old
// page. In `npm run dev`, which renders every request, it streams every time.
//
// It renders inside app/menu/layout.js, so the sidebar is on screen beside it.
export default function MenuLoading() {
  return (
    <main className="menu">
      <h2>The menu</h2>
      <DishSkeleton label="the dish" />
    </main>
  );
}
