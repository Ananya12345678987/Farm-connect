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
  const [revealed, setRevealed] = useState(disabled);

  useEffect(() => {
    if (disabled) {
      setRevealed(true);
      return undefined;
    }
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, disabled]);

  return [ref, revealed];
}