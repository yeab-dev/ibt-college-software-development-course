import { memo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  selectAddItem,
  selectQuantityOf,
  useCartStore,
} from "../cart/cartStore";
import { useRenderCount } from "../hooks/useRenderCount";
import Modal from "../ui/Modal";

function Dish({ dish }) {
  // Refuse to render a dish we cannot price. Showing "undefined ETB" — or
  // worse, letting it into the basket at 0 — is the half-rendered interface
  // React's white screen exists to prevent. Throwing hands the decision to the
  // nearest error boundary, which in App.jsx is the one around the menu: the
  // header, the cart panel and the rest of the app keep working.
  if (typeof dish.price !== "number") {
    throw new Error(`${dish.name} arrived without a price`);
  }

  // This is the clearest demonstration in the whole application, and the
  // README has the measured numbers.
  //
  // Under context every card called useCart(), got the entire value object,
  // and re-rendered on every "Add" — thirteen cards, three dishes, thirty-nine
  // renders. Here each card subscribes to a single number: its own quantity.
  // Adding Doro Wat leaves the Shiro card's selector returning the same 0 it
  // returned before, so React skips it. Three renders instead of thirty-nine.
  const quantity = useCartStore(selectQuantityOf(dish.id));

  // One value at a time. Two selectors, not one returning { quantity, addItem }
  // — that object would be new on every call and defeat the comparison.
  const addItem = useCartStore(selectAddItem);

  const renders = useRenderCount(`Dish · ${dish.name}`);

  // The modal's open state lives here, in the one card it belongs to. Opening
  // Doro Wat's details re-renders Doro Wat's card and nothing else.
  const [showDetails, setShowDetails] = useState(false);

  return (
    <article className="dish">
      <div className="dish__head">
        <h2>
          <Link to={`/menu/${dish.slug}`}>{dish.name}</Link>
        </h2>
        <p className="dish__price">
          {dish.price} {dish.currency}
        </p>
      </div>

      {dish.description && <p className="dish__note">{dish.description}</p>}

      <div className="dish__foot">
        {dish.spicy === true && <span className="dish__tag">🌶️ Spicy</span>}

        <button type="button" className="dish__add" onClick={() => addItem(dish)}>
          Add
        </button>

        <button
          type="button"
          className="dish__details"
          aria-haspopup="dialog"
          onClick={() => setShowDetails(true)}
        >
          Details
        </button>

        {quantity > 0 && (
          <span className="dish__count">{quantity} in order</span>
        )}

        <span className="dish__renders">{renders} renders</span>
      </div>

      {/* Written inside the card, rendered into #modal-root. The card's
          overflow: hidden would clip it otherwise. */}
      {showDetails && (
        <Modal title={dish.name} onClose={() => setShowDetails(false)}>
          <p className="modal__price">
            {dish.price} {dish.currency}
            {dish.spicy === true && " · 🌶️ Spicy"}
          </p>
          {dish.description && <p>{dish.description}</p>}
          <p>{quantity > 0 ? `${quantity} in your order.` : "Not in your order yet."}</p>
          <div className="modal__actions">
            {/* Still reads and writes the same store — a portal moves pixels,
                not the component. */}
            <button type="button" className="cta" onClick={() => addItem(dish)}>
              Add one — {dish.price} {dish.currency}
            </button>
            <Link to={`/menu/${dish.slug}`}>Full page</Link>
          </div>
        </Modal>
      )}
    </article>
  );
}

Dish.propTypes = {
  dish: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    // Not .isRequired: a missing price is caught above, by throwing, rather
    // than by a console warning nobody reads.
    price: PropTypes.number,
    category: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    spicy: PropTypes.bool,
    description: PropTypes.string,
  }).isRequired,
};

// Day 34, measured — see PROFILE.md. Typing in the search box re-renders Menu,
// which re-renders DishList, which re-rendered every card still on screen even
// though each one's `dish` prop is the very same object as last time. The
// search term cannot move further down: the list needs it to filter. So this
// is the "memo if you must" case — and it works only because `dish` is the one
// prop and it is referentially stable (straight from the fetched array). Pass
// an inline object or arrow function here and memo silently does nothing.
export default memo(Dish);
