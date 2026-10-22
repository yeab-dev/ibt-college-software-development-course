"use client";

// Day 33's checkout, moved beside app/checkout/page.js. The form logic — one
// state object, derived errors, touched-on-blur, the in-flight ref, the
// failure path — is untouched. What changed is everything around it:
//
//   - "use client": a form with state and handlers lives in the browser.
//   - ?fail=1 is read with useSearchParams() again, as on Day 33 (Day 36 had
//     the page read it; Day 37 keeps the page down to the one request read
//     that makes it dynamic, the cookie).
//   - Day 37: a returning customer arrives as a prop, read by the page from
//     a cookie, and pre-fills the name and area. A successful order writes
//     that cookie.
//   - No sign-in. Day 31's /login and RequireAuth are not among this
//     exercise's five routes, so the "Signed in as…" line is gone.
//   - No /orders/:id. Success used to navigate to a receipt route; that route
//     is not in the brief either, so the receipt renders right here instead.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PropTypes from "prop-types";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  selectClear,
  selectItems,
  selectTotal,
  useCartStore,
} from "@/cart/cartStore";
import { customerCookieString } from "./customerCookie";
import Field from "./Field";
import { OrderError, placeOrder } from "./placeOrder";
import { AREAS, FIELDS, NOTES_MAX, validate } from "./validate";

const EMPTY = { name: "", phone: "", area: "Bole", notes: "" };
const ALL_TOUCHED = Object.fromEntries(FIELDS.map((f) => [f, true]));

