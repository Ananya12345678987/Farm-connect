import { FiHeart, FiMapPin } from "react-icons/fi";

import ProduceArt from "../ProduceArt/ProduceArt";
import { formatRate, formatDay } from "../../utils/format";
import cn from "../../utils/cn";
import "./ProductCard.css";

/**
 * Marketplace listing.
 *
 * The grower's name sits above the crop name, not below it in small grey
 * text — on this platform the person is the point, so the hierarchy says so.
 *
 * Renders a photograph if `product.image` is set and falls back to generated
 * produce artwork otherwise, so the catalogue never shows a broken image.
 */
export default function ProductCard({
  product,
  size = "md",
  saved = false,
  onToggleSave,
  className,
}) {
  const {
    id,
    name,
    tone,
    image,
    price,
    unit,
    quantity,
    organic,
    farmer,
    location,
    harvestedOn,
    note,
  } = product;

  return (
    <article className={cn("prod", `prod--${size}`, className)}>
      <div className="prod__media">
        {image ? (
          <img src={image} alt={name} loading="lazy" decoding="async" />
        ) : (
          <ProduceArt tone={tone} />
        )}

        {organic && <span className="u-chip u-chip--lime prod__badge">Organic</span>}

        <button
          type="button"
          className="prod__save"
          aria-pressed={saved}
          onClick={() => onToggleSave?.(id)}
        >
          <FiHeart aria-hidden="true" />
          <span className="u-sr">
            {saved ? `Remove ${name} from saved listings` : `Save ${name}`}
          </span>
        </button>
      </div>

      <div className="prod__body">
        <p className="prod__grower">{farmer.name}</p>
        <h3 className="prod__name">{name}</h3>

        <p className="prod__where">
          <FiMapPin aria-hidden="true" />
          <span>{location}</span>
        </p>

        {size === "tall" && note && <p className="prod__note">{note}</p>}

        <div className="prod__foot">
          <p className="prod__price u-tnum">{formatRate(price, unit)}</p>
          <p className="prod__stock">{quantity}</p>
        </div>

        <p className="prod__harvest">Harvested {formatDay(harvestedOn)}</p>
      </div>
    </article>
  );
}