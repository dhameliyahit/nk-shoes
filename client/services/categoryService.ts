import { api } from "@/lib/api";
import { Category, CategoryQueryFilters } from "@/types/category";

/**
 * Fetch all active categories with optional filters (gender, featured)
 */
export async function getCategories(filters?: CategoryQueryFilters): Promise<Category[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.gender && filters.gender !== "all") {
      params.append("gender", filters.gender);
    }
    if (filters?.featured) {
      params.append("featured", "true");
    }
    if (filters?.all) {
      params.append("all", "true");
    }

    const queryString = params.toString();
    const url = queryString ? `${api.categories}?${queryString}` : api.categories;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.statusText}`);
    }

    const data: Category[] = await res.json();
    return data;
  } catch (error) {
    console.warn("[Category Service Warning] Could not load from backend, using fallback:", error);
    return [];
  }
}

/**
 * Fetch a single category by slug or ID
 */
export async function getCategoryBySlug(idOrSlug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${api.categories}/${encodeURIComponent(idOrSlug)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.warn(`[Category Service Warning] Failed to get category ${idOrSlug}:`, error);
    return null;
  }
}
