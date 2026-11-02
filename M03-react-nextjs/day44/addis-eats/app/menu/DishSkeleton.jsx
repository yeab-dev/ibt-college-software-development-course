import PropTypes from "prop-types";

// What stands in for the dish list while it is on its way: the heading's
// status line plus six grey cards the same size as real ones, so nothing jumps
// when the dishes replace them.
//
// Plain markup — no hooks, no directive — so it can go out in the very first
// bytes of the response. Used twice: as the <Suspense> fallback in page.js and
// inside loading.js.
function DishSkeleton({ label = "the menu" }) {
  return (
    <div aria-busy="true">
      <p className="state" role="status">
        Warming the mitad &mdash; loading {label}&hellip;
      </p>
      <ul className="dishes dishes--skeleton" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i}>
            <div className="dish dish--skeleton" />
          </li>
        ))}
      </ul>
    </div>
  );
}

DishSkeleton.propTypes = {
  label: PropTypes.string,
};

export default DishSkeleton;
