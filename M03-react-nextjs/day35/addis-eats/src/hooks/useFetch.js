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
        //
        // Day 35: the API explains itself in `message`. Pass that on, so the
        // screen can say "there is no dish called pizza" rather than a bare
        // status code. The code is kept as a fallback for a body that is not
        // JSON (a proxy's HTML error page, say).
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? `The server answered ${res.status}.`);
        }

        setData(await res.json());
        setIsLoading(false);
      } catch (err) {
        // An abort is not a failure: the url changed (or the component
        // unmounted) before the answer came back, and a newer request is
        // already in flight. Leave the state to it.
        if (err.name === "AbortError") return;

        // fetch rejects with a TypeError when the request never got an answer
        // at all. "Failed to fetch" means nothing to the person reading it.
        setError(
          err instanceof TypeError
            ? "Addis Eats could not be reached. Check your connection."
            : err.message,
        );
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
