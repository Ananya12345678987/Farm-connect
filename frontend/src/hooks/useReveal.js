import { useEffect, useRef, useState } from "react";

/**
 * Scroll reveal via IntersectionObserver. Fires once, then disconnects, so
 * nothing observes the element for the rest of the session.
 *
 * Returns [ref, revealed].
 */
export default function useReveal({
  threshold = 0.18,
  rootMargin = "0px 0px -8% 0px",
  disabled = false,
} = {}) {
  const ref = useRef(null);

  // Browsers without IntersectionObserver start out revealed, so nothing
  // stays hidden. Deciding it here (not in the effect) avoids an extra render.
  const [seen, setSeen] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    if (disabled || seen) return undefined;
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, disabled, seen]);

  // `disabled` (reduced motion) means "show everything straight away".
  return [ref, disabled || seen];
}