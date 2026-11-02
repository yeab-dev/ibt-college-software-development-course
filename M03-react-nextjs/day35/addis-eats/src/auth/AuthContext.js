import { createContext } from "react";

// Same shape as CartContext: the context object alone in its own module, so
// the provider file can export nothing but a component.
export const AuthContext = createContext(null);
