import { Link } from "react-router-dom";
import "./Logo.css";

/**
 * Wordmark plus a two-leaf sprout. The leaves are the same shapes the hero
 * plant uses, so the mark reads as a seedling of the large visual.
 */
export default function Logo({ to = "/", tone = "ink", className = "" }) {
  const content = (
    <>
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 28 28" focusable="false">
          <path className="logo__stem" d="M14 25V10.5" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path className="logo__leaf logo__leaf--left" d="M14 15.4c-1.3-3.7-4.4-5-7.2-4.8-.4 3.3 1.6 6.2 4.6 6.9 1.1.2 2 .1 2.6-.1z" />
          <path className="logo__leaf logo__leaf--right" d="M14 12.6c1.1-3.9 4.1-5.6 7.2-5.6.5 3.5-1.4 6.7-4.5 7.6-1.1.3-2 .2-2.7 0z" />
        </svg>
      </span>
      <span className="logo__word">
        Farm<span className="logo__word-accent">Connect</span>
      </span>
    </>
  );

  const classes = `logo logo--${tone} ${className}`.trim();

  if (!to) return <span className={classes}>{content}</span>;

  return (
    <Link className={classes} to={to} aria-label="FarmConnect, home">
      {content}
    </Link>
  );
}