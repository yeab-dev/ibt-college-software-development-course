import { apiError } from "@/lib/apiError";
import { getDishSlugs, readMenu } from "@/lib/menu";

// GET /api/dishes/kitfo      → 200, the dish
// GET /api/dishes/not-a-dish → 404, { "error": "No such dish" }
//
// The path parameter arrives in the second argument, as it does on a page —
// and, as on a page since Next.js 15, `params` is a Promise. (The slides
// write `params.id` directly; that was the Next.js 14 API.) The id is the
// same slug /menu/[id] uses, so a dish has one name in both URLs.
//
// The honest 404: an unknown id is "no such thing", not an empty 200 and not
// a 500. The body has the same shape as every other failure.
//
// Day 40: static via params, refreshed hourly — the route whose strategy
// changed when the reason was written down. Day 39 left it dynamic, "so the
// endpoint and the file never disagree". Asked the Day 40 questions, that did
// not hold up: nobody in particular is asking, so it can be static; an hour
// is the staleness /menu/kitfo already accepts for the same dish and price,
// so the two cannot disagree any more than the page and the list do; and
// every id is known at build time. So it is built the way the dish page is:
// thirteen JSON responses prerendered by the build (● in the output), and an
// unlisted slug answered on request, as a 404.
export async function generateStaticParams() {
  const slugs = await getDishSlugs();
  return slugs.map((slug) => ({ id: slug }));
}

export const revalidate = 3600;

export async function GET(request, { params }) {
  const { id } = await params;
  const dishes = await readMenu();
  const dish = dishes.find((d) => d.slug === id);

  if (!dish) {
    return apiError(404, "No such dish");
  }
  return Response.json(dish);
}
