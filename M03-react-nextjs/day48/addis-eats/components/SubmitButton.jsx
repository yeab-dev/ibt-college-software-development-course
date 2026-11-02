"use client";

import PropTypes from "prop-types";
import { useFormStatus } from "react-dom";

// Day 48. A submit button that is disabled while its form's action runs.
//
// The checkout, sign-in, sign-up and cancel forms already had this: they are
// client components with useActionState, which hands back `pending`. The
// kitchen's Refuse buttons and the Sign out buttons are forms rendered by
// *server* components (they need no state of their own), so there is no
// hook to call where the form is written. useFormStatus reads the pending
// state of the <form> it is rendered inside — which is why it has to be a
// separate component, placed in the form, rather than a call next to it
// (react.dev: "useFormStatus will only return status information for a
// parent <form>").
//
// Before hydration this is a plain submit button, and the form still posts.
export default function SubmitButton({ children, pendingLabel, className }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

SubmitButton.propTypes = {
  children: PropTypes.node.isRequired,
  pendingLabel: PropTypes.node.isRequired,
  className: PropTypes.string,
};
