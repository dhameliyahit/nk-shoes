export interface Category {
  _id: string;
  name: string;
  slug: string;
  tag?: string;
  description?: string;
  image: string;
  imagePublicId?: string;
  bannerImage?: string;
  bannerPublicId?: string;
  badge?: string;
  startingPrice?: string;
  itemCount?: string;
  gender?: "men" | "women" | "unisex" | "kids" | "all";
  displayOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryQueryFilters {
  gender?: string;
  featured?: boolean;
  all?: boolean;
}
