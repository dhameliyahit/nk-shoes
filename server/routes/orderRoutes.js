import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  verifyPincodeController,
  phonepeCallbackController,
  getPhonepeStatusController,
} from "../controllers/orderController.js";
import { getPublicStoreSettings } from "../controllers/settingController.js";
import { protect, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/settings", getPublicStoreSettings);
router.get("/verify-pincode/:pincode", verifyPincodeController);
router.get("/phonepe/callback", phonepeCallbackController);
router.get("/phonepe/status/:merchantOrderId", getPhonepeStatusController);
router.route("/").post(optionalAuth, createOrder);
router.route("/myorders").get(protect, getMyOrders);
router.route("/my-orders").get(protect, getMyOrders);
router.route("/:id").get(optionalAuth, getOrderById);
router.route("/:id/cancel").put(optionalAuth, cancelMyOrder);

export default router;
