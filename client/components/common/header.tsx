"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  RiSearchLine,
  RiHeartLine,
  RiUser3Line,
  RiShoppingBag3Line,
  RiMenuLine,
  RiCloseLine,
  RiArrowRightLine,
} from "react-icons/ri";
import {
  MAIN_NAV_ITEMS,
  UTILITY_LINKS,
  POPULAR_SEARCH_TAGS,
  POPULAR_SEARCH_SUGGESTIONS,
  type NavItem,
  type UtilityLink,
  type SearchSuggestionItem,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useAuth, User } from "@/context/auth-context";

export interface HeaderProps {
  /**
   * Main navigation items (defaults to Nike/Adidas style footwear categories).
   */
  navItems?: NavItem[];
  /**
   * Secondary utility links (HELP | SIGN UP | LOGIN).
   */
  utilityLinks?: UtilityLink[];
  /**
   * Shopping bag count badge.
   * - If 0, badge is hidden.
   * - If > 99, displays '99+'.
   * @default 0
   */
  bagCount?: number;
  /**
   * Wishlist item count badge.
   * @default 0
   */
  wishlistCount?: number;
  /**
   * Custom wrapper classes
   */
  className?: string;
}

export function Header({
  navItems = MAIN_NAV_ITEMS,
  utilityLinks = UTILITY_LINKS,
  bagCount = 0,
  wishlistCount = 0,
  className,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrollAnimationClass, setScrollAnimationClass] = useState<"moveon" | "moveout">("moveon");

  let liveBagCount = bagCount;
  let handleOpenBag = () => {};
  try {
    const cart = useCart();
    liveBagCount = cart.totalCount;
    handleOpenBag = cart.openCart;
  } catch {
    // Fallback if rendered outside provider
  }

  let liveWishlistCount = wishlistCount;
  try {
    const wl = useWishlist();
    liveWishlistCount = wl.wishlistCount;
  } catch {
    // Fallback if rendered outside provider
  }

  let user: User | null = null;
  let isLoggedIn = false;
  let logout = () => {};
  try {
    const auth = useAuth();
    user = auth.user;
    isLoggedIn = auth.isLoggedIn;
    logout = auth.logout;
  } catch {
    // Fallback if rendered outside provider
  }

  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastPosRef = useRef(0);

  // User-Specified Smart Hide-on-Scroll Implementation
  useEffect(() => {
    lastPosRef.current = window.pageYOffset || document.documentElement.scrollTop;

    const handleScroll = () => {
      const winpos = window.pageYOffset || document.documentElement.scrollTop;
      const lastpos = lastPosRef.current;

      setIsScrolled(winpos > 8);

      // Always show when near the very top
      if (winpos < 80) {
        setScrollAnimationClass("moveon");
      } else if (winpos < lastpos) {
        // Scrolling UP -> animate header IN
        setScrollAnimationClass("moveon");
      } else if (winpos > lastpos && winpos > 100) {
        // Scrolling DOWN -> animate header OUT
        setScrollAnimationClass("moveout");
      }

      lastPosRef.current = winpos <= 0 ? 0 : winpos;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Lock body scroll when mobile menu or search is open
  useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  // Escape key handler
  const closeAll = useCallback(() => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAll();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeAll]);

  // Filter search suggestions in real-time
  const filteredSuggestions: SearchSuggestionItem[] = searchQuery.trim()
    ? POPULAR_SEARCH_SUGGESTIONS.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_SEARCH_SUGGESTIONS.slice(0, 4);

  // Filter popular tags
  const filteredTags = searchQuery.trim()
    ? POPULAR_SEARCH_TAGS.filter((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_SEARCH_TAGS;

  // Handle actual search submission
  const executeSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  // Determine active route strictly without false positives across category links
  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/";

    // When viewing an individual product detail page (/products/[slug]), don't underline category filter links
    if (pathname.startsWith("/products/") && pathname !== "/products") {
      return false;
    }

    const [basePath, queryStr] = href.split("?");

    if (queryStr) {
      if (pathname !== basePath) return false;
      const search = typeof window !== "undefined" ? window.location.search : "";
      const currentParams = new URLSearchParams(search);
      const targetParams = new URLSearchParams(queryStr);
      for (const [key, val] of targetParams.entries()) {
        if (currentParams.get(key) !== val) return false;
      }
      return true;
    }

    return pathname === basePath;
  };

  // Format bag count badge: 0 => hidden, >99 => '99+'
  const formattedBagCount = bagCount > 99 ? "99+" : bagCount.toString();

  return (
    <>
      {/* Fixed Header with User-Specified Scroll Animations (.moveon / .moveout) */}
      <header
        className={cn(
          "sticky top-0 z-40 w-full bg-white header-smart-scroll select-none",
          scrollAnimationClass,
          isScrolled && "shadow-[0_4px_24px_rgba(0,0,0,0.07)]",
          className
        )}
      >
        {/* =========================================================
            MAIN HEADER ROW (Logo Left | Nav Center | Actions Right)
            ========================================================= */}
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 h-[76px] lg:h-[84px] grid grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center">
          {/* MOBILE HAMBURGER BUTTON */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#080808] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <RiMenuLine className="text-[24px]" />
          </button>

          {/* BRAND LOGO */}
          <Link
            href="/"
            className="inline-flex items-center lg:justify-self-start justify-self-center text-[#080808] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#080808]"
            aria-label="NK-SHOES Home"
          >
            <span
              className="text-[32px] sm:text-[36px] lg:text-[40px] font-black italic tracking-[-1.5px] leading-none uppercase"
              style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
            >
              NK<span className="font-bold ml-[2px]">SHOES</span>
            </span>
          </Link>

          {/* DESKTOP CENTER NAVIGATION */}
          <nav
            className="hidden lg:flex items-center justify-center gap-7 xl:gap-9 h-full justify-self-center"
            aria-label="Primary Navigation"
          >
            {navItems.map((item) => {
              const active = isRouteActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative h-full inline-flex items-center text-[14px] xl:text-[15px] font-bold uppercase tracking-[0.04em] whitespace-nowrap transition-colors duration-200 cursor-pointer",
                    item.isSale
                      ? "text-[#C83224] hover:text-[#A52A20]"
                      : active
                      ? "text-[#080808]"
                      : "text-[#171717] hover:text-[#555555]"
                  )}
                >
                  <span>{item.label}</span>

                  {/* Underline indicator */}
                  <span
                    className={cn(
                      "absolute bottom-[20px] left-0 right-0 h-[2.5px] transition-transform duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)] origin-left",
                      item.isSale ? "bg-[#C83224]" : "bg-[#080808]",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    )}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </nav>

          {/* RIGHT ACTION ICONS (Built with react-icons) */}
          <div className="flex items-center justify-self-end gap-1 sm:gap-1.5">
            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-[#080808] hover:bg-[#F6F6F6] active:scale-95 transition-all cursor-pointer"
              aria-label="Search shoes and collections"
              aria-expanded={isSearchOpen}
            >
              <RiSearchLine className="text-[21px]" />
            </button>

            {/* Account (Desktop & Tablet) */}
            <Link
              href={isLoggedIn ? "/profile" : "/login"}
              className="hidden sm:inline-flex relative w-10 h-10 items-center justify-center text-[#080808] hover:bg-[#F6F6F6] active:scale-95 transition-all cursor-pointer"
              aria-label={isLoggedIn && user ? `Profile of ${user.name}` : "My Profile"}
              title={isLoggedIn && user ? `Hi, ${user.name}` : "Sign In / Profile"}
            >
              <RiUser3Line className="text-[21px]" />
              {isLoggedIn && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
              )}
            </Link>

            {/* Wishlist (Desktop & Tablet) */}
            <Link
              href="/wishlist"
              className="hidden sm:inline-flex relative w-10 h-10 items-center justify-center text-[#080808] hover:bg-[#F6F6F6] active:scale-95 transition-all cursor-pointer"
              aria-label={`Wishlist with ${liveWishlistCount} items`}
            >
              <RiHeartLine className="text-[21px]" />
              {liveWishlistCount > 0 && (
                <span className="absolute top-[4px] right-[4px] min-w-[15px] h-[15px] px-1 bg-[#080808] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {liveWishlistCount > 99 ? "99+" : liveWishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Link */}
            <Link
              href="/cart"
              className="relative w-10 h-10 flex items-center justify-center text-[#111111] hover:bg-[#F5F5F5] transition-all cursor-pointer"
              aria-label={`Shopping bag with ${liveBagCount} items`}
              title="Shopping Bag"
            >
              <RiShoppingBag3Line className="text-[21px]" />
              {liveBagCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-[#000000] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {liveBagCount > 99 ? "99+" : liveBagCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* =========================================================
            SECONDARY UTILITY HEADER ROW (HELP | SIGN UP / USER STATE | LOGIN / LOGOUT)
        {/* =========================================================
            SECONDARY UTILITY BAR (Desktop Only - Height 36px)
            Clean, bordered surface with zero marketing clutter
            ========================================================= */}
        <div className="hidden lg:block border-t border-b border-[#E7E7E7] bg-[#F6F6F6]">
          <div className="max-w-[1500px] mx-auto px-6 lg:px-12 h-[36px] flex items-center justify-end">
            <nav
              className="flex items-center gap-3.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#626262]"
              aria-label="Utility Links"
            >
              <Link
                href="/pages/help"
                className="hover:text-[#080808] transition-colors cursor-pointer py-1"
              >
                Help
              </Link>
              <span className="w-px h-[12px] bg-[#D4D4D4]" aria-hidden="true" />

              {isLoggedIn && user ? (
                <>
                  <Link
                    href="/profile"
                    className="hover:text-[#080808] transition-colors cursor-pointer py-1 text-[#080808] font-bold flex items-center gap-1.5"
                    title="View & Edit Customer Profile"
                  >
                    <span>Profile ({user.name.split(" ")[0]})</span>
                  </Link>
                  <span className="w-px h-[12px] bg-[#D4D4D4]" aria-hidden="true" />
                  <Link
                    href="/profile?tab=orders"
                    className="hover:text-[#080808] transition-colors cursor-pointer py-1"
                    title="View Customer Orders & Tracking"
                  >
                    Orders
                  </Link>
                  {user.role === "admin" && (
                    <>
                      <span className="w-px h-[12px] bg-[#D4D4D4]" aria-hidden="true" />
                      <Link
                        href="/admin"
                        className="hover:text-[#080808] transition-colors cursor-pointer py-1 text-[#080808] font-bold"
                        title="Admin Console"
                      >
                        Admin
                      </Link>
                    </>
                  )}
                  <span className="w-px h-[12px] bg-[#D4D4D4]" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="hover:text-[#E53E3E] transition-colors cursor-pointer py-1 text-[11px] font-semibold uppercase tracking-wider"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="hover:text-[#080808] transition-colors cursor-pointer py-1"
                  >
                    Create Account
                  </Link>
                  <span className="w-px h-[12px] bg-[#D4D4D4]" aria-hidden="true" />
                  <Link
                    href="/login"
                    className="hover:text-[#080808] transition-colors cursor-pointer py-1 text-[#080808] font-bold"
                  >
                    Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* =========================================================
          IMPROVED EXPANDABLE SEARCH (Center & Top 0, Square, Z-Index++, Live Results)
          - No full white line background
          - Sharp athletic square borders (rounded-none)
          - CLEAR text button + CLOSE text button (no cross)
          - Live search results display
          ========================================================= */}
      {isSearchOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 z-[95] nk-backdrop"
            onClick={() => setIsSearchOpen(false)}
            aria-hidden="true"
          />

          {/* Centered Top Floating Search Panel */}
          <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-3 sm:pt-6 px-3 sm:px-6 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-[820px] bg-white border-2 border-[#080808] shadow-[0_24px_64px_rgba(0,0,0,0.22)] rounded-none nk-modal-scale overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Product Search"
            >
              {/* Search Input Bar (Square, athletic, high-contrast) */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-3 px-4 sm:px-6 py-3.5 bg-white border-b border-[#E9E9E9]"
              >
                <RiSearchLine className="text-[22px] text-[#080808] flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH SHOES, SNEAKERS, DROPS..."
                  className="w-full text-sm sm:text-base font-semibold uppercase tracking-wider text-[#080808] placeholder:text-[#888888] outline-none bg-transparent rounded-none"
                  aria-label="Search footwear"
                />

                {/* CLEAR text button (appears when input is typed) */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#080808] bg-[#F6F6F6] hover:bg-[#E9E9E9] border border-[#D4D4D4] transition-colors rounded-none cursor-pointer flex-shrink-0"
                  >
                    Clear
                  </button>
                )}

                {/* CLOSE text button (clean text button instead of cross) */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-[#080808] hover:bg-[#222222] transition-colors rounded-none cursor-pointer flex-shrink-0"
                >
                  Close
                </button>
              </form>

              {/* LIVE RESULTS & SUGGESTIONS AREA */}
              <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto bg-white">
                {/* Popular Search Tags */}
                {filteredTags.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#777777] mb-2.5">
                      {searchQuery.trim() ? "Matching Categories" : "Popular Searches"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {filteredTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => executeSearch(tag)}
                          className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide bg-[#F6F6F6] text-[#111111] hover:bg-[#080808] hover:text-white border border-[#E9E9E9] hover:border-[#080808] transition-all rounded-none cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Matching Results List */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#777777] mb-2.5">
                    {searchQuery.trim()
                      ? `Matching Results (${filteredSuggestions.length})`
                      : "Trending Footwear"}
                  </p>

                  {filteredSuggestions.length > 0 ? (
                    <div className="divide-y divide-[#E9E9E9] border border-[#E9E9E9]">
                      {filteredSuggestions.map((item) => (
                        <div
                          key={item.title}
                          onClick={() => executeSearch(item.title)}
                          className="group flex items-center justify-between p-3 sm:p-3.5 hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#F6F6F6] group-hover:bg-[#080808] group-hover:text-white flex items-center justify-center text-[#777777] transition-colors flex-shrink-0">
                              <RiSearchLine className="text-[15px]" />
                            </span>
                            <div>
                              <div className="text-sm font-bold text-[#080808] group-hover:underline">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-[#777777] uppercase tracking-wider">
                                {item.category}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.tag && (
                              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#080808] text-white">
                                {item.tag}
                              </span>
                            )}
                            <RiArrowRightLine className="text-[18px] text-[#777777] group-hover:text-[#080808] group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-[#777777]">
                      No footwear found matching &ldquo;{searchQuery}&rdquo;. Press Enter to view all product catalog.
                    </div>
                  )}
                </div>

                {/* Search Footer */}
                {searchQuery.trim() && (
                  <div className="mt-4 pt-3 border-t border-[#E9E9E9] flex items-center justify-between">
                    <span className="text-xs text-[#777777]">
                      Press <kbd className="px-1.5 py-0.5 bg-[#F6F6F6] border border-[#D4D4D4] font-mono text-[10px]">ENTER</kbd> to search all products
                    </span>
                    <button
                      type="button"
                      onClick={() => executeSearch(searchQuery)}
                      className="text-xs font-bold uppercase tracking-wider text-[#080808] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>View All Results</span>
                      <RiArrowRightLine className="text-[14px]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================
          MOBILE DRAWER OVERLAY & DIALOG (Slide from left with global anim)
          ========================================================= */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 nk-backdrop lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-[min(380px,86vw)] bg-white p-6 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] flex flex-col justify-between overflow-y-auto lg:hidden rounded-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-5 border-b border-[#E7E7E7]">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[#080808] focus-visible:outline-none"
            >
              <span
                className="text-[30px] font-black italic tracking-[-1px] uppercase leading-none"
                style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
              >
                NK<span className="font-bold ml-[2px]">SHOES</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-[#080808] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <RiCloseLine className="text-[24px]" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col mt-3" aria-label="Mobile Category Links">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between min-h-[56px] border-b border-[#E7E7E7] text-[16px] font-bold text-[#111111] transition-colors hover:text-[#626262] cursor-pointer",
                  item.isSale && "!text-[#C83224]"
                )}
              >
                <span>{item.label}</span>
                <RiArrowRightLine className="text-[18px] text-[#777777]" />
              </Link>
            ))}

            {/* Mobile Menu Direct Wishlist Link */}
            <Link
              href="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between min-h-[56px] border-b border-[#E7E7E7] text-[16px] font-bold text-[#111111] transition-colors hover:text-[#626262] cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <RiHeartLine className="text-[20px]" />
                <span>Favorites / Wishlist</span>
              </span>
              {liveWishlistCount > 0 ? (
                <span className="bg-[#111111] text-white text-xs px-2.5 py-0.5 rounded-none font-bold">
                  {liveWishlistCount} {liveWishlistCount === 1 ? "item" : "items"}
                </span>
              ) : (
                <span className="text-xs text-[#888888] font-normal">Empty</span>
              )}
            </Link>

            {/* Mobile Menu Direct Bag Link */}
            <Link
              href="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between min-h-[56px] border-b border-[#E7E7E7] text-[16px] font-bold text-[#111111] transition-colors hover:text-[#626262] cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <RiShoppingBag3Line className="text-[20px]" />
                <span>Shopping Bag</span>
              </span>
              {liveBagCount > 0 ? (
                <span className="bg-[#111111] text-white text-xs px-2.5 py-0.5 rounded-none font-bold">
                  {liveBagCount} {liveBagCount === 1 ? "item" : "items"}
                </span>
              ) : (
                <span className="text-xs text-[#888888] font-normal">Empty</span>
              )}
            </Link>
          </nav>
        </div>

        {/* Mobile Utility Footer (Help, Create Account, Login / Hi Name, Logout) */}
        <div className="mt-auto pt-6 border-t border-[#F0F0F0] flex flex-col gap-3 text-xs">
          {isLoggedIn && user ? (
            <>
              <div className="text-[14px] font-bold text-[#080808] flex items-center gap-2">
                <span>Hi, {user.name}</span>
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              </div>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[14px] font-semibold text-[#626262] hover:text-[#080808] transition-colors cursor-pointer"
              >
                Profile Info & Addresses
              </Link>
              <Link
                href="/profile?tab=orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[14px] font-semibold text-[#626262] hover:text-[#080808] transition-colors cursor-pointer"
              >
                My Orders & Tracking
              </Link>
              <Link
                href="/pages/help"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[14px] font-semibold text-[#626262] hover:text-[#080808] transition-colors cursor-pointer"
              >
                Help & Support
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="text-[14px] font-semibold text-[#E53E3E] hover:underline text-left cursor-pointer pt-1"
              >
                Logout
              </button>
            </>
          ) : (
            utilityLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "text-[14px] font-semibold text-[#626262] hover:text-[#080808] transition-colors cursor-pointer",
                  link.isPrimary && "font-bold text-[#080808]"
                )}
              >
                {link.label}
              </Link>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

export default Header;
