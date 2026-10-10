import useReveal from "../../hooks/useReveal";
import useReducedMotion from "../../hooks/useReducedMotion";
import cn from "../../utils/cn";
import "./Chart.css";

/**
 * Column chart, drawn with CSS rather than SVG so the bars stay pixel-crisp
 * at any width and the grow-in is a single composited transform.
 *
 * The numbers are also output as a visually hidden table, so the chart is
 * readable by screen readers instead of being announced as one blank image.
 */
export default function BarChart({
  data,
  formatValue = (v) => v,
  caption,
  highlightLast = true,
  className,
}) {
  const reduced = useReducedMotion();
  const [ref, revealed] = useReveal({ threshold: 0.3, disabled: reduced });
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <figure className={cn("chart", className)} ref={ref}>
      <div className="chart__plot chart__plot--bars" data-revealed={revealed}>
        {/* Grid lines double as the contour motif inside the product. */}
        <div className="chart__grid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} />
          ))}
        </div>

        <div className="chart__bars" aria-hidden="true">
          {data.map((point, index) => (
            <div className="chart__col" key={point.label}>
              <div className="chart__bar-track">
                <span
                  className={cn(
                    "chart__bar",
                    highlightLast && index === data.length - 1 && "is-current"
                  )}
                  style={{
                    "--h": `${(point.value / max) * 100}%`,
                    "--d": `${index * 70}ms`,
                  }}
                >
                  <span className="chart__bar-value u-tnum">
                    {formatValue(point.value)}
                  </span>
                </span>
              </div>
              <span className="chart__tick">{point.label}</span>
            </div>
          ))}
        </div>
      </div>

      <table className="u-sr">
        <caption>{caption ?? "Chart data"}</caption>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
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