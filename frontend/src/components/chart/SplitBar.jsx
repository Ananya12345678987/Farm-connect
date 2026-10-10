import useReveal from "../../hooks/useReveal";
import useReducedMotion from "../../hooks/useReducedMotion";
import cn from "../../utils/cn";
import "./Chart.css";

/**
 * Proportional split. A single horizontal bar rather than a donut: shares are
 * far easier to compare along one axis than around a circle, and it reads at
 * any width without a legend fighting for space.
 */
export default function SplitBar({ data, caption, className }) {
  const reduced = useReducedMotion();
  const [ref, revealed] = useReveal({ threshold: 0.4, disabled: reduced });
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

  return (
    <figure className={cn("split", className)} ref={ref}>
      <div className="split__bar" data-revealed={revealed} aria-hidden="true">
        {data.map((slice, index) => (
          <span
            key={slice.label}
            className={`split__seg split__seg--${slice.tone}`}
            style={{
              "--w": `${(slice.value / total) * 100}%`,
              "--d": `${index * 90}ms`,
            }}
          />
        ))}
      </div>

      <ul className="split__legend">
        {data.map((slice) => (
          <li key={slice.label}>
            <span className={`split__key split__key--${slice.tone}`} aria-hidden="true" />
            <span className="split__label">{slice.label}</span>
            <span className="split__value u-tnum">{slice.value}%</span>
          </li>
        ))}
      </ul>

      {caption && <figcaption className="chart__caption">{caption}</figcaption>}
    </figure>
  );
}