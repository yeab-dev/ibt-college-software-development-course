import { ImageResponse } from "next/og";
import { OG_SIZE, ogCard, photoDataUrl } from "@/components/OgCard";
import { heroPhoto } from "@/lib/photos";

// Day 44: the site-wide preview picture, by file name.
//
// Being called opengraph-image.js in app/ is the whole configuration: Next.js
// serves the image at /opengraph-image and adds og:image (with its width,
// height, type and alt) to every page in the app — unless a folder nearer the
// page has its own, as app/menu/[id]/ does. Like the Day 36 special files, it
// works by existing. The twitter:image tag is copied from it too.
//
// Generated rather than a .jpg dropped in, so it is the same card as the
// dishes' and the words on it are text in this file, not pixels in a design
// tool. It reads nothing from the request, so the build renders it once and
// serves the PNG as a static file.
export const alt = "Addis Eats: a tray of injera with eight stews, and the words Ethiopian dishes delivered across Addis Ababa";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    ogCard({
      eyebrow: "Addis Eats",
      title: "Ethiopian food, delivered",
      text: "Doro Wat, Tibs, Kitfo and Shiro from one Addis Ababa kitchen. Paid with TeleBirr.",
      photoSrc: await photoDataUrl(heroPhoto),
    }),
    { ...size },
  );
}
