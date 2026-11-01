"use client";

// Day 33's checkout, now posting to a server action.
//
// Step 4 pointed this form at POST /api/orders with fetch and branched on the
// status code, exactly as on Day 33 (the README keeps that version). Step 5
// deleted the fetch: the form's `action` is now placeOrder from
// app/actions.js, and React sends the request. Step 6 let useActionState
// carry what Day 33 kept by hand:
//
//   Day 33 (and step 4)                 now
//   submitting + an in-flight ref       `pending`, from useActionState
//   serverErrors + failure              `state.fieldErrors` + `state.error`
//   setOrder(placed) → receipt          the action redirects to /orders/[id]
//   handleSubmit → fetch → try/catch    <form action={formAction}>
//
// What did not change: Day 33's validate() still runs on every render, a
// field still speaks up once it has been left, nothing is sent while the form
// knows it is wrong, focus still goes to the first problem, the field markup
// is the same Field, and nothing typed is ever cleared on failure.
//
// It works before hydration. The form is a real <form> whose action is the
// server action's URL, so with JavaScript off (or not loaded yet) the browser
// posts it, the action runs, and Next.js renders this page again with the
// action's result as `state` — field errors beside their fields, or the
// redirect to the receipt. That is why the inputs are uncontrolled, with
// `defaultValue`: the values have to survive a round trip that no browser
// code takes part in.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PropTypes from "prop-types";
import { useActionState, useEffect, useRef, useState } from "react";
import { placeOrder, signOut } from "@/app/actions";
import Field from "@/components/Field";
import { AREAS, FIELDS, NOTES_MAX, validate } from "@/lib/validate";

const ALL_TOUCHED = Object.fromEntries(FIELDS.map((f) => [f, true]));

