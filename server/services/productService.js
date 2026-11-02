import mongoose from "mongoose";
import Product from "../models/Product.js";
import AppError from "../utils/appError.js";
import { uploadFromBuffer, deleteFromCloudinary } from "./cloudinaryService.js";
import { trackProductViewPerDevice } from "./viewTrackerService.js";

/**
 * Service: Query products with multi-facet filters, sorting, and pagination
 * @param {object} queryParams
 */
export const queryProducts = async (queryParams = {}) => {
  const page = Math.max(1, Number(queryParams.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(queryParams.limit) || 20));
  const skip = (page - 1) * limit;

  const {
    keyword,
    search,
    category,
    gender,
    size,
    minPrice,
    maxPrice,
    filter,
    sort,
    inStock,
  } = queryParams;

  const query = { isActive: true };

  // 1. Text Search
  const searchTerm = search || keyword;
  if (searchTerm && searchTerm.trim()) {
    const regex = new RegExp(searchTerm.trim(), "i");
    query.$or = [{ name: regex }, { subtitle: regex }, { description: regex }, { tags: regex }];
  }

  // 2. Category Filter (slug or ObjectId) - matches either primary or multiple categories array
  if (category && category !== "all") {
    if (mongoose.Types.ObjectId.isValid(category)) {
      const catId = new mongoose.Types.ObjectId(category);
      const catClause = { $or: [{ category: catId }, { categories: catId }] };
      if (!query.$and) query.$and = [];
      query.$and.push(catClause);
    } else {
      const cleanSlug = category.toLowerCase().trim();
      const catClause = {
        $or: [{ categorySlug: cleanSlug }, { categorySlugs: cleanSlug }],
      };
      if (!query.$and) query.$and = [];
      query.$and.push(catClause);
    }
  }

  // 3. Gender Filter
  if (gender && gender !== "all") {
    query.$or = [
      ...(query.$or || []),
      { gender: gender.toLowerCase() },
      { gender: "unisex" },
    ];
  }

  // 4. Footwear Size Filter
  if (size && size !== "all") {
    const cleanSize = size.toUpperCase().trim();
    query.sizes = {
      $elemMatch: {
        size: { $regex: new RegExp(`^${cleanSize}$`, "i") },
        available: true,
        stock: { $gt: 0 },
      },
    };
  }

  // 5. Price Range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // 6. In Stock Filter
  if (inStock === "true") {
    query.stock = { $gt: 0 };
  }

  // 7. Sorting Criteria Default
  let sortOptions = { isFeatured: -1, createdAt: -1 };

  // 8. Dynamic Preset Filters (Time & Sales based with graceful fallbacks)
  if (filter === "new-arrivals") {
    const cutOff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    const countRecent = await Product.countDocuments({ ...query, createdAt: { $gte: cutOff } });
    if (countRecent > 0) {
      query.createdAt = { $gte: cutOff };
    }
    sortOptions = { createdAt: -1 };
  } else if (filter === "sale") {
    query.$expr = { $gt: ["$originalPrice", "$price"] };
  } else if (filter === "best-sellers") {
    // If products have sales, views, or high ratings, prioritize them; otherwise display existing products as-is
    const hasPerformers = await Product.countDocuments({
      ...query,
      $or: [{ salesCount: { $gt: 0 } }, { viewsCount: { $gt: 0 } }, { ratings: { $gte: 4.5 } }],
    });
    if (hasPerformers > 0) {
      query.$or = [{ salesCount: { $gt: 0 } }, { viewsCount: { $gt: 0 } }, { ratings: { $gte: 4.5 } }];
    }
    sortOptions = { salesCount: -1, viewsCount: -1, ratings: -1, createdAt: -1 };
  } else if (filter === "featured") {
    query.isFeatured = true;
  }

  // 9. Sorting Criteria Override from Query Params
  switch (sort) {
    case "price-asc":
      sortOptions = { price: 1 };
      break;
    case "price-desc":
      sortOptions = { price: -1 };
      break;
    case "bestseller":
    case "best-sellers":
      sortOptions = { salesCount: -1, viewsCount: -1, ratings: -1, createdAt: -1 };
      break;
    case "rating":
      sortOptions = { ratings: -1, numReviews: -1 };
      break;
    case "newest":
      sortOptions = { createdAt: -1 };
      break;
    case "featured":
      sortOptions = { isFeatured: -1, createdAt: -1 };
      break;
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .populate("category", "name slug")
      .populate("categories", "name slug")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
  ]);

  return {
    products,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
    limit,
  };
};

/**
 * Service: Get newly arrived products (dynamic time sort)
 * If no new products added recently, displays existing latest data as-is
 * @param {number} limit
 */
