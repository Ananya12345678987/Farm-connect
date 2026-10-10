import { useEffect, useState } from "react";

/**
 * True once the page has scrolled past `offset`. Passive listener, and state
 * only changes when the boolean flips — not on every scroll frame.
 */
export default function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = null;

    const measure = () => {
      frame = null;
      setScrolled(window.scrollY > offset);
    };

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [offset]);

  return scrolled;
}