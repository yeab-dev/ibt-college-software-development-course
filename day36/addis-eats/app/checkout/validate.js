// The rules for the checkout, in one place.
//
// A pure function: it takes the form object and returns an errors object. No
// React, no DOM, no side effects — exactly like the reducer on Day 30, and just
// as easy to test on its own (`npm run check:validate`). The mock server in
// mock/ordersApi.js imports this same file, so the browser and the "server"
// cannot drift apart on what a valid order is.

export const AREAS = ["Bole", "Kazanchis", "Megenagna", "Piassa"];

export const NOTES_MAX = 200;

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

export function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "We need a name for the delivery";
  }

  const phone = normalisePhone(form.phone);
  if (!phone) {
    errors.phone = "Enter the TeleBirr number that will pay";
  } else if (!TELEBIRR.test(phone)) {
    errors.phone = "Use 09… or +2519… — a TeleBirr number has 10 digits";
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
