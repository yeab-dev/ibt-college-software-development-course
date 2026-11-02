# Keyboard, touch and the double tap: Addis Eats, checked by hand and by script

Day 48. The reading sheet's first half asks four things of the interface:
no clickable divs, a focus ring you can see everywhere, every function
reachable with Tab, Enter and Escape, one order per impatient tap, and
targets a thumb can hit with nothing hidden behind hover. This file is the
audit: what was looked for, how, what was wrong, what changed, and the
numbers afterwards.

Every result below comes from the production build (`npm run build && npm
run start`) driven by headless Chromium, one browser at a time, with the
scripts kept outside the repository. "Tab stop" means an element that
`document.activeElement` became after a real Tab key press, not an element
that merely looks focusable.

## 1 · Clickable divs, and a button doing a link's job

**How it was looked for.** Every event handler in the app:

```bash
grep -rn "onClick\|onKeyDown\|onPointer\|onMouse\|tabIndex\|role=" app components
```

**What it found.** No clickable `div`, `span` or `li` at all — the menu was
built from buttons and links on Day 33 and stayed that way. Every `onClick`
is on a `<button>` (Add, Remove one, Clear, the category buttons, the error
pages' *Try again*, *Simulate a broken kitchen*) or an `<a href>` (the menu's
result pager, which only adds an `onClick` to stay on the page for a plain
click and leaves Ctrl-, Cmd- and middle-clicks to the href). The only
`tabIndex` values are `0` on the scrolling table region (so a keyboard can
scroll it) and `-1` on the checkout's error message (so focus can be sent
there).

**The one fix.** The cart's **Checkout** was a `<button onClick={() =>
router.push("/checkout")}>`. That is the reverse of a clickable div — a real
control, but the wrong one: it navigates, so a screen reader announced
"button" for something that goes somewhere, a middle click did nothing, and
the browser showed no address on hover. It is a `<Link className="cta"
href="/checkout">` now ([app/cart/CartContents.jsx](app/cart/CartContents.jsx)),
and `useRouter` left the file. `router.push` is for when *code* decides to
navigate; a person choosing to go somewhere gets a link.

## 2 · Visible focus, everywhere

**Before.** Since Day 33 each control listed its own `:focus-visible` rule
(the category buttons, the tabs, the form fields, the pager…). Anything not
on a list fell back to Chromium's default, a thin 1 px `auto` ring in near
black: the brand link, the basket badge, every dish name, every home-page
special, the photo credits, *Simulate a broken kitchen*, the CSV links, and
both charts. On the desktop audit that was **75 of 188 tab stops**. Nothing
had `outline: none` — the ring was weak, not missing.

**The fix.** One rule at the end of [app/globals.css](app/globals.css):

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

`:focus-visible`, not `:focus`: the browser shows it when focus arrives by
keyboard and not after a click or a tap, which is what the old per-control
rules did too. The accent follows the theme (`#aa3bff` light, `#c084fc`
dark), so the ring is never invisible against the background.

**After.** Every tab stop on 13 pages at two widths — **476 tab stops**,
including the Leaflet map, its zoom buttons and pins, and the Recharts
charts — shows `solid 2px` in the accent colour, and `:focus-visible`
matched on every one.

**The one `outline: none`.** `#content:focus`, the place the skip link
lands. It is a region with `tabIndex={-1}`, not a control: a ring around
the whole page would say "you can press this". The next Tab goes to the
first control inside, which shows the ring as usual.

## 3 · Tab, Enter and Escape

### The whole order, without a mouse

One script, a fresh browser with no cookies at all, keys only (Tab,
Shift+Tab, Enter, Escape, the arrow keys, and the characters typed into the
fields). The focus and the ring were read from `document.activeElement` at
every step.

