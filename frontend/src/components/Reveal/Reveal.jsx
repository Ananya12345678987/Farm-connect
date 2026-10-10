import useReveal from "../../hooks/useReveal";
import useReducedMotion from "../../hooks/useReducedMotion";
import cn from "../../utils/cn";
import "./Reveal.css";

/**
 * Scroll reveal wrapper. Used sparingly: section openings, one staggered
 * grid per screen, and the stats counters.
 *
 * variant: "up" | "fade" | "mask" (clip-path wipe, for images)
 * stagger: index used to offset the delay of siblings.
 */
export default function Reveal({
  as: Tag = "div",
  children,
  variant = "up",
  delay = 0,
  stagger = 0,
  step = 70,
  className,
  style,
  ...rest
}) {
  const reduced = useReducedMotion();
  const [ref, revealed] = useReveal({ disabled: reduced });

  return (
    <Tag
      ref={ref}
      className={cn("reveal", `reveal--${variant}`, className)}
      data-revealed={revealed ? "true" : "false"}
      style={{ "--reveal-delay": `${delay + stagger * step}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}