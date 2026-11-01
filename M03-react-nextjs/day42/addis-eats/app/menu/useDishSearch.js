import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

// Day 41. The menu's search box, as a query: the slides' "debounce, then let
// the key do the work".
//
// The key is the URL of the answer, and everything the answer depends on is
// in it — the term, the category the box searches in, and the page. Change
// any of them and SWR fetches; come back to one it has seen and the answer is
// already in the cache.
//
// `q` arrives already debounced (FilterShell: useDebounce(term, 300)), so the
// key changes once per pause in typing, not once per key press.

export function searchKey({ q, category, page }) {
  if (!q) return null;
  const params = new URLSearchParams({ q });
  if (category !== "All") params.set("category", category);
  if (page > 1) params.set("page", String(page));
  return `/api/dishes?${params}`;
}

export function useDishSearch({ q, category, page }) {
  // An empty box is a null key: no request at all. The list on screen is
  // then the server's, filtered by category in the browser as before. The
  // hook is still called on every render — never inside an `if` — and the
  // null key is how it says "not now".
  const key = searchKey({ q, category, page });

  const { data, error, isLoading } = useSWR(key, fetcher, {
    // While "tibs" is on its way, keep showing the answer for "tib" (or
    // page 1 while page 2 loads) instead of nothing. Without this the list
    // would flash empty between every pair of terms.
    keepPreviousData: true,

    // The menu changes a few times a day, and the list these results sit in
    // is itself up to an hour old (/menu is ISR, 1 h). A result is good for
    // as long as the tab is open: a term already answered is not asked again
    // when it is typed again, nor when the tab regains focus. (Reconnecting
    // still asks, the default: on a connection that drops, the answer on
    // screen may be a failure.)
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  return {
    // keepPreviousData would hand back the last search's answer even after
    // the box is cleared (a null key). An empty box shows no results.
    results: key ? data : undefined,
    error: key ? error : undefined,
    // Asked, and nothing for *this* key yet: what is shown is the previous
    // answer, or the server's list.
    searching: Boolean(key) && isLoading,
  };
}
