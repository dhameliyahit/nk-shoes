import catchAsync from "../utils/catchAsync.js";
import * as categoryService from "../services/categoryService.js";

/**
 * @desc    Get all active categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.getAllCategories(req.query);
  res.status(200).json(categories);
});

/**
 * @desc    Get single category by slug or ObjectId
 * @route   GET /api/categories/:idOrSlug
 * @access  Public
 */
export const getCategoryBySlugOrId = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryByIdOrSlug(req.params.idOrSlug);
  res.status(200).json(category);
});

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
export const createCategory = catchAsync(async (req, res) => {
  const newCategory = await categoryService.createCategory(
    req.body,
    req.file ? req.file.buffer : null
  );
  res.status(201).json(newCategory);
});

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = catchAsync(async (req, res) => {
  const updatedCategory = await categoryService.updateCategory(
    req.params.id,
    req.body,
    req.file ? req.file.buffer : null
  );
  res.status(200).json(updatedCategory);
});

/**
 * @desc    Delete category and clean up Cloudinary asset
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = catchAsync(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Category deleted successfully",
    data: result,
  });
});

/**
 * @desc    Direct Cloudinary Image Upload
 * @route   POST /api/categories/upload
 * @access  Private/Admin
 */
export const uploadCategoryImage = catchAsync(async (req, res) => {
  const folder = req.body.folder || "nk-shoes/categories";
  const uploadResult = await categoryService.uploadCategoryImage(
    req.file ? req.file.buffer : null,
    folder
  );

  res.status(200).json({
    status: "success",
    url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
    format: uploadResult.format,
    bytes: uploadResult.bytes,
  });
});
