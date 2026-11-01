import Product from "../models/Product.js";

/**
 * In-memory sliding window cache for per-device view deduplication.
 * Key: `${deviceId}::${productId}`
 * Value: timestamp (ms) of the view
 */
const deviceViewCache = new Map();

// 1 hour cooldown per device per product to prevent duplicate increments
// on fast refreshes, Next.js metadata double-fetches, or accidental clicks.
const VIEW_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Extracts a consistent unique device or client identifier from Express req
 * @param {import("express").Request} req
 * @returns {string} Unique device identifier
 */
export const getDeviceIdentifier = (req) => {
  if (!req) return "unknown-device";

  // 1. Explicit Client Device ID header (e.g. from frontend localStorage)
  const headerDeviceId = req.headers?.["x-device-id"];
  if (headerDeviceId && typeof headerDeviceId === "string" && headerDeviceId.trim()) {
    return headerDeviceId.trim();
  }

  // 2. Cookie device ID if present
  if (req.cookies && req.cookies.nk_device_id) {
    return req.cookies.nk_device_id;
  }

  // 3. Fallback to client IP address + User Agent fingerprint
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : req.socket?.remoteAddress || req.ip || "unknown-ip";

  const userAgent = (req.headers?.["user-agent"] || "unknown-agent").substring(0, 100);
  return `${ip}::${userAgent}`;
};

/**
 * Tracks a product view per device.
 * Increments `viewsCount` by 1 only once per device within the cooldown window.
 *
 * @param {string|import("mongoose").Types.ObjectId} productId
 * @param {import("express").Request} req
 * @returns {Promise<{ incremented: boolean, viewsCount?: number }>}
 */
export const trackProductViewPerDevice = async (productId, req) => {
  try {
    if (!productId) return { incremented: false };

    const deviceId = getDeviceIdentifier(req);
    const prodIdStr = productId.toString();
    const cacheKey = `${deviceId}::${prodIdStr}`;
    const now = Date.now();

    // Check if this device already viewed this product recently
    const lastViewedAt = deviceViewCache.get(cacheKey);
    if (lastViewedAt && now - lastViewedAt < VIEW_COOLDOWN_MS) {
      // Already counted for this device within the cooldown window
      return { incremented: false };
    }

    // Record view timestamp for this device
    deviceViewCache.set(cacheKey, now);

    // Prune stale cache entries if cache grows large
    if (deviceViewCache.size > 10000) {
      for (const [key, timestamp] of deviceViewCache.entries()) {
        if (now - timestamp > VIEW_COOLDOWN_MS) {
          deviceViewCache.delete(key);
        }
      }
    }

    // Atomically increment viewsCount in MongoDB
    const updated = await Product.findByIdAndUpdate(
      productId,
      { $inc: { viewsCount: 1 } },
      { new: true, select: "viewsCount" }
    ).exec();

    return { incremented: true, viewsCount: updated?.viewsCount };
  } catch (err) {
    console.error("[ViewTracker] Failed to record view count:", err.message);
    return { incremented: false };
  }
};
