import mongoose from "mongoose";
import { slugify } from "../utils/slugify.js";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 60 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 400 },
    icon: { type: String, trim: true, maxlength: 60 },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

categorySchema.pre("validate", function setSlug(next) {
  if (this.isModified("name") || !this.slug) this.slug = slugify(this.name);
  next();
});

export default mongoose.model("Category", categorySchema);
