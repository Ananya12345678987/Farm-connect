import "./RouteFallback.css";

/**
 * Shown while a lazily loaded route chunk arrives. It is a quiet growth bar
 * rather than a spinner, and it is announced politely so a screen-reader user
 * is told the page is loading instead of hearing silence.
 */
export default function RouteFallback() {
  return (
    <div className="rfall" role="status" aria-live="polite">
      <span className="rfall__bar" aria-hidden="true">
        <span />
      </span>
      <span className="u-sr">Loading page</span>
    </div>
  );
}