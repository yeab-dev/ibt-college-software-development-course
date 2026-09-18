import { Link, useParams } from "react-router-dom";
import { selectAddItem, useCartStore } from "../cart/cartStore";
import { useFetch } from "../hooks/useFetch";

function DishDetail() {
  // One route, thirteen dishes. useParams returns an object keyed by the names
  // in the path — here `slug`, from path="menu/:slug". Every value is a
  // string, even when it looks like a number.
  const { slug } = useParams();
  // This screen only writes. It subscribes to the action, which never changes
  // identity, so nothing anyone does to the cart can re-render it.
  const addItem = useCartStore(selectAddItem);

  // Because `slug` is in the URL passed to useFetch, it is in that hook's
  // dependency array too. Navigating from Doro Wat to Kitfo refetches on its
  // own — no extra code.
  const { data: dish, isLoading, error } = useFetch(`/api/menu/${slug}`);

  // The Day 29 order, with one case added: loading, error, empty, data.
  if (isLoading) {
    return (
      <p className="state" role="status">
        Loading {slug.replaceAll("-", " ")}&hellip;
      </p>
    );
  }

  // Two different kinds of missing. A path nobody claimed — /menuu/kitfo — is
  // caught by the "*" route and never reaches this component. A *valid* path
  // with an id that does not exist — /menu/pizza — matches perfectly, so this
  // component has to notice and say so itself.
  if (error) {
    return (
      <div className="state state--error" role="alert">
        <p>No dish called &ldquo;{slug}&rdquo;. {error}</p>
        <p>
          <Link to="/menu">Back to the menu</Link>
        </p>
      </div>
    );
  }

  if (!dish) return null;

  return (
    <main className="detail">
      <p className="detail__crumb">
        <Link to="/menu">&larr; Menu</Link>
      </p>

      <h2>{dish.name}</h2>

      <p className="detail__price">
        {dish.price} {dish.currency}
      </p>

      <p className="detail__meta">
        {dish.category}
        {dish.spicy && " · 🌶️ Spicy"}
      </p>

      <p className="detail__note">{dish.description}</p>

      <button
        type="button"
        className="dish__add"
        onClick={() => addItem(dish)}
      >
        Add to order
      </button>
    </main>
  );
}

export default DishDetail;
