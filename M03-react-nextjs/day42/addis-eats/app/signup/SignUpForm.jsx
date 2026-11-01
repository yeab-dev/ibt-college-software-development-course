"use client";

import PropTypes from "prop-types";
import { useActionState } from "react";
import { signUp } from "@/app/actions";
import Field from "@/components/Field";

// Day 42. The sign-up form: the same shape as LoginForm, for the same
// reason — useActionState for the server's answers. The rules (a name, a
// TeleBirr number nobody has used, eight characters of password) are all
// signUp's, on the server. Works with JavaScript off.
export default function SignUpForm({ next }) {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <form className="form" action={formAction} noValidate>
      <input type="hidden" name="next" value={next} />

      <Field
        name="name"
        label="Your name"
        autoComplete="name"
        defaultValue={state?.values?.name ?? ""}
        error={state?.fieldErrors?.name}
      />

      <Field
        name="phone"
        label="Phone number"
        type="tel"
        inputMode="tel"
        autoComplete="username"
        hint="The TeleBirr number you will pay with: 09… or +2519…"
        defaultValue={state?.values?.phone ?? "09"}
        error={state?.fieldErrors?.phone}
      />

      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters"
        error={state?.fieldErrors?.password}
      />

      <button type="submit" className="cta" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}

SignUpForm.propTypes = {
  next: PropTypes.string.isRequired,
};
