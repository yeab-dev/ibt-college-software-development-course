import { apiError } from "@/lib/apiError";
import { readMenu } from "@/lib/menu";

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
export async function GET(request, { params }) {
  const { id } = await params;
  const dishes = await readMenu();
  const dish = dishes.find((d) => d.slug === id);

  if (!dish) {
    return apiError(404, "No such dish");
  }
  return Response.json(dish);
}
