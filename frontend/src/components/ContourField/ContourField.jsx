import cn from "../../utils/cn";
import "./ContourField.css";

/**
 * The recurring motif: topographic survey lines.
 *
 * It is one shape scaled into a nest of contours, which is how a real contour
 * map of a rise in the land looks. It carries the "surveyed, plotted, known"
 * idea that the brand is built on.
 *
 * tone: "ink" | "lime" | "ivory"
 */

const RIDGE =
  "M600 96c118 0 214 34 266 92 52 58 46 132 8 190-38 58-108 100-196 116-88 16-194 6-262-34-68-40-98-110-84-176 14-66 72-128 150-160 38-16 76-26 118-28z";

const LEVELS = [1, 0.87, 0.74, 0.61, 0.49, 0.38, 0.28, 0.19];

export default function ContourField({
  tone = "ink",
  drift = true,
  className,
  ...rest
}) {
  return (
    <div
      className={cn("contour", `contour--${tone}`, drift && "contour--drift", className)}
      aria-hidden="true"
      {...rest}
    >
      <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" focusable="false">
        <g className="contour__nest">
          {LEVELS.map((scale, index) => (
            <path
              key={scale}
              d={RIDGE}
              className="contour__line"
              style={{
                transformOrigin: "600px 380px",
                transform: `scale(${scale}) rotate(${index * 1.4}deg)`,
                opacity: 0.22 + index * 0.075,
                "--line-index": index,
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}