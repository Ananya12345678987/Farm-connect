import { FiArrowRight, FiArrowDown } from "react-icons/fi";

import Button from "../Button/Button";
import ContourField from "../ContourField/ContourField";
import PlantScene from "./PlantScene";
import usePointerParallax from "../../hooks/usePointerParallax";
import useScrollSignal from "../../hooks/useScrollSignal";
import useReducedMotion from "../../hooks/useReducedMotion";
import useIsCoarsePointer from "../../hooks/useIsCoarsePointer";
import "./Hero.css";

/**
 * Hero.
 *
 * Headline chosen: "The shortest line between a field and a market."
 * It states the product's value in one image, it is short enough to set at
 * display size, and "line" ties the words to the contour motif the whole
 * site is built on.
 */

const FLOATERS = [
  { id: "seed", x: -6, y: 14, z: 60, dur: 9.5, delay: 0 },
  { id: "grain", x: 88, y: 46, z: -40, dur: 12, delay: 1.8 },
  { id: "leaf", x: 6, y: 74, z: 30, dur: 10.8, delay: 0.9 },
];

function Floater({ id, style }) {
  return (
    <span className={`hero__floater hero__floater--${id}`} style={style} aria-hidden="true">
      {id === "seed" && (
        <svg viewBox="0 0 24 24" focusable="false">
          <ellipse cx="12" cy="12" rx="6.5" ry="9.5" transform="rotate(24 12 12)" />
          <path d="M9 17c1.5-3 3.5-6 6-8" />
        </svg>
      )}
      {id === "grain" && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 21V7" />
          <ellipse cx="8" cy="9" rx="3.4" ry="1.9" transform="rotate(-34 8 9)" />
          <ellipse cx="16" cy="9" rx="3.4" ry="1.9" transform="rotate(34 16 9)" />
          <ellipse cx="8" cy="14" rx="3.4" ry="1.9" transform="rotate(-34 8 14)" />
          <ellipse cx="16" cy="14" rx="3.4" ry="1.9" transform="rotate(34 16 14)" />
        </svg>
      )}
      {id === "leaf" && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M3 20c0-9 6.5-15 18-15 0 10-7 15-18 15z" />
          <path d="M3 20C8 14 13.5 9.5 21 5" />
        </svg>
      )}
    </span>
  );
}

export default function Hero() {
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const interactive = !reduced && !coarse;

  const sectionRef = useScrollSignal(!reduced);
  const stageRef = usePointerParallax(interactive);

  return (
    <section className="hero" id="top" ref={sectionRef} aria-labelledby="hero-title">
      {/* Morning light: a warm wash that travels slowly across the field,
          plus faint low-angle rays. No visible disc, no yellow circle. */}
      <div className="hero__light" aria-hidden="true">
        <span className="hero__light-wash" />
        <span className="hero__light-rays" />
      </div>

      <ContourField tone="ink" className="hero__contour" />

      <div className="u-page hero__inner">
        <div className="hero__copy">
          <p className="u-eyebrow hero__eyebrow">Live across 25 districts</p>

          <h1 className="hero__title" id="hero-title">
            The shortest line between a field and a market.
          </h1>

          <p className="hero__lead">
            Farmers list what is ready and name their own rate. Buyers source it
            direct from the farm that grew it — no commission agents in between.
          </p>

          <div className="hero__actions">
            <Button to="/farmer-register" size="lg" icon={<FiArrowRight />}>
              List your harvest
            </Button>
            <Button to="/#for-buyers" variant="secondary" size="lg">
              Browse the marketplace
            </Button>
          </div>

          <div className="hero__proof">
            <span className="hero__proof-marks" aria-hidden="true">
              <span>SG</span>
              <span>RP</span>
              <span>KN</span>
              <span>LV</span>
            </span>
            <p className="hero__proof-text">
              <strong>500+ verified farms</strong> selling direct this season
            </p>
          </div>
        </div>

        <div className="hero__stage" ref={stageRef}>
          <figure className="hero__frame">
            <img
              src="/images/farm.jpg"
              alt="Rows of crops on terraced farmland in the early morning"
              width="626"
              height="417"
              fetchPriority="high"
              decoding="async"
            />
            <span className="hero__frame-veil" aria-hidden="true" />
          </figure>

          <div className="hero__plant">
            <PlantScene />
          </div>

          {/* Floating cards read as live marketplace data, so the decoration
              also explains what the product does. */}
          <div className="hero__card hero__card--listing">
            <span className="hero__card-dot" aria-hidden="true" />
            <div>
              <p className="hero__card-title">Nati tomatoes · ₹28/kg</p>
              <p className="hero__card-meta">Gowda Thota, Kolar · 1,200 kg ready</p>
            </div>
          </div>

          <div className="hero__card hero__card--stat">
            <p className="hero__card-stat u-tnum">₹4.1L</p>
            <p className="hero__card-meta">earned direct this season</p>
          </div>

          {!coarse &&
            FLOATERS.map((floater) => (
              <Floater
                key={floater.id}
                id={floater.id}
                style={{
                  "--fx": `${floater.x}%`,
                  "--fy": `${floater.y}%`,
                  "--fz": `${floater.z}px`,
                  "--fdur": `${floater.dur}s`,
                  "--fdelay": `${floater.delay}s`,
                }}
              />
            ))}
        </div>
      </div>

      <a className="hero__cue" href="#value">
        <span>Explore FarmConnect</span>
        <span className="hero__cue-arrow" aria-hidden="true">
          <FiArrowDown />
        </span>
      </a>
    </section>
  );
}