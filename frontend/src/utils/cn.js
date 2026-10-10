/** Joins class names, dropping anything falsy. */
export default function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}