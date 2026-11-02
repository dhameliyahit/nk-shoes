import express from "express";
import {
  createProduct,
  updateProduct,
  getProductByIdAdmin,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
  getAllReviewsAdmin,
  deleteReviewAdmin,
  getAllUsers,
  updateUserRole,
  deleteUserAdmin,
  getDashboardStats,
} from "../controllers/adminController.js";
import {
  getAllPagesAdmin,
  createPageAdmin,
  updatePageAdmin,
  deletePageAdmin,
} from "../controllers/pageController.js";
import {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  testEmail,
} from "../controllers/settingController.js";
import { uploadCategoryImage } from "../controllers/categoryController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(protect, admin);

// Analytics & Dashboard
router.get("/stats", getDashboardStats);

// Products
router.route("/products").post(createProduct);
router
  .route("/products/:id")
  .get(getProductByIdAdmin)
  .put(updateProduct)
  .delete(deleteProduct);

// Categories
router.post("/categories/upload", upload.single("image"), uploadCategoryImage);
router.route("/categories").post(createCategory);
router.route("/categories/:id").put(updateCategory).delete(deleteCategory);

// Orders & Logistics
router.route("/orders").get(getAllOrders);
router.route("/orders/:id").get(getOrderByIdAdmin);
router.route("/orders/:id/status").put(updateOrderStatus);

// Reviews Moderation
router.get("/reviews", getAllReviewsAdmin);
router.delete("/reviews/:productId/:reviewId", deleteReviewAdmin);

// Dynamic CMS Pages
router.route("/pages").get(getAllPagesAdmin).post(createPageAdmin);
router.route("/pages/:id").put(updatePageAdmin).delete(deletePageAdmin);

// User Access
router.route("/users").get(getAllUsers);
router.route("/users/:id").delete(deleteUserAdmin);
router.route("/users/:id/role").put(updateUserRole);

// Settings & Store Configuration
router.route("/settings").get(getAllSettings);
router.route("/settings/:key").get(getSettingByKey).put(updateSetting);
router.post("/settings/email/test", testEmail);

export default router;
