import { Profiler } from "react";
import PropTypes from "prop-types";

// React's <Profiler>, recording into window.__profile so PROFILE.md's numbers
// come from a script rather than a screenshot. Same data the DevTools Profiler
// shows: which region committed, why (mount or update), and actualDuration —
// the time spent rendering that subtree in this commit.
//
// In a production build <Profiler> does nothing, so the probes cost nothing
// there. They stay in the code because PROFILE.md says how to re-run them.
function onRender(id, phase, actualDuration) {
  const log = (window.__profile ??= []);
  log.push({ id, phase, ms: actualDuration });
}

function Probe({ id, children }) {
  if (!import.meta.env.DEV) return children;
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}

Probe.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default Probe;
