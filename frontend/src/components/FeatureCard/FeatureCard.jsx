import cn from "../../utils/cn";
import "./FeatureCard.css";

/**
 * Feature card.
 *
 * No icon chrome and no box: each card is a column with a hairline rule above
 * it and a figure that states the point numerically where one exists.
 */
export default function FeatureCard({ title, body, figure, figureLabel, className }) {
  return (
    <article className={cn("feature", className)}>
      <span className="feature__rule" aria-hidden="true" />

      {figure && (
        <p className="feature__figure u-tnum">
          {figure}
          {figureLabel && <span className="feature__figure-label">{figureLabel}</span>}
        </p>
      )}

      <h3 className="feature__title">{title}</h3>
      <p className="feature__body">{body}</p>
    </article>
  );
}