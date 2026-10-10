import Reveal from "../components/Reveal/Reveal";
import "./ValueStatement.css";

/**
 * The transition out of the hero. One sentence set at display size, plus the
 * arithmetic that makes the argument concrete — the price gap is the whole
 * reason this product exists, so it is stated as a number rather than a claim.
 */
export default function ValueStatement() {
  return (
    <section className="value" id="value" aria-labelledby="value-title">
      <div className="u-page value__inner">
        <Reveal>
          <h2 className="value__title" id="value-title">
            From the field to the market, without the four stops in between.
          </h2>
        </Reveal>

        <div className="value__ledger">
          <Reveal className="value__row" stagger={0} step={110}>
            <span className="value__row-label">What the farmer is paid today</span>
            <span className="value__row-figure u-tnum">₹8</span>
          </Reveal>

          <Reveal className="value__row" stagger={1} step={110}>
            <span className="value__row-label">What the kitchen pays today</span>
            <span className="value__row-figure u-tnum">₹40</span>
          </Reveal>

          <Reveal className="value__row value__row--accent" stagger={2} step={110}>
            <span className="value__row-label">Taken by people who grew nothing</span>
            <span className="value__row-figure u-tnum">₹32</span>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <p className="value__note">
            A kilo of tomatoes leaving Kolar changes hands four times before it
            is cooked. FarmConnect removes the hands that only add cost.
          </p>
        </Reveal>
      </div>
    </section>
  );
}