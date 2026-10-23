import PropTypes from "prop-types";
import Dish from "./Dish";
import { FilterItem } from "./FilterShell";

// Day 38: a server component. It renders every dish, once, on the server — and
// ships no JavaScript.
//
// Day 33's version took isLoading, error, searchTerm, category and onRetry,
// and drew five different states. Those states have all found better homes:
// waiting is the Suspense boundary in page.js, failing is error.js, and
// "nothing matches" is FilterShell's job, since only the browser knows what
// was typed. onRetry was a function, and a function cannot be passed into a
// server component from the client anyway. What is left is the list.
//
// How filtering works without this component running in the browser: each
// card is wrapped in a FilterItem, a tiny client component that hides its
// <li> when FilterShell says so. FilterItem receives the server-rendered card
// as children, so the card's code stays here. The browser toggles a `hidden`
// attribute; it never re-renders a dish.
function DishList({ dishes }) {
  return (
    <ul className="dishes">
      {dishes.map((dish) => (
        <FilterItem key={dish.id} id={dish.id}>
          <Dish dish={dish} />
        </FilterItem>
      ))}
    </ul>
  );
}

DishList.propTypes = {
  dishes: PropTypes.array.isRequired,
};

export default DishList;
