// The menu's categories, in the order the sidebar shows them.
//
// Its own file, and deliberately free of node:fs, because both sides need it:
// the server-rendered menu layout and the browser-side filter. lib/menu.js
// could not be imported by a "use client" file at all.
export const CATEGORIES = ["All", "Main", "Side", "Drink", "Dessert"];

export function isCategory(value) {
  return CATEGORIES.includes(value);
}
