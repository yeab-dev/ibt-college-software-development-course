import Image from "next/image";
import PropTypes from "prop-types";

// Day 43: a photograph with its credit underneath — the home page's platter
// and the dish page's dish.
//
// A server component. next/image is a client component, but a server
// component may render it like next/link; what reaches the browser is an
// <img> with a srcset, already in the HTML.
//
// `sizes` is required here rather than defaulted, because only the caller
// knows how wide its column is. Without it the browser assumes the photo is
// as wide as the screen and picks from the srcset accordingly — on a desktop,
// a 1920-pixel file for a 640-pixel column.
//
// `preload` is passed through for the one page-sized image that is the LCP
// element. See PERF.md for why it is `preload` and not the course's
// `priority`.
function CreditedPhoto({ photo, sizes, preload = false }) {
  return (
    <figure className="photo">
      <Image
        className="photo__img"
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes={sizes}
        preload={preload}
      />
      <figcaption className="photo__credit">
        <a href={photo.source}>{photo.credit}</a>
      </figcaption>
    </figure>
  );
}

CreditedPhoto.propTypes = {
  photo: PropTypes.shape({
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    credit: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired,
  }).isRequired,
  sizes: PropTypes.string.isRequired,
  preload: PropTypes.bool,
};

export default CreditedPhoto;
