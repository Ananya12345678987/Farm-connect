import Button from "../components/Button/Button";
import ContourField from "../components/ContourField/ContourField";
import "./NotFound.css";

export default function NotFound() {
  return (
    <section className="nf" aria-labelledby="nf-title">
      <ContourField tone="ink" className="nf__contour" />

      <div className="u-page nf__inner">
        <p className="u-eyebrow">That page is not here</p>
        <h1 className="nf__title" id="nf-title">
          This plot has nothing planted on it.
        </h1>
        <p className="nf__lead">
          The address you followed does not match anything on FarmConnect. The
          marketplace is one step away.
        </p>
        <div className="nf__actions">
          <Button to="/" size="lg">
            Back to home
          </Button>
          <Button to="/#for-buyers" size="lg" variant="secondary">
            Browse listings
          </Button>
        </div>
      </div>
    </section>
  );
}