// Day 38: a server component again. No directive, no hooks.
//
// On Days 36 and 37 this file began with "use client", because the card read
// the cart store. Only two things on it actually do: the Add button and the
// "in order" count. They are now AddToCartButton.jsx, and the rest of the card
// is rendered on the server and arrives as HTML. In the browser, this file's
// code does not exist: search the /menu chunks for "dish__head" and nothing is
// found (the README has the check).
import Link from "next/link";
import PropTypes from "prop-types";
import AddToCartButton from "./AddToCartButton";

function Dish({ dish }) {
  return (
    <article className="dish">
      <div className="dish__head">
        <h2>
          {/* next/link is a client component; a server component may render
              it like any other. Its href is a string — data, so it crosses. */}
          <Link href={`/menu/${dish.slug}`}>{dish.name}</Link>
        </h2>
        <p className="dish__price">
          {dish.price} {dish.currency}
        </p>
      </div>

      {dish.description && <p className="dish__note">{dish.description}</p>}

      <div className="dish__foot">
        {dish.spicy === true && <span className="dish__tag">🌶️ Spicy</span>}

        {/* The boundary. `dish` is a plain object, so it can be passed; an
            onAdd={…} callback could not — a function cannot be sent from the
            server to the browser. The button reaches the store itself. */}
        <AddToCartButton dish={dish} />
      </div>
    </article>
  );
}

Dish.propTypes = {
  dish: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    spicy: PropTypes.bool,
    description: PropTypes.string,
  }).isRequired,
};

export default Dish;
