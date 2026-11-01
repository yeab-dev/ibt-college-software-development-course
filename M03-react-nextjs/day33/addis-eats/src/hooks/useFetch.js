import { useCallback, useEffect, useState } from "react";

// Day 29 kept all of this inside Menu: the three state variables, the
// AbortController, the res.ok check and the AbortError that is not really an
// error. None of it is about menus — it is about fetching — so it belongs in a
// function of its own.
//
// A custom hook is just a function whose name starts with `use` and which
// calls other hooks. It shares *logic*, never data: every component that calls
// useFetch gets its own independent data, isLoading and error.
export function useFetch(url) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bumping this number is how `refetch` re-runs an effect whose other
  // dependencies have not changed.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(url, { signal: controller.signal });

        // fetch only rejects when the network itself fails, so a 404 or a 503
        // arrives here as a perfectly resolved promise.
        if (!res.ok) {
          throw new Error(`The server answered ${res.status}.`);
        }

        setData(await res.json());
        setIsLoading(false);
      } catch (err) {
        // An abort is not a failure: the url changed (or the component
        // unmounted) before the answer came back, and a newer request is
        // already in flight. Leave the state to it.
        if (err.name === "AbortError") return;

        setError(err.message);
        setIsLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [url, attempt]);

  // useCallback so the identity is stable: a component can put `refetch` in a
  // dependency array, or hand it to a memoised child, without causing the very
  // re-render it was trying to avoid.
  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, isLoading, error, refetch };
}
