"use client";

import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import { useOrder } from "./useOrder";

// Day 47. The map's door: a small client component whose one job is to load
// the real map (DeliveryMap.jsx) in the browser only.
//
// Leaflet touches `window` the moment it is imported. Rendered on the server
// it would crash the render (there is no window there), so it must never be
// imported by anything the server renders — and every client component *is*
// rendered on the server once, for the HTML. next/dynamic with ssr: false
// is the way out: the server renders `loading` instead, and the browser
// fetches DeliveryMap's chunk (Leaflet, react-leaflet and the stylesheet)
// after hydration. Here ssr: false is not an optimisation, it is the only way
// the library loads at all.
//
// Why this file exists at all, rather than one dynamic() call in page.js:
// `ssr: false` is not allowed in a server component. The installed docs say
// it in so many words (node_modules/next/dist/docs/01-app/02-guides/
// lazy-loading.md: "ssr: false is not allowed with next/dynamic in Server
// Components. Please move it into a Client Component."), and the receipt page
// is a server component. So the call lives in a "use client" file, as the
// slides' app/track/MapPanel.jsx does.
//
// The placeholder is exactly the map's height (.delivery-map, 320 px in
// globals.css, the same class the map itself gets), so nothing below it moves
// when the map replaces it: no layout shift, measured in the README.
const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="delivery-map delivery-map--placeholder" aria-hidden="true">
      Loading the map…
    </div>
  ),
});

// It also reads the live order (the stream's frames land in this query) and
// hands the map plain numbers, so DeliveryMap needs to know nothing about
// SWR or streams.
export default function MapPanel({ orderId, initial }) {
  const { data: order } = useOrder(orderId, initial);
  const { courier, drop } = order.tracking;
  return (
    <DeliveryMap
      courier={courier && { lat: courier.lat, lng: courier.lng, name: courier.name }}
      drop={{ lat: drop.lat, lng: drop.lng, area: drop.area }}
    />
  );
}

MapPanel.propTypes = {
  orderId: PropTypes.string.isRequired,
  initial: PropTypes.shape({
    tracking: PropTypes.shape({ drop: PropTypes.object.isRequired }).isRequired,
  }).isRequired,
};
