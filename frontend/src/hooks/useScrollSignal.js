import { useEffect, useRef } from "react";

/**
 * Writes the element's scroll progress (0 at the moment its top hits the top
 * of the viewport, 1 once it has fully passed) onto it as --sy. Used for the
 * hero's scroll-linked drift. Values are written straight to the DOM; no
 * re-renders.
 */
export default function useScrollSignal(enabled = true) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return undefined;

    let frame = null;

    const measure = () => {
      frame = null;
      const rect = node.getBoundingClientRect();
      const span = rect.height || 1;
      const progress = Math.max(0, Math.min(1, -rect.top / span));
      node.style.setProperty("--sy", progress.toFixed(4));
    };

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return ref;
}