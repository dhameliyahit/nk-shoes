import { v2 as cloudinary } from "cloudinary";
import config from "../config/env.js";

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: config.cloudinary.cloudName || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: config.cloudinary.apiKey || process.env.CLOUDINARY_API_KEY,
  api_secret: config.cloudinary.apiSecret || process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a memory buffer (e.g. from Multer) directly to Cloudinary
 * @param {Buffer} buffer - Buffer from file upload
 * @param {string} folder - Target folder on Cloudinary
 * @param {object} options - Optional upload options
 * @returns {Promise<{ url: string, secure_url: string, public_id: string, format: string, bytes: number }>}
 */
export const uploadFromBuffer = (buffer, folder = "nk-shoes/categories", options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        quality: "auto:best",
        fetch_format: "auto",
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary Upload Error]", error);
          return reject(error);
        }
        resolve({
          url: result.url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload a Base64 string or remote image URL to Cloudinary
 * @param {string} fileStrOrUrl - Base64 data URI or image URL
 * @param {string} folder - Target folder on Cloudinary
 * @param {object} options - Additional options
 */
export const uploadImage = async (fileStrOrUrl, folder = "nk-shoes/categories", options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(fileStrOrUrl, {
      folder,
      resource_type: "image",
      quality: "auto:best",
      fetch_format: "auto",
      ...options,
    });

    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("[Cloudinary Image Upload Error]", error);
    throw error;
  }
};

/**
 * Extract Cloudinary public_id from a Cloudinary URL
 * @param {string} url
 * @returns {string|null}
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    let afterUpload = parts[1].split("?")[0];
    const segments = afterUpload.split("/");
    // Filter out transformation segments like w_800, c_fill, and version tags v123456
    const cleanSegments = segments.filter(
      (seg) => !(seg.startsWith("v") && /^\d+$/.test(seg.slice(1))) && !seg.includes(",")
    );
    const pathWithExt = cleanSegments.join("/");
    const lastDotIndex = pathWithExt.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return pathWithExt.substring(0, lastDotIndex);
    }
    return pathWithExt;
  } catch (err) {
    return null;
  }
};

/**
 * Delete an asset from Cloudinary using its public_id or full Cloudinary URL
 * @param {string} publicIdOrUrl - The public ID or Cloudinary URL of the image
 */
export const deleteFromCloudinary = async (publicIdOrUrl) => {
  if (!publicIdOrUrl) return { result: "not_found" };
  let publicId = publicIdOrUrl;
  if (typeof publicIdOrUrl === "string" && publicIdOrUrl.includes("http")) {
    publicId = extractPublicIdFromUrl(publicIdOrUrl);
  }
  if (!publicId) return { result: "not_found" };
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary Purge] Deleted old asset: ${publicId} ->`, result?.result || result);
    return result;
  } catch (error) {
    console.error(`[Cloudinary Delete Error] Failed to delete ${publicId}:`, error.message);
    return { result: "error", message: error.message };
  }
};

/**
 * Generate an optimized responsive URL from a Cloudinary publicId
 */
export const getOptimizedUrl = (publicId, { width = 800, quality = "auto", crop = "fill" } = {}) => {
  if (!publicId) return "";
  return cloudinary.url(publicId, {
    width,
    crop,
    quality,
    fetch_format: "auto",
    secure: true,
  });
};

export default cloudinary;
