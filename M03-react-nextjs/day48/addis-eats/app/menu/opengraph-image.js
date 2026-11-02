import { ImageResponse } from "next/og";
import { OG_SIZE, ogCard, photoDataUrl } from "@/components/OgCard";
import { readMenu } from "@/lib/menu";
import { etb } from "@/lib/format";
import { dishPhoto } from "@/lib/photos";

// Day 44: the menu's own preview picture — the deck's "section OG image".
//
// It is here for a second reason, found by checking the page source rather
// than trusting the code. /menu's page sets `openGraph` (for its og:url), and
// metadata merges shallowly: that object replaced the root's, *including* the
// og:image app/opengraph-image.js had put there. /menu's <head> had no
// og:image at all. An image file in a page's own folder is merged after the
// page's metadata, so this one survives — the same reason `/` (whose page sits
// beside app/opengraph-image.js) and the dish pages (beside theirs) kept
// theirs. SEO.md has the details.
//
// Under app/menu/ it would also be the picture for every page below /menu,
// but each dish has its own in app/menu/[id]/, which is nearer.
//
// The count and the cheapest price come from the menu file, so the card is
// revalidated with the menu.
export const alt = "A plate of tibs beside the words The menu, with how many dishes there are and the lowest price in birr";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image() {
  const dishes = await readMenu();
  const cheapest = Math.min(...dishes.map((dish) => dish.price));

  return new ImageResponse(
    ogCard({
      eyebrow: "Addis Eats",
      title: "The menu",
      price: `From ${etb(cheapest)}`,
      text: `${dishes.length} dishes: mains, sides, drinks and desserts, cooked in Addis Ababa.`,
      photoSrc: await photoDataUrl(dishPhoto("tibs")),
    }),
    { ...size },
  );
}
