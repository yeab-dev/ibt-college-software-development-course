"use client";

// Day 38: the only part of a dish card that needs the browser.
//
// Until today the whole card (Dish.jsx) was a client component, because this
// button and the "2 in order" line read the cart store. Everything else on the
// card — the name, the link, the price, the description, the spicy tag — is
// markup from data, and it was being shipped as JavaScript only to be rendered
// a second time in the browser. So the interactive leaf was cut out, and the
// card went back to the server.
//
// Also used by the dish page, which had its own copy (AddToOrder.jsx) of the
// same button. One leaf, two places.
//
// Day 40: the render counter that sat beside the button (Day 32's teaching
// instrument) is gone; the project ships without its diagnostics.
import PropTypes from "prop-types";
import {
  selectAddItem,
  selectQuantityOf,
  useCartStore,
} from "@/cart/cartStore";

function AddToCartButton({ dish, label = "Add" }) {
  // Each button subscribes to one number, its own dish's quantity. Adding Doro
  // Wat leaves Shiro's selector returning the same 0, so Shiro's button does
  // not re-render — the Day 32 measurement, unchanged.
  const quantity = useCartStore(selectQuantityOf(dish.id));
  const addItem = useCartStore(selectAddItem);

  return (
    <>
      <button type="button" className="dish__add" onClick={() => addItem(dish)}>
        {label}
      </button>

      {quantity > 0 && <span className="dish__count">{quantity} in order</span>}
    </>
  );
}

// `dish` crosses from a server component, so it must be plain data — an
// object of strings, numbers and booleans. It is: it came out of JSON.parse.
AddToCartButton.propTypes = {
  dish: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
  }).isRequired,
  label: PropTypes.string,
};

export default AddToCartButton;
