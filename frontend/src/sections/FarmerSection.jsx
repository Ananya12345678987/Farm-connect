import { FiArrowRight, FiCheck } from "react-icons/fi";

import Button from "../components/Button/Button";
import Reveal from "../components/Reveal/Reveal";
import useScrollSignal from "../hooks/useScrollSignal";
import useReducedMotion from "../hooks/useReducedMotion";
import { FARMER_BENEFITS } from "../data/site";
import "./FarmerSection.css";

export default function FarmerSection() {
  const reduced = useReducedMotion();
  const ref = useScrollSignal(!reduced);

  return (
    <section
      className="farmerx u-section"
      id="for-farmers"
      ref={ref}
      aria-labelledby="farmerx-title"
    >
      <div className="u-page farmerx__inner">
        <Reveal className="farmerx__media" variant="mask">
          <figure className="farmerx__frame">
            <img
              src="/images/farm.jpg"
              alt="A farmer's fields at first light, planted in rows"
              width="626"
              height="417"
              loading="lazy"
              decoding="async"
            />
          </figure>

          <div className="farmerx__quote">
            <p className="farmerx__quote-text">
              I used to take whatever the agent offered at the gate. Now the
              rate on my listing is the rate I get.
            </p>
            <p className="farmerx__quote-by">
              Shivamma Gowda · Gowda Thota, Kolar
            </p>
          </div>
        </Reveal>

        <div className="farmerx__copy">
          <Reveal>
            <h2 className="farmerx__title" id="farmerx-title">
              You grew it. You should name its price.
            </h2>
            <p className="farmerx__lead">
              Everything a farmer needs is one screen and four fields. No
              dashboard training, no desktop, no agent.
            </p>
          </Reveal>

          <ul className="farmerx__list">
            {FARMER_BENEFITS.map((benefit, index) => (
              <Reveal as="li" key={benefit.id} stagger={index} step={70}>
                <span className="farmerx__tick" aria-hidden="true">
                  <FiCheck />
                </span>
                <span>
                  <strong>{benefit.title}</strong>
                  <span className="farmerx__list-body">{benefit.body}</span>
                </span>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={200}>
            <Button to="/farmer-register" size="lg" icon={<FiArrowRight />}>
              Join as a farmer
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}