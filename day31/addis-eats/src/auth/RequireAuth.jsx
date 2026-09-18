import { useContext } from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";

// An ordinary component. It takes Day 27's `children` prop and Day 30's
// context, and renders either what it wraps or a redirect.
function RequireAuth({ children }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Check loading FIRST. While the session is still being read, `user` is
  // null — redirecting on that would throw a signed-in person out on every
  // refresh of /checkout.
  if (loading) {
    return (
      <p className="state" role="status">
        Checking your session&hellip;
      </p>
    );
  }

  if (!user) {
    // Returning <Navigate /> is a normal render that happens to change the
    // URL. Calling navigate() here would be a side effect during render —
    // exactly what Day 29 warned about.
    //
    // `state` carries where they were trying to go, so Login can send them
    // back. `replace` means the back button does not return them to the page
    // that just turned them away.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node,
};

export default RequireAuth;
