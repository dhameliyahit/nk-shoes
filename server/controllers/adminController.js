import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { deleteFromCloudinary, extractPublicIdFromUrl } from "../services/cloudinaryService.js";

/**
 * Helper: Resolve and normalize single/multiple categories
 * Maps ObjectIds and slugs across category, categorySlug, categories, and categorySlugs
 */
async function resolveCategories(data) {
  let rawList = [];

  if (Array.isArray(data.categorySlugs) && data.categorySlugs.length > 0) {
    rawList.push(...data.categorySlugs);
  }
  if (Array.isArray(data.categories) && data.categories.length > 0) {
    rawList.push(...data.categories);
  }
  if (data.category) {
    rawList.push(data.category);
  }
  if (data.categorySlug) {
    rawList.push(data.categorySlug);
  }

  if (rawList.length === 0) return;

  const resolvedIds = [];
  const resolvedSlugs = [];

  for (const item of rawList) {
    if (!item) continue;
    let val = typeof item === "object" && item !== null ? (item._id || item.slug || item.name) : item;
    val = String(val).trim();
    if (!val) continue;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(val);
    if (isObjectId) {
      const found = await Category.findById(val);
      if (found) {
        resolvedIds.push(found._id);
        resolvedSlugs.push(found.slug.toLowerCase().trim());
      } else {
        resolvedIds.push(val);
      }
    } else {
      const cleanSlug = val.toLowerCase().trim();
      const found = await Category.findOne({
        $or: [{ slug: cleanSlug }, { name: new RegExp(`^${val}$`, "i") }],
      });
      if (found) {
        resolvedIds.push(found._id);
        resolvedSlugs.push(found.slug.toLowerCase().trim());
      } else {
        resolvedSlugs.push(cleanSlug);
      }
    }
  }

  const uniqueSlugs = [...new Set(resolvedSlugs)];
  const uniqueIds = [...new Set(resolvedIds.map(String))];

  if (uniqueSlugs.length > 0) {
    data.categorySlug = uniqueSlugs[0];
    data.categorySlugs = uniqueSlugs;
  }
  if (uniqueIds.length > 0) {
    data.category = uniqueIds[0];
    data.categories = uniqueIds;
  }
}

/**
 * Products Management
 */
export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    if (!productData.slug && productData.name) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    await resolveCategories(productData);

    const product = new Product(productData);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const updateData = { ...req.body };

    await resolveCategories(updateData);

    // Purge removed images from Cloudinary if image list was updated
    if (Array.isArray(updateData.images) && Array.isArray(product.images)) {
      const removedImages = product.images.filter((oldUrl) => !updateData.images.includes(oldUrl));
      for (const removed of removedImages) {
        const pid = extractPublicIdFromUrl(removed);
        if (pid) await deleteFromCloudinary(pid);
      }
    }

    Object.assign(product, updateData);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductByIdAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      .populate("categories", "name slug");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Purge product images from Cloudinary
    if (Array.isArray(product.media)) {
      for (const m of product.media) {
        if (m.public_id) await deleteFromCloudinary(m.public_id);
      }
    }
    if (Array.isArray(product.images)) {
      for (const imgUrl of product.images) {
        const pid = extractPublicIdFromUrl(imgUrl);
        if (pid) await deleteFromCloudinary(pid);
      }
    }

    await product.deleteOne();
    res.json({ message: "Product removed successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Categories Management
 */
export const createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }
    const category = new Category(categoryData);
    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const newImage = req.body.image;
    // If category image changed or removed, delete the old Cloudinary image
    if (newImage !== undefined && newImage !== category.image) {
      const oldPublicId = category.imagePublicId || extractPublicIdFromUrl(category.image);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
      category.imagePublicId = extractPublicIdFromUrl(newImage) || "";
    }

    Object.assign(category, req.body);
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Purge category image from Cloudinary
    const publicId = category.imagePublicId || extractPublicIdFromUrl(category.image);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
    if (category.bannerImage) {
      const bannerPid = extractPublicIdFromUrl(category.bannerImage);
      if (bannerPid) await deleteFromCloudinary(bannerPid);
    }

    await category.deleteOne();
    res.json({ message: "Category removed successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Orders & Logistics Management
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "id name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderByIdAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "id name email");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.body.orderStatus) {
      order.orderStatus = req.body.orderStatus;
      if (req.body.orderStatus === "delivered") {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }
    }

    if (req.body.isDelivered !== undefined) {
      order.isDelivered = req.body.isDelivered;
      if (req.body.isDelivered && !order.deliveredAt) {
        order.deliveredAt = Date.now();
      }
    }

    if (req.body.isPaid !== undefined) {
      order.isPaid = req.body.isPaid;
      if (req.body.isPaid && !order.paidAt) {
        order.paidAt = Date.now();
        order.paymentStatus = "Success";
      }
    }

    if (req.body.courierName !== undefined) order.courierName = req.body.courierName;
    if (req.body.trackingNumber !== undefined) order.trackingNumber = req.body.trackingNumber;
    if (req.body.trackingUrl !== undefined) order.trackingUrl = req.body.trackingUrl;
    if (req.body.cancelReason !== undefined) order.cancelReason = req.body.cancelReason;
    if (req.body.orderNotes !== undefined) order.orderNotes = req.body.orderNotes;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Customer Reviews Moderation
 */
export const getAllReviewsAdmin = async (req, res) => {
  try {
    const products = await Product.find({ "reviews.0": { $exists: true } }).select("name slug images reviews");
    const allReviews = [];
    products.forEach((p) => {
      (p.reviews || []).forEach((r) => {
        allReviews.push({
          productId: p._id,
          productName: p.name,
          productSlug: p.slug,
          productImage: p.images?.[0] || "",
          reviewId: r._id,
          author: r.author || "Customer",
          city: r.city || "India",
          rating: Number(r.rating) || 5,
          title: r.title || "",
          content: r.content || "",
          fit: r.fit || "True to Size",
          verified: r.verified !== undefined ? r.verified : true,
          helpfulCount: Number(r.helpfulCount) || 0,
          createdAt: r.createdAt,
        });
      });
    });
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(allReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReviewAdmin = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const initialLength = product.reviews.length;
    product.reviews = product.reviews.filter((r) => r._id.toString() !== reviewId);

    if (product.reviews.length === initialLength) {
      return res.status(404).json({ message: "Review not found" });
    }

    product.numReviews = product.reviews.length;
    if (product.numReviews > 0) {
      const sum = product.reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      product.ratings = Number((sum / product.numReviews).toFixed(1));
    } else {
      product.ratings = 5.0;
    }

    await product.save();
    res.json({ message: "Review removed successfully", reviewId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Users Management
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.role = req.body.role || user.role;
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (req.user && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own active admin account" });
    }
    await user.deleteOne();
    res.json({ message: "User account deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Dashboard & Operational Analytics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      orderStatus: { $in: ["processing", "confirmed"] },
    });
    const shippedOrders = await Order.countDocuments({ orderStatus: "shipped" });
    const deliveredOrders = await Order.countDocuments({ orderStatus: "delivered" });

    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $lte: 5 } });
    const totalUsers = await User.countDocuments();

    const revenueResult = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const recentOrders = await Order.find({})
      .select("shippingAddress totalPrice orderStatus paymentMethod isPaid createdAt")
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      totalProducts,
      lowStockProducts,
      totalUsers,
      totalRevenue: revenueResult[0]?.total || 0,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
