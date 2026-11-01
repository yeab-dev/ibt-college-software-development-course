import { useMemo, useReducer } from "react";
import PropTypes from "prop-types";
import { CartContext } from "./CartContext";
import { cartCount, cartReducer, cartTotal, initialCartState } from "./cartReducer";

// The provider is the only place that knows the cart is a reducer. Everything
// below it sees items, a total, a count and a dispatch.
function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const total = cartTotal(state.items);
  const count = cartCount(state.items);

  // Without useMemo this object literal is rebuilt on every render of
  // CartProvider, and a new object means a new context value, which means
  // every consumer re-renders — even when the cart itself did not change.
  //
  // `dispatch` is deliberately not in the dependency array: useReducer
  // guarantees it is the same function for the life of the component.
  const value = useMemo(
    () => ({ items: state.items, total, count, dispatch }),
    [state.items, total, count],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

CartProvider.propTypes = {
  children: PropTypes.node,
};

export default CartProvider;
