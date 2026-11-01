import express from "express";
import {
  getProducts,
  getNewArrivals,
  getBestSellers,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  recordProductView,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  voteReviewHelpful,
} from "../controllers/productController.js";
import { protect, admin, optionalAuth } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/best-sellers", getBestSellers);
router.get("/featured", getFeaturedProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);
router.post("/:identifier/view", recordProductView);

// Product reviews & helpful votes
router.post("/:identifier/reviews", optionalAuth, addProductReview);
router.post("/:identifier/reviews/:reviewId/helpful", voteReviewHelpful);

// Admin routes with image upload
router.post("/", protect, admin, upload.array("images", 8), createProduct);
router.put("/:id", protect, admin, upload.array("images", 8), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

export default router;
