"use client";

import PropTypes from "prop-types";
import { useActionState, useMemo } from "react";
import { cancelOrder } from "@/app/actions";

// The receipt's one interactive part: a form whose action is cancelOrder,
// bound to this order's id.
//
// bind() puts the id into the action's arguments — and into the page's HTML,
// where anyone can read it and change it. That is fine, because the id is
// only *which* order to look at. Whether this person may cancel it is decided
// inside cancelOrder, from the session cookie and the record's owner.
//
// useActionState for the pending label and the answer. On success the action
// calls revalidatePath, so the receipt is re-rendered in the same response
// and this button is replaced by "Cancelled at …".
export default function CancelOrderButton({ orderId }) {
  const action = useMemo(() => cancelOrder.bind(null, orderId), [orderId]);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="cancel">
      <button type="submit" className="tabs__signout" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel this order"}
      </button>
      <p role="status" className="cancel__result">
        {state?.message ?? state?.error}
      </p>
    </form>
  );
}

CancelOrderButton.propTypes = {
  orderId: PropTypes.string.isRequired,
};
