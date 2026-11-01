import PropTypes from "prop-types";

// In React 19 a ref is an ordinary prop, so no forwardRef wrapper is needed:
// Menu hands us its useRef and we pass it straight to the input it wants to
// focus.
function SearchBar({ value, onChange, ref }) {
  return (
    <div className="search">
      <label className="search__label" htmlFor="dish-search">
        Search this category
      </label>

      <div className="search__field">
        <input
          id="dish-search"
          ref={ref}
          type="search"
          value={value}
          placeholder="Try &ldquo;tibs&rdquo;"
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />

        {value !== "" && (
          <button
            type="button"
            className="search__clear"
            onClick={() => {
              onChange("");
              ref.current.focus();
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  ref: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};

export default SearchBar;
