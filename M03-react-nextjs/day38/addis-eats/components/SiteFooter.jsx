// The footer every page shares. Plain markup, so a server component; the root
// layout renders it once and it stays put for the whole visit.
export default function SiteFooter() {
  return (
    <footer className="sitefoot">
      <p>
        CodeOps · Day 38 · Server &amp; client components ·{" "}
        <span className="sitefoot__note">
          Menu prices are refreshed at least once an hour.
        </span>
      </p>
    </footer>
  );
}
