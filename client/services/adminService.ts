import { api } from "@/lib/api";
import { Product } from "@/types/product";

/**
 * Returns standard authenticated headers with Bearer token
 */
function getAdminHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const resolvedToken =
    token || (typeof window !== "undefined" ? localStorage.getItem("nk_shoes_token") : null);
  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }
  return headers;
}

// ============================================================================
// TYPES
// ============================================================================

export interface AdminDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: {
    _id: string;
    totalPrice: number;
    orderStatus: string;
    paymentMethod: string;
    isPaid: boolean;
    createdAt: string;
    shippingAddress: {
      fullName: string;
      city: string;
      state: string;
    };
  }[];
}

export interface AdminOrderItem {
  product?: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface AdminOrder {
  _id: string;
  user?: {
    _id: string;
    id: string;
    name: string;
    email: string;
  };
  guestEmail?: string;
  orderItems: AdminOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    alternatePhone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    district?: string;
  };
  paymentMethod: "cod" | "phonepe" | "card" | "upi";
  paymentStatus: "Pending" | "Success" | "Failed" | "Cancelled";
  itemsPrice: number;
  shippingPrice: number;
  discountAmount?: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  orderStatus: "processing" | "confirmed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  cancelReason?: string;
  orderNotes?: string;
  giftWrap?: boolean;
  promoCode?: string;
  merchantOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderStatusPayload {
  orderStatus?: string;
  isDelivered?: boolean;
  isPaid?: boolean;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  cancelReason?: string;
  orderNotes?: string;
}

export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  featured?: boolean;
  order?: number;
  createdAt?: string;
}

