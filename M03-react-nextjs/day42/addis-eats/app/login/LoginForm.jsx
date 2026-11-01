"use client";

import PropTypes from "prop-types";
import { useActionState } from "react";
import { signIn } from "@/app/actions";
import Field from "@/components/Field";

// The sign-in form. A client component only for useActionState: the errors
// beside the fields, the "no match" message, and the pending button. Every
// check is signIn's, on the server (app/actions.js): the phone rule from
// lib/validate.js, then the password against the stored scrypt hash.
//
// Like the checkout, it works with JavaScript off: the browser posts the
// form, signIn runs, and either redirects or the page is rendered again with
// its answer as `state`.
//
// Day 42: a password. It is never echoed back — after a failed try the
// phone number is kept and the password field starts empty, as every
// sign-in form does — and nothing about it is stored in this browser.
export default function LoginForm({ next }) {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <form className="form" action={formAction} noValidate>
      <input type="hidden" name="next" value={next} />

      {state?.error && (
        <div className="form__failure" role="alert">
          <p>{state.error}</p>
        </div>
      )}

      <Field
        name="phone"
        label="Phone number"
        type="tel"
        inputMode="tel"
        autoComplete="username"
        hint="09… or +2519…"
        defaultValue={state?.values?.phone ?? "09"}
        error={state?.fieldErrors?.phone}
      />

      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={state?.fieldErrors?.password}
      />

      <button type="submit" className="cta" disabled={pending}>
        {pending ? "Signing in…" : `Sign in and continue to ${next}`}
      </button>
    </form>
  );
}

LoginForm.propTypes = {
  next: PropTypes.string.isRequired,
};
