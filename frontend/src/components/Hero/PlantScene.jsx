import { useEffect, useMemo, useState } from "react";
import useReducedMotion from "../../hooks/useReducedMotion";
import useIsCoarsePointer from "../../hooks/useIsCoarsePointer";
import cn from "../../utils/cn";
import "./PlantScene.css";

/**
 * The hero's 3D element.
 *
 * Built from layered DOM planes in a `transform-style: preserve-3d` rig rather
 * than WebGL. That was a deliberate call, not a shortcut:
 *
 *  - it is composited by the GPU with no render loop, no canvas and no shader
 *    compile, and it adds no library weight
 *  - it degrades to a flat, still illustration under prefers-reduced-motion
 *  - it can be a real <button>, so the click interaction is reachable from
 *    the keyboard, which a canvas object is not
 *
 * Depth is real: each leaf sits at its own translateZ, so rotating the rig
 * with the pointer produces genuine parallax between the front and back
 * leaves rather than a flat tilt.
 */

const MAX_STAGE = 4;

/* z is the depth in px; leaves alternate in front of and behind the stem. */
const LEAVES = [
  { id: "l1", stage: 1, x: -30, y: 8, z: 34, rot: -24, scale: 0.62, sway: 7.5, dur: 7.2 },
  { id: "l2", stage: 1, x: 28, y: -4, z: -26, rot: 22, scale: 0.58, sway: -6.5, dur: 8.4 },
  { id: "l3", stage: 2, x: -46, y: -52, z: -40, rot: -34, scale: 0.82, sway: 5.5, dur: 9.1 },
  { id: "l4", stage: 2, x: 44, y: -68, z: 48, rot: 30, scale: 0.9, sway: -7, dur: 7.8 },
  { id: "l5", stage: 3, x: -38, y: -116, z: 22, rot: -46, scale: 0.7, sway: 8, dur: 8.9 },
  { id: "l6", stage: 3, x: 36, y: -134, z: -18, rot: 42, scale: 0.66, sway: -5.5, dur: 9.6 },
  { id: "l7", stage: 4, x: -6, y: -176, z: 12, rot: -8, scale: 0.52, sway: 4.5, dur: 10.2 },
];

const MOTES = [
  { id: "m1", x: -78, y: -40, z: 70, size: 5, dur: 11, delay: 0 },
  { id: "m2", x: 82, y: -96, z: -60, size: 4, dur: 13, delay: 1.6 },
  { id: "m3", x: -58, y: -158, z: 40, size: 3, dur: 9.5, delay: 0.8 },
  { id: "m4", x: 62, y: -186, z: 90, size: 4, dur: 12.4, delay: 2.4 },
  { id: "m5", x: -96, y: -122, z: -80, size: 3, dur: 14, delay: 3.1 },
  { id: "m6", x: 100, y: -30, z: 30, size: 3, dur: 10.6, delay: 1.1 },
];

const STAGE_LABEL = {
  1: "seedling",
  2: "young plant",
  3: "established plant",
  4: "full growth",
};

export default function PlantScene({ className }) {
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();

  /* Reduced motion skips the growth sequence and starts fully grown. */
  const [stage, setStage] = useState(() => (reduced ? MAX_STAGE : 0));
  const [pulsing, setPulsing] = useState(false);

  /* Entrance: the plant grows in, one stage at a time. */
  useEffect(() => {
    if (reduced) return undefined;
    const timers = [1, 2, 3].map((target, index) =>
      setTimeout(() => setStage(target), 380 + index * 460)
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const handleGrow = () => {
    setStage((current) => (current >= MAX_STAGE ? 1 : current + 1));
    if (reduced) return;
    setPulsing(true);
    setTimeout(() => setPulsing(false), 650);
  };

  const visibleLeaves = useMemo(
    () => LEAVES.filter((leaf) => leaf.stage <= stage),
    [stage]
  );

  /* Stem length is driven by growth stage; 0 is bare soil. */
  const stemProgress = Math.min(stage / MAX_STAGE, 1);

  return (
    <div className={cn("plant", reduced && "plant--still", className)}>
      <button
        type="button"
        className={cn("plant__rig", pulsing && "is-pulsing")}
        onClick={handleGrow}
        aria-describedby="plant-hint"
      >
        <span className="u-sr">
          {`Grow the plant. Currently at ${STAGE_LABEL[stage] ?? "seed"}.`}
        </span>

        {/* Soil ridge — the ground the whole composition stands on. */}
        <span className="plant__soil" aria-hidden="true">
          <svg viewBox="0 0 240 44" focusable="false">
            <ellipse cx="120" cy="24" rx="92" ry="17" className="plant__soil-fill" />
            <path d="M40 22c26-9 60-13 96-11 30 2 52 6 66 12" className="plant__soil-line" />
            <path d="M52 30c24-8 56-11 90-9 28 1 48 5 60 10" className="plant__soil-line" />
          </svg>
        </span>

        {/* Stem */}
        <span className="plant__stem" aria-hidden="true">
          <svg viewBox="0 0 60 260" focusable="false" preserveAspectRatio="none">
            <path
              d="M30 258C30 200 24 168 27 130 30 92 36 64 30 18"
              className="plant__stem-path"
              style={{ strokeDashoffset: 300 - 300 * stemProgress }}
            />
          </svg>
        </span>

        {/* Leaves, each on its own depth plane */}
        {visibleLeaves.map((leaf, index) => (
          <span
            key={leaf.id}
            className="plant__leaf"
            aria-hidden="true"
            style={{
              "--lx": `${leaf.x}px`,
              "--ly": `${leaf.y}px`,
              "--lz": `${leaf.z}px`,
              "--lrot": `${leaf.rot}deg`,
              "--lscale": leaf.scale,
              "--lsway": `${leaf.sway}deg`,
              "--ldur": `${leaf.dur}s`,
              "--ldelay": `${index * 0.42}s`,
            }}
          >
            <span className="plant__leaf-sway">
              <svg viewBox="0 0 120 64" focusable="false">
                <path
                  className="plant__leaf-blade"
                  d="M2 56C2 26 30 6 74 4c26-1 44 4 44 4-6 30-34 52-74 54-22 1-38-3-42-6z"
                />
                <path className="plant__leaf-vein" d="M2 56C30 40 66 22 114 10" />
                <path
                  className="plant__leaf-vein plant__leaf-vein--minor"
                  d="M28 48c6-10 10-18 10-26M56 36c4-10 6-18 6-26M82 24c2-8 4-14 4-20"
                />
              </svg>
            </span>
          </span>
        ))}

        {/* Drifting motes. Skipped entirely on touch devices, where they cost
            paint work and are barely visible at that size. */}
        {!coarse &&
          !reduced &&
          MOTES.map((mote) => (
            <span
              key={mote.id}
              className="plant__mote"
              aria-hidden="true"
              style={{
                "--mx": `${mote.x}px`,
                "--my": `${mote.y}px`,
                "--mz": `${mote.z}px`,
                "--msize": `${mote.size}px`,
                "--mdur": `${mote.dur}s`,
                "--mdelay": `${mote.delay}s`,
              }}
            />
          ))}
      </button>

      <p className="plant__hint" id="plant-hint">
        {coarse ? "Tap the plant to grow it" : "Click the plant to grow it"}
      </p>
    </div>
  );
}