import { Component } from "react";
import PropTypes from "prop-types";

// The one class you still write. There is no hook for catching a render error.
//
// Two methods, two jobs:
//   getDerivedStateFromError — runs during render, puts the error in state so
//                              the fallback renders instead of the children
//   componentDidCatch        — runs after, the side-effect half: report it
//
// What a boundary does NOT catch: errors in event handlers, in promises and
// async code, in timers, or in the boundary itself. A failed fetch is still
// useFetch's error state, and a failed order is still Checkout's try/catch.
// Boundaries handle the case nobody planned for; they replace neither.
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Stand-in for Sentry or similar. Wherever it goes, send it somewhere
    // someone will actually read it — an error caught silently is a bug hidden.
    console.error(`[${this.props.name}] crashed:`, error, info.componentStack);
  }

  componentDidUpdate(prevProps) {
    // A boundary stays tripped until something resets it. When `resetKey`
    // changes — the person navigated somewhere else — give the children
    // another chance instead of showing the old fallback forever.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      // A function fallback gets the error and a way out; a plain element is
      // fine when there is nothing to retry.
      return typeof fallback === "function"
        ? fallback({ error: this.state.error, reset: this.reset })
        : fallback;
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  name: PropTypes.string.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  resetKey: PropTypes.any,
  children: PropTypes.node,
};

export default ErrorBoundary;
