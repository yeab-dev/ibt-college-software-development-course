"use client";

import PropTypes from "prop-types";
import { selectAddItem, useCartStore } from "@/cart/cartStore";

// The one interactive part of the dish page, split out of DishDetail.jsx.
//
// The page is a server component, and a server component cannot hold an
// onClick or call a store hook. So the button becomes its own small client
// component and the rest of the page stays on the server. It subscribes to the
// action only — never changes identity — so nothing anyone does to the cart can
// re-render it.
function AddToOrder({ dish }) {
  const addItem = useCartStore(selectAddItem);

  return (
    <button type="button" className="dish__add" onClick={() => addItem(dish)}>
      Add to order
    </button>
  );
}

AddToOrder.propTypes = {
  dish: PropTypes.object.isRequired,
};

export default AddToOrder;
