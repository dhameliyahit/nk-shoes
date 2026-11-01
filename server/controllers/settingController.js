import Setting from "../models/Setting.js";
import Order from "../models/Order.js";
import { sendTestEmail } from "../services/emailService.js";

/**
 * @desc    Get public store settings (Announcement, Coupons, Shipping, Payment rules)
 * @route   GET /api/settings/public or GET /api/orders/settings
 * @access  Public
 */
export const getPublicStoreSettings = async (req, res) => {
  try {
    const storeSettings = await Setting.get("store_settings");
    if (!storeSettings) {
      return res.status(404).json({
        success: false,
        message: "Store settings have not been configured in database yet.",
        settings: null,
      });
    }

    res.json({
      success: true,
      settings: storeSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      settings: null,
    });
  }
};

/**
 * @desc    Validate coupon code against backend settings
 * @route   POST /api/settings/validate-coupon
 * @access  Public
 */
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal = 0, email = "" } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ valid: false, message: "Coupon code is required" });
    }

    const storeSettings = await Setting.get("store_settings");
    const coupons = storeSettings?.coupons || [];
    const cleanCode = code.trim().toUpperCase();

    const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (!coupon) {
      return res.status(404).json({ valid: false, message: `Coupon '${cleanCode}' is invalid or expired` });
    }

    // New User Only Coupon Validation
    if (coupon.isNewUserOnly) {
      let pastOrdersCount = 0;
      const userFilters = [];
      if (req.user?._id) userFilters.push({ user: req.user._id });
      if (email && email.trim()) userFilters.push({ guestEmail: email.trim().toLowerCase() });
      if (req.user?.email) userFilters.push({ guestEmail: req.user.email.toLowerCase() });

      if (userFilters.length > 0) {
        pastOrdersCount = await Order.countDocuments({
          $or: userFilters,
          orderStatus: { $ne: "cancelled" },
        });
      }

      if (pastOrdersCount > 0) {
        return res.status(400).json({
          valid: false,
          coupon,
          message: `Coupon '${coupon.code}' is valid exclusively for new customers on their first order.`,
        });
      }
    }

    if (coupon.minOrderAmount && Number(subtotal) < Number(coupon.minOrderAmount)) {
      return res.status(400).json({
        valid: false,
        coupon,
        message: `Minimum order amount of ₹${coupon.minOrderAmount.toLocaleString("en-IN")} required for this coupon`,
      });
    }

    const discountPercent = Number(coupon.discountPercent || 0);
    const discountAmount = Math.round((Number(subtotal) * discountPercent) / 100);

    return res.json({
      valid: true,
      code: coupon.code,
      discountPercent,
      discountAmount,
      description: coupon.description,
      message: `Coupon '${coupon.code}' applied: ${discountPercent}% OFF!`,
    });
  } catch (error) {
    return res.status(500).json({ valid: false, message: error.message });
  }
};

/**
 * @desc    Get all settings
 * @route   GET /api/admin/settings
 * @access  Private/Admin
 */
export const getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find({});
    // Mask sensitive passwords in list view
    const sanitized = settings.map((s) => {
      const doc = s.toObject();
      if (doc.key === "email" && doc.value?.auth?.pass) {
        doc.value = {
          ...doc.value,
          auth: { ...doc.value.auth, pass: "********" },
        };
      }
      return doc;
    });
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get setting by key
 * @route   GET /api/admin/settings/:key
 * @access  Private/Admin
 */
export const getSettingByKey = async (req, res) => {
  try {
    const key = req.params.key.toLowerCase().trim();
    const setting = await Setting.findOne({ key });

    if (!setting) {
      return res.status(404).json({ message: `Setting with key '${key}' not found` });
    }

    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update or create a setting (Flexible Schema)
 * @route   PUT /api/admin/settings/:key
 * @access  Private/Admin
 */
export const updateSetting = async (req, res) => {
  try {
    const key = req.params.key.toLowerCase().trim();
    let incomingValue = req.body.value !== undefined ? req.body.value : req.body;
    const { description, group } = req.body;

    // If updating email setting, format and preserve credentials cleanly
    if (key === "email") {
      const existing = await Setting.get("email");
      const email = incomingValue.email || incomingValue.auth?.user || existing?.auth?.user || "";
      let pass = incomingValue.password || incomingValue.auth?.pass;

      // Keep existing password if frontend sends masked string or empty string
      if (!pass || pass === "********") {
        pass = existing?.auth?.pass || "";
      }

      incomingValue = {
        service: incomingValue.service || "gmail",
        host: incomingValue.host || "smtp.gmail.com",
        port: incomingValue.port ? Number(incomingValue.port) : 465,
        secure: incomingValue.secure !== undefined ? Boolean(incomingValue.secure) : true,
        auth: {
          user: email,
          pass: pass,
        },
        fromName: incomingValue.fromName || "NK-SHOES",
        fromEmail: incomingValue.fromEmail || email,
      };
    }

    const updatedSetting = await Setting.set(key, incomingValue, {
      description: description || (key === "email" ? "Gmail SMTP Email Settings" : undefined),
      group: group || (key === "email" ? "system" : undefined),
    });

    res.json({
      success: true,
      message: `Setting '${key}' updated successfully`,
      setting: updatedSetting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Send test email using current or provided SMTP settings
 * @route   POST /api/admin/settings/email/test
 * @access  Private/Admin
 */
export const testEmail = async (req, res) => {
  try {
    const { toEmail } = req.body;

    if (!toEmail) {
      return res.status(400).json({ message: "Recipient email (toEmail) is required" });
    }

    const result = await sendTestEmail(toEmail);
    res.json({
      success: true,
      message: `Test email sent successfully to ${toEmail}`,
      details: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to send test email: ${error.message}`,
    });
  }
};
