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
        quality: "auto:good",
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
      quality: "auto:good",
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
 * Delete an asset from Cloudinary using its public_id
 * @param {string} publicId - The public ID of the image
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return { result: "not_found" };
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("[Cloudinary Delete Error]", error);
    throw error;
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
