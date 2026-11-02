import { apiError } from "@/lib/apiError";
import { isFinal } from "@/lib/orderStage";
import { getOrder, orderView } from "@/lib/orders";
import { getSession, sessionFromCookie } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

// GET /api/orders/1001/stream — the order, pushed as server-sent events.
//
// Day 47. The Day 39 route handler, returning a stream instead of a
// response: ordinary HTTP, so it needs no new infrastructure and passes
// through proxies. The receipt opens it with EventSource
// (app/orders/[id]/useOrderStream.js) and it replaces the receipt's
// five-second poll (TRACKING.md says why). GET /api/orders/[id] is kept, for
// the fallback when a stream cannot be held open.
//
// Before the stream opens, exactly the checks GET /api/orders/[id] makes, in
// the same order, answered the same way (AUTH.md, Day 47):
//
//   401  no session                      (JSON, like every endpoint)
//   404  no such order
//   403  signed in, but someone else's order
//   200  text/event-stream, and the frames below
//
// A refusal is an ordinary JSON response, not a stream. EventSource treats
// any status but 200, or any type but text/event-stream, as fatal: it fires
// `error`, sets readyState to CLOSED and never reconnects — so a stranger's
// browser does not keep knocking.
//
// The frames. The format is strict: a field name, a colon, a space, the
// value, and a *blank line* to end the message ("data: …\n\n"). With one
// newline the browser keeps waiting for the rest of a message that never
// ends.
//
//   retry: 3000                   once: reconnect after 3 s if the line drops
//   data: {…the order…}           the whole order view (lib/orders.js), first
//                                 at once, then whenever it changes
//   event: end                    the order is delivered or cancelled: the
//   data: {"reason":"delivered"}  client closes its EventSource, and then
//                                 this handler closes the stream
//
// Every frame is the whole state, not a change to apply. A reconnect needs
// no Last-Event-ID and no replay: its first frame is the current order, which
// is the "resync on reconnect" the reading sheet asks for.
//
// While it is open it re-checks, every tick, that the session it was opened
// with is still live and the order is still this person's. Signing out
// elsewhere, or the session expiring, ends the stream within one tick; the
// browser reconnects, meets the 401 above, and gives up.

// How often to look. The courier crosses the map in 180 s (lib/delivery.js),
// so 3 s is sixty small moves; the stage itself changes only twice.
const TICK_MS = 3000;

// With nothing new to say (an order in the kitchen does not move), send the
// order anyway this often: it refreshes "placed 2 minutes ago" beside the
// map, and an idle connection with traffic on it is not cut by a proxy.
const REFRESH_MS = 15000;

// The longest one connection is held. The browser reconnects by itself
// (running every check above again), so this costs one request. It keeps a
// connection's life under a serverless platform's limit — see maxDuration.
const MAX_STREAM_MS = 270_000;

// Day 47: on a serverless host (Vercel) a function — and so this response —
// is stopped after its maximum duration. Next.js passes this to the
// platform; the handler closes itself first (MAX_STREAM_MS) so the browser
// sees a clean end and reconnects, rather than an error. `next start` has no
// limit and ignores it.
export const maxDuration = 300;

const encoder = new TextEncoder();

// One line per field, then the blank line that ends the message.
function frame({ event, data }) {
  return encoder.encode(`${event ? `event: ${event}\n` : ""}data: ${JSON.stringify(data)}\n\n`);
}

// How many streams this server process holds open, for the log line below:
// the reading sheet's "navigate away five times — how many connections are
// open?" is answered by reading it. On globalThis, like the order store's
// write queue, so every bundle in the process counts in the same place.
const open = (globalThis.__addisEatsStreams ??= { count: 0 });

export async function GET(request, { params }) {
  // The same three checks as GET /api/orders/[id], in the same order.
  const user = await getSession();
  if (!user) {
    return apiError(401, "Not signed in.");
  }

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return apiError(404, "No such order.");
  }
  if (order.userId !== user.id) {
    return apiError(403, "That order is not yours.");
  }

  // The cookie this stream was opened with, to ask again later. Read from
  // the request, not cookies(): the ticks below run after this function has
  // returned its Response.
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;

  let timer = null;
  let stopped = false;
  let controllerRef = null;

  // Every way a stream ends comes through here, once: delivered, signed
  // out, the time cap, or the browser going away (cancel / abort below).
  function stop(reason) {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    request.signal.removeEventListener("abort", onAbort);
    try {
      controllerRef?.close();
    } catch {
      // Already closed: the browser cancelled it.
    }
    open.count -= 1;
    console.log(`[stream] order ${id} closed (${reason}); ${open.count} open`);
  }

  function onAbort() {
    stop("client went away");
  }

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      open.count += 1;
      console.log(`[stream] order ${id} opened by ${user.id}; ${open.count} open`);

      const send = (message) => {
        if (!stopped) controller.enqueue(frame(message));
      };

      const startedAt = Date.now();
      let lastSent = "";
      let lastSentAt = 0;

      // Send the order if it changed (or the refresh is due); finish if it
      // can no longer change.
      const push = (current) => {
        const view = orderView(current);
        // `at` changes every tick by definition; compare everything else.
        const comparable = JSON.stringify({ ...view, tracking: { ...view.tracking, at: null } });
        if (comparable !== lastSent || Date.now() - lastSentAt >= REFRESH_MS) {
          send({ data: view });
          lastSent = comparable;
          lastSentAt = Date.now();
        }
        if (isFinal(view.stage)) {
          send({ event: "end", data: { reason: view.stage } });
          stop(view.stage);
        }
      };

      controller.enqueue(encoder.encode(`retry: 3000\n\n`));
      push(order);
      if (stopped) return; // already delivered or cancelled: one frame, then end

      timer = setInterval(async () => {
        try {
          if (Date.now() - startedAt >= MAX_STREAM_MS) {
            // No `end` event: the browser should reconnect, and will.
            stop("time cap, browser will reconnect");
            return;
          }
          const [still, current] = await Promise.all([sessionFromCookie(cookie), getOrder(id)]);
          if (stopped) return;
          if (!still || still.id !== user.id || !current || current.userId !== user.id) {
            // Close without `end`: the browser reconnects, and the checks at
            // the top of this handler answer it (401).
            stop("session no longer valid");
            return;
          }
          push(current);
        } catch (err) {
          console.error(`[stream] order ${id}:`, err);
          stop("error");
        }
      }, TICK_MS);
    },

    // The browser closed the EventSource, navigated away or lost the
    // network: Next.js cancels the stream. Without this the interval would
    // go on reading the order file every 3 s for nobody.
    cancel() {
      stop("client went away");
    },
  });

  // Belt and braces: the request's own signal also fires when the
  // connection drops. stop() runs once, whichever comes first.
  request.signal.addEventListener("abort", onAbort);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // Never stored; and no-transform, so nothing between (including
      // next start's own gzip) buffers the frames to compress them.
      "Cache-Control": "private, no-store, no-transform",
      // nginx and similar reverse proxies buffer responses by default; this
      // asks them not to. Harmless where there is none.
      "X-Accel-Buffering": "no",
    },
  });
}
