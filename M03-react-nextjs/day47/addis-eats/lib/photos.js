import photos from "@/data/photos.json";

// Day 43: the photographs, and everything a page needs to draw one honestly.
//
// Each entry in data/photos.json carries five things next/image needs or a
// reader deserves:
//
//   src            a file in public/dishes/, cropped to 3:2 and saved at
//                  1200 × 800 — roughly the largest size it is ever shown at
//                  on a 2× screen. Not a camera original: the reading sheet's
//                  "upload at roughly display size". next/image resizes from
//                  this file, so it is the ceiling, not what is sent.
//   width, height  the file's real pixels. next/image writes them onto the
//                  <img>, which gives the browser the aspect ratio before a
//                  byte of the photo has arrived. That is the reserved space.
//   alt            what the photograph shows, written for someone who cannot
//                  see it — not "image", and not the dish name again.
//   credit, source the photographer and licence. The photos are from
//                  Wikimedia Commons, under CC BY / CC BY-SA or public
//                  domain; the licences ask for the credit, and the dish page
//                  and the home page print it under the photo.
//
// Kept apart from data/menu.json on purpose. The menu is what the kitchen
// sells, and GET /api/dishes returns it to the browser as search results; a
// photograph's alt text and licence are presentation, used only by server
// components. Putting them in menu.json would have sent them to every search.
//
// Two dishes have no photo: ambo-water and kolo-cake. Commons has no free
// photograph of either, and a stock picture of some other cake would be a
// picture of the wrong thing. Their cards render without one — see Dish.jsx.

export const heroPhoto = photos.hero;

export function dishPhoto(slug) {
  return photos.dishes[slug] ?? null;
}
