import PropTypes from "prop-types";

// Label, control and message, wired together.
//
// The four attributes that matter:
//   htmlFor + id      — the label belongs to this control (and a tap on the
//                       label focuses it, which is a bigger target on a phone)
//   aria-invalid      — the control is currently wrong
//   aria-describedby  — the hint and the message are read out with the control
//   role="alert"      — the message is announced the moment it appears
//
// `as` picks the element: "input", "select" or "textarea". Everything else is
// passed straight through, so the caller still owns value, onChange and onBlur.
function Field({ as: Control = "input", name, label, hint, error, children, ...rest }) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={error ? "field field--invalid" : "field"}>
      <label className="form__label" htmlFor={name}>
        {label}
      </label>

      <Control
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {children}
      </Control>

      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}

      {/* Colour is never the only signal: the message is in words, it sits
          directly under its own field, and the mark carries the meaning for
          anyone who cannot see the red. */}
      {error && (
        <p id={errorId} className="field__error" role="alert">
          <span className="field__mark" aria-hidden="true">
            ⚠
          </span>{" "}
          {error}
        </p>
      )}
    </div>
  );
}

Field.propTypes = {
  as: PropTypes.oneOf(["input", "select", "textarea"]),
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  hint: PropTypes.node,
  error: PropTypes.string,
  children: PropTypes.node,
};

export default Field;
