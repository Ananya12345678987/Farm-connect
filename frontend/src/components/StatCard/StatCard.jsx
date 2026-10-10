import useCountUp from "../../hooks/useCountUp";
import useReducedMotion from "../../hooks/useReducedMotion";
import { formatNumber } from "../../utils/format";
import cn from "../../utils/cn";
import "./StatCard.css";

/**
 * Animated statistic. Counts once, when its section becomes visible, and
 * never re-runs. The final value is written into the accessible label up
 * front, so assistive tech is never read a partial number.
 */
export default function StatCard({
  value,
  suffix = "",
  label,
  caption,
  active,
  delay = 0,
  className,
}) {
  const reduced = useReducedMotion();
  const shown = useCountUp(value, { active, reduced, duration: 1500 + delay });

  return (
    <div className={cn("stat", className)}>
      <p className="stat__value u-tnum">
        <span aria-hidden="true">
          {formatNumber(shown)}
          {suffix}
        </span>
        <span className="u-sr">{`${formatNumber(value)}${suffix}`}</span>
      </p>
      <p className="stat__label">{label}</p>
      {caption && <p className="stat__caption">{caption}</p>}
    </div>
  );
}