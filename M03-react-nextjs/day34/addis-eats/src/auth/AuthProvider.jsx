import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";

const STORAGE_KEY = "addis-eats-session";

// A stand-in for a real sign-in. There is no server and no password — the
// point of Day 31 is the *guard*, not the credentials.
//
// Reading the session is deliberately asynchronous, with a small delay. A real
// app asks a server (`GET /api/me`) and waits; doing the same here means the
// `loading` state below is genuinely observable rather than a flag that is
// already false by the first paint.
function readSession() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      resolve(stored ? JSON.parse(stored) : null);
    }, 400);
  });
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // `loading` is the whole reason RequireAuth works on a cold page load.
  // While the session is being read, `user` is null. A guard that redirects
  // on `!user` without checking `loading` first bounces a signed-in person to
  // the login screen on every refresh of /checkout.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Day 29's cleanup pattern: if the provider unmounts before the read
    // finishes, do not set state on a component that is gone.
    let cancelled = false;

    readSession().then((session) => {
      if (cancelled) return;
      setUser(session);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((phone) => {
    const session = { phone, name: `Guest ${phone.slice(-4)}` };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // Memoised for the same reason CartProvider's value is: a fresh object every
  // render is a fresh context value, and that re-renders every consumer.
  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export default AuthProvider;
