import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";

import useTilt from "../../hooks/useTilt";
import useReducedMotion from "../../hooks/useReducedMotion";
import useIsCoarsePointer from "../../hooks/useIsCoarsePointer";
import cn from "../../utils/cn";
import "./RoleCard.css";

/**
 * Role selection.
 *
 * Each card carries a small diagram of what that person actually does on the
 * platform — rows of a field being listed, a route from farm to buyer, a
 * ledger being checked — so the three are distinguishable at a glance rather
 * than by their labels alone.
 *
 * The whole card is one link. The tilt is capped at 5deg so text stays
 * readable and the hit area does not move away from the cursor.
 */

function RoleMark({ id }) {
  if (id === "farmer") {
    return (
      <svg viewBox="0 0 88 56" focusable="false" aria-hidden="true">
        <g className="rolemark__rows">
          <path d="M4 44c22-12 50-17 80-15" />
          <path d="M4 36c20-11 46-16 74-15" />
          <path d="M8 28c18-9 40-13 64-13" />
        </g>
        <g className="rolemark__crop">
          <path d="M30 30V14" />
          <path d="M30 22c-5-2-8-6-8-11 5 0 9 3 11 7z" />
          <path d="M30 18c4-3 6-7 6-12-5 1-9 4-10 8z" />
        </g>
        <circle className="rolemark__pin" cx="64" cy="20" r="4" />
      </svg>
    );
  }

  if (id === "buyer") {
    return (
      <svg viewBox="0 0 88 56" focusable="false" aria-hidden="true">
        <path className="rolemark__route" d="M12 42c14 0 18-26 32-26s18 20 32 20" />
        <circle className="rolemark__node" cx="12" cy="42" r="5" />
        <circle className="rolemark__node rolemark__node--end" cx="76" cy="36" r="5" />
        <g className="rolemark__crate">
          <path d="M36 20h18v12H36z" />
          <path d="M36 24h18" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 88 56" focusable="false" aria-hidden="true">
      <g className="rolemark__ledger">
        <path d="M18 10h40a4 4 0 014 4v32H22a4 4 0 01-4-4z" />
        <path d="M28 22h22M28 30h22M28 38h14" />
      </g>
      <g className="rolemark__check">
        <circle cx="66" cy="38" r="11" />
        <path d="M61 38l3.6 3.6L72 34" />
      </g>
    </svg>
  );
}

export default function RoleCard({ role, stagger = 0 }) {
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const tilt = useTilt({ enabled: !reduced && !coarse, max: 5 });

  return (
    <article
      className={cn("role", `role--${role.accent}`)}
      style={{ "--i": stagger }}
      {...tilt}
    >
      <div className="role__inner">
        <span className="role__mark">
          <RoleMark id={role.id} />
        </span>

        <p className="role__tagline">{role.tagline}</p>

        <h3 className="role__title">
          <Link className="role__link" to={role.route}>
            {role.title}
            <span className="role__hit" aria-hidden="true" />
          </Link>
        </h3>

        <p className="role__desc">{role.description}</p>

        <span className="role__cta">
          {role.action}
          <FiArrowUpRight aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}