import { useEffect, useState } from "react";

// Day 41. The value, but only once it has stopped changing for `delay` ms.
//
// Typing "tibs" changes the input four times in half a second. Fed straight
// into a query key, that is four requests, three of them for words nobody
// wanted. Fed through this, the key changes once, 300 ms after the last key
// press — the README counts the requests in the network tab.
export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // A new key press clears the timer and starts again: only the last one
    // ever fires.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