| Step | Keys | What happened |
| --- | --- | --- |
| `/menu` | — | Focus starts in the search box (Day 33's autofocus) |
| Search | type `tibs`, Escape | 1 dish shown; Escape emptied the box (a native `type="search"` behaviour) and all 13 came back |
| Add | Tab ×n to the first *Add*, Enter, Enter | Badge: *2 items*. Button 66 × 48, ring 2 px accent |
| To the basket | Shift+Tab to the badge, Enter | `/cart` |
| Cart | Tab to *Remove one* (44 × 44), on to *Checkout* (now a link), Enter | Signed out, so the proxy sent it to `/login?next=%2Fcheckout` |
| Sign in | Tab to the phone, type; Tab to the password, type; **Enter in the field** | The form's `onSubmit`/`action` ran — no button was touched — and landed on `/checkout` |
| Checkout | Tab through name (typed), TeleBirr number (prefilled), area (ArrowDown changed it), notes (typed), to *Order* | |
| Place it | Enter, then Enter again 150 ms later | The button was `disabled` and read *Sending your order — ETB 480…*; one order added (445 → 446); the receipt `/orders/1446` |
| Skip link | reload, Tab | *Skip to content* appeared at (16, 8), 148 × 44, ringed; Enter put focus on `#content`; the next Tab went to the first control in the page |
| The map | Tab to the map, ArrowRight ×2 | The map panned |
| | Tab to *zoom in*, Enter | The view zoomed |
| | Tab to a pin | Its tooltip opened on focus (*Around here, in Kazanchis*) |
| | Tab, Tab… | Out of the map (attribution links, then the page's own links): **no trap** |
| Back to the list | Tab to *All your orders*, Enter; Tab to `#1446`, Enter | The new order's receipt again |

Console errors during the run: none.

### Escape, and why there is so little of it

The sheet's rule is "Escape closes anything modal, and focus returns". Addis
Eats has **no modal, menu, drawer or dialog** — every screen is a page, and
the menus are always-visible lists of buttons and links. So there was
nothing to close, and no focus to return. What Escape does do:

| Where | Escape | Checked |
| --- | --- | --- |
| The menu's search box | Clears it (the browser's own `type="search"` behaviour) | Yes, above |
| A chart's keyboard tooltip (Recharts 3) | Hides it | Tab to the revenue chart, ArrowRight showed *Megenagna · ETB 34,250*, ArrowRight *Kazanchis*, Escape hid it; Tab moved on to the next chart |
| A map pin's tooltip (Leaflet) | Nothing — it closes when focus leaves the pin | Leaflet's `closeOnEscapeKey` is for popups, which this map has none of. The tooltip is a few words *under* the pin, covers nothing you need, and repeats the facts beside the map |

If a dialog is ever added, the rule is the native `<dialog>` element with
`showModal()`: it traps focus, closes on Escape, and returns focus to what
opened it, all without code.

### The skip link

The header is seven tab stops (brand, basket, five tabs) before any page's
content, on every page. [app/layout.js](app/layout.js) now starts with
`<a className="skip-link" href="#content">Skip to content</a>`, off screen
until focused; the page wrapper is `id="content" tabIndex={-1}`. A plain
`<a>`, not a `<Link>`: it goes to a place on this page, which the browser
does itself.

On `/menu` the first Tab after loading does not reach it, because focus is
already in the search box. That is Day 33's choice (searching is what people
come to the menu to do), kept; Shift+Tab goes back up through the categories
and the header.

### The map and the charts are not traps

- **Leaflet** makes the map container focusable (arrow keys pan, `+`/`-`
  zoom) and each marker focusable; Tab moves through them and out. Day 48
  raised the pins' boxes to 44 px tall (the pill you see is still 28 px, at
  the bottom of the box, so the pin's point has not moved) and the zoom
  buttons to 44 × 44.
- **Recharts 3** turns on its `accessibilityLayer` by default: each chart's
  SVG is one tab stop, the arrow keys move between data points with the
  tooltip, and Tab leaves. The revenue values are also printed on the bars,
  and the line has *as a table* underneath (a `<details>` that opens with
  Enter — checked).

## 4 · One order per tap

The sheet's table calls the double submit "the expensive one" and gives two
fixes: disable the button while the action is pending, *and* make the write
idempotent on the server. Both are here, because each covers a case the
other cannot.

### In the browser: disabled while pending

| Form | How it knows it is pending | Since |
| --- | --- | --- |
| Checkout (*Order — ETB 480*) | `useActionState` → `pending`; `handleSubmit` also stops a submit while `pending` | Day 39 |
| Sign in, sign up | `useActionState` → `pending` | Day 42 |
| Cancel this order (receipt) | `useActionState` → `pending` | Day 39 |
| **Refuse #… (kitchen)**, **Sign out** (checkout, `/login`) | **`useFormStatus()` in [components/SubmitButton.jsx](components/SubmitButton.jsx)** | **Day 48** |

