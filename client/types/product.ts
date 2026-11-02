export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface ProductSize {
  size: string; // e.g. "UK 6", "UK 7", "UK 8"
  available: boolean;
  stock?: number;
}

export interface ProductBadge {
  text: string;
  variant: "new" | "sale" | "hot" | "bestseller" | "soldout";
}

export interface ProductImageItem {
  url: string;
  public_id?: string;
  alt?: string;
}

export interface ProductReview {
  id?: string;
  _id?: string;
  author: string;
  city?: string;
  rating: number;
  fit?: "Runs Small" | "True to Size" | "Runs Large";
  title: string;
  content: string;
  verified?: boolean;
  helpfulCount?: number;
  createdAt?: string;
  date?: string;
  isUserAdded?: boolean;
}

export interface Product {
  _id?: string;
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  tagline?: string;
  gender: "men" | "women" | "unisex" | "kids";
  category: any;
  categorySlug?: string;
  categories?: any[];
  categorySlugs?: string[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  images: string[];
  media?: ProductImageItem[];
  colors: ProductColor[];
  sizes: ProductSize[];
  badge?: ProductBadge;
  rating: number;
  reviewCount: number;
  reviews?: ProductReview[];
  description: string;
  features?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  sku?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  inStock: boolean;
  stock?: number;
  salesCount?: number;
  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductQueryFilters {
  keyword?: string;
  search?: string;
  category?: string;
  gender?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  filter?: "new-arrivals" | "best-sellers" | "sale" | "featured";
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "bestseller" | "rating";
  page?: number;
  limit?: number;
  inStock?: boolean;
}

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  page: number;
  pages: number;
  total: number;
  limit: number;
}
