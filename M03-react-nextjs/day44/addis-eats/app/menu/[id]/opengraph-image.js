import { ImageResponse } from "next/og";
import { OG_SIZE, ogCard, photoDataUrl } from "@/components/OgCard";
import { getDishSlugs, readDish } from "@/lib/menu";
import { dishPhoto } from "@/lib/photos";

// Day 44: one preview picture per dish, generated.
//
// Sitting in app/menu/[id]/, it overrides app/opengraph-image.js for every
// dish page, and receives the same `params` the page does (a Promise, since
// Next.js 16 — the slides' `params.id` without `await` is the Next.js 14
// form). Thirteen dishes get thirteen cards: photo, name, price, sentence.
//
// The price on the card is the price on the page, from the same record. So
// the image keeps the page's window: prerendered for every known slug, then
// regenerated at most hourly (STRATEGY.md has the row).
export const alt = "The dish's photograph beside its name, price in birr and a sentence about it";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getDishSlugs();
  return slugs.map((slug) => ({ id: slug }));
}

export default async function Image({ params }) {
  const { id } = await params;
  // readDish, not getDish: no 900 ms teaching delay for a request nobody
  // watches load.
  const dish = await readDish(id);
  const photo = dish && dishPhoto(dish.slug);

  return new ImageResponse(
    dish
      ? ogCard({
          eyebrow: `Addis Eats · ${dish.category}`,
          title: dish.name,
          price: `${dish.price} ${dish.currency}`,
          text: dish.description,
          photoSrc: photo ? await photoDataUrl(photo) : null,
        })
      : ogCard({ eyebrow: "Addis Eats", title: "Not on the menu", text: "Have a look at today's dishes." }),
    { ...size },
  );
}
