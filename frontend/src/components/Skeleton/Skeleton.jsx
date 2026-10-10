import cn from "../../utils/cn";
import "./Skeleton.css";

/**
 * Shape-matched loading placeholders. They mirror the real component's
 * footprint so nothing jumps when data arrives.
 */
export function Skeleton({ w, h = "1rem", radius = "6px", className, style }) {
  return (
    <span
      className={cn("skel", className)}
      style={{ width: w, height: h, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <span className={cn("skel-text", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} w={i === lines - 1 ? "62%" : "100%"} h="0.75rem" />
      ))}
    </span>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("skel-card", className)} aria-hidden="true">
      <Skeleton w="100%" h="168px" radius="var(--r-card)" />
      <div className="skel-card__body">
        <Skeleton w="42%" h="0.7rem" />
        <Skeleton w="78%" h="1.05rem" />
        <SkeletonText lines={2} />
        <Skeleton w="34%" h="1.1rem" />
      </div>
    </div>
  );
}

export function SkeletonRows({ rows = 4, className }) {
  return (
    <div className={cn("skel-rows", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skel-rows__row" key={i}>
          <Skeleton w="38%" h="0.85rem" />
          <Skeleton w="22%" h="0.85rem" />
          <Skeleton w="16%" h="0.85rem" />
        </div>
      ))}
    </div>
  );
}

/**
 * Wraps a loading region so assistive tech is told something is coming,
 * without narrating every skeleton bar.
 */
export function LoadingRegion({ label = "Loading", children, className }) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      <span className="u-sr">{label}</span>
      {children}
    </div>
  );
}

export default Skeleton;