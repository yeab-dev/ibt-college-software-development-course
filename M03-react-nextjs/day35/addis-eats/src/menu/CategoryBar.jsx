import PropTypes from "prop-types";

function CategoryBar({ categories, selectedCategory, onSelectCategory }) {
  return (
    <nav className="categories" aria-label="Menu categories">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={
            selectedCategory === category
              ? "categories__button categories__button--active"
              : "categories__button"
          }
          aria-pressed={selectedCategory === category}
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </button>
      ))}
    </nav>
  );
}

CategoryBar.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string.isRequired,
  onSelectCategory: PropTypes.func.isRequired,
};

export default CategoryBar;
