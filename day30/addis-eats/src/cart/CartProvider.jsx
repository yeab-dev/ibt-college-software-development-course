import { useMemo, useReducer } from "react";
import PropTypes from "prop-types";
import { CartContext } from "./CartContext";
import {
  cartCount,
  cartReducer,
  cartTotal,
  initialCartState,
} from "./cartReducer";

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const total = cartTotal(state.items);
  const count = cartCount(state.items);

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
