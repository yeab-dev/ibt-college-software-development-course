import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// The same guard, for the context that is going to stay. When the cart moves
// into a store, this is the hook that still proves the pattern: export the
// hook, keep the context object private to the module.
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (ctx === null) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return ctx;
}
