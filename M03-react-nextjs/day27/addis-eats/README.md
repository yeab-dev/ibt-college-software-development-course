# Addis Eats: Day 27, Props & Rendering Patterns

A static Addis Eats menu, grouped into Main, Starter, Bread and Dessert sections. Each dish sits in a card with its price and, when it applies, a spicy badge. Categories with no dishes show an empty state. Everything is driven by props; interactivity (a clickable filter) arrives with state on Day 28.

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm run lint
```

## Components

All in `src/components/`.

- **`Dish`** shows one dish: its name, its price and currency, and a 🌶 Spicy badge.
  - `name` (string) and `price` (number) are required.
  - `currency` (string) is optional and defaults to `"ETB"`.
  - `spicy` (boolean) is optional and defaults to `false`.
  - The badge is rendered with `Boolean(spicy) && …`, so a numeric `0` from the data can never show up as a stray "0" on the page.
- **`Card`** is a generic bordered frame. It renders whatever it is given as `children`, so it knows nothing about dishes and can wrap any content.
- **`Menu`** shows one category. It receives the full `dishes` array and a `category`, and works out the visible list at render time with `filter`, instead of keeping a second, pre-filtered copy that could get out of sync. If nothing matches, it renders `No <category> dishes yet.` instead. Each dish is wrapped in a `Card`, and the key (`dish.id`) sits on the `Card` because that's the outermost element returned by `map`.

`App` renders a `Menu` for each of the four categories. Dessert has no dishes, so it shows the empty state.

## Data

`src/data.js` exports `menu`, an array of dishes with `id`, `name`, `price`, `category` and `spicy` (optional). `id` is used as the list key.

## Notes

- **PropTypes do nothing in React 19.** The course material says PropTypes print console warnings for wrong props. React 19 removed that check, so `propTypes` are now ignored without any warning. I tested this: `<Dish price="raw" />`, `price="350"`, and a missing `price` all rendered with no warning. The `propTypes` objects are kept to meet the exercise and to document each component's props.
- **JSDoc type checking instead.** Each component has a JSDoc comment describing its props, and `jsconfig.json` turns on type checking (`checkJs`) so that VS Code checks every place a component is used, as you type. This caught real mistakes during the day:
  - `spicy: 0` in the data, which broke the boolean contract
  - a `"Desert"` typo in a category, which the `"Main" | "Starter" | "Bread" | "Dessert"` union rejected
  - `Proptypes`/`childrend` typos that React 19 would have ignored silently

  `strict` is off and `vite/client` types are included, to keep the checks to what matters for a plain-JS project.
- **Keys are ids, not indexes.** With `key={index}`, deleting the first dish made a note typed under Shiro jump to Tibs, because React matches list items by key, and the index keys moved to different dishes. With `key={dish.id}`, the note stayed with Shiro.
