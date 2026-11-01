import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ThemeContext } from "./ThemeContext";

const STORAGE_KEY = "addis-eats-theme";
const THEMES = ["system", "light", "dark"];

// Step 2. The theme is the clearest argument for splitting contexts: it changes
// perhaps twice in a session, while the cart changes on every click. Keeping
// both in one `{ user, cart, theme }` object would make every theme consumer
// re-render on every "Add" — the rare value paying the cost of the busy one.
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? "system",
  );

  // Writing to the DOM is exactly what an effect is for: synchronising React
  // state with something outside React.
  useEffect(() => {
    if (theme === "system") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, themes: THEMES, setTheme }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node,
};

export default ThemeProvider;
