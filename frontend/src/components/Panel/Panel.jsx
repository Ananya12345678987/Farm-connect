import cn from "../../utils/cn";
import "./Panel.css";

/**
 * A dashboard surface. Takes a heading, an optional action in the top right,
 * and an id so the sidebar can scroll to it. Using one panel everywhere keeps
 * the spacing, radius and border identical across the three dashboards.
 */
export default function Panel({
  id,
  title,
  subtitle,
  action,
  children,
  padded = true,
  className,
}) {
  const headingId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      className={cn("panel", !padded && "panel--flush", className)}
      aria-labelledby={headingId}
    >
      {title && (
        <header className="panel__head">
          <div>
            <h2 className="panel__title" id={headingId}>
              {title}
            </h2>
            {subtitle && <p className="panel__sub">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}