import { DELIVERY_SECONDS, KITCHEN_SECONDS, orderStage } from "./orderStage";

// Day 47. Where an order is on the map, worked out from when it was placed.
//
// Addis Eats has no couriers with phones reporting their position, so the
// position is simulated, the same way lib/orderStage.js simulates the
// kitchen: from the order's time and stage, and nothing else. That makes it
// deterministic. The same order at the same instant is in the same place for
// the receipt's first render, for GET /api/orders/[id] and for every frame of
// the stream — and on every machine, so a test can predict it.
//
//   in the kitchen  the courier waits at the kitchen (Meskel Square)
//   on the way      the courier moves in a straight line from the kitchen to
//                   the delivery point, evenly, over the three minutes the
//                   stage lasts (KITCHEN_SECONDS → DELIVERY_SECONDS)
//   delivered       the courier is at the delivery point
//   cancelled       there is no courier
//
// The delivery point is in the order's neighbourhood: a real landmark in each
// of the four, moved by up to ~400 m in a direction chosen from the order id,
// so two orders to Bole are not drawn on the same pixel. It is not the
// customer's address — the checkout only asks for a neighbourhood — and the
// text beside the map says "around", not a street.
//
// Coordinates are [latitude, longitude], Leaflet's order. GeoJSON writes
// [longitude, latitude]; mixing the two puts Bole in the Indian Ocean (the
// deck's warning), so every point here is an object with named fields and
// the map turns it into [lat, lng] in one place.
//
// Pure: no React, no Node, no clock of its own (`now` is passed in). The
// server computes it; the browser only draws what it is sent.

export const KITCHEN = { name: "the Addis Eats kitchen", place: "Meskel Square", lat: 9.0105, lng: 38.7614 };

// One landmark per neighbourhood the checkout offers (lib/validate.js AREAS).
export const DROP_POINTS = {
  Bole: { landmark: "Edna Mall", lat: 8.9967, lng: 38.7889 },
  Kazanchis: { landmark: "the Economic Commission for Africa", lat: 9.0189, lng: 38.7672 },
  Megenagna: { landmark: "Megenagna Square", lat: 9.0203, lng: 38.8013 },
  Piassa: { landmark: "St George's Cathedral", lat: 9.0366, lng: 38.7517 },
};

const COURIERS = ["Abel", "Tigist", "Yared", "Mekdes", "Biniam", "Hirut", "Kaleb", "Selam"];

// ~0.0036° of latitude is ~400 m in Addis.
const SPREAD = 0.0036;

// A small, stable number from the order id: the same id always gives the
// same courier and the same nudge away from the landmark.
function hash(text) {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const round = (n) => Math.round(n * 1e5) / 1e5; // ~1 m: plenty, and short JSON

export function dropPoint(order) {
  const base = DROP_POINTS[order.area] ?? DROP_POINTS.Bole;
  const h = hash(order.id);
  const angle = ((h % 360) * Math.PI) / 180;
  const distance = SPREAD * (0.4 + ((h >>> 9) % 60) / 100); // 40–100 % of SPREAD
  return {
    area: order.area,
    landmark: base.landmark,
    lat: round(base.lat + distance * Math.sin(angle)),
    lng: round(base.lng + distance * Math.cos(angle)),
  };
}

// Great-circle distance in kilometres (haversine). Accurate to metres at
// city scale, which is far more than "1.4 km away" needs.
export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// How far along the route the courier is, 0 to 1.
function progress(order, stage, now) {
  if (stage === "kitchen") return 0;
  if (stage !== "on-the-way") return 1;
  const seconds = (now - Date.parse(order.placedAt)) / 1000;
  return Math.min(1, Math.max(0, (seconds - KITCHEN_SECONDS) / (DELIVERY_SECONDS - KITCHEN_SECONDS)));
}

// What the receipt's map and the text beside it need, and nothing else:
// two points, a name, a distance and two times. `at` is the server's clock
// when this was computed, so the browser can say "in 2 minutes" against the
// same instant the server meant (lib/format.js, relative()).
export function tracking(order, now = Date.now()) {
  const stage = orderStage(order, now);
  const drop = dropPoint(order);
  const share = progress(order, stage, now);
  const courier =
    stage === "cancelled"
      ? null
      : {
          name: COURIERS[hash(order.id) % COURIERS.length],
          lat: round(KITCHEN.lat + (drop.lat - KITCHEN.lat) * share),
          lng: round(KITCHEN.lng + (drop.lng - KITCHEN.lng) * share),
        };

  return {
    kitchen: KITCHEN,
    drop,
    courier,
    // One decimal: "1.4 km". A courier 30 m away is "0 km", and arrives
    // within the next frame anyway.
    remainingKm: courier ? Math.round(distanceKm(courier, drop) * 10) / 10 : null,
    etaAt: new Date(Date.parse(order.placedAt) + DELIVERY_SECONDS * 1000).toISOString(),
    at: new Date(now).toISOString(),
  };
}
