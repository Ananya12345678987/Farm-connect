import StatCard from "../components/StatCard/StatCard";
import ContourField from "../components/ContourField/ContourField";
import useReveal from "../hooks/useReveal";
import useReducedMotion from "../hooks/useReducedMotion";
import { STATS } from "../data/site";
import "./Stats.css";

export default function Stats() {
  const reduced = useReducedMotion();
  const [ref, revealed] = useReveal({ threshold: 0.35, disabled: reduced });

  return (
    <section className="statsx" ref={ref} aria-labelledby="statsx-title">
      <ContourField tone="ivory" className="statsx__contour" />

      <div className="u-page statsx__inner">
        <h2 className="statsx__title" id="statsx-title">
          Where the platform stands today
        </h2>

        <div className="statsx__grid">
          {STATS.map((stat, index) => (
            <StatCard
              key={stat.id}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              caption={stat.caption}
              active={revealed}
              delay={index * 90}
            />
          ))}
        </div>
      </div>
    </section>
  );
}