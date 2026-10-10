import { useId } from "react";
import useReveal from "../../hooks/useReveal";
import useReducedMotion from "../../hooks/useReducedMotion";
import cn from "../../utils/cn";
import "./Chart.css";

const W = 600;
const H = 220;
const PAD = 8;

/**
 * Trend line with a soft area beneath it. The stroke draws itself in once on
 * reveal; `vector-effect: non-scaling-stroke` keeps the line an even weight
 * while the viewBox stretches to the container.
 */
export default function LineChart({
  data,
  formatValue = (v) => v,
  caption,
  className,
}) {
  const reduced = useReducedMotion();
  const [ref, revealed] = useReveal({ threshold: 0.3, disabled: reduced });
  const gradientId = useId().replace(/:/g, "");

  /* No history yet (a brand-new account) is a real state, not an edge
     case to crash on — draw a flat baseline instead of an empty chart. */
  const series = data.length > 0 ? data : [{ label: "", value: 0 }];

  const max = Math.max(...series.map((d) => d.value), 1);
  const min = Math.min(...series.map((d) => d.value), 0);
  const span = max - min || 1;

  const points = series.map((point, index) => {
    const x = PAD + (index / Math.max(series.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - ((point.value - min) / span) * (H - PAD * 2);
    return { ...point, x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x} ${H} L${points[0].x} ${H} Z`;

  return (
    <figure className={cn("chart", className)} ref={ref}>
      <div className="chart__plot" data-revealed={revealed}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="chart__svg"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={`g-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-forest-3)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--c-forest-3)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={area} fill={`url(#g-${gradientId})`} className="chart__area" />
          <path d={line} className="chart__line" />

          {points.map((point, index) => (
            <circle
              key={`${point.label}-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              className={cn("chart__dot", index === points.length - 1 && "is-current")}
              style={{ "--d": `${420 + index * 60}ms` }}
            />
          ))}
        </svg>

        <div className="chart__ticks" aria-hidden="true">
          {series.map((point, index) => (
            <span className="chart__tick" key={`${point.label}-${index}`}>
              {point.label}
            </span>
          ))}
        </div>
      </div>

      <table className="u-sr">
        <caption>{caption ?? "Chart data"}</caption>
        <tbody>
          {series.map((point, index) => (
            <tr key={`${point.label}-${index}`}>
              <th scope="row">{point.label}</th>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {caption && <figcaption className="chart__caption">{caption}</figcaption>}
    </figure>
  );
}