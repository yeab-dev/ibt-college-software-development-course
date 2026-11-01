# Addis Eats — Day 33: forms & controlled components

The Day 32 application with a real checkout: four controlled fields in one
state object, rules in a pure function, errors that wait until a field has been
left, accessible messaging, a submit that cannot fire twice, and a failure path
that never throws the order away.

## Run it

```bash
npm install
npm run dev
npm run check:validate   # the rules, from plain Node
npm run check:store      # Day 32's store checks, still passing
```

Sign in with any `09…` number, add a few dishes, open **Checkout**.

| Try | What happens |
| --- | --- |
| Tab through the form without typing | Each field complains only after you leave it |
| Fix a field that is showing an error | The message disappears on the keystroke that fixes it |
| Press Enter in the name field | The form submits — or focus jumps to the first bad field |
| Phone `0900 000 000` | The *server* rejects it (422) and the message lands under the phone |
| Open `/checkout?fail=1` and order | The kitchen answers 503: reason shown, every value kept |
| Press Order twice fast | One POST. The button says *Sending your order — 480 ETB…* |

## The six steps, and where each one landed

| Step | Where it is |
| --- | --- |
| 1. Name, TeleBirr phone, area, optional notes | [Checkout.jsx](src/checkout/Checkout.jsx) — one `form` object, one `handleChange` |
| 2. `validate(form)` as a pure function, derived on render | [validate.js](src/checkout/validate.js), called as `const errors = validate(form)` |
| 3. Touched on blur, errors only once touched | `touched` + `shownError()` in Checkout |
| 4. Labels, `aria-invalid`, `aria-describedby`, `role="alert"` | [Field.jsx](src/checkout/Field.jsx) |
| 5. Submitting flag, disabled button, ETB total in its label | `submitting` + `inFlight` ref in Checkout |
| 6. Failed request: say why, keep values, focus first bad field | `catch` in `handleSubmit`, [api/orders.js](src/api/orders.js), [mock/ordersApi.js](mock/ordersApi.js) |

## Each rule, and why it exists

| Field | Rule | Message | Why |
| --- | --- | --- | --- |
| name | not empty after trimming | *We need a name for the delivery* | The rider asks for someone at the gate. Spaces alone are not a name. |
| phone | required | *Enter the TeleBirr number that will pay* | Payment is a TeleBirr request to this number. No number, no payment. |
| phone | `^(?:\+251\|0)9\d{8}$` after stripping spaces and dashes | *Use 09… or +2519… — a TeleBirr number has 10 digits* | Accepts both ways Ethiopians write a mobile number. We strip formatting ourselves rather than reject `0911 234 567` for spacing. |
| phone | registered with TeleBirr (**server only**) | *That number is not registered with TeleBirr* | Only the server can know this. It comes back as a 422 and is shown beside the field like any other error. |
| area | one of Bole, Kazanchis, Megenagna, Piassa | *Choose a delivery area* | These are where riders go. The `<select>` cannot produce anything else, but a forged request can — so the rule stays. |
| notes | optional, at most 200 characters | *Keep notes to 200 characters — you have 213* | A note the rider can read at a glance. The message says how far over you are, and a live counter shows it before you get there. |

Every message says what to do, not just that something failed.

The server ([mock/ordersApi.js](mock/ordersApi.js)) imports **the same
`validate.js`** and runs it again. Client validation is a courtesy; the server
check is the real rule, because anything from a browser can be forged. The
server also ignores any prices sent to it and totals the order from the menu.

## Decisions worth explaining

**Errors are derived, never stored.** `validate(form)` runs on every render, so
the messages cannot disagree with the values. Only *which fields have been
visited* is state.

**After first blur, then live.** `touched[field]` turns on when you leave a
field and stays on, so from then on the message tracks every keystroke and
clears the moment it is right. An empty field on first render is invalid, but
nobody has done anything wrong yet, so it stays quiet.

**Submitting with errors reveals all of them.** Pressing Order marks every
field touched and moves focus to the first problem, in top-to-bottom order
(`FIELDS`), not whatever order the keys came out of an object.

**Disabled only while sending.** The brief's slide shows
`disabled={submitting || hasErrors}`, and its own note warns that a disabled
button with no visible reason looks broken. With untouched fields there *is*
no visible reason, and a disabled button cannot be pressed to find out. So the
button is disabled only while the order is in flight. That is the one time the
label itself explains why.

**A ref guards, state shows.** `if (submitting) return` reads a snapshot. Two
submits in the same tick both see `false`, because neither has re-rendered.
`inFlight.current` changes the instant it is written. The browser test fires
`requestSubmit()` twice in one tick and gets exactly one POST.

**Server errors clear when their field is edited.** The server judged the old
value; once you change it, that verdict is stale. Client errors take precedence
because they are current.

**Failure keeps everything.** `form` is never reset in the `catch`. `flushSync`
renders the messages before focus moves, so the focused field already carries
its `aria-describedby` and a screen reader reads the reason with it. With no
single field to blame (503, network), focus goes to the failure message
instead.

**Never colour alone.** Each error is words under its field, a ⚠ mark, and a
thick left border, so it is still distinguishable in greyscale.

**`noValidate` on the form.** The browser's own bubbles would fire before
ours, in wording we did not choose, at a time we did not pick.

## The six form states

| State | What the person sees |
| --- | --- |
| pristine | Four fields, no messages |
| dirty | Exactly what they typed |
| invalid | A message under each visited field that is wrong |
| submitting | Button disabled, *Sending your order — 480 ETB…* |
| failed | The reason at the top, field errors in place, every value still there |
| succeeded | `navigate("/orders/1001", { replace: true })`. Back skips the form |

The receipt fetches the order by id, so refreshing `/orders/1001` still works
until the dev server restarts. Orders are kept in memory.

## Verified

Driven in headless Chromium against the dev server: pristine form shows no
alerts. Blur on name shows its error with `aria-invalid` and
`aria-describedby="name-error"`, while the untouched phone stays quiet. Fixing
the name clears it live. Enter with an empty phone focuses the phone and sends
nothing. `0900 000 000` returns the server's message under the phone. `?fail=1`
shows the 503 reason, focuses it, and keeps name, phone and notes. Two
same-tick submits send one POST and land on the receipt.

## Files

| File | Job |
| --- | --- |
| [src/checkout/Checkout.jsx](src/checkout/Checkout.jsx) | The form, its state, submission and feedback |
| [src/checkout/validate.js](src/checkout/validate.js) | The pure rules, shared with the mock server |
| [src/checkout/validate.check.mjs](src/checkout/validate.check.mjs) | Node assertions for every rule |
| [src/checkout/Field.jsx](src/checkout/Field.jsx) | Label, control, hint and message with the aria wiring |
| [src/api/orders.js](src/api/orders.js) | `placeOrder`, turning 422 / 5xx / network failure into one `OrderError` |
| [mock/ordersApi.js](mock/ordersApi.js) | `POST /api/orders` and `GET /api/orders/:id` inside Vite |
| [src/pages/Receipt.jsx](src/pages/Receipt.jsx) | The succeeded state |

## Homework: React Hook Form

Not done here. The same form with `useForm` and a zod resolver is the
comparison exercise; `validate.js` would become the schema.
