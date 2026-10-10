import Hero from "../components/Hero/Hero";
import SectionHeading from "../components/SectionHeading/SectionHeading";
import ValueStatement from "../sections/ValueStatement";
import WhyFarmConnect from "../sections/WhyFarmConnect";
import HowItWorks from "../sections/HowItWorks";

/* Placeholders for sections that arrive in the next commit. */
const BLOCKS = [
  { id: "for-farmers", title: "For farmers" },
  { id: "for-buyers", title: "For buyers" },
  { id: "get-started", title: "Get started" },
];

export default function Home() {
  return (
    <>
      <Hero />
      <ValueStatement />
      <WhyFarmConnect />
      <HowItWorks />

      {BLOCKS.map((block) => (
        <section
          key={block.id}
          id={block.id}
          className="u-page u-section"
          style={{ minHeight: "60vh" }}
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