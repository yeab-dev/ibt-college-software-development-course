import { create } from "zustand";
import { persist } from "zustand/middleware";

// Step 3. The whole cart, in one function call.
//
// There is no provider. The store is a plain module, so any component imports
// it directly — nothing has to be mounted above you, and moving a component
// around the tree cannot break its access to the cart.
//
// `create` takes a function receiving `set` and returning the initial state.
// The actions live in that same object: no separate reducer file, no action
// type strings, no dispatch.
export const useCartStore = create(
  // Step 5. The persist middleware. Everything inside it is the store you
  // would have written anyway; the wrapper is what saves it to localStorage
  // after every change and reads it back on load. The order now survives a
  // refresh without a single line of effect code.
  persist(
    (set) => ({
      items: [],

      addItem: (dish) =>
        // `set` merges, it does not replace: returning { items } leaves every
        // other key untouched. Pass a function when the new value depends on
        // the old one.
        set((state) => {
          const existing = state.items.find((item) => item.id === dish.id);

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === dish.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          return { items: [...state.items, { ...dish, quantity: 1 }] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
            )
            .filter((item) => item.quantity > 0),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "addis-eats-cart",

      // Only the data is worth saving. Without partialize the actions would be
      // written to localStorage too — as nothing, because functions do not
      // survive JSON — and rehydration would put those nothings back over the
      // real ones.
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

// Step 4. Selectors, defined once at module level so their identity is stable
// across renders.
//
// Each one returns a *primitive* or the array itself — never a fresh object.
// Zustand compares the selector's result with the previous one to decide
// whether a re-render is needed; returning `{ items, total }` builds a new
// object every call, so the comparison always says "changed" and the whole
// benefit disappears.

export const selectItems = (state) => state.items;

export const selectCount = (state) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectTotal = (state) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// A selector can take an argument as long as you keep it out of the component
// body's identity — this returns a plain number, so a card only re-renders
// when its own quantity changes.
export const selectQuantityOf = (id) => (state) =>
  state.items.find((item) => item.id === id)?.quantity ?? 0;

// The actions never change, so a component that only writes subscribes to
// something permanently stable and never re-renders because of the cart.
export const selectAddItem = (state) => state.addItem;
export const selectRemoveItem = (state) => state.removeItem;
export const selectClear = (state) => state.clear;
