import { useCallback, useRef } from "react";

/**
 * Small cursor-follow tilt for cards. Returns props to spread on the element.
 * Max tilt is kept low (default 5deg) — enough to feel responsive, not enough
 * to make text hard to read or hit targets hard to click.
 */
export default function useTilt({ enabled = true, max = 5 } = {}) {
  const ref = useRef(null);
  const frame = useRef(null);

  const apply = useCallback((rx, ry, glowX, glowY) => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", `${rx.toFixed(2)}deg`);
    node.style.setProperty("--tilt-y", `${ry.toFixed(2)}deg`);
    node.style.setProperty("--glow-x", `${glowX.toFixed(1)}%`);
    node.style.setProperty("--glow-y", `${glowY.toFixed(1)}%`);
  }, []);

  const onPointerMove = useCallback(
    (event) => {
      if (!enabled || event.pointerType === "touch") return;
      const node = ref.current;
      if (!node) return;
      if (frame.current !== null) return;

      const { clientX, clientY } = event;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = (clientX - rect.left) / rect.width;
        const ny = (clientY - rect.top) / rect.height;
        apply((0.5 - ny) * max * 2, (nx - 0.5) * max * 2, nx * 100, ny * 100);
      });
    },
    [enabled, max, apply]
  );

  const onPointerLeave = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    apply(0, 0, 50, 50);
  }, [apply]);

  return enabled
    ? { ref, onPointerMove, onPointerLeave, "data-tilt": "" }
    : { ref };
}