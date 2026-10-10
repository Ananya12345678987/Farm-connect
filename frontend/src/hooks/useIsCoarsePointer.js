import { useEffect, useState } from "react";

const QUERY = "(hover: none), (pointer: coarse)";

/**
 * True on touch devices. Used to skip pointer-driven effects (tilt, parallax)
 * that cost work and mean nothing without a cursor.
 */
export default function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia(QUERY);
    const onChange = (event) => setCoarse(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return coarse;
}