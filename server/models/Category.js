import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a category name"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tag: {
      type: String,
      trim: true,
      uppercase: true,
      default: function () {
        return (this.name || "").toUpperCase();
      },
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    imagePublicId: {
      type: String,
      default: "",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    bannerPublicId: {
      type: String,
      default: "",
    },
    badge: {
      type: String,
      trim: true,
      default: "",
    },
    startingPrice: {
      type: String,
      default: "",
    },
    itemCount: {
      type: String,
      default: "50+ Styles",
    },
    gender: {
      type: String,
      enum: ["men", "women", "unisex", "kids", "all"],
      default: "all",
      lowercase: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name if not provided
categorySchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

export const DEFAULT_CATEGORIES = [
  {
    name: "Men's Footwear",
    slug: "men",
    tag: "MEN",
    description: "Daily wear sneakers, office shoes, basketball & casual trainers.",
    itemCount: "150+ Styles",
    startingPrice: "Starting ₹1,499",
    badge: "BESTSELLER",
    gender: "men",
    displayOrder: 1,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85",
  },
  {
    name: "Women's Footwear",
    slug: "women",
    tag: "WOMEN",
    description: "Lightweight walking shoes, sneakers, training kicks & everyday comfort.",
    itemCount: "120+ Styles",
    startingPrice: "Starting ₹1,299",
    badge: "TRENDING",
    gender: "women",
    displayOrder: 2,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=85",
  },
  {
    name: "Trending Sneakers",
    slug: "sneakers",
    tag: "SNEAKERS",
    description: "Clean silhouette kicks, streetwear drops, chunky trainers & retro high-tops.",
    itemCount: "95+ Styles",
    startingPrice: "Starting ₹1,999",
    badge: "HOT DROP",
    gender: "unisex",
    displayOrder: 3,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=85",
  },
  {
    name: "Sports & Running",
    slug: "running",
    tag: "SPORTS",
    description: "High-cushion responsive marathon runners, gym trainers & athletics.",
    itemCount: "80+ Styles",
    startingPrice: "Starting ₹1,699",
    badge: "PRO TECH",
    gender: "all",
    displayOrder: 4,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=85",
  },
  {
    name: "Daily Casuals & Slides",
    slug: "casual",
    tag: "CASUAL",
    description: "Slip-on recovery foam slides, canvas shoes & effortless weekend wear.",
    itemCount: "60+ Styles",
    startingPrice: "Starting ₹899",
    badge: "BUDGET PICK",
    gender: "all",
    displayOrder: 5,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=85",
  },
  {
    name: "Classics & High-Top",
    slug: "classics",
    tag: "PREMIUM",
    description: "Premium leather silhouettes, retro basketball aesthetics & collector drops.",
    itemCount: "45+ Styles",
    startingPrice: "Starting ₹2,499",
    badge: "HERITAGE",
    gender: "all",
    displayOrder: 6,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=85",
  },
];

const Category = mongoose.model("Category", categorySchema);
export default Category;