function Checkout({ user, returningCustomer, basket }) {
  const simulateFailure = useSearchParams().get("fail") === "1";

  // The whole of Day 33's submitting / failed bookkeeping, in one hook.
  // `state` is whatever placeOrder last returned (null before the first try);
  // `pending` is true from the press until the answer arrives.
  const [state, formAction, pending] = useActionState(placeOrder, null);

  // Step 1, still. The values the form starts from: what the action handed
  // back after a failed try, or the returning customer's name and area and
  // the signed-in phone number.
  const [form, setForm] = useState(
    () =>
      state?.values ?? {
        name: returningCustomer?.name ?? "",
        phone: user.phone,
        area: returningCustomer?.area ?? AREAS[0],
        notes: "",
      },
  );

  // Step 3. Which fields the person has actually left.
  const [touched, setTouched] = useState({});

  // Which fields were edited since the server last judged them. Keyed by the
  // state object itself, so a new answer from the server starts afresh
  // without an effect to reset it.
  const [edited, setEdited] = useState({ for: null, fields: {} });

  const failureRef = useRef(null);

  // Step 2. Derived, never stored.
  const errors = validate(form);

  function serverError(field) {
    const dismissed = edited.for === state && edited.fields[field];
    return dismissed ? undefined : state?.fieldErrors?.[field];
  }

  // A field speaks up once it has been left. A server error shows until that
  // field is edited.
  function shownError(field) {
    return (touched[field] && errors[field]) || serverError(field);
  }

  // The inputs are not controlled — React and the browser own their values —
  // but every keystroke is mirrored here so validate() can judge it live.
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((f) => ({ ...f, [name]: value }));
    setEdited((e) => ({
      for: state,
      fields: { ...(e.for === state ? e.fields : {}), [name]: true },
    }));
  }

  function handleBlur(event) {
    const { name } = event.target;
    setTouched((t) => (t[name] ? t : { ...t, [name]: true }));
  }

  // Runs before the action. Calling preventDefault() here stops it, which is
  // how "nothing leaves the browser while the form knows it is wrong"
  // survives the switch to a server action. It is a courtesy: without
  // JavaScript this never runs, and the server's check is the same one.
  function handleSubmit(event) {
    if (pending) {
      event.preventDefault(); // no double order
      return;
    }
    const firstBad = FIELDS.find((f) => errors[f]);
    if (firstBad) {
      event.preventDefault();
      setTouched(ALL_TOUCHED);
      document.getElementById(firstBad)?.focus();
    }
  }

  // After each answer from the server, put the person where the problem is:
  // the first field it named, or the message when no single field is to
  // blame. (An effect, because focus is the DOM's, not React's.)
  useEffect(() => {
    if (!state) return;
    const firstServerBad = FIELDS.find((f) => state.fieldErrors?.[f]);
    if (firstServerBad) {
      document.getElementById(firstServerBad)?.focus();
    } else if (state.error) {
      failureRef.current?.focus();
    }
  }, [state]);

  // Rendered by the server from the cookie, so it is in the HTML of the very
  // first response.
  const welcome = returningCustomer && (
    <p className="checkout__welcome">
      Welcome back, {returningCustomer.name}. Delivery to{" "}
      {returningCustomer.area} is filled in for you &mdash; change it below if
      you need to.
    </p>
  );

  // Day 31's "Signed in as…" line, back now that there is a session. Sign out
  // is a second, separate form — forms cannot nest — posting to another
  // action. It needs no JavaScript either.
  const session = (
    <div className="checkout__session">
      <span>
        Signed in as <strong>{user.name}</strong> ({user.phone})
      </span>
      <form action={signOut}>
        <button type="submit" className="tabs__signout">
          Sign out
        </button>
      </form>
    </div>
  );

  // The basket arrives from the server, priced from the menu — the same
  // lines and total the action is about to charge.
  if (basket.lines.length === 0) {
    return (
      <main className="prose">
        <h2>Checkout</h2>
        {session}
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

  const failure = state?.error && (state.fieldErrors?.items ?? state.error);

  return (
    <main className="prose">
      <h2>Checkout</h2>

      {session}
      {welcome}

      <ul className="checkout__lines">
        {basket.lines.map((line) => (
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

      {simulateFailure && (
        <p className="state">
          <strong>?fail=1 is on</strong> — the kitchen will refuse this order.{" "}
          <Link href="/checkout">Turn it off</Link>
        </p>
      )}

      {/* action={formAction}: the form posts to placeOrder. onSubmit still
          runs first, in the browser, and may stop it. noValidate — the
          browser's own bubbles would fire before ours, in words we did not
          choose. */}
      <form
        className="form checkout-form"
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
      >
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

        {/* ?fail=1, carried to the action. Without JavaScript the action
            cannot see the page's URL, so the switch travels in the form. */}
        {simulateFailure && <input type="hidden" name="fail" value="1" />}

        <Field
          name="name"
          label="Name for the delivery"
          autoComplete="name"
          defaultValue={form.name}
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
          defaultValue={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shownError("phone")}
        />

        {/* After an action, React resets the form to its default values.
            Inputs and the textarea take a new defaultValue on every render,
            so they reset to what was typed. A <select> only reads
            defaultValue when it mounts — it would snap back to Bole. The key
            changes with each answer from the server, so the select is
            mounted afresh with the area that was sent. */}
        <Field
          key={`area-${state?.attempt ?? 0}`}
          as="select"
          name="area"
          label="Delivery area"
          defaultValue={form.area}
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

        <Field
          as="textarea"
          name="notes"
          label="Notes for the rider (optional)"
          rows={3}
          hint={`${form.notes.length} / ${NOTES_MAX} characters`}
          defaultValue={form.notes}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shownError("notes")}
        />

        {/* Disabled only while sending — the one time the person can see why.
            `pending` comes from useActionState: no state of our own, and no
            ref, because the hook flips it in the same event as the press. */}
        <button
          type="submit"
          className="cta checkout-form__submit"
          disabled={pending}
        >
          {pending
            ? `Sending your order — ${basket.total} ETB…`
            : `Order — ${basket.total} ETB`}
        </button>
      </form>
    </main>
  );
}

Checkout.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
  }).isRequired,
  returningCustomer: PropTypes.shape({
    name: PropTypes.string.isRequired,
    area: PropTypes.string.isRequired,
  }),
  basket: PropTypes.shape({
    lines: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        quantity: PropTypes.number.isRequired,
      }),
    ).isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};

export default Checkout;
