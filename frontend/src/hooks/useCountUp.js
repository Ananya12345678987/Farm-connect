import { useEffect, useRef, useState } from "react";

/**
 * Counts from 0 to `target` once `active` turns true, and never again.
 * Uses rAF with an ease-out curve so the number settles rather than stops.
 * With reduced motion it simply returns the final number.
 */
export default function useCountUp(target, { active, duration = 1600, reduced }) {
  const [value, setValue] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (reduced || !active || done.current) return undefined;

    done.current = true;
    let frame = 0;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration, reduced]);

  return reduced ? target : value;
}