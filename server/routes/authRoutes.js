import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  verifyEmail,
  resendVerificationOTP,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendVerificationOTP);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/addresses", protect, addAddress);
router.delete("/addresses/:id", protect, deleteAddress);
router.put("/addresses/:id/default", protect, setDefaultAddress);

export default router;
