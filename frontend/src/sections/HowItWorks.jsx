import SectionHeading from "../components/SectionHeading/SectionHeading";
import Reveal from "../components/Reveal/Reveal";
import { STEPS } from "../data/site";
import "./HowItWorks.css";

/**
 * Four steps.
 *
 * The numbers are kept because this genuinely is a sequence — a farmer cannot
 * list before being verified, and a buyer cannot find a listing that does not
 * exist. The connecting line between them is drawn once as the section
 * scrolls into view.
 */
export default function HowItWorks() {
  return (
    <section className="how u-section" id="how-it-works" aria-labelledby="how-title">
      <div className="u-page">
        <SectionHeading
          id="how-title"
          title="How a crop gets from a field to a buyer"
          lead="Four steps, and the platform only touches the first three."
        />

        <ol className="how__track">
          <Reveal className="how__line" variant="fade" aria-hidden="true" />

          {STEPS.map((step, index) => (
            <Reveal as="li" className="how__step" key={step.id} stagger={index} step={130}>
              <span className="how__num u-tnum">
                {String(step.id).padStart(2, "0")}
              </span>
              <span className="how__node" aria-hidden="true" />
              <h3 className="how__step-title">{step.title}</h3>
              <p className="how__step-body">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}