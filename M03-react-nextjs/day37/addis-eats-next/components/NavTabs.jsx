"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", end: true },
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
];

// Next.js has no NavLink. On Day 31 NavLink was "a Link that also knows whether
// it is the open page"; here that knowledge comes from usePathname, and the
// Link is the ordinary one. A hook means a client component, so this small
// piece is split out of the layout, which stays a server component.
function NavTabs() {
  const pathname = usePathname();

  // `end` does what it did on Day 31: "/" must match only "/", not every URL
  // that begins with a slash. The others also stay lit on deeper paths, so
  // /menu/kitfo still highlights Menu.
  function isActive(tab) {
    return tab.end
      ? pathname === tab.href
      : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
  }

  return (
    <nav className="tabs" aria-label="Main">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={isActive(tab) ? "tabs__link tabs__link--active" : "tabs__link"}
          aria-current={isActive(tab) ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export default NavTabs;