export const getNewArrivals = async (limit = 8) => {
  const safeLimit = Math.min(24, Math.max(1, limit));
  return await Product.find({ isActive: true })
    .populate("category", "name slug")
    .populate("categories", "name slug")
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

/**
 * Service: Get best sellers (dynamic sales, views, and rating sort)
 * If no orders yet, automatically falls back to product view count + ratings as-is
 * @param {number} limit
 */
export const getBestSellers = async (limit = 8) => {
  const safeLimit = Math.min(24, Math.max(1, limit));
  return await Product.find({ isActive: true })
    .populate("category", "name slug")
    .populate("categories", "name slug")
    .sort({ salesCount: -1, viewsCount: -1, ratings: -1, createdAt: -1 })
    .limit(safeLimit);
};

/**
 * Service: Get editorial featured products
 * @param {number} limit
 */
export const getFeaturedProducts = async (limit = 8) => {
  const safeLimit = Math.min(20, Math.max(1, limit));
  return await Product.find({ isFeatured: true, isActive: true })
    .populate("category", "name slug")
    .populate("categories", "name slug")
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

/**
 * Service: Get single product by slug and fetch 4 related products
 * Increments product view count using per-device deduplication system (+1 per device)
 * @param {string} slug
 * @param {object} req - Express request object for device tracking
 */
export const getProductBySlug = async (slug, req = null) => {
  if (!slug) throw new AppError("Product slug is required", 400);

  const product = await Product.findOne({ slug: slug.toLowerCase(), isActive: true })
    .populate("category", "name slug")
    .populate("categories", "name slug");

  if (!product) {
    throw new AppError("Product not found with requested slug", 404);
  }

  // Increment views in background with per-device deduplication (+1 per device)
  if (req) {
    trackProductViewPerDevice(product._id, req).catch(() => {});
  } else {
    Product.updateOne({ _id: product._id }, { $inc: { viewsCount: 1 } }).exec();
  }

  const allSlugs = [
    product.categorySlug,
    ...(Array.isArray(product.categorySlugs) ? product.categorySlugs : []),
  ].filter(Boolean);

  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [
      { categorySlug: { $in: allSlugs } },
      { categorySlugs: { $in: allSlugs } },
      { gender: product.gender },
    ],
  })
    .populate("category", "name slug")
    .populate("categories", "name slug")
    .limit(4)
    .sort({ salesCount: -1, viewsCount: -1 });

  return { product, relatedProducts };
};

/**
 * Service: Get single product by MongoDB ObjectId
 * Increments product view count using per-device deduplication system (+1 per device)
 * @param {string} id
 * @param {object} req - Express request object for device tracking
 */
export const getProductById = async (id, req = null) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID format", 400);
  }

  const product = await Product.findById(id)
    .populate("category", "name slug")
    .populate("categories", "name slug");
  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  if (req) {
    trackProductViewPerDevice(product._id, req).catch(() => {});
  }

  return product;
};

/**
 * Service: Explicitly record a view for a product (per device +1)
 * @param {string} identifier - Product ID or Slug
 * @param {object} req - Express request object
 */
export const recordProductView = async (identifier, req) => {
  let product = null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier);
  } else {
    product = await Product.findOne({ slug: identifier.toLowerCase() });
  }

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const result = await trackProductViewPerDevice(product._id, req);
  return {
    productId: product._id,
    slug: product.slug,
    incremented: result.incremented,
    viewsCount: result.viewsCount ?? product.viewsCount,
  };
};

/**
 * Service: Create a new product with Cloudinary image processing
 * @param {object} productData
 * @param {Array} files - Multer file array
 */
