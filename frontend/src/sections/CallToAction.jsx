import { FiArrowRight } from "react-icons/fi";

import Button from "../components/Button/Button";
import Reveal from "../components/Reveal/Reveal";
import "./CallToAction.css";

export default function CallToAction() {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="u-page">
        <Reveal className="cta__panel">
          <div className="cta__copy">
            <h2 className="cta__title" id="cta-title">
              This season&apos;s harvest is already being listed.
            </h2>
            <p className="cta__lead">
              Registration is free for farmers and buyers alike. We do not take
              a cut of what you sell.
            </p>
          </div>

          <div className="cta__actions">
            <Button to="/farmer-register" size="lg" variant="lime" icon={<FiArrowRight />}>
              List your harvest
            </Button>
            <Button to="/buyer-register" size="lg" variant="secondary" className="cta__ghost">
              Source produce
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}