import Button from "../Button/Button";
import cn from "../../utils/cn";
import "./EmptyState.css";

/**
 * An empty screen is an invitation to act, so every one of these carries a
 * next step. The mark is a furrowed field with nothing sown in it — the same
 * contour language as the rest of the site.
 */
export default function EmptyState({
  title,
  body,
  action = null,
  actionTo,
  onAction,
  size = "md",
  className,
}) {
  return (
    <div className={cn("empty", `empty--${size}`, className)}>
      <span className="empty__mark" aria-hidden="true">
        <svg viewBox="0 0 64 48" focusable="false">
          <path d="M2 34c14-10 30-15 48-15 5 0 9 .3 13 1" />
          <path d="M2 42c14-10 30-15 48-15 5 0 9 .3 13 1" />
          <path d="M6 26c12-8 26-12 40-12 6 0 11 .5 16 1.5" />
          <circle className="empty__seed" cx="32" cy="12" r="3.5" />
        </svg>
      </span>

      <h3 className="empty__title">{title}</h3>
      {body && <p className="empty__body">{body}</p>}

      {action && (
        <Button
          variant="secondary"
          size="sm"
          to={actionTo}
          onClick={onAction}
          className="empty__action"
        >
          {action}
        </Button>
      )}
    </div>
  );
}