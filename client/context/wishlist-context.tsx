"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import toast from "react-hot-toast";
import { Product } from "@/types/product";
import { useAuth } from "@/context/auth-context";

interface WishlistContextType {
  wishlist: Product[];
  wishlistCount: number;
  isHydrated: boolean;
  isInWishlist: (identifier: string) => boolean;
  toggleWishlist: (product: Product) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (identifier: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_KEY = "nk_shoes_wishlist_guest_v1";

function getStorageKey(userId?: string): string {
  return userId ? `nk_shoes_wishlist_user_${userId}` : GUEST_WISHLIST_KEY;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Active storage key based on authentication status
  const currentKey = useMemo(() => getStorageKey(user?._id), [user?._id]);

  // Load from localStorage on mount and when active key / user changes
  useEffect(() => {
    try {
      let savedItems: Product[] = [];
      const stored = localStorage.getItem(currentKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          savedItems = parsed;
        }
      }

      // If user just logged in, merge items from guest storage so nothing is lost
      if (user?._id) {
        const guestStored = localStorage.getItem(GUEST_WISHLIST_KEY);
        if (guestStored) {
          try {
            const guestItems = JSON.parse(guestStored);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              const existingIds = new Set(
                savedItems.map((p) => p._id || p.id || p.slug)
              );
              for (const item of guestItems) {
                const id = item._id || item.id || item.slug;
                if (!existingIds.has(id)) {
                  savedItems.push(item);
                  existingIds.add(id);
                }
              }
              // Clear guest storage after successful merge
              localStorage.removeItem(GUEST_WISHLIST_KEY);
            }
          } catch {
            // ignore
          }
        }
      }

      setWishlist(savedItems);
    } catch (e) {
      console.error("[Wishlist] Error loading from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, [currentKey, user?._id]);

  // Persist to localStorage whenever wishlist updates after hydration
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(currentKey, JSON.stringify(wishlist));
    } catch (e) {
      console.error("[Wishlist] Error saving to localStorage:", e);
    }
  }, [wishlist, currentKey, isHydrated]);

  const isInWishlist = useCallback(
    (identifier: string) => {
      if (!identifier) return false;
      return wishlist.some(
        (p) =>
          p.id === identifier ||
          p._id === identifier ||
          p.slug === identifier ||
          p.slug === identifier.toLowerCase()
      );
    },
    [wishlist]
  );

  const addToWishlist = useCallback(
    (product: Product) => {
      const id = product._id || product.id || product.slug;
      if (isInWishlist(id)) return;

      setWishlist((prev) => [product, ...prev]);
      toast.success(`Saved to Wishlist • ${product.name}`, {
        icon: "❤️",
      });
    },
    [isInWishlist]
  );

  const removeFromWishlist = useCallback((identifier: string) => {
    if (!identifier) return;
    let removedItemName = "";
    setWishlist((prev) => {
      const target = prev.find(
        (p) =>
          p.id === identifier ||
          p._id === identifier ||
          p.slug === identifier ||
          p.slug === identifier.toLowerCase()
      );
      if (target) {
        removedItemName = target.name;
      }
      return prev.filter(
        (p) =>
          p.id !== identifier &&
          p._id !== identifier &&
          p.slug !== identifier &&
          p.slug !== identifier.toLowerCase()
      );
    });

    if (removedItemName) {
      toast.success(`Removed from Wishlist • ${removedItemName}`);
    } else {
      toast.success("Removed from Wishlist");
    }
  }, []);

  const toggleWishlist = useCallback(
    (product: Product) => {
      const id = product._id || product.id || product.slug;
      if (isInWishlist(id)) {
        removeFromWishlist(id);
      } else {
        addToWishlist(product);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    try {
      localStorage.removeItem(currentKey);
    } catch {}
    toast.success("Wishlist cleared");
  }, [currentKey]);

  const value = useMemo(
    () => ({
      wishlist,
      wishlistCount: wishlist.length,
      isHydrated,
      isInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
    }),
    [
      wishlist,
      isHydrated,
      isInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
