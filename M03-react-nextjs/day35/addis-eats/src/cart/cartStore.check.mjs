// The store is a plain module, so it can be driven from plain Node with no
// components at all. That is one of the things a store buys you over context:
// a context value only exists while a provider is mounted.
//
// Run with `npm run check:store`.

import assert from "node:assert/strict";

// persist writes to localStorage, which Node does not have. A small shim is
// enough, and it also lets us prove that what was written is what we expect.
//
// It has to hang off `window`, not off globalThis: zustand's default storage
// is literally `createJSONStorage(() => window.localStorage)`. Shim the bare
// global instead and persist silently falls back to "storage unavailable".
const store = new Map();
const localStorageShim = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = { localStorage: localStorageShim };
globalThis.localStorage = localStorageShim;

const {
  useCartStore,
  selectCount,
  selectTotal,
  selectQuantityOf,
  selectAddItem,
} = await import("./cartStore.js");

const doro = { id: 1, slug: "doro-wat", name: "Doro Wat", price: 240 };
const shiro = { id: 2, slug: "shiro", name: "Shiro", price: 120 };

const { addItem, removeItem, clear } = useCartStore.getState();
const read = () => useCartStore.getState();

// --- the actions -----------------------------------------------------------

addItem(doro);
assert.deepEqual(read().items, [{ ...doro, quantity: 1 }]);

addItem(doro);
assert.equal(read().items.length, 1, "the same dish bumps the quantity");
assert.equal(read().items[0].quantity, 2);

addItem(shiro);
assert.equal(selectCount(read()), 3);
assert.equal(selectTotal(read()), 240 * 2 + 120);

removeItem(doro.id);
assert.equal(selectQuantityOf(doro.id)(read()), 1);

removeItem(doro.id);
assert.deepEqual(
  read().items.map((item) => item.id),
  [shiro.id],
  "the line disappears when the last one goes",
);

// --- what a selector actually buys you -------------------------------------
//
// This is the whole argument for a store over context, and it is checkable.
// React re-renders a subscriber when its selector returns something that is
// not Object.is-equal to what it returned last time. So: add a dish, and ask
// whether an *unrelated* card's selector changed its answer.

clear();
addItem(shiro);

const shiroCardBefore = selectQuantityOf(shiro.id)(read());
const addItemBefore = selectAddItem(read());

addItem(doro); // a completely different dish

assert.ok(
  Object.is(shiroCardBefore, selectQuantityOf(shiro.id)(read())),
  "the Shiro card's selector is unchanged, so that card does not re-render",
);

assert.ok(
  Object.is(addItemBefore, selectAddItem(read())),
  "the action identity is stable, so write-only components never re-render",
);

// Under context every one of those consumers gets the whole value object and
// re-renders regardless. That is the thing context cannot do.

// --- and the mistake the slide warns about ---------------------------------

const objectSelector = (state) => ({ count: state.items.length });
assert.ok(
  !Object.is(objectSelector(read()), objectSelector(read())),
  "a selector returning a fresh object always looks changed — never do this",
);

// --- persistence -----------------------------------------------------------

clear();
addItem(doro);
addItem(shiro);

const saved = JSON.parse(store.get("addis-eats-cart"));
assert.deepEqual(
  saved.state.items.map((item) => item.slug),
  ["doro-wat", "shiro"],
  "persist wrote the items to storage",
);
assert.equal(
  saved.state.addItem,
  undefined,
  "partialize kept the actions out of storage",
);

console.log("cartStore: all checks passed");
