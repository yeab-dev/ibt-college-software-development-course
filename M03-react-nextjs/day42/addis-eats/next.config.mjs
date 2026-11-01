/** @type {import('next').NextConfig} */
const nextConfig = {
  // create-next-app 16.4 switches on `cacheComponents` and
  // `partialPrefetching` by default. Both change *when* a route renders — the
  // subject of Day 37 — and with them on, the build no longer prints the plain
  // ○ static / ƒ dynamic table the Day 36 slides teach you to read. Today is
  // routing, so they are left off and every route behaves the classic way.

  // Day 42: forbidden() and app/forbidden.js, so /kitchen can answer a
  // signed-in customer with a real 403 rather than a 404 or a 200 that says
  // "no". Experimental in Next.js 16.4 (the README says so).
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
