// Day 38: a server component again. No directive, no hooks.
//
// On Days 36 and 37 this file began with "use client", because the card read
// the cart store. Only two things on it actually do: the Add button and the
// "in order" count. They are now AddToCartButton.jsx, and the rest of the card
// is rendered on the server and arrives as HTML. In the browser, this file's
// code does not exist: search the /menu chunks for "dish__head" and nothing is
// found (the README has the check).
import Image from "next/image";
import Link from "next/link";
import PropTypes from "prop-types";
import { etb } from "@/lib/format";
import { dishPhoto } from "@/lib/photos";
import AddToCartButton from "./AddToCartButton";

// Day 43: the card has a photograph, through next/image. The card stays a
// server component; the <img> and its srcset are in the HTML.
//
// How wide a card is, at every width of the window — the honest `sizes`.
// Worked out from the CSS, not guessed (PERF.md has the arithmetic):
//
//   up to 585px    one column, the page less its padding  ≈ 100vw − 50px
//   586–760px      two columns                            ≈ 50vw − 33px
//   761–817px      sidebar appears; one column again      ≈ 100vw − 282px
//   818–1093px     two columns beside the sidebar         ≈ 50vw − 149px
//   1094px and up  three columns in a 1126px page         = 271px
//
// On Lighthouse's phone (412px wide, 1.75× pixels) that is 362px, so the
// browser takes the 640w file. Without `sizes`, next/image would treat the
// file's 1200px as the display width and offer only 1× and 2× of it: the
// phone would download the whole 1200-pixel photo for a 362-pixel card.
const CARD_SIZES =
  "(max-width: 585px) calc(100vw - 50px), (max-width: 760px) calc(50vw - 33px), " +
  "(max-width: 817px) calc(100vw - 282px), (max-width: 1093px) calc(50vw - 149px), 271px";

function Dish({ dish, lcpCandidate = false }) {
  const photo = dishPhoto(dish.slug);
  return (
    <article className="dish">
      {/* No photo for two dishes (lib/photos.js says why); the card simply
          starts with its name. width and height are the file's pixels — they
          set the aspect ratio, and CSS sets the size.

          Every card's photo is lazy (next/image's default) except the first
          one's, which is the page's LCP element: loaded at once, at high
          priority. Not `preload` — DishList.jsx says why. */}
      {photo && (
        <Image
          className="dish__photo"
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes={CARD_SIZES}
          loading={lcpCandidate ? "eager" : "lazy"}
          fetchPriority={lcpCandidate ? "high" : undefined}
        />
      )}
      <div className="dish__head">
        <h2>
          {/* next/link is a client component; a server component may render
              it like any other. Its href is a string — data, so it crosses. */}
          <Link className="tap" href={`/menu/${dish.slug}`}>{dish.name}</Link>
        </h2>
        <p className="dish__price">{etb(dish.price)}</p>
      </div>

      {dish.description && <p className="dish__note">{dish.description}</p>}

      <div className="dish__foot">
        {dish.spicy === true && <span className="dish__tag">🌶️ Spicy</span>}

        {/* The boundary. `dish` is a plain object, so it can be passed; an
            onAdd={…} callback could not — a function cannot be sent from the
            server to the browser. The button reaches the store itself. */}
        <AddToCartButton dish={dish} />
      </div>
    </article>
  );
}

Dish.propTypes = {
  dish: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    spicy: PropTypes.bool,
    description: PropTypes.string,
  }).isRequired,
  lcpCandidate: PropTypes.bool,
};

export default Dish;
