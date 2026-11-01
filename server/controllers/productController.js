import catchAsync from "../utils/catchAsync.js";
import * as productService from "../services/productService.js";

/**
 * @desc    Get all products with multi-facet filters & sorting
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = catchAsync(async (req, res) => {
  const result = await productService.queryProducts(req.query);
  res.status(200).json({
    status: "success",
    ...result,
  });
});

/**
 * @desc    Get newly arrived products (dynamic time sort)
 * @route   GET /api/products/new-arrivals
 * @access  Public
 */
export const getNewArrivals = catchAsync(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  const products = await productService.getNewArrivals(limit);
  res.status(200).json(products);
});

/**
 * @desc    Get best sellers (dynamic sales and rating sort)
 * @route   GET /api/products/best-sellers
 * @access  Public
 */
export const getBestSellers = catchAsync(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  const products = await productService.getBestSellers(limit);
  res.status(200).json(products);
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = catchAsync(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  const products = await productService.getFeaturedProducts(limit);
  res.status(200).json(products);
});

/**
 * @desc    Get product by slug with related products
 * @route   GET /api/products/slug/:slug
 * @access  Public
 */
export const getProductBySlug = catchAsync(async (req, res) => {
  const data = await productService.getProductBySlug(req.params.slug, req);
  res.status(200).json(data);
});

/**
 * @desc    Get product by ObjectId
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id, req);
  res.status(200).json(product);
});

/**
 * @desc    Record product view (per device +1)
 * @route   POST /api/products/:identifier/view
 * @access  Public
 */
export const recordProductView = catchAsync(async (req, res) => {
  const result = await productService.recordProductView(req.params.identifier, req);
  res.status(200).json({
    status: "success",
    ...result,
  });
});

/**
 * @desc    Create a new product with Cloudinary image uploads
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = catchAsync(async (req, res) => {
  const newProduct = await productService.createProduct(req.body, req.files);
  res.status(201).json(newProduct);
});

/**
 * @desc    Update existing product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = catchAsync(async (req, res) => {
  const updatedProduct = await productService.updateProduct(
    req.params.id,
    req.body,
    req.files
  );
  res.status(200).json(updatedProduct);
});

/**
 * @desc    Delete a product and purge its Cloudinary assets
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = catchAsync(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Product deleted successfully",
    data: result,
  });
});

/**
 * @desc    Add verified customer review for a product
 * @route   POST /api/products/:identifier/reviews
 * @access  Public / OptionalAuth
 */
export const addProductReview = catchAsync(async (req, res) => {
  const result = await productService.addProductReview(
    req.params.identifier,
    req.body,
    req.user
  );
  res.status(201).json(result);
});

/**
 * @desc    Upvote a customer review as helpful
 * @route   POST /api/products/:identifier/reviews/:reviewId/helpful
 * @access  Public
 */
export const voteReviewHelpful = catchAsync(async (req, res) => {
  const result = await productService.voteReviewHelpful(
    req.params.identifier,
    req.params.reviewId
  );
  res.status(200).json(result);
});
