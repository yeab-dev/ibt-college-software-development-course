import PropTypes from "prop-types";

// Day 44: structured data, as a <script type="application/ld+json"> in the
// page's HTML. A server component: the object is built on the server from
// the same record the page renders, and arrives as text a crawler reads
// without running any JavaScript.
//
// A plain <script>, not next/script. JSON-LD is data, not code to run, so
// there is nothing to schedule (the installed json-ld guide says the same).
//
// The one line that is not in the slides: `.replace(/</g, "\\u003c")`.
// JSON.stringify does not escape "<", so a dish description containing
// "</script>" would end the tag early and whatever followed would be read as
// HTML — a script injection. "<" is still "<" to a JSON parser, and
// never a tag to the HTML parser. The guide in
// node_modules/next/dist/docs/01-app/02-guides/json-ld.md does exactly this.
function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

JsonLd.propTypes = {
  data: PropTypes.object.isRequired,
};

export default JsonLd;
