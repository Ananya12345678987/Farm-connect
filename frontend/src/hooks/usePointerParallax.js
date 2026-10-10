import { useEffect, useRef } from "react";

/**
 * Writes normalised pointer position (-1..1) onto the element as the CSS
 * custom properties --px and --py. Children then opt in at whatever depth
 * they want, e.g. translate3d(calc(var(--px) * 14px), ...).
 *
 * Deliberately never touches React state: the pointer moves at 120Hz and
 * re-rendering on it would be the single most expensive thing on the page.
 */
export default function usePointerParallax(enabled = true, { damping = 0.09 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return undefined;

    let frame = null;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let running = false;

    const loop = () => {
      x += (targetX - x) * damping;
      y += (targetY - y) * damping;
      node.style.setProperty("--px", x.toFixed(4));
      node.style.setProperty("--py", y.toFixed(4));

      if (Math.abs(targetX - x) > 0.001 || Math.abs(targetY - y) > 0.001) {
        frame = requestAnimationFrame(loop);
      } else {
        running = false;
        frame = null;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const onPointerMove = (event) => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      targetY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetX = Math.max(-1, Math.min(1, targetX));
      targetY = Math.max(-1, Math.min(1, targetY));
      start();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      start();
    };

    node.addEventListener("pointermove", onPointerMove, { passive: true });
    node.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerleave", onLeave);
      if (frame !== null) cancelAnimationFrame(frame);
      node.style.removeProperty("--px");
      node.style.removeProperty("--py");
    };
  }, [enabled, damping]);

  return ref;
}