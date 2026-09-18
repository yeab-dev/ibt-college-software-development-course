import { Link, useLocation } from "react-router-dom";

// path="*" matches anything no other route claimed. Without this screen, a
// mistyped URL renders nothing at all and says nothing about why.
function NotFound() {
  const location = useLocation();

  return (
    <main className="prose">
      <h2>Nothing at {location.pathname}</h2>
      <p>That address is not one of ours.</p>
      <p>
        <Link className="cta" to="/menu">
          Back to the menu
        </Link>
      </p>
    </main>
  );
}

export default NotFound;
