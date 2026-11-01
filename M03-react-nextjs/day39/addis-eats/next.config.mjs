/** @type {import('next').NextConfig} */
const nextConfig = {
  // create-next-app 16.4 switches on `cacheComponents` and
  // `partialPrefetching` by default. Both change *when* a route renders — the
  // subject of Day 37 — and with them on, the build no longer prints the plain
  // ○ static / ƒ dynamic table the Day 36 slides teach you to read. Today is
  // routing, so they are left off and every route behaves the classic way.
};

export default nextConfig;
