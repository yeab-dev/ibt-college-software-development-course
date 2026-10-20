import { useTheme } from "../theme/useTheme";

// The only consumer of ThemeContext. Because the theme has a provider of its
// own, adding a dish to the cart cannot re-render it — and changing the theme
// cannot re-render anything that only cares about the cart.
function ThemePicker() {
  const { theme, themes, setTheme } = useTheme();

  return (
    <label className="theme">
      <span className="visually-hidden">Theme</span>
      <select
        value={theme}
        aria-label="Theme"
        onChange={(event) => setTheme(event.target.value)}
      >
        {themes.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default ThemePicker;
