import assert from "node:assert/strict";
import { AREAS, NOTES_MAX, normalisePhone, validate } from "./validate.js";

// validate() is pure, so it is tested like the reducer on Day 30: hand it an
// object, look at what comes back. No browser, no React.

const good = { name: "Hana", phone: "0911234567", area: "Bole", notes: "" };

assert.deepEqual(validate(good), {}, "a complete order is valid");

// Pristine is invalid — which is exactly why errors wait for `touched`.
const pristine = validate({ name: "", phone: "", area: "Bole", notes: "" });
assert.deepEqual(Object.keys(pristine), ["name", "phone"]);

assert.ok(validate({ ...good, name: "   " }).name, "whitespace is not a name");

// Both Ethiopian formats, with the spacing people actually type.
for (const phone of ["0911234567", "+251911234567", "0911 234 567", "+251 91-123-4567"]) {
  assert.equal(validate({ ...good, phone }).phone, undefined, `accepts ${phone}`);
}
for (const phone of ["091123456", "0811234567", "251911234567", "09112345678", "09abc12345"]) {
  assert.ok(validate({ ...good, phone }).phone, `rejects ${phone}`);
}
assert.equal(normalisePhone(" 0911 23-45 67 "), "0911234567");

for (const area of AREAS) assert.deepEqual(validate({ ...good, area }), {});
assert.ok(validate({ ...good, area: "Mars" }).area, "a forged area is caught");

assert.deepEqual(validate({ ...good, notes: "x".repeat(NOTES_MAX) }), {});
assert.match(validate({ ...good, notes: "x".repeat(NOTES_MAX + 1) }).notes, /201/);

// Pure: same input, same output, and the input is not touched.
const frozen = Object.freeze({ ...good, phone: "0911 234 567" });
assert.deepEqual(validate(frozen), validate(frozen));

console.log("validate: all checks passed");
