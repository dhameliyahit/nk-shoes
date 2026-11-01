export interface NavItem {
  label: string;
  href: string;
  isSale?: boolean;
  isNew?: boolean;
}

export interface UtilityLink {
  label: string;
  href: string;
  isPrimary?: boolean;
}

/**
 * Main customer-side navigation categories (Nike / Adidas style).
 * Can be managed from admin panel or CMS in the future.
 */
export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "New Arrivals", href: "/products?filter=new-arrivals", isNew: true },
  { label: "Running", href: "/products?category=running" },
  { label: "Sneakers", href: "/products?category=sneakers" },
  { label: "Sports & Gym", href: "/products?category=sports" },
  { label: "All Shoes", href: "/products" },
  { label: "Sale", href: "/products?filter=sale", isSale: true },
];

/**
 * Secondary utility row links: LOGIN / CREATE ACCOUNT
 */
export const UTILITY_LINKS: UtilityLink[] = [
  { label: "Help", href: "/help" },
  { label: "Create Account", href: "/register" },
  { label: "Login", href: "/login", isPrimary: true },
];

/**
 * Popular footwear search tags for quick suggestions.
 */
export const POPULAR_SEARCH_TAGS = [
  "Air Jordan",
  "Running Shoes",
  "Classic Retro",
  "Air Max 90",
  "Court Vision",
  "Sale Sneakers",
];

export interface SearchSuggestionItem {
  title: string;
  category: string;
  tag?: string;
}

export const POPULAR_SEARCH_SUGGESTIONS: SearchSuggestionItem[] = [
  { title: "Air Jordan 1 Retro High OG", category: "Men's Basketball / Lifestyle", tag: "Trending" },
  { title: "Nike Air Max 90 Futura", category: "Running & Streetwear", tag: "Hot" },
  { title: "Dunk Low Retro 'Panda'", category: "Classic Sneaker", tag: "Popular" },
  { title: "Court Vision Low Next Nature", category: "Everyday Wear", tag: "Classic" },
  { title: "ZoomX Vaporfly 3", category: "Pro Running", tag: "Drop" },
  { title: "Air Force 1 '07 LV8", category: "Iconic Heritage", tag: "Essential" },
];