export interface AdminReview {
  id?: string;
  _id?: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  reviewId: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  content: string;
  fit: string;
  verified: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface AdminPage {
  _id: string;
  title: string;
  slug: string;
  category: "Support" | "Policy" | "Company" | "General";
  content: string;
  excerpt?: string;
  displayDate?: string;
  subtitle?: string;
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 1. DASHBOARD ANALYTICS
// ============================================================================

export async function getAdminStats(token?: string | null): Promise<AdminDashboardStats> {
  const res = await fetch(api.admin.stats, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load admin stats");
  return await res.json();
}

// ============================================================================
// 2. ORDERS & LOGISTICS
// ============================================================================

export async function getAdminOrders(token?: string | null): Promise<AdminOrder[]> {
  const res = await fetch(api.admin.orders, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load orders");
  return await res.json();
}

export async function getAdminOrderById(id: string, token?: string | null): Promise<AdminOrder> {
  const res = await fetch(`${api.admin.orders}/${id}`, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load order detail");
  return await res.json();
}

export async function updateAdminOrderStatus(
  id: string,
  payload: UpdateOrderStatusPayload,
  token?: string | null
): Promise<AdminOrder> {
  const res = await fetch(`${api.admin.orders}/${id}/status`, {
    method: "PUT",
    headers: getAdminHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update order status");
  }
  return await res.json();
}

// ============================================================================
// 3. PRODUCTS MANAGEMENT
// ============================================================================

export async function getAdminProducts(token?: string | null): Promise<Product[]> {
  // Use public products endpoint with limit 100 or all
  const res = await fetch(`${api.products}?limit=100`, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load products");
  const data = await res.json();
  return Array.isArray(data) ? data : data.products || [];
}

export async function getAdminProductById(id: string, token?: string | null): Promise<Product> {
  const res = await fetch(`${api.admin.products}/${id}`, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) {
    const fallbackRes = await fetch(`${api.products}/${id}`);
    if (fallbackRes.ok) return await fallbackRes.json();
    throw new Error("Failed to load product");
  }
  return await res.json();
}

export async function uploadAdminProductImages(files: File[], token?: string | null): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  const resolvedToken =
    token || (typeof window !== "undefined" ? localStorage.getItem("nk_shoes_token") : null);
  const headers: Record<string, string> = {};
  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  const res = await fetch(`${api.products}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload product images");
  }

  const data = await res.json();
  return data.images || [];
}

export async function createAdminProduct(payload: any, token?: string | null): Promise<Product> {
  const res = await fetch(api.admin.products, {
    method: "POST",
    headers: getAdminHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create product");
  }
  return await res.json();
}

export async function updateAdminProduct(id: string, payload: any, token?: string | null): Promise<Product> {
  const res = await fetch(`${api.admin.products}/${id}`, {
    method: "PUT",
    headers: getAdminHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update product");
  }
  return await res.json();
}

export async function deleteAdminProduct(id: string, token?: string | null): Promise<{ message: string }> {
  const res = await fetch(`${api.admin.products}/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete product");
  return await res.json();
}

// ============================================================================
// 4. CATEGORIES MANAGEMENT
// ============================================================================

export async function getAdminCategories(token?: string | null): Promise<AdminCategory[]> {
  const res = await fetch(api.categories, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load categories");
  return await res.json();
}

export async function uploadAdminCategoryImage(file: File, token?: string | null): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const resolvedToken =
    token || (typeof window !== "undefined" ? localStorage.getItem("nk_shoes_token") : null);
  const headers: Record<string, string> = {};
  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  let res = await fetch(`${api.admin.categories}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    res = await fetch(`${api.categories}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload category image");
  }

  const data = await res.json();
  return data.url || data.secure_url || "";
}

export async function createAdminCategory(payload: any, token?: string | null): Promise<AdminCategory> {
  const res = await fetch(api.admin.categories, {
    method: "POST",
    headers: getAdminHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return await res.json();
}

export async function updateAdminCategory(id: string, payload: any, token?: string | null): Promise<AdminCategory> {
  const res = await fetch(`${api.admin.categories}/${id}`, {
    method: "PUT",
    headers: getAdminHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update category");
  return await res.json();
}

export async function deleteAdminCategory(id: string, token?: string | null): Promise<{ message: string }> {
  const res = await fetch(`${api.admin.categories}/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete category");
  return await res.json();
}

// ============================================================================
// 5. REVIEWS MODERATION
// ============================================================================

export async function getAdminReviews(token?: string | null): Promise<AdminReview[]> {
  const res = await fetch(api.admin.reviews, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load reviews");
  return await res.json();
}

export async function deleteAdminReview(
  productId: string,
  reviewId: string,
  token?: string | null
): Promise<{ message: string }> {
  const res = await fetch(`${api.admin.reviews}/${productId}/${reviewId}`, {
    method: "DELETE",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete review");
  return await res.json();
}

// ============================================================================
// 6. DYNAMIC CMS PAGES
// ============================================================================

export async function getAdminPages(token?: string | null): Promise<AdminPage[]> {
  const res = await fetch(api.admin.pages, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load CMS pages");
  return await res.json();
}

export async function createAdminPage(payload: Partial<AdminPage>, token?: string | null): Promise<AdminPage> {
  const res = await fetch(api.admin.pages, {
    method: "POST",
    headers: getAdminHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create page");
  }
  return await res.json();
}

export async function updateAdminPage(
  id: string,
  payload: Partial<AdminPage>,
  token?: string | null
): Promise<AdminPage> {
  const res = await fetch(`${api.admin.pages}/${id}`, {
    method: "PUT",
    headers: getAdminHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update page");
  }
  return await res.json();
}

export async function deleteAdminPage(id: string, token?: string | null): Promise<{ message: string }> {
  const res = await fetch(`${api.admin.pages}/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete page");
  return await res.json();
}

// ============================================================================
// 7. STORE SETTINGS & PROMOTIONS
// ============================================================================

export async function getAdminSettings(token?: string | null): Promise<any[]> {
  const res = await fetch(api.admin.settings, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load settings");
  return await res.json();
}

export async function getAdminSettingByKey(key: string, token?: string | null): Promise<any> {
  const res = await fetch(`${api.admin.settings}/${key}`, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to load setting: ${key}`);
  }
  return await res.json();
}

export async function updateAdminSetting(key: string, value: any, token?: string | null): Promise<any> {
  const res = await fetch(`${api.admin.settings}/${key}`, {
    method: "PUT",
    headers: getAdminHeaders(token),
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error(`Failed to update setting: ${key}`);
  return await res.json();
}

export async function testAdminEmail(toEmail: string, token?: string | null): Promise<{ success: boolean; message: string; details?: any }> {
  const res = await fetch(`${api.admin.settings}/email/test`, {
    method: "POST",
    headers: getAdminHeaders(token),
    body: JSON.stringify({ toEmail }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send test email");
  return data;
}

// ============================================================================
// 8. USERS & ACCESS CONTROL
// ============================================================================

export interface AdminUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "user";
  avatar?: string;
  isVerified?: boolean;
  addresses?: any[];
  createdAt: string;
  updatedAt: string;
}

export async function getAdminUsers(token?: string | null): Promise<AdminUser[]> {
  const res = await fetch(api.admin.users, {
    method: "GET",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load users list");
  return await res.json();
}

export async function updateAdminUserRole(
  id: string,
  role: "admin" | "user",
  token?: string | null
): Promise<AdminUser> {
  const res = await fetch(`${api.admin.users}/${id}/role`, {
    method: "PUT",
    headers: getAdminHeaders(token),
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update user role");
  }
  return await res.json();
}

export async function deleteAdminUser(id: string, token?: string | null): Promise<{ message: string; id: string }> {
  const res = await fetch(`${api.admin.users}/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete user");
  }
  return await res.json();
}
