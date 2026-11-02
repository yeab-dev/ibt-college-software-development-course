import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A dialog rendered somewhere else.
//
// The dish card has overflow: hidden, so anything rendered inside it is
// clipped to the card however it is styled — no z-index gets out of an
// ancestor's overflow or stacking context. createPortal moves the *DOM node*
// to #modal-root (in index.html, outside #root) and leaves the *component*
// exactly where it was written: it still reads the cart store, and its events
// still bubble up the React tree to the card that opened it.
//
// The five things that make it usable:
//   focus moves in       — the first focusable control, on open
//   focus is trapped     — Tab and Shift+Tab wrap inside; the page behind is inert
//   Escape closes        — on every platform, the expected way out
//   focus returns        — to whatever opened it, so they continue from there
//   role="dialog"        — with aria-modal and a label, so it is announced
function Modal({ title, onClose, children }) {
  const panelRef = useRef(null);
  const titleId = useId();

  // Keep the latest onClose without making the effect below depend on it. A
  // parent passing an inline arrow would otherwise re-run the effect on every
  // render — and the cleanup would hand focus back mid-use.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    const app = document.getElementById("root");

    // Everything behind the dialog: unreachable by Tab, by a screen reader's
    // virtual cursor, and by a click. aria-modal says the same thing to
    // assistive tech; inert makes the browser enforce it.
    app.inert = true;
    document.body.style.overflow = "hidden";

    (panel.querySelector(FOCUSABLE) ?? panel).focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = [...panel.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      app.inert = false;
      document.body.style.overflow = "";
      // Back to where they were. Guarded: the opener may be gone by now.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return createPortal(
    // A click on the backdrop closes; a click inside the panel must not count
    // as one, so only a click whose target *is* the overlay closes it.
    <div
      className="overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal__head">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.getElementById("modal-root"),
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default Modal;
