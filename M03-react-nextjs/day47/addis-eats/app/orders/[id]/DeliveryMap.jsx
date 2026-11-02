"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import { useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";

// Day 47. The map itself: Leaflet, through react-leaflet. Only ever loaded by
// MapPanel.jsx's dynamic(…, { ssr: false }) — importing this file anywhere
// the server renders would crash on Leaflet's first look at `window`.
//
// The three things the deck says people forget, all here:
//
//   1. the stylesheet: `import "leaflet/dist/leaflet.css"` above. Without it
//      the tiles render as a scattered mosaic and the controls unstyled.
//      Next.js bundles it into this chunk's CSS, so it too loads only with
//      the map.
//   2. an explicit height: .delivery-map is 320 px (globals.css). Leaflet
//      fills its container, and a container with no height is 0 px tall.
//   3. the attribution: OpenStreetMap's tiles are free on condition that the
//      map says where they come from. It is a licence condition, not
//      decoration, so it stays in the corner.
//
// Composition, as with the charts: tiles, markers and the route line are
// children of the container. Adding a courier was adding a <Marker>.

// The tile URL without the slides' {s} subdomains (a., b., c.): OSM's tile
// usage policy now asks for the single tile.openstreetmap.org host. The
// public server is for light use — fine for coursework, not for a business —
// so the map is only drawn for an order still on its way (Tracking.jsx), it
// does not zoom on the scroll wheel (fewer accidental tile loads, and the
// page still scrolls), and maxZoom is the server's own 19.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Pins made of HTML and CSS (L.divIcon) rather than Leaflet's default image
// pin, whose PNGs a bundler does not find (a known Leaflet-with-bundlers
// problem) — and a word on each pin, so the two are told apart by what they
// say, not only by colour. Built once, at module level, like a formatter.
const COURIER_PIN = L.divIcon({
  className: "map-pin map-pin--courier",
  html: "<span>Courier</span>",
  iconSize: [76, 28],
  iconAnchor: [38, 28],
});
const DROP_PIN = L.divIcon({
  className: "map-pin map-pin--drop",
  html: "<span>You</span>",
  iconSize: [48, 28],
  iconAnchor: [24, 28],
});

// The straight line still to travel: dashed, because it is not a road.
const ROUTE = { color: "#6d28d9", weight: 3, dashArray: "6 6" };

// Leaflet takes [latitude, longitude]. GeoJSON is [longitude, latitude];
// this is the one place an object becomes an array, so the order is decided
// once.
const toLatLng = (point) => [point.lat, point.lng];

export default function DeliveryMap({ courier, drop }) {
  // Fit the view to both markers, once, when the map is created. The
  // courier only ever moves along the line between where it started and
  // the delivery point, so everything it will do from here stays inside
  // these bounds — no refitting while someone is looking at (or has
  // panned) the map. `bounds` is read by MapContainer at creation only.
  // (useState's initialiser: computed on the first render, then kept.)
  const [bounds] = useState(() =>
    L.latLngBounds(courier ? [toLatLng(courier), toLatLng(drop)] : [toLatLng(drop)]),
  );

  // Leaflet makes the map's box focusable (arrow keys pan it). This names it
  // for a screen reader, which then finds the same facts in words beside it.
  // MapContainer passes only className, id and style to its <div>, so the
  // label is set on Leaflet's container once the map exists.
  const label = `Map of the delivery to ${drop.area}. The same information is given in words beside the map.`;

  return (
    <MapContainer
      className="delivery-map"
      bounds={bounds}
      boundsOptions={{ padding: [40, 40], maxZoom: 16 }}
      scrollWheelZoom={false}
      whenReady={(event) => event.target.getContainer().setAttribute("aria-label", label)}
    >
      <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
      {courier && (
        <Polyline positions={[toLatLng(courier), toLatLng(drop)]} pathOptions={ROUTE} />
      )}
      <Marker position={toLatLng(drop)} icon={DROP_PIN} title={`Delivery point in ${drop.area}`}>
        <Tooltip direction="bottom" offset={[0, 4]}>
          Around here, in {drop.area}
        </Tooltip>
      </Marker>
      {courier && (
        // react-leaflet moves an existing marker when `position` changes
        // (setLatLng), so each pushed frame slides this one pin along.
        <Marker position={toLatLng(courier)} icon={COURIER_PIN} title={`${courier.name}, your courier`} zIndexOffset={1000}>
          <Tooltip direction="bottom" offset={[0, 4]}>
            {courier.name}, your courier
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}

DeliveryMap.propTypes = {
  courier: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number, name: PropTypes.string }),
  drop: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number, area: PropTypes.string }).isRequired,
};
