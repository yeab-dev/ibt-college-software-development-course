// The reducer is a plain function, so it can be checked with plain Node — no
// React, no browser, no rendering. Run it with `npm run check:reducer`.
//
// Build the reducer first and call it directly with plain objects. If it is
// right on its own, wiring it into a component is a five-line job.

import assert from "node:assert/strict";
import {
  cartCount,
  cartReducer,
  cartTotal,
  initialCartState,
} from "./cartReducer.js";

const doro = { id: 1, name: "Doro Wat", price: 240 };
const shiro = { id: 2, name: "Shiro", price: 120 };

// add — a dish that is not in the cart yet becomes a new line with quantity 1
let state = cartReducer(initialCartState, { type: "add", dish: doro });
assert.deepEqual(state.items, [{ ...doro, quantity: 1 }]);

// add — the same dish again bumps the quantity instead of adding a second line
state = cartReducer(state, { type: "add", dish: doro });
assert.equal(state.items.length, 1);
assert.equal(state.items[0].quantity, 2);

// the reducer never mutates: the state we started from is untouched
assert.deepEqual(initialCartState.items, []);

state = cartReducer(state, { type: "add", dish: shiro });
assert.equal(cartCount(state.items), 3);
assert.equal(cartTotal(state.items), 240 * 2 + 120);

// remove — takes one off the line
state = cartReducer(state, { type: "remove", id: doro.id });
assert.equal(state.items[0].quantity, 1);

// remove — drops the line entirely when the last one goes
state = cartReducer(state, { type: "remove", id: doro.id });
assert.deepEqual(
  state.items.map((item) => item.id),
  [shiro.id],
);

// clear — back to the beginning
state = cartReducer(state, { type: "clear" });
assert.deepEqual(state, initialCartState);

// an unknown action is a bug, and says so
assert.throws(() => cartReducer(state, { type: "Add" }), /unknown action/);

console.log("cartReducer: all checks passed");