The last row was the gap. Those forms are rendered by server components —
they need no state of their own — so there was no hook to give them a
`pending`. `useFormStatus` reads the status of the `<form>` it is rendered
*inside*, which is why it has to live in a small client component placed in
the form (the Next.js forms guide's own `SubmitButton`). Checked: tapping
*Refuse #1453* on the kitchen board at 390 px, a `MutationObserver` saw the
button `disabled` with the text *Refusing #1453…* before the board
re-rendered without it.

Every one of these forms is submitted through the form (`action`, and
`onSubmit` on the checkout), never an `onClick` on the button — so Enter in
a field works, as the keyboard run showed.

### On the server: an idempotency key

A disabled button only protects the requests that page's JavaScript sends.
With JavaScript off (or not loaded yet, on a slow phone) the browser posts
the form itself, and a second tap posts it again; an API client retrying
after a timeout is the same. So:

1. [app/checkout/page.js](app/checkout/page.js) renders a fresh
   `randomUUID()` into a hidden `idempotencyKey` field each time the
   checkout is rendered. Every copy of that form's request carries the same
   key.
2. `placeOrder` passes it to `createOrder` ([lib/orders.js](lib/orders.js)),
   which looks for an order *of this person's* with that key — first
   straight away (a repeat that arrives after the first has finished, when
   the basket may already be empty), and again **inside the write queue**.
   The second look is the one that holds under a double tap: both requests
   pass the first look before either has written, but writes run one after
   another, so the second reads the file the first just saved, finds its
   order and writes nothing. It answers `replayed: true`, and the action
   redirects to the same receipt.
3. `POST /api/orders` takes the same key in an `Idempotency-Key` header and
   answers a repeat with `200` and `Idempotent-Replayed: true` instead of
   `201`.

A form whose key was used and then failed (validation, `?fail=1`) wrote
nothing, so trying again with the same key is a new attempt, as it should
be. AUTH.md has why the key is not a security risk (it is looked up per
person, and never sent back).

### Tested

Signed in as Bereket, a basket of three dishes, the counts read from
`.data/orders.json` before and after:

| Case | POSTs to `/checkout` | Orders added |
| --- | --- | --- |
| JavaScript on, two real taps 150 ms apart | 1 (the second tap hit a disabled button) | **1** |
| JavaScript on, `dblclick` | 1 | **1** |
| JavaScript on, `form.requestSubmit()` twice in one tick | 1 | **1** |
| JavaScript off, two taps 150 ms apart | **2** | **1** — the key |
| JavaScript off, `dblclick` | 1 (Chromium replaced the first navigation before it was sent) | 1 |
| *Control:* JavaScript off, two taps, the hidden key **removed** | 2 | **2** — what the server did before today |

The control row is the reason for the server half: with JavaScript off the
button cannot be disabled, two requests arrive, and only the key turns them
into one order.

The API, with `curl`:

| Request | Answer |
| --- | --- |
| Two concurrent `POST /api/orders`, the same `Idempotency-Key` | `201 Created` and `200 OK` + `Idempotent-Replayed: true`; both bodies order `#1440`; one order added; no `idempotencyKey` in either body |
| The same key again, later | `200` |
| Two concurrent POSTs with no key | `201`, `201`; two orders (unchanged behaviour) |
| Almaz sending the key Bereket just used | `201`, a new order of her own — keys are per person |

**The limit, honestly.** The write queue is one Node.js process's memory and
the orders are one file, so "inside the queue" means "on this server". Two
servers (or two serverless instances) would each have their own queue. A
database makes this a unique index on `(userId, idempotencyKey)`, and the
insert that loses the race fails instead of duplicating — the same idea,
enforced by the store (Module 4).

## 5 · Targets a thumb can hit, and nothing behind hover

### How it was measured

On every page, as the right person (13 pages: signed out, Almaz, Selam), at
1200 px and at 390 px (a phone, with touch), every visible `a[href]`,
`button`, `input`, `select`, `textarea`, `summary` and focusable element's
`getBoundingClientRect()`, listing any under 44 px in either direction.

### What was under 44 px, and what it is now

| Element | Before | Fix | After |
| --- | --- | --- | --- |
| Cart *Remove one* (−) | 26 × 26 | `width`/`height: 44px` | 44 × 44 |
| *Sign out*, *Refuse #…*, *Cancel this order* (`.tabs__signout`) | 77 × 40 | `min-height: 44px` | × 44 |
| Main tabs, category buttons — **below 1024 px only** | × 41 (the root font drops to 16 px there, on exactly the screens that are touched) | `min-height: 44px` | × 44 at every width |
| Result and table pager (*1*, *2*, *Next →*) | 36 × 40 | `min-width`/`min-height: 44px` | 44 × 44 |
| Table sort headers | × 28 | `min-height: 44px`, negative margin so the header row does not grow | × 44 |
| *Orders per day as a table* (`summary`) | × 26 | `padding-block: 12px` | × 46 |
| *Simulate a broken kitchen* | 171 × 26 | `min-height: 44px` | × 44 |
| Dish names on the menu cards | e.g. *Tej* 29 × 25 | `.tap` (below), negative margin so the card does not grow | 44 × 44 at least |
| Order numbers in the tables (`#1416`) | 45 × 20 | `.tap`, negative margin so the row is 44, not 60 | 45 × 44 |
| Home-page specials, *← Menu*, *All your orders*, receipt and cart line items, the staff link rows, the CSV links | × 17–25 | `.tap` / `min-height: 44px` | × 44 |
| Leaflet zoom buttons | 30 × 30 (even in Leaflet's touch mode) | 44 × 44, outranking Leaflet's rule | 44 × 45 |
| Map pins (they are focusable and tappable) | 48/76 × 28 | the icon box 44 tall, the visible pill unchanged at its bottom | 48/76 × 44 |

`.tap` is one small utility in [app/globals.css](app/globals.css)
(`inline-flex`, `min-height` and `min-width` 44 px) put on links that stand
on their own. It is a class rather than a rule on every `a` because of the
exception below.

### What is still under 44 px, on purpose

| Element | Size | Why it may be |
| --- | --- | --- |
| *Create an account* (`/login`), *Sign in* (`/signup`) | × 22–24 | Inside a sentence ("New here? Create an account.") |
| The photo credits (*Photo: Artem.G, CC BY-SA 4.0, via Wikimedia Commons*) | × 17 | Inside a line of caption text |
| Leaflet's attribution (*Leaflet*, *OpenStreetMap*) | × 14–15 | Inside the attribution line, which the tile licence requires and Leaflet draws |

WCAG 2.2 exempts a target "in a sentence or its size is otherwise
constrained by the line-height of non-target text", in both 2.5.8 (AA, 24 px)
and 2.5.5 (AAA, 44 px). Making those links 44 px tall would spread the
sentence they are in over three lines. Nothing else on any page, at either
width, is under 44 × 44.

### Nothing hidden behind hover

Every `:hover` rule in the stylesheet changes a colour or a border on
something already visible; none shows, reveals or enables
anything. The two things that do appear on hover both have the same
information elsewhere, visible without a pointer:

- **The charts' tooltips**: every revenue bar carries its value as a label,
  the orders-per-day line has *Orders per day as a table* under it, and the
  tooltip also follows the keyboard (above).
- **The map pins' tooltips**: the pins carry a word (*Courier*, *You*), the
  tooltip also opens on focus, and the facts beside the map say the same in
  full.

No handler uses `onMouseEnter`/`onMouseOver`, so there is nothing a touch
screen cannot trigger. Phone check at 390 px: no page scrolls sideways
(`scrollWidth` 390 on `/`, `/menu`, a dish, `/cart`, `/login`, `/kitchen`,
`/dashboard`, `/orders` and a live receipt).

## Where the material and the installed docs disagree

| The course says | The docs / the platform | What was done |
| --- | --- | --- |
| "`onPointerDown` fires for mouse, touch and stylus alike, so use it for anything you would otherwise write twice" | True of pointer *movement and pressing*, and MDN's pointer-events page is about that. But a `pointerdown` is not an *activation*: it fires before the person has decided (a scroll that starts on a button fires it), and **a keyboard never fires it**. `click` already fires for mouse, touch, pen and for Enter/Space on a button (react.dev, "Responding to events"; the HTML spec's activation behaviour) | Every action stays on `onClick` or a form's `action`. Nothing in the app needed pointer events |
| `<input type="tel" inputMode="numeric">` for the TeleBirr number | MDN: `inputmode="numeric"` gives digits only; `inputmode="tel"` gives digits plus `+ * #`. The form accepts `+2519…`, which `numeric` cannot type on many phone keyboards | `type="tel" inputMode="tel"`, as since Day 33 |
| "Targets at least 44 by 44 pixels" | WCAG 2.2 has two numbers: 44 px is 2.5.5 Target Size (Enhanced), level AAA; the AA requirement is 2.5.8, 24 px, or smaller with spacing. Both exempt links in a sentence | 44 px everywhere it can be, the in-sentence links exempt (above) |
| "Escape closes anything modal, focus moves into a dialog and returns" | Agrees; the platform does all three for a native `<dialog>` opened with `showModal()` (MDN) | No modal exists to apply it to (§3) |
| `<button disabled={pending}>` is "the" fix for a double submit | The forms guide's pattern too, and it works — when JavaScript is running. With it off, the browser posts twice (measured above) | Disabled button **and** a server-side idempotency key, as the slide's own note asks |
| React attaches "one listener at the root" | Since React 17 that root is the container React renders into, not `document` (React 17 release notes). Next.js hydrates the whole document, so here the two are the same and the point stands | — |
| "Pooling is gone; `event.persist()` no longer applies" | Agrees (React 17+). `persist()` still exists and does nothing | — |
