"use client";

import PropTypes from "prop-types";
import { usePathname } from "next/navigation";
import { createContext, use, useEffect, useState } from "react";
import { isCategory } from "@/lib/categories";

// The selected category, held by the menu layout.
//
// Day 36 kept it in the query string and read it with useSearchParams. That no
// longer works as it did: /menu is now prerendered once for everybody, and a
// prerendered page cannot know the query string — useSearchParams would turn
// everything under it into browser-only rendering, dishes included. So the
// category moved up into the layout, where it belongs anyway: the sidebar
// that changes it lives there, and a layout's state survives navigation. Pick
// Drink, open a dish, come back — still Drink, and no request was made to find
// that out.
//
// The URL still follows along (/menu?category=Drink), so the address can be
// shared and survives a reload. It is just no longer the thing the server
// reads.
const MenuFilterContext = createContext(null);

function readCategoryFromUrl() {
  const requested = new URLSearchParams(window.location.search).get("category");
  return isCategory(requested) ? requested : "All";
}

function MenuFilterProvider({ children }) {
  // Starts at "All" on the server and in the browser's first render, so the
  // prerendered HTML and hydration agree. The real value is read just after.
  const [category, setCategory] = useState("All");
  const pathname = usePathname();

  // Once, after hydration: a reload of /menu?category=Drink restores Drink.
  // Effects never run on the server, so this is the first moment window exists.
  useEffect(() => {
    const fromUrl = readCategoryFromUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the URL, an external system, exactly once
    if (fromUrl !== "All") setCategory(fromUrl);
  }, []);

  // Keep the address in step whenever the list is on screen. replaceState, not
  // router.replace: the router would fetch /menu again just to filter a list
  // the browser already holds, and five categories should not cost five
  // presses of Back. Next.js listens to the history API, so its own idea of
  // the URL stays correct.
  useEffect(() => {
    if (pathname !== "/menu") return;
    const query = category === "All" ? "" : `?category=${category}`;
    if (window.location.search !== query) {
      window.history.replaceState(null, "", `/menu${query}`);
    }
  }, [category, pathname]);

  return (
    <MenuFilterContext value={{ category, setCategory }}>
      {children}
    </MenuFilterContext>
  );
}

MenuFilterProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useMenuFilter() {
  const value = use(MenuFilterContext);
  if (!value) {
    throw new Error("useMenuFilter must be used inside app/menu/layout.js");
  }
  return value;
}

export default MenuFilterProvider;