export const createProduct = async (productData, files = []) => {
  const {
    name,
    slug,
    subtitle,
    tagline,
    description,
    features,
    price,
    originalPrice,
    category,
    categorySlug,
    gender,
    brand,
    sizes,
    colors,
    isFeatured,
    isActive,
    tags,
    seo,
    images: bodyImages,
  } = productData;

  if (!name || !price || !description) {
    throw new AppError("Name, price, and description are required fields", 400);
  }

  const uploadedImages = [];
  const media = [];

  // Process uploaded image file buffers to Cloudinary
  if (Array.isArray(files) && files.length > 0) {
    for (const file of files) {
      const result = await uploadFromBuffer(file.buffer, "nk-shoes/products");
      uploadedImages.push(result.secure_url);
      media.push({
        url: result.secure_url,
        public_id: result.public_id,
        alt: name,
      });
    }
  }

  if (Array.isArray(bodyImages)) {
    uploadedImages.push(...bodyImages);
  }

  const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes || [];
  const parsedColors = typeof colors === "string" ? JSON.parse(colors) : colors || [];
  const parsedFeatures = typeof features === "string" ? JSON.parse(features) : features || [];
  const parsedSeo = typeof seo === "string" ? JSON.parse(seo) : seo || {};

  const product = new Product({
    name: name.trim(),
    slug: (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    subtitle: subtitle || "Performance & Lifestyle Footwear",
    tagline: tagline || "",
    description,
    features: parsedFeatures,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    category: category || undefined,
    categorySlug: categorySlug || "sneakers",
    categories: Array.isArray(productData.categories) ? productData.categories : (category ? [category] : []),
    categorySlugs: Array.isArray(productData.categorySlugs) ? productData.categorySlugs : (categorySlug ? [categorySlug] : []),
    gender: gender || "unisex",
    brand: brand || "NK-SHOES",
    images: uploadedImages,
    media,
    sizes: parsedSizes,
    colors: parsedColors,
    isFeatured: Boolean(isFeatured),
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    tags: Array.isArray(tags) ? tags : [],
    seo: parsedSeo,
  });

  return await product.save();
};

/**
 * Service: Update product details and handle image additions
 * @param {string} id
 * @param {object} updateData
 * @param {Array} files
 */
export const updateProduct = async (id, updateData, files = []) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID format", 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (Array.isArray(files) && files.length > 0) {
    for (const file of files) {
      const result = await uploadFromBuffer(file.buffer, "nk-shoes/products");
      product.images.push(result.secure_url);
      product.media.push({
        url: result.secure_url,
        public_id: result.public_id,
        alt: product.name,
      });
    }
  }

  if (updateData.sizes && typeof updateData.sizes === "string") updateData.sizes = JSON.parse(updateData.sizes);
  if (updateData.colors && typeof updateData.colors === "string") updateData.colors = JSON.parse(updateData.colors);
  if (updateData.features && typeof updateData.features === "string") updateData.features = JSON.parse(updateData.features);
  if (updateData.seo && typeof updateData.seo === "string") updateData.seo = JSON.parse(updateData.seo);

  Object.assign(product, updateData);
  return await product.save();
};

/**
 * Service: Delete product and purge images from Cloudinary
 * @param {string} id
 */
export const deleteProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID format", 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.media && product.media.length > 0) {
    for (const item of product.media) {
      if (item.public_id) {
        await deleteFromCloudinary(item.public_id);
      }
    }
  }

  await product.deleteOne();
  return { id };
};

/**
 * Service: Add customer review to a product and re-calculate ratings & numReviews
 * @param {string} identifier - Product ObjectId or slug
 * @param {object} reviewData - { rating, title, content, author, city, fit }
 * @param {object} user - Authenticated user if available
 */
export const addProductReview = async (identifier, reviewData, user = null) => {
  let product = null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier);
  } else {
    product = await Product.findOne({ slug: identifier.toLowerCase() });
  }

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const { rating, title, content, author, city, fit } = reviewData;

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  if (!title || !title.trim()) {
    throw new AppError("Review title is required", 400);
  }

  if (!content || !content.trim()) {
    throw new AppError("Review content is required", 400);
  }

  const newReview = {
    user: user ? user._id : undefined,
    author: author ? author.trim() : user ? user.name : "Verified Customer",
    city: city ? city.trim() : "India",
    rating: numRating,
    fit: ["Runs Small", "True to Size", "Runs Large"].includes(fit) ? fit : "True to Size",
    title: title.trim(),
    content: content.trim(),
    verified: true,
    helpfulCount: 0,
  };

  if (!Array.isArray(product.reviews)) {
    product.reviews = [];
  }

  product.reviews.unshift(newReview);
  product.numReviews = product.reviews.length;
  const totalStars = product.reviews.reduce((sum, r) => sum + (r.rating || 5), 0);
  product.ratings = Number((totalStars / product.reviews.length).toFixed(1));

  await product.save();

  return {
    success: true,
    message: "Thank you! Your verified review has been published.",
    review: product.reviews[0],
    ratings: product.ratings,
    numReviews: product.numReviews,
    reviews: product.reviews,
  };
};

/**
 * Service: Upvote a review as helpful
 * @param {string} identifier - Product ObjectId or slug
 * @param {string} reviewId - Review subdocument ID
 */
export const voteReviewHelpful = async (identifier, reviewId) => {
  let product = null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier);
  } else {
    product = await Product.findOne({ slug: identifier.toLowerCase() });
  }

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const review = product.reviews?.id(reviewId);
  if (!review) {
    throw new AppError("Review not found", 404);
  }

  review.helpfulCount = (review.helpfulCount || 0) + 1;
  await product.save();

  return {
    success: true,
    reviewId,
    helpfulCount: review.helpfulCount,
  };
};

export default {
  queryProducts,
  getNewArrivals,
  getBestSellers,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  recordProductView,
  addProductReview,
  voteReviewHelpful,
  createProduct,
  updateProduct,
  deleteProduct,
};
