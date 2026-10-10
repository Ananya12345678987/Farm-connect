import Reveal from "../components/Reveal/Reveal";
import ContourField from "../components/ContourField/ContourField";
import SectionHeading from "../components/SectionHeading/SectionHeading";
import CallToAction from "../sections/CallToAction";
import { ABOUT, STEPS } from "../data/site";
import "./About.css";

/**
 * About, told as the arithmetic of the problem rather than a wall of company
 * prose. The page reuses the home page's CTA so the two stay in step.
 */
export default function About() {
  return (
    <>
      <section className="about-hero" aria-labelledby="about-title">
        <ContourField tone="ink" className="about-hero__contour" />

        <div className="u-page about-hero__inner">
          <p className="u-eyebrow">Why we built this</p>
          <h1 className="about-hero__title" id="about-title">
            The grower is the only person in the chain who cannot set the price.
          </h1>
          <p className="about-hero__lead">
            FarmConnect is a marketplace built to change that one thing.
          </p>
        </div>
      </section>

      <section className="about-story u-section" aria-labelledby="about-story-title">
        <div className="u-page about-story__inner">
          <Reveal className="about-story__heading">
            <h2 id="about-story-title">What FarmConnect is</h2>
          </Reveal>

          <div className="about-story__body">
            {ABOUT.story.map((paragraph, index) => (
              <Reveal as="p" key={paragraph.slice(0, 24)} stagger={index} step={90}>
                {paragraph}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-pillars" aria-labelledby="about-pillars-title">
        <div className="u-page">
          <h2 className="u-sr" id="about-pillars-title">
            Mission and vision
          </h2>

          <div className="about-pillars__grid">
            <Reveal className="about-pillar">
              <h3>Mission</h3>
              <p>{ABOUT.mission}</p>
            </Reveal>
            <Reveal className="about-pillar" delay={120}>
              <h3>Vision</h3>
              <p>{ABOUT.vision}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="about-how u-section" aria-labelledby="about-how-title">
        <div className="u-page">
          <SectionHeading
            id="about-how-title"
            title="Who it helps, and how"
            lead="The same four steps, read from both sides of the trade."
          />

          <div className="about-how__grid">
            <Reveal className="about-how__col">
              <h3>For the farmer</h3>
              <ul>
                <li>A verified listing that names your farm, not a lot number.</li>
                <li>The rate you entered is the rate a buyer sees.</li>
                <li>Buyers in districts your mandi never reached.</li>
                <li>A record of every sale, useful at loan time.</li>
              </ul>
            </Reveal>

            <Reveal className="about-how__col" delay={120}>
              <h3>For the buyer</h3>
              <ul>
                <li>Grade, moisture and harvest date before you commit.</li>
                <li>One conversation with the grower instead of four with agents.</li>
                <li>Filters that respect what you can actually collect.</li>
                <li>The same farms, season after season.</li>
              </ul>
            </Reveal>
          </div>

          <ol className="about-how__steps">
            {STEPS.map((step) => (
              <li key={step.id}>
                <span className="u-tnum">{String(step.id).padStart(2, "0")}</span>
                <p>{step.title}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CallToAction />
    </>
  );
}