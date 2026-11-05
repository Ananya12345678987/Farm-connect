import crypto from "node:crypto";

export const slugify = (value) =>
  String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Product slugs must be unique; a short random suffix avoids a retry loop
 *  when two farmers list "Tomatoes" on the same day. */
export const uniqueSlug = (value) =>
  `${slugify(value) || "item"}-${crypto.randomBytes(3).toString("hex")}`;
