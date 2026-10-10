import Reveal from "../Reveal/Reveal";
import cn from "../../utils/cn";
import "./SectionHeading.css";

/**
 * Section opener. Left-aligned by default and paired with an optional aside.
 * `id` is applied to the heading so in-page nav links land on the title.
 */
export default function SectionHeading({
  id,
  title,
  lead,
  aside = null,
  align = "start",
  tone = "ink",
  level: Level = "h2",
  className,
}) {
  return (
    <div className={cn("sec-head", `sec-head--${align}`, `sec-head--${tone}`, className)}>
      <Reveal className="sec-head__main">
        <Level id={id} className="sec-head__title">
          {title}
        </Level>
        {lead && <p className="sec-head__lead">{lead}</p>}
      </Reveal>
      {aside && (
        <Reveal className="sec-head__aside" delay={120}>
          {aside}
        </Reveal>
      )}
    </div>
  );
}