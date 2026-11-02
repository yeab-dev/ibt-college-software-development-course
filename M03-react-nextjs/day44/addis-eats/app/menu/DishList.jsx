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
//
// Day 43: the first card's photo is fetched eagerly and at high priority, and
// no other. On a phone it is the only photo above the fold, and Lighthouse
// names it as the LCP element; on a desktop the first row has three, all the
// same size, and the first one painted counts. Raising all three would make
// them compete for the same bandwidth — the reading sheet's warning.
//
// Why loading="eager" + fetchPriority="high" here, when the home page and the
// dish page use `preload`: the installed Next.js 16 docs advise against
// `preload` when more than one image could be the LCP element depending on
// the viewport (the first row here), and recommend these two attributes
// instead "in most cases". Both were measured here, seven runs each, and
// Lighthouse could not tell them apart: /menu's LCP is held back by something
// else, the Suspense reveal (PERF.md, "What is left"). So the choice follows
// the docs rather than a number.
function DishList({ dishes }) {
  return (
    <ul className="dishes">
      {dishes.map((dish, index) => (
        <FilterItem key={dish.id} id={dish.id}>
          <Dish dish={dish} lcpCandidate={index === 0} />
        </FilterItem>
      ))}
    </ul>
  );
}

DishList.propTypes = {
  dishes: PropTypes.array.isRequired,
};

export default DishList;
