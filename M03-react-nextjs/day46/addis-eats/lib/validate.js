// The rules for an order, in one place — the Day 33 schema.
//
// A pure function: it takes the form object and returns an errors object. No
// React, no DOM, no side effects — exactly like the reducer on Day 30.
//
// Day 39: moved from app/checkout/ to lib/, because it now has three callers
// on two sides of the network:
//
//   app/checkout/Checkout.jsx  the browser, on every render — a courtesy, so
//                              nobody waits for a round trip to learn they
//                              missed a field
//   app/api/orders/route.js    the server, for anyone who POSTs JSON
//   app/actions.js             the server, for the checkout's own form
//
// The last two go through lib/orders.js. Same file, same messages, so the
// browser and the server cannot drift apart on what a valid order is — and
// only the server's verdict counts, because curl never runs the first one.
//
// No "server-only" here, on purpose: the browser needs it too.

export const AREAS = ["Bole", "Kazanchis", "Megenagna", "Piassa"];

export const NOTES_MAX = 200;

// Day 39: a name the server will store and print on the kitchen board. The
// form never gets near it; a forged body can.
export const NAME_MAX = 80;

// Field order, top to bottom. Focus goes to the first bad field in *this*
// order, not whatever order the keys happen to come out of an errors object.
export const FIELDS = ["name", "phone", "area", "notes"];

// Ethiopian mobile numbers come as 0911… or +251911…, and people type them
// with spaces and dashes. Strip what we can fix ourselves before testing —
// never reject a number for formatting.
export function normalisePhone(phone) {
  return phone.replace(/[\s-]/g, "");
}

const TELEBIRR = /^(?:\+251|0)9\d{8}$/;

// One spelling of a number: 0911 22 33 44 and +251911223344 are the same
// phone, so the server stores and compares 0911223344.
export function localNumber(phone) {
  return normalisePhone(phone).replace(/^\+251/, "0");
}

// The phone rule on its own. The sign-in form (Day 39's /login) checks the
// same number the checkout does, in the same words.
export function phoneError(raw) {
  const phone = normalisePhone(raw);
  if (!phone) return "Enter the TeleBirr number that will pay";
  if (!TELEBIRR.test(phone)) return "Use 09… or +2519… — a TeleBirr number has 10 digits";
  return undefined;
}

// What arrives from outside — a JSON body, a FormData — is not a form yet: a
// field can be missing, a number, an array. validate() expects four strings,
// so both server entry points pass through this first. A forged `name: 42`
// becomes "42" and is judged like anything typed.
export function toOrderForm(get) {
  const text = (key) => {
    const value = get(key);
    return typeof value === "string" ? value : value == null ? "" : String(value);
  };
  return { name: text("name"), phone: text("phone"), area: text("area"), notes: text("notes") };
}

export function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "We need a name for the delivery";
  } else if (form.name.trim().length > NAME_MAX) {
    errors.name = `Keep the name under ${NAME_MAX} characters`;
  }

  const phone = phoneError(form.phone);
  if (phone) {
    errors.phone = phone;
  }

  // The select can only offer these four, so a person cannot get this wrong.
  // A forged request can, which is why the rule is here anyway.
  if (!AREAS.includes(form.area)) {
    errors.area = "Choose a delivery area";
  }

  if (form.notes.length > NOTES_MAX) {
    errors.notes = `Keep notes to ${NOTES_MAX} characters — you have ${form.notes.length}`;
  }

  return errors; // {} means valid
}
