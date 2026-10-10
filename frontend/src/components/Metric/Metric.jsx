import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { formatNumber, formatCompactINR } from "../../utils/format";

/** One dashboard statistic, with its change against the previous period. */
export default function Metric({ label, value, delta, deltaLabel, format }) {
  const display = format === "inr" ? formatCompactINR(value) : formatNumber(value);
  const up = delta >= 0;
  const Icon = up ? FiTrendingUp : FiTrendingDown;

  return (
    <div className="metric">
      <p className="metric__label">{label}</p>
      <p className="metric__value u-tnum">{display}</p>
      {delta !== undefined && (
        <p className="metric__delta" style={up ? undefined : { color: "var(--c-rust)" }}>
          <Icon aria-hidden="true" />
          {up ? "+" : ""}
          {delta}
          {format === "inr" ? "%" : ""} <span>{deltaLabel}</span>
        </p>
      )}
    </div>
  );
}