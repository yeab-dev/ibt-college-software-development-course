import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Day 44: the picture a link preview shows, drawn as JSX.
//
// Not a React component that ends up in a page. app/opengraph-image.js and
// app/menu/[id]/opengraph-image.js hand what this returns to ImageResponse
// (next/og), which renders it to a 1200 × 630 PNG on the server with Satori.
// Satori understands a subset of CSS: flexbox, absolute positioning, basic
// box and text properties. No grid, no stylesheet, no class names — every
// style is inline, and every <div> with more than one child needs
// display: flex, or the image fails to render. It fails without much of a
// message, which is why the README's checks fetch both images.
//
// No emoji (the 🌶️ the cards show): Satori would download an emoji font from
// a CDN while rendering. No Fraunces either: next/font serves woff2, which
// Satori cannot read. The card uses next/og's bundled sans-serif.

// The size every platform expects. Anything else is cropped by the platform,
// usually through the middle of the text.
export const OG_SIZE = { width: 1200, height: 630 };

// The dark palette from globals.css, so the card looks like the site.
const BG = "#16171d";
const TEXT = "#f3f4f6";
const MUTED = "#9ca3af";
const ACCENT = "#c084fc";

// A photo from public/dishes/, as a data: URL. Satori cannot fetch "/dishes/
// kitfo.jpg" from the site (there is no site while the build runs), so the
// file is read from disk and inlined into the image.
export async function photoDataUrl(photo) {
  const file = await readFile(path.join(process.cwd(), "public", photo.src));
  return `data:image/jpeg;base64,${file.toString("base64")}`;
}

// `photoSrc` is optional: two dishes have no photograph (lib/photos.js), and
// their card is text across the whole width.
export function ogCard({ eyebrow, title, price, text, photoSrc }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: BG }}>
      {photoSrc && (
        // A square crop of the 3:2 photo, the left half of the card.
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        <img
          src={photoSrc}
          width={630}
          height={630}
          style={{ width: 630, height: 630, objectFit: "cover" }}
        />
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 56px 48px",
          color: TEXT,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, letterSpacing: 4, color: ACCENT, textTransform: "uppercase" }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: photoSrc ? 68 : 84, lineHeight: 1.1, marginTop: 24 }}>{title}</div>
          {price && <div style={{ fontSize: 44, color: ACCENT, marginTop: 20 }}>{price}</div>}
          <div style={{ fontSize: 30, lineHeight: 1.35, color: MUTED, marginTop: 28 }}>{text}</div>
        </div>
        <div style={{ fontSize: 24, color: MUTED }}>Delivered across Addis Ababa</div>
      </div>
    </div>
  );
}
