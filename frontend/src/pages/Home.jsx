import Hero from "../components/Hero/Hero";
import SectionHeading from "../components/SectionHeading/SectionHeading";
import ValueStatement from "../sections/ValueStatement";
import WhyFarmConnect from "../sections/WhyFarmConnect";
import HowItWorks from "../sections/HowItWorks";
import FarmerSection from "../sections/FarmerSection";
import Stats from "../sections/Stats";
import PlatformFeatures from "../sections/PlatformFeatures";

/* Placeholder for sections that arrive in the next commits. */
function Placeholder({ id, title }) {
  return (
    <section id={id} className="u-page u-section" style={{ minHeight: "50vh" }}>
      <SectionHeading
        title={title}
        lead="Placeholder section, replaced by the real one soon."
      />
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <ValueStatement />
      <WhyFarmConnect />
      <HowItWorks />
      <FarmerSection />
      <Placeholder id="for-buyers" title="For buyers" />
      <Stats />
      <PlatformFeatures />
      <Placeholder id="get-started" title="Get started" />
    </>
  );
}