import Button from "../Button/Button";
import cn from "../../utils/cn";
import "./ErrorState.css";

/**
 * Errors say what happened and what to do about it. They never surface a
 * stack trace, and they never apologise.
 */
export default function ErrorState({
  title = "This section did not load",
  body = "The marketplace service did not respond. Your data is safe.",
  onRetry,
  className,
}) {
  return (
    <div className={cn("errstate", className)} role="alert">
      <span className="errstate__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 8v5" />
          <circle cx="12" cy="16.6" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="9.2" />
        </svg>
      </span>

      <div className="errstate__copy">
        <h3 className="errstate__title">{title}</h3>
        <p className="errstate__body">{body}</p>
      </div>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}