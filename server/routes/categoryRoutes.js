import express from "express";
import {
  getCategories,
  getCategoryBySlugOrId,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "../controllers/categoryController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/:idOrSlug", getCategoryBySlugOrId);

// Admin-protected category routes (with Multer file upload support)
router.post("/upload", protect, admin, upload.single("image"), uploadCategoryImage);
router.post("/", protect, admin, upload.single("image"), createCategory);
router.put("/:id", protect, admin, upload.single("image"), updateCategory);
router.delete("/:id", protect, admin, deleteCategory);

export default router;
