# PROFILE — one measured re-render, fixed and measured again

## How it was measured

[src/dev/Probe.jsx](src/dev/Probe.jsx) wraps regions in React's `<Profiler>`:
`Menu`, `CartPanel`, `CartBadge`, and every dish card. Each commit's
`actualDuration` goes into `window.__profile`. That is the same number the
DevTools Profiler flamegraph shows, but read by a script, so the measurement
can be repeated. In a production build `<Profiler>` is a no-op, so the probes
cost nothing there.

The script ran in headless Chromium against `npm run dev`, with the **CPU
throttled 4×** through the DevTools protocol to stand in for a mid-range
phone. It did each interaction 10 times and averaged.

Caveats, stated rather than hidden:

- **This is a development build.** `<StrictMode>` renders everything twice, and
  `useRenderCount` from Day 32 `console.log`s on every render. Absolute
  milliseconds are inflated. Compare the rows with each other.
- `actualDuration` for `Menu` **includes its children**, so the Menu row
  contains the dish-card row.

## 1. The session the brief asks for: adding dishes

Three dishes added, five times over (15 adds):

| Region | Renders per add | ms per add |
| --- | --- | --- |
| Menu (contains the clicked card) | 1 | 4.03 |
| **Dish card: only the one clicked** | 1 | **3.97** |
| CartPanel | 1 | 3.67 |
| CartBadge | 1 | 3.10 |

**Slowest component: the clicked dish card**, at about 4 ms, with the cart
panel close behind. Every row here is a *correct* render. The card's quantity
changed, the panel's lines changed, and the badge's count changed. Only **1**
card renders per add, not 13. Day 32's narrow selectors already removed the
unnecessary renders on this interaction, and nothing here needs fixing.

## 2. The unnecessary re-render: typing in the search box

Typing `tibs` one letter at a time, 10 times over (40 keystrokes). Recorded
with and without the fix, twice each, alternating, against the same server:

| | Menu, ms per keystroke | Dish cards, ms per keystroke |
| --- | --- | --- |
| Before, round 1 | 14.80 | 8.30 |
| Before, round 2 | 14.82 | 8.30 |
| **After, round 1** | **6.30** | **0.02** |
| **After, round 2** | **6.04** | **0.02** |

**About 2.4× faster per keystroke for the menu region. The cards' share fell
from 8.3 ms to effectively zero.**

### Why it rendered

`search` is state in `Menu`. Each keystroke re-renders Menu, which re-renders
`DishList`, which re-renders every card still on screen, about 2.3 per
keystroke over the course of "tibs". Each of those cards received **the same
`dish` object** it had last time, straight from the fetched array. Nothing it
displays had changed. The cause is the table row *"its parent re-rendered"*.

### Why memo, not moving state down

The brief says to move state down if you can and memo if you must. Moving it
down was the first thing tried, on paper:

- Into `SearchBar`? No. `DishList` needs the term to filter, so the state
  cannot live below the list's parent.
- Into a new `SearchableDishList` that owns `search` and renders both?
  Possible. It would spare `CategoryBar` and the footer, which are the cheap
  part. The cards would still be children of the component whose state
  changed, so they would still re-render. The 8.3 ms is in the cards.

So the state is already as low as it can usefully go, and this is the case
where memo is the right tool.

### The fix

```js
export default memo(Dish);
```

One line in [Dish.jsx](src/components/Dish.jsx). It works only because the one
prop, `dish`, is referentially stable. Passing an inline object or an arrow
function would make memo compare unequal on every render and do nothing.
`useCallback` is not needed: the card's handlers are created inside the card,
so they are not props.

The Profiler still fires for each card after the fix, because its `<Profiler>`
wrapper is a child of `DishList`. That is why the "renders" count did not drop.
Each one now commits in about **0.02 ms**, which is memo bailing out before the
card's body runs.

### What did not change

Adding a dish costs the same before and after (4.0 → 5.0 ms in one run and
back down in the next, which is noise at this resolution). memo does not
change the clicked card's render: its quantity selector changed, and that is a
real update.

## Re-run it

```bash
npm run dev    # then, with playwright-core and Chromium available:
# record window.__profile around the interaction; see Probe.jsx
```

Or by hand: React DevTools → Profiler → record, type `tibs` in the search box,
stop. Before the fix, every visible dish card shows a bar per keystroke, and
"Why did this render?" says *"The parent component rendered."* After the fix
they are grey: *did not render*.
