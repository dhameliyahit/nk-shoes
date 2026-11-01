import mongoose from "mongoose";

const productSizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true, // e.g. "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"
      trim: true,
    },
    stock: {
      type: Number,
      default: 10,
      min: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const productColorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Core Black / Cloud White"
    hex: { type: String, default: "#111111" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, default: "" },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const productReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    city: {
      type: String,
      default: "India",
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    fit: {
      type: String,
      enum: ["Runs Small", "True to Size", "Runs Large"],
      default: "True to Size",
    },
    title: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Review content is required"],
      trim: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a product name"],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "Performance & Lifestyle Footwear",
    },
    tagline: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    features: [
      {
        type: String,
      },
    ],
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: function () {
        return `NK-${Math.floor(100000 + Math.random() * 900000)}`;
      },
    },
    brand: {
      type: String,
      default: "NK-SHOES",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },
    categorySlug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      default: "sneakers",
    },
    gender: {
      type: String,
      enum: ["men", "women", "unisex", "kids"],
      default: "unisex",
      lowercase: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
      min: 0,
      index: true,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    images: [String], // Array of image URLs for quick storefront rendering
    media: [productImageSchema], // Rich Cloudinary image objects with public_id
    colors: [productColorSchema],
    sizes: [productSizeSchema],
    stock: {
      type: Number,
      default: 50,
      min: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
      index: true,
    },
    ratings: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 12,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    tags: [String],
    reviews: [productReviewSchema],
    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      keywords: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from name if not provided
productSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

// Update total stock based on sizes array if sizes exist
productSchema.pre("save", function (next) {
  if (this.sizes && this.sizes.length > 0) {
    this.stock = this.sizes.reduce((total, s) => total + (s.stock || 0), 0);
  }
  next();
});

// ============================================================================
// DYNAMIC VIRTUALS: Calculated at runtime from time, stock, and sales
// ============================================================================

/**
 * isNew: Dynamically calculated based on createdAt (within last 35 days)
 * No static flag required!
 */
productSchema.virtual("isNew").get(function () {
  if (!this.createdAt) return true;
  const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  return new Date(this.createdAt) >= thirtyFiveDaysAgo;
});

/**
 * isBestSeller: Dynamically determined by sales volume, view popularity, or high review count
 */
productSchema.virtual("isBestSeller").get(function () {
  return (
    (this.salesCount || 0) >= 5 ||
    (this.viewsCount || 0) >= 20 ||
    ((this.ratings || 0) >= 4.7 && (this.numReviews || 0) >= 10)
  );
});

/**
 * inStock: Dynamically computed from stock count
 */
productSchema.virtual("inStock").get(function () {
  return (this.stock || 0) > 0;
});

/**
 * discountPercent: Dynamically calculated from originalPrice and price
 */
productSchema.virtual("discountPercent").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

/**
 * badge: Computed automatically based on real-time factors
 * Priority: Sold Out > Discount % > Just Dropped > Bestseller > Low Stock
 */
productSchema.virtual("badge").get(function () {
  if ((this.stock || 0) === 0) {
    return { text: "SOLD OUT", variant: "soldout" };
  }
  if (this.originalPrice && this.originalPrice > this.price) {
    const discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    return { text: `-${discount}% OFF`, variant: "sale" };
  }
  // Check if newly arrived (created in last 35 days)
  const isNewlyCreated =
    this.createdAt && new Date(this.createdAt) >= new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  if (isNewlyCreated) {
    return { text: "JUST DROPPED", variant: "new" };
  }
  if (
    (this.salesCount || 0) >= 5 ||
    (this.viewsCount || 0) >= 20 ||
    ((this.ratings || 0) >= 4.7 && (this.numReviews || 0) >= 10)
  ) {
    return { text: "BESTSELLER", variant: "bestseller" };
  }
  if ((this.stock || 0) <= 5) {
    return { text: "FEW PAIRS LEFT", variant: "hot" };
  }
  return undefined;
});

// ============================================================================
// INITIAL SEEDING FOR FLAGSHIP FOOTWEAR
// ============================================================================
export const DEFAULT_FLAGSHIP_PRODUCTS = [
  {
    name: "NK Ultraboost Light 26",
    slug: "nk-ultraboost-light-26",
    subtitle: "Men's High-Mileage Road Running Shoes",
    tagline: "Experience epic energy return with lightweight responsive foam cushioning.",
    description:
      "Engineered for daily distance and explosive road tempo. Features high-tensile engineered breathable mesh, precision Continental rubber traction, and full-length responsive midsole return.",
    features: [
      "Lightweight engineered mesh upper for maximum breathability",
      "Full-length responsive foam midsole with 20% higher energy return",
      "High-abrasion Continental grip rubber outsole",
      "Reinforced heel counter for lateral heel lockdown",
      "Reflective 3M detailing for night road running",
    ],
    price: 3499,
    originalPrice: 4999,
    categorySlug: "running",
    gender: "men",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=85",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200&q=85",
      "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=1200&q=85",
    ],
    colors: [
      { name: "Solar Red / Core Black", hex: "#E53E3E" },
      { name: "Triple Black", hex: "#111111" },
      { name: "Cloud White / Silver", hex: "#F5F5F5" },
    ],
    sizes: [
      { size: "UK 6", stock: 8, available: true },
      { size: "UK 7", stock: 12, available: true },
      { size: "UK 8", stock: 15, available: true },
      { size: "UK 9", stock: 14, available: true },
      { size: "UK 10", stock: 10, available: true },
      { size: "UK 11", stock: 6, available: true },
    ],
    stock: 65,
    salesCount: 88,
    ratings: 4.9,
    numReviews: 42,
    isFeatured: true,
    isActive: true,
  },
  {
    name: "NK Samba Classic Court",
    slug: "nk-samba-classic-court",
    subtitle: "Low-Profile Retro Streetwear Sneaker",
    tagline: "The timeless football heritage silhouette reworked for modern street culture.",
    description:
      "Born on the pitch and adopted by worldwide streetwear icons. Features supple genuine leather, classic suede T-toe overlay, and low-profile gum rubber outsole.",
    features: [
      "Full-grain leather upper with suede T-toe reinforcement",
      "Textured gum rubber outsole with pivot-point traction",
      "Die-cut EVA insole for lightweight all-day comfort",
      "Gold foil lateral branding accents",
    ],
    price: 2799,
    originalPrice: 3499,
    categorySlug: "sneakers",
    gender: "unisex",
    images: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=85",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=1200&q=85",
      "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=1200&q=85",
    ],
    colors: [
      { name: "Cloud White / Core Black / Gum", hex: "#FFFFFF" },
      { name: "Core Black / Cloud White", hex: "#1A1A1A" },
    ],
    sizes: [
      { size: "UK 5", stock: 5, available: true },
      { size: "UK 6", stock: 9, available: true },
      { size: "UK 7", stock: 14, available: true },
      { size: "UK 8", stock: 18, available: true },
      { size: "UK 9", stock: 12, available: true },
      { size: "UK 10", stock: 7, available: true },
    ],
    stock: 65,
    salesCount: 140,
    ratings: 4.8,
    numReviews: 67,
    isFeatured: true,
    isActive: true,
  },
  {
    name: "NK PureMotion Cloudfoam",
    slug: "nk-puremotion-cloudfoam",
    subtitle: "Women's Lightweight Slip-On Walking Sneaker",
    tagline: "Cloudfoam pillow-soft midsole cushioning built for all-day effortless strides.",
    description:
      "Designed specifically for women's ergonomic foot architecture. Seamless sock-like knit construction hugs your foot, while the Cloudfoam midsole provides immediate step-in softness.",
    features: [
      "Sock-like breathable circular knit upper",
      "Cloudfoam memory-cushion dual-density sockliner",
      "Flex-groove rubber pods for natural motion",
      "Pull-tabs at heel and tongue for rapid on-off",
    ],
    price: 2199,
    originalPrice: 2899,
    categorySlug: "women",
    gender: "women",
    images: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=85",
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1200&q=85",
    ],
    colors: [
      { name: "Lilac Whisper / Rose", hex: "#D6BCFA" },
      { name: "Chalk White / Sand", hex: "#FAF0E6" },
      { name: "Core Black / White", hex: "#2D3748" },
    ],
    sizes: [
      { size: "UK 4", stock: 6, available: true },
      { size: "UK 5", stock: 10, available: true },
      { size: "UK 6", stock: 15, available: true },
      { size: "UK 7", stock: 12, available: true },
      { size: "UK 8", stock: 8, available: true },
    ],
    stock: 51,
    salesCount: 75,
    ratings: 4.9,
    numReviews: 38,
    isFeatured: true,
    isActive: true,
  },
  {
    name: "NK Pro Training Force X",
    slug: "nk-pro-training-force-x",
    subtitle: "Cross-Training & Heavy Lifting Stability Shoe",
    tagline: "Flat stable base meets responsive forefoot flex for heavy squats, HIIT, and box jumps.",
    description:
      "Engineered for high-intensity gym sessions, functional fitness, and heavy lifting. Wide toe box allows natural toe splay, while TPU heel wraps prevent roll-over under heavy loads.",
    features: [
      "High-density TPU heel clip for maximum lifting stability",
      "Tear-resistant ripstop ballistic mesh upper",
      "Rope-wrap side rubber sidewalls for climbing traction",
      "Removable Hyperlift insert to adjust heel-to-toe drop",
    ],
    price: 3199,
    originalPrice: 3999,
    categorySlug: "sports",
    gender: "men",
    images: [
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1200&q=85",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=85",
    ],
    colors: [
      { name: "Carbon Black / Volt Green", hex: "#222222" },
      { name: "Stealth Grey / Iron", hex: "#4A5568" },
    ],
    sizes: [
      { size: "UK 7", stock: 8, available: true },
      { size: "UK 8", stock: 14, available: true },
      { size: "UK 9", stock: 16, available: true },
      { size: "UK 10", stock: 11, available: true },
      { size: "UK 11", stock: 5, available: true },
    ],
    stock: 54,
    salesCount: 45,
    ratings: 4.7,
    numReviews: 29,
    isFeatured: true,
    isActive: true,
  },
  {
    name: "NK Adilette 22 Slide",
    slug: "nk-adilette-22-slide",
    subtitle: "Futuristic 3D Topographic Recovery Slide",
    tagline: "Bio-based EVA construction designed with futuristic topographical contours.",
    description:
      "Inspired by 3D topographical maps of human expeditions to Mars. Created with sugarcane-based EVA foam for soft, ergonomic arch recovery after grueling workout sessions.",
    features: [
      "One-piece bio-based EVA construction containing 25% plant material",
      "Ergonomic contoured footbed designed for post-training recovery",
      "Topographic textured grip pattern prevents slipping on wet tiles",
      "Quick-drying water-resistant structure",
    ],
    price: 1499,
    originalPrice: 1999,
    categorySlug: "casual",
    gender: "unisex",
    images: [
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=1200&q=85",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=85",
    ],
    colors: [
      { name: "Desert Sand", hex: "#D2B48C" },
      { name: "Carbon Grey", hex: "#2D3748" },
      { name: "Off White", hex: "#F7FAFC" },
    ],
    sizes: [
      { size: "UK 6", stock: 10, available: true },
      { size: "UK 7", stock: 18, available: true },
      { size: "UK 8", stock: 22, available: true },
      { size: "UK 9", stock: 19, available: true },
      { size: "UK 10", stock: 12, available: true },
    ],
    stock: 81,
    salesCount: 160,
    ratings: 4.9,
    numReviews: 92,
    isFeatured: true,
    isActive: true,
  },
  {
    name: "NK Forum 84 High Leather",
    slug: "nk-forum-84-high-leather",
    subtitle: "Heritage Basketball High-Top Sneaker",
    tagline: "Authentic 1984 hardwood court design crafted from premium vintage leather.",
    description:
      "A tribute to the iconic 1984 basketball classic. Crafted from thick full-grain leather, removable cross-ankle strap, and vintage off-white midsole detailing.",
    features: [
      "Premium heavyweight full-grain leather and suede details",
      "Removable hook-and-loop cross ankle strap for customized styling",
      "Vintage off-white EVA midsole with signature Dellinger webbing",
      "Pivot-circle rubber cupsole for authentic hardwood feel",
    ],
    price: 3999,
    originalPrice: 5499,
    categorySlug: "classics",
    gender: "unisex",
    images: [
      "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=1200&q=85",
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=85",
    ],
    colors: [
      { name: "Off White / Royal Blue", hex: "#2B6CB0" },
      { name: "Chalk White / Grey One", hex: "#E2E8F0" },
    ],
    sizes: [
      { size: "UK 7", stock: 6, available: true },
      { size: "UK 8", stock: 10, available: true },
      { size: "UK 9", stock: 9, available: true },
      { size: "UK 10", stock: 7, available: true },
      { size: "UK 11", stock: 4, available: true },
    ],
    stock: 36,
    salesCount: 38,
    ratings: 4.8,
    numReviews: 24,
    isFeatured: true,
    isActive: true,
  },
];

const Product = mongoose.model("Product", productSchema);
export default Product;
