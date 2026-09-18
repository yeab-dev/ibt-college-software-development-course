// A reducer is a pure function: (state, action) => newState. No fetch, no
// setState, no Math.random, no Date.now — the same state and the same action
// must always produce the same result. That is what makes it testable without
// React, and what `cartReducer.check.mjs` in this folder relies on.

export const initialCartState = { items: [] };

export function cartReducer(state, action) {
  switch (action.type) {
    // The cart stores a line per dish with a quantity, not one entry per
    // click, so adding a dish already in the cart bumps its quantity.
    case "add": {
      const existing = state.items.find((item) => item.id === action.dish.id);

      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.dish.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, { ...action.dish, quantity: 1 }],
      };
    }

    // Remove takes one off the line and drops the line when it hits zero.
    case "remove": {
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.id
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          )
          .filter((item) => item.quantity > 0),
      };
    }

    case "clear":
      return initialCartState;

    // Throwing on an unknown action turns a silent typo — dispatching
    // { type: "Add" } — into an error that names itself.
    default:
      throw new Error(`cartReducer: unknown action "${action.type}"`);
  }
}

// Derived, never stored. Keeping the total in state means two sources of truth
// that can disagree; computing it from items means it cannot.
export function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartCount(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
