import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router does not restore or reset scroll on its own. This sends the
 * reader to the top on a route change, and to the right section when the URL
 * carries a hash — including when arriving from another page, which is how
 * the navbar's "How it works" link works from /about.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    /* The target may not have painted yet when arriving from another route,
       so look for it across a few frames before giving up. */
    let frame = null;
    let tries = 0;

    const find = () => {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" });
        return;
      }
      tries += 1;
      if (tries < 10) {
        frame = requestAnimationFrame(find);
      } else {
        window.scrollTo(0, 0);
      }
    };

    frame = requestAnimationFrame(find);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [pathname, hash]);

  return null;
}