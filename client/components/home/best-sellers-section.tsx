"use client";

import React, { useState, useEffect } from "react";
import { ProductSection } from "@/components/product/product-section";
import { getBestSellers } from "@/services/productService";
import { Product } from "@/types/product";

interface BestSellersSectionProps {
  products?: Product[];
  defaultLayout?: "slider" | "grid";
  className?: string;
}

export function BestSellersSection({
  products,
  defaultLayout = "slider",
  className,
}: BestSellersSectionProps) {
  const [liveProducts, setLiveProducts] = useState<Product[]>(products || []);
  const [loading, setLoading] = useState(!products || products.length === 0);

  useEffect(() => {
    let isMounted = true;
    async function loadFreshBestSellers() {
      try {
        const data = await getBestSellers(8);
        if (isMounted) {
          setLiveProducts(data || []);
        }
      } catch (e) {
        if (isMounted) {
          setLiveProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadFreshBestSellers();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && liveProducts.length === 0) {
    return null;
  }

  return (
    <ProductSection
      title="Best Sellers"
      subtitle="Top-selling sneakers, high-mileage runners, and customer favorites with verified reviews."
      badge="Trending Now"
      products={liveProducts}
      defaultLayout={defaultLayout}
      allowLayoutToggle={true}
      viewAllHref="/products?filter=best-sellers"
      viewAllText="Explore Best Sellers"
      className={className}
    />
  );
}
