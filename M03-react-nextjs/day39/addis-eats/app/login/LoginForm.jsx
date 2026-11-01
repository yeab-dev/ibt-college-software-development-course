"use client";

import PropTypes from "prop-types";
import { useActionState } from "react";
import { signIn } from "@/app/actions";
import Field from "@/components/Field";

// The sign-in form. A client component only for useActionState: the error
// beside the field and the pending button. The check itself is signIn's, on
// the server, with the checkout's own phone rule (lib/validate.js).
//
// Like the checkout, it works with JavaScript off: the browser posts the
// form, signIn runs, and either redirects or the page is rendered again with
// its answer as `state`.
export default function LoginForm({ next }) {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <form className="form" action={formAction} noValidate>
      <input type="hidden" name="next" value={next} />

      <Field
        name="phone"
        label="Phone number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="09… or +2519…"
        defaultValue={state?.values?.phone ?? "09"}
        error={state?.fieldErrors?.phone}
      />

      <button type="submit" className="cta" disabled={pending}>
        {pending ? "Signing in…" : `Continue to ${next}`}
      </button>
    </form>
  );
}

LoginForm.propTypes = {
  next: PropTypes.string.isRequired,
};
