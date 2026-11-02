import mongoose from "mongoose";
import Category from "../models/Category.js";
import AppError from "../utils/appError.js";
import { uploadFromBuffer, uploadImage, deleteFromCloudinary, extractPublicIdFromUrl } from "./cloudinaryService.js";

/**
 * Service: Retrieve categories with optional filters
 * @param {object} filterOptions - { gender, featured, all }
 */
export const getAllCategories = async ({ gender, featured, all } = {}) => {
  const query = {};

  if (all !== "true") {
    query.isActive = true;
  }

  if (featured === "true") {
    query.isFeatured = true;
  }

  if (gender && gender !== "all") {
    query.$or = [{ gender: gender.toLowerCase() }, { gender: "all" }, { gender: "unisex" }];
  }

  return await Category.find(query).sort({ displayOrder: 1, name: 1 });
};

/**
 * Service: Retrieve single category by slug or MongoDB ObjectId
 * @param {string} idOrSlug
 */
export const getCategoryByIdOrSlug = async (idOrSlug) => {
  let category = null;

  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    category = await Category.findById(idOrSlug);
  }

  if (!category) {
    category = await Category.findOne({ slug: idOrSlug.toLowerCase() });
  }

  if (!category) {
    throw new AppError(`Category not found with identifier: ${idOrSlug}`, 404);
  }

  return category;
};

/**
 * Service: Create a new category with optional Cloudinary image upload
 * @param {object} categoryData
 * @param {Buffer} fileBuffer
 */
export const createCategory = async (categoryData, fileBuffer) => {
  const { name, slug, tag, description, badge, startingPrice, itemCount, gender, displayOrder, isFeatured, isActive, image } =
    categoryData;

  if (!name || !name.trim()) {
    throw new AppError("Category name is required", 400);
  }

  const generatedSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const existingCategory = await Category.findOne({
    $or: [{ name: name.trim() }, { slug: generatedSlug }],
  });

  if (existingCategory) {
    throw new AppError("A category with this name or slug already exists", 400);
  }

  let imageUrl = image || "";
  let imagePublicId = "";

  if (fileBuffer) {
    const uploadResult = await uploadFromBuffer(fileBuffer, "nk-shoes/categories");
    imageUrl = uploadResult.secure_url;
    imagePublicId = uploadResult.public_id;
  } else if (image && (image.startsWith("data:image/") || image.startsWith("http"))) {
    const uploadResult = await uploadImage(image, "nk-shoes/categories");
    imageUrl = uploadResult.secure_url;
    imagePublicId = uploadResult.public_id;
  }

  const newCategory = new Category({
    name: name.trim(),
    slug: generatedSlug,
    tag: tag || name.toUpperCase(),
    description: description || "",
    image: imageUrl,
    imagePublicId,
    badge: badge || "",
    startingPrice: startingPrice || "",
    itemCount: itemCount || "50+ Styles",
    gender: gender || "all",
    displayOrder: displayOrder ? Number(displayOrder) : 0,
    isFeatured: isFeatured !== undefined ? isFeatured : true,
    isActive: isActive !== undefined ? isActive : true,
  });

  return await newCategory.save();
};

/**
 * Service: Update existing category
 * @param {string} id - Category ObjectId
 * @param {object} updateData
 * @param {Buffer} fileBuffer
 */
export const updateCategory = async (id, updateData, fileBuffer) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category ID format", 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Handle image replacement if new file or image URL provided
  if (fileBuffer) {
    const oldPublicId = category.imagePublicId || extractPublicIdFromUrl(category.image);
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }
    const uploadResult = await uploadFromBuffer(fileBuffer, "nk-shoes/categories");
    category.image = uploadResult.secure_url;
    category.imagePublicId = uploadResult.public_id;
  } else if (updateData.image !== undefined && updateData.image !== category.image) {
    const oldPublicId = category.imagePublicId || extractPublicIdFromUrl(category.image);
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }
    if (updateData.image && (updateData.image.startsWith("data:image/") || !updateData.image.includes("cloudinary.com"))) {
      if (updateData.image.startsWith("data:image/") || updateData.image.startsWith("http")) {
        const uploadResult = await uploadImage(updateData.image, "nk-shoes/categories");
        category.image = uploadResult.secure_url;
        category.imagePublicId = uploadResult.public_id;
      }
    } else {
      category.image = updateData.image;
      category.imagePublicId = extractPublicIdFromUrl(updateData.image) || "";
    }
  }

  if (updateData.name) category.name = updateData.name.trim();
  if (updateData.slug) category.slug = updateData.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (updateData.tag) category.tag = updateData.tag.toUpperCase();
  if (updateData.description !== undefined) category.description = updateData.description;
  if (updateData.badge !== undefined) category.badge = updateData.badge;
  if (updateData.startingPrice !== undefined) category.startingPrice = updateData.startingPrice;
  if (updateData.itemCount !== undefined) category.itemCount = updateData.itemCount;
  if (updateData.gender) category.gender = updateData.gender.toLowerCase();
  if (updateData.displayOrder !== undefined) category.displayOrder = Number(updateData.displayOrder);
  if (updateData.isFeatured !== undefined) category.isFeatured = updateData.isFeatured;
  if (updateData.isActive !== undefined) category.isActive = updateData.isActive;

  return await category.save();
};

/**
 * Service: Delete category and purge Cloudinary image
 * @param {string} id - Category ObjectId
 */
export const deleteCategory = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category ID format", 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const publicId = category.imagePublicId || extractPublicIdFromUrl(category.image);
  if (publicId) {
    await deleteFromCloudinary(publicId);
  }

  await category.deleteOne();
  return { id };
};

/**
 * Service: Direct image upload to Cloudinary
 * @param {Buffer} buffer
 * @param {string} folder
 */
export const uploadCategoryImage = async (buffer, folder = "nk-shoes/categories") => {
  if (!buffer) {
    throw new AppError("No image buffer provided for upload", 400);
  }
  return await uploadFromBuffer(buffer, folder);
};

export default {
  getAllCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
};
