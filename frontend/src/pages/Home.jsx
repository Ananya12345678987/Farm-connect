import SectionHeading from "../components/SectionHeading/SectionHeading";
import Button from "../components/Button/Button";

const BLOCKS = [
  { id: "how-it-works", title: "How it works" },
  { id: "for-farmers", title: "For farmers" },
  { id: "for-buyers", title: "For buyers" },
  { id: "get-started", title: "Get started" },
];

export default function Home() {
  return (
    <>
      <section
        className="u-page"
        style={{ paddingTop: "calc(var(--nav-h) + 4rem)", minHeight: "90vh" }}
      >
        <p className="u-eyebrow">Farmers and buyers, trading direct</p>
        <h1 style={{ fontSize: "var(--fs-display)", color: "var(--c-forest)" }}>
          FarmConnect
        </h1>
        <Button to="/#how-it-works" size="lg">
          See how it works
        </Button>
      </section>

      {BLOCKS.map((block) => (
        <section
          key={block.id}
          id={block.id}
          className="u-page u-section"
          style={{ minHeight: "80vh" }}
        >
          <SectionHeading
            title={block.title}
            lead="Placeholder section, replaced by the real one soon."
          />
        </section>
      ))}
    </>
  );
}