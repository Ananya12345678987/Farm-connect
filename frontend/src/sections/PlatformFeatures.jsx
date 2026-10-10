import SectionHeading from "../components/SectionHeading/SectionHeading";
import Reveal from "../components/Reveal/Reveal";
import { PLATFORM_FEATURES } from "../data/site";
import "./PlatformFeatures.css";

export default function PlatformFeatures() {
  return (
    <section className="pfeat u-section" aria-labelledby="pfeat-title">
      <div className="u-page">
        <SectionHeading
          id="pfeat-title"
          title="Built for the conditions it actually runs in"
          lead="Patchy signal, mid-range phones, and a season that does not wait for a sync to finish."
        />

        <div className="pfeat__grid">
          {PLATFORM_FEATURES.map((feature, index) => (
            <Reveal className="pfeat__item" key={feature.id} stagger={index} step={80}>
              <h3 className="pfeat__title">{feature.title}</h3>
              <p className="pfeat__body">{feature.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}