import express from "express";
import {
  getPublicStoreSettings,
  validateCoupon,
} from "../controllers/settingController.js";

const router = express.Router();

// Publicly available store settings (coupons, announcement, shipping, payment configuration)
router.get("/public", getPublicStoreSettings);
router.get("/store", getPublicStoreSettings);
router.post("/validate-coupon", validateCoupon);

export default router;

