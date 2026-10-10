const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat("en-IN");

/** ₹48 */
export const formatPrice = (value) => inr.format(value);

/** ₹48/kg */
export const formatRate = (value, unit) => `${inr.format(value)}/${unit}`;

/** 1,24,500 — Indian digit grouping */
export const formatNumber = (value) => plain.format(value);

/** ₹4.2L / ₹1.3Cr — the way Indian sellers actually read revenue */
export function formatCompactINR(value) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return inr.format(value);
}

/** "12 Sep" */
export const formatDay = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Turns 1200 into "1,200+" for display-only stat counters. */
export const withPlus = (value) => `${plain.format(value)}+`;