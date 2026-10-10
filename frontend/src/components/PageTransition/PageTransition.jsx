import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./PageTransition.css";

/**
 * Page transition and route focus management.
 *
 * The fade is 180ms and has no exit phase, so navigation still feels
 * instantaneous.
 *
 * It also moves focus to <main> on every route change after the first, so a
 * keyboard or screen-reader user does not stay parked in the old page's nav.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const node = mainRef.current;
    if (node) node.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <main
      id="main"
      className="app-main page-transition"
      ref={mainRef}
      tabIndex={-1}
      key={pathname}
    >
      {children}
    </main>
  );
}