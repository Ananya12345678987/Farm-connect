import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheck } from "react-icons/fi";

import Logo from "../Logo/Logo";
import Button from "../Button/Button";
import ContourField from "../ContourField/ContourField";
import "./AuthShell.css";

/**
 * Split screen used by every auth page: the form on the left where the eye
 * lands first, and a quiet panel on the right carrying the farm photograph
 * and one concrete proof point.
 *
 * On success the form is replaced rather than overlaid, so the confirmation
 * is what the page is about once it happens.
 */
export default function AuthShell({
  title,
  lead,
  children,
  footer,
  panelTitle,
  panelPoints = [],
  success = null,
}) {
  return (
    <div className="auth">
      <div className="auth__form-side">
        <div className="auth__form-inner">
          <div className="auth__head">
            <Logo />
            <Link className="auth__back" to="/">
              <FiArrowLeft aria-hidden="true" />
              <span>Back</span>
            </Link>
          </div>

          {success ? (
            <div className="auth__success" role="status">
              <span className="auth__success-mark" aria-hidden="true">
                <FiCheck />
              </span>
              <h1 className="auth__title">{success.title}</h1>
              <p className="auth__lead">{success.body}</p>
              <Button to={success.to} size="lg" className="auth__success-cta">
                {success.action}
              </Button>
            </div>
          ) : (
            <>
              <h1 className="auth__title">{title}</h1>
              {lead && <p className="auth__lead">{lead}</p>}
              {children}
            </>
          )}

          {footer && !success && <p className="auth__footer">{footer}</p>}
        </div>
      </div>

      <aside className="auth__panel" aria-hidden="true">
        <img
          src="/images/farm.jpg"
          alt=""
          width="626"
          height="417"
          loading="lazy"
          decoding="async"
        />
        <span className="auth__panel-veil" />
        <ContourField tone="ivory" className="auth__panel-contour" />

        <div className="auth__panel-copy">
          <p className="auth__panel-title">{panelTitle}</p>
          <ul className="auth__panel-list">
            {panelPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}