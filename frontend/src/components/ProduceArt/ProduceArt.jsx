import cn from "../../utils/cn";
import "./ProduceArt.css";

/**
 * Generated artwork for produce that has no photograph yet.
 *
 * Each crop gets a duotone field with a large, cropped, single-colour
 * silhouette of itself — the same treatment across the whole catalogue, so
 * the marketplace reads as one designed set.
 *
 * ProductCard renders a real <img> the moment `image` is populated, so this
 * is a fallback, not a dependency.
 */

const PALETTE = {
  tomato: { from: "#F6E3DA", to: "#EFCDBE", ink: "#B4512F" },
  leaf: { from: "#E4EEDF", to: "#CFE2C6", ink: "#3C6B37" },
  mango: { from: "#FBEEDA", to: "#F4DDB4", ink: "#B8791A" },
  grain: { from: "#F3ECDC", to: "#E7DBC0", ink: "#8C6E33" },
  millet: { from: "#EEEBDD", to: "#DFD9C1", ink: "#7A7442" },
  banana: { from: "#F7F0D6", to: "#EDE2B4", ink: "#A28A26" },
  onion: { from: "#F2E5E8", to: "#E4CDD5", ink: "#9A4257" },
  turmeric: { from: "#FBEBCF", to: "#F2D79E", ink: "#A9690F" },
  default: { from: "#EEEADF", to: "#DFD9CA", ink: "#5E6353" },
};

function Silhouette({ tone }) {
  switch (tone) {
    case "tomato":
      return (
        <g>
          <circle cx="152" cy="118" r="52" />
          <circle cx="206" cy="142" r="34" opacity="0.72" />
          <circle cx="110" cy="152" r="28" opacity="0.55" />
          <path d="M152 70c-9-8-20-11-31-9 4 10 12 17 22 19zm0 0c9-8 20-11 31-9-4 10-12 17-22 19z" opacity="0.9" />
        </g>
      );
    case "leaf":
      return (
        <g>
          <path d="M60 158c0-48 34-88 86-96 26-4 48 0 66 10-6 50-42 88-92 94-22 3-42 1-60-8z" />
          <path d="M60 158c30-30 68-56 112-72" fill="none" stroke="#fff" strokeWidth="3" opacity="0.45" />
          <path d="M104 128c6 14 10 26 10 38M142 106c4 16 6 28 6 40" fill="none" stroke="#fff" strokeWidth="2.4" opacity="0.32" />
        </g>
      );
    case "mango":
      return (
        <g>
          <ellipse cx="150" cy="116" rx="62" ry="48" transform="rotate(-18 150 116)" />
          <ellipse cx="216" cy="152" rx="40" ry="31" transform="rotate(-14 216 152)" opacity="0.66" />
          <path d="M112 74c-4-12 2-22 14-27 3 12-2 22-14 27z" opacity="0.9" />
        </g>
      );
    case "grain":
      return (
        <g>
          <path d="M150 178V54" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <ellipse cx={132} cy={78 + i * 21} rx="17" ry="9" transform={`rotate(-32 132 ${78 + i * 21})`} opacity={0.9 - i * 0.07} />
              <ellipse cx={168} cy={78 + i * 21} rx="17" ry="9" transform={`rotate(32 168 ${78 + i * 21})`} opacity={0.9 - i * 0.07} />
            </g>
          ))}
        </g>
      );
    case "millet":
      return (
        <g>
          <path d="M150 178V86" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
          {[
            [150, 44, 15], [128, 62, 12], [172, 62, 12], [116, 84, 10],
            [184, 84, 10], [136, 82, 9], [164, 82, 9], [150, 66, 11],
            [106, 104, 8], [194, 104, 8], [150, 96, 9],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} opacity={0.88 - i * 0.045} />
          ))}
        </g>
      );
    case "banana":
      return (
        <g>
          <path d="M78 76c34 66 84 96 138 92-6-52-52-96-108-104-14-2-24 2-30 12z" />
          <path d="M96 58c32 60 78 88 128 86-8-46-50-86-102-94-13-2-22 2-26 8z" opacity="0.6" />
        </g>
      );
    case "onion":
      return (
        <g>
          <path d="M150 62c34 0 62 32 62 66 0 30-28 50-62 50s-62-20-62-50c0-34 28-66 62-66z" />
          <path d="M150 62c14 20 20 44 20 66s-6 38-20 50M150 62c-14 20-20 44-20 66s6 38 20 50" fill="none" stroke="#fff" strokeWidth="2.6" opacity="0.35" />
          <path d="M150 62c-2-14-10-24-22-30 4 16 10 26 22 30z" opacity="0.85" />
        </g>
      );
    case "turmeric":
      return (
        <g>
          <path d="M92 132c-6-26 8-48 30-54 16-4 28 4 32 18 4 16-4 32-20 40-18 9-36 6-42-4z" />
          <path d="M148 158c-8-24 4-48 26-56 16-6 30 2 34 16 5 17-4 34-21 43-19 10-34 7-39-3z" opacity="0.72" />
          <path d="M206 122c-6-18 2-34 18-40 12-4 22 2 25 12 4 13-3 26-16 32-14 7-25 4-27-4z" opacity="0.5" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="150" cy="116" r="54" />
          <circle cx="208" cy="146" r="32" opacity="0.6" />
        </g>
      );
  }
}

export default function ProduceArt({ tone = "default", className }) {
  const palette = PALETTE[tone] ?? PALETTE.default;
  const gradientId = `pa-grad-${tone}`;

  return (
    <div className={cn("produce-art", className)} aria-hidden="true">
      <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
        </defs>

        <rect width="300" height="180" fill={`url(#${gradientId})`} />

        {/* Contour arcs, tying the catalogue back to the site motif. */}
        <g stroke={palette.ink} strokeOpacity="0.14" fill="none" strokeWidth="1.2">
          <path d="M-20 148c60-42 128-62 200-58" />
          <path d="M-20 168c66-50 142-72 222-66" />
          <path d="M-20 128c54-34 114-52 178-50" />
        </g>

        <g className="produce-art__shape" fill={palette.ink} color={palette.ink} fillOpacity="0.92">
          <Silhouette tone={tone} />
        </g>
      </svg>
    </div>
  );
}