function Checkout({ returningCustomer }) {
  const simulateFailure = useSearchParams().get("fail") === "1";
  const items = useCartStore(selectItems);
  const total = useCartStore(selectTotal);
  const clear = useCartStore(selectClear);

  // The succeeded state. On Vite this was a separate /orders/:id screen.
  const [order, setOrder] = useState(null);

  // Step 1. Every field in one object, one handler for all of them.
  // The server read the cookie and rendered these values into the HTML, so
  // the browser's first render starts from the same ones — no mismatch.
  const [form, setForm] = useState(() =>
    returningCustomer ? { ...EMPTY, ...returningCustomer } : EMPTY,
  );

  // Step 3. Which fields the person has actually left.
  const [touched, setTouched] = useState({});

  // Step 5. The flag the UI reads...
  const [submitting, setSubmitting] = useState(false);
  // ...and the guard the handler reads. State is a snapshot: two presses in the
  // same tick both see `submitting === false`, because neither has re-rendered
  // yet. A ref changes the moment you write it, so the second press stops here.
  const inFlight = useRef(false);

  // Step 6. What the server said, kept apart from what validate() says.
  const [serverErrors, setServerErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const failureRef = useRef(null);

  // Step 2. Derived, never stored. validate() runs on every render, so the
  // errors can never disagree with the values.
  const errors = validate(form);

  // A field speaks up once it has been left — and from then on it is live, so
  // the message disappears the moment the person fixes it. A server error
  // shows until that field is edited.
  function shownError(field) {
    return (touched[field] && errors[field]) || serverErrors[field];
  }

  function handleChange(event) {
    const { name, value } = event.target;
    // The updater form reads the latest state, not the value from this render.
    setForm((f) => ({ ...f, [name]: value }));
    // The server judged the old value. Once it is edited, that verdict is stale.
    setServerErrors((s) => {
      if (!(name in s)) return s;
      const rest = { ...s };
      delete rest[name];
      return rest;
    });
  }

  function handleBlur(event) {
    const { name } = event.target;
    setTouched((t) => (t[name] ? t : { ...t, [name]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault(); // no page reload
    if (inFlight.current) return; // no double order

    setFailure(null);

    // Nothing leaves the browser while the form knows it is wrong. Reveal every
    // message at once and put the person where the first problem is.
    const firstBad = FIELDS.find((f) => errors[f]);
    if (firstBad) {
      setTouched(ALL_TOUCHED);
      document.getElementById(firstBad)?.focus();
      return;
    }

    inFlight.current = true;
    setSubmitting(true);

    try {
      const placed = await placeOrder(form, items, { fail: simulateFailure });
      // The receipt replaces the form, then the basket empties. Nothing is
      // left on screen that could place the same order twice.
      setOrder(placed);
      clear();
      // Remember the name and area for next time. The server reads this on
      // the next visit to /checkout — the reason that route is dynamic.
      document.cookie = customerCookieString(placed);
    } catch (err) {
      const fieldErrors = err instanceof OrderError ? err.fieldErrors : {};

      // Render the messages *now*, so the field we focus already carries its
      // aria-describedby and the screen reader reads the reason with it.
      flushSync(() => {
        setServerErrors(fieldErrors);
        setFailure(err.message);
        setSubmitting(false);
      });

      // Never clear on failure. `form` is untouched — every value is still
      // in the inputs. Only focus moves.
      const firstServerBad = FIELDS.find((f) => fieldErrors[f]);
      if (firstServerBad) {
        document.getElementById(firstServerBad)?.focus();
      } else {
        failureRef.current?.focus();
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  // Checked before the empty basket: clear() has just emptied it, and the
  // person should see their receipt, not "nothing to check out".
  if (order) {
    return (
      <main className="prose">
        <h2>Order {order.id} is in the kitchen</h2>
        <p>
          {order.total} ETB will be requested from TeleBirr {order.phone}. On its
          way to {order.name} in {order.area}.
        </p>

        <ul className="checkout__lines">
          {order.lines.map((line) => (
            <li key={line.id} className="checkout__line checkout__line--summary">
              <span className="checkout__name">
                {line.quantity} × {line.name}
              </span>
              <span className="checkout__amount">
                {line.price * line.quantity} ETB
              </span>
            </li>
          ))}
        </ul>

        {order.notes && <p>Note for the rider: &ldquo;{order.notes}&rdquo;</p>}

        <p>
          <Link className="cta" href="/menu" replace>
            Order something else
          </Link>
        </p>
      </main>
    );
  }

  // Rendered by the server from the cookie, so it is in the HTML of the very
  // first response — even before the basket has been read from localStorage.
  const welcome = returningCustomer && (
    <p className="checkout__welcome">
      Welcome back, {returningCustomer.name}. Delivery to{" "}
      {returningCustomer.area} is filled in for you &mdash; change it below if
      you need to.
    </p>
  );

  if (items.length === 0) {
    return (
      <main className="prose">
        <h2>Checkout</h2>
        {welcome}
        <p>There is nothing to check out.</p>
        <p>
          <Link className="cta" href="/menu">
            Go to the menu
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="prose">
      <h2>Checkout</h2>

      {welcome}

      <ul className="checkout__lines">
        {items.map((item) => (
          <li key={item.id} className="checkout__line checkout__line--summary">
            <span className="checkout__name">
              {item.quantity} × {item.name}
            </span>
            <span className="checkout__amount">
              {item.price * item.quantity} ETB
            </span>
          </li>
        ))}
      </ul>

      {simulateFailure && (
        <p className="state">
          <strong>?fail=1 is on</strong> — the kitchen will refuse this order.{" "}
          <Link href="/checkout">Turn it off</Link>
        </p>
      )}

      {/* onSubmit on the form, not onClick on the button: Enter works in every
          field, and the browser and screen readers treat it as a real form.
          noValidate — the browser's own bubbles would fire before ours, in
          words we did not choose and at a time we did not pick. */}
      <form className="form checkout-form" onSubmit={handleSubmit} noValidate>
        {/* Why the last attempt failed. Always mounted so it is a live region
            that already exists when the message arrives; tabIndex -1 so focus
            can be sent here when no single field is to blame. */}
        <div
          ref={failureRef}
          tabIndex={-1}
          role="alert"
          className={failure ? "form__failure" : undefined}
        >
          {failure && (
            <p>
              <span aria-hidden="true">⚠</span> {failure}
            </p>
          )}
        </div>

        <Field
          name="name"
          label="Name for the delivery"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shownError("name")}
        />

        <Field
          name="phone"
          label="TeleBirr number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          hint="09… or +2519… — spaces are fine. This number pays."
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shownError("phone")}
        />

        {/* value on the select, not `selected` on an option. */}
        <Field
          as="select"
          name="area"
          label="Delivery area"
          value={form.area}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shownError("area")}
        >
          {AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </Field>

        {/* A textarea takes value, not children. In JSX the text between the
            tags is ignored and the field would never update. */}
        <Field
          as="textarea"
          name="notes"
          label="Notes for the rider (optional)"
          rows={3}
          hint={`${form.notes.length} / ${NOTES_MAX} characters`}
          value={form.notes}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shownError("notes")}
        />

        {/* Disabled only while sending — the one time the person can see why.
            A button disabled for invalid fields they have not visited yet
            just looks broken; pressing it instead shows them what is wrong. */}
        <button
          type="submit"
          className="cta checkout-form__submit"
          disabled={submitting}
        >
          {submitting ? `Sending your order — ${total} ETB…` : `Order — ${total} ETB`}
        </button>
      </form>
    </main>
  );
}

Checkout.propTypes = {
  returningCustomer: PropTypes.shape({
    name: PropTypes.string.isRequired,
    area: PropTypes.string.isRequired,
  }),
};

export default Checkout;
