import SectionHeading from "../components/SectionHeading/SectionHeading";
import FeatureCard from "../components/FeatureCard/FeatureCard";
import Reveal from "../components/Reveal/Reveal";
import { VALUE_POINTS } from "../data/site";
import "./WhyFarmConnect.css";

const FIGURES = {
  direct: { figure: "1", label: "step between farm and buyer" },
  pricing: { figure: "0", label: "commission taken on a sale" },
  verified: { figure: "2 days", label: "to verify a new farm" },
  simple: { figure: "~60s", label: "to publish a listing" },
};

export default function WhyFarmConnect() {
  return (
    <section className="why u-section" aria-labelledby="why-title">
      <div className="u-page">
        <SectionHeading
          id="why-title"
          title="What is different about selling here"
          lead="Four decisions that shape the whole platform. Each one costs us something, which is how you can tell they are real."
        />

        <div className="why__grid">
          {VALUE_POINTS.map((point, index) => (
            <Reveal key={point.id} stagger={index} step={90}>
              <FeatureCard
                title={point.title}
                body={point.body}
                figure={FIGURES[point.id]?.figure}
                figureLabel={FIGURES[point.id]?.label}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}