import { api } from "@/lib/api";
import { Product, ProductQueryFilters, ProductListResponse } from "@/types/product";
import { getOrCreateDeviceId } from "@/lib/device";

/**
 * Returns standard headers including x-device-id for per-device view tracking
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    headers["x-device-id"] = getOrCreateDeviceId();
  }
  return headers;
}

/**
 * Normalizes a product from MongoDB schema to match client interface
 */
export function normalizeProduct(p: any): Product {
  const id = p._id ? p._id.toString() : p.id || p.slug;
  const inStock = p.inStock !== undefined ? p.inStock : (p.stock || 0) > 0;
  
  // Format sizes if needed
  const sizes = (p.sizes || []).map((s: any) =>
    typeof s === "string" ? { size: s, available: true } : s
  );

  const rawReviews = Array.isArray(p.reviews) ? p.reviews : [];
  const reviews = rawReviews.map((r: any) => ({
    id: r._id ? r._id.toString() : r.id || `rev-${Math.random()}`,
    _id: r._id ? r._id.toString() : r.id,
    author: r.author || "Verified Buyer",
    city: r.city || "India",
    rating: Number(r.rating) || 5,
    fit: r.fit || "True to Size",
    title: r.title || "",
    content: r.content || "",
    verified: r.verified !== undefined ? r.verified : true,
    helpfulCount: Number(r.helpfulCount) || 0,
    createdAt: r.createdAt,
    date: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Recently",
  }));

  return {
    ...p,
    id,
    _id: p._id ? p._id.toString() : undefined,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle || "Performance Footwear",
    gender: p.gender || "unisex",
    category: p.categorySlug || (typeof p.category === "object" ? p.category?.slug : p.category) || "sneakers",
    categorySlug: p.categorySlug || (typeof p.category === "object" ? p.category?.slug : p.category) || "sneakers",
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85"],
    colors: p.colors || [{ name: "Core Black", hex: "#111111" }],
    sizes,
    badge: p.badge,
    rating: p.ratings !== undefined ? Number(p.ratings) : p.rating !== undefined ? Number(p.rating) : 4.8,
    reviewCount: p.numReviews !== undefined ? Number(p.numReviews) : reviews.length,
    reviews,
    description: p.description || "",
    features: p.features || [],
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    inStock,
    stock: p.stock ?? 50,
    salesCount: p.salesCount ?? 0,
    viewsCount: p.viewsCount ?? 0,
  };
}

/**
 * Fetch products list with filters, sorting, and pagination from real backend API
 */
export async function getProducts(filters?: ProductQueryFilters): Promise<ProductListResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.keyword) params.append("keyword", filters.keyword);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.category && filters.category !== "all") params.append("category", filters.category);
    if (filters?.gender && filters.gender !== "all") params.append("gender", filters.gender);
    if (filters?.size && filters.size !== "all") params.append("size", filters.size);
    if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
    if (filters?.filter) params.append("filter", filters.filter);
    if (filters?.sort) params.append("sort", filters.sort);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.inStock) params.append("inStock", "true");

    const qs = params.toString();
    const url = qs ? `${api.products}?${qs}` : api.products;

    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`);
    }

    const data = await res.json();
    const normalizedProducts = (data.products || []).map(normalizeProduct);

    return {
      success: true,
      products: normalizedProducts,
      page: data.page || 1,
      pages: data.pages || 1,
      total: data.total || normalizedProducts.length,
      limit: data.limit || 20,
    };
  } catch (error) {
    console.error("[Product Service] Error fetching products from backend:", error);
    return {
      success: false,
      products: [],
      page: 1,
      pages: 1,
      total: 0,
      limit: 20,
    };
  }
}

/**
 * Fetch dynamic new arrivals (fresh releases) from real backend API
 */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  try {
    const res = await fetch(`${api.products}/new-arrivals?limit=${limit}`, {
      method: "GET",
      headers: getHeaders(),
      next: { revalidate: 30 },
    });

    if (!res.ok) throw new Error("Failed to fetch new arrivals");
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map(normalizeProduct);
    }
    return [];
  } catch (err) {
    console.error("[Product Service] Error fetching new arrivals from backend:", err);
    return [];
  }
}

/**
 * Fetch dynamic best sellers from real backend API
 */
export async function getBestSellers(limit = 8): Promise<Product[]> {
  try {
    const res = await fetch(`${api.products}/best-sellers?limit=${limit}`, {
      method: "GET",
      headers: getHeaders(),
      next: { revalidate: 30 },
    });

    if (!res.ok) throw new Error("Failed to fetch best sellers");
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map(normalizeProduct);
    }
    return [];
  } catch (err) {
    console.error("[Product Service] Error fetching best sellers from backend:", err);
    return [];
  }
}

/**
 * Fetch single product by slug along with related products from real backend API
 */
export async function getProductBySlug(
  slug: string
): Promise<{ product: Product | null; relatedProducts: Product[] }> {
  try {
    const res = await fetch(`${api.products}/slug/${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: getHeaders(),
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return { product: null, relatedProducts: [] };
    }

    const data = await res.json();
    return {
      product: data.product ? normalizeProduct(data.product) : null,
      relatedProducts: Array.isArray(data.relatedProducts)
        ? data.relatedProducts.map(normalizeProduct)
        : [],
    };
  } catch (err) {
    console.error("[Product Service] Error fetching product by slug from backend:", err);
    return { product: null, relatedProducts: [] };
  }
}

/**
 * Explicitly records a view for a product with per-device deduplication (+1 per device)
 */
export async function recordProductView(
  identifier: string
): Promise<{ success: boolean; viewsCount?: number }> {
  try {
    const res = await fetch(`${api.products}/${encodeURIComponent(identifier)}/view`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, viewsCount: data.viewsCount };
  } catch (err) {
    return { success: false };
  }
}

/**
 * Submit verified customer review to MongoDB
 */
export async function addProductReview(
  identifier: string,
  reviewData: {
    rating: number;
    title: string;
    content: string;
    author: string;
    city?: string;
    fit?: "Runs Small" | "True to Size" | "Runs Large";
  },
  token?: string | null
): Promise<{
  success: boolean;
  message: string;
  review?: any;
  ratings?: number;
  numReviews?: number;
  reviews?: any[];
  error?: string;
}> {
  try {
    const headers: Record<string, string> = {
      ...getHeaders(),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${api.products}/${encodeURIComponent(identifier)}/reviews`, {
      method: "POST",
      headers,
      body: JSON.stringify(reviewData),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to submit review",
        error: data.message,
      };
    }

    return {
      success: true,
      message: data.message || "Thank you! Your verified review has been published.",
      review: data.review,
      ratings: data.ratings,
      numReviews: data.numReviews,
      reviews: data.reviews,
    };
  } catch (error: any) {
    console.error("[Product Service] Error submitting review:", error);
    return {
      success: false,
      message: error.message || "Network error submitting review",
      error: error.message,
    };
  }
}

/**
 * Upvote review as helpful
 */
export async function voteReviewHelpful(
  identifier: string,
  reviewId: string
): Promise<{ success: boolean; helpfulCount?: number }> {
  try {
    const res = await fetch(
      `${api.products}/${encodeURIComponent(identifier)}/reviews/${encodeURIComponent(reviewId)}/helpful`,
      {
        method: "POST",
        headers: getHeaders(),
      }
    );
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, helpfulCount: data.helpfulCount };
  } catch (err) {
    return { success: false };
  }
}
