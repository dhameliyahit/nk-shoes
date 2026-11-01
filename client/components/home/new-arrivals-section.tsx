"use client";

import React, { useState, useEffect } from "react";
import { ProductSection } from "@/components/product/product-section";
import { getNewArrivals } from "@/services/productService";
import { Product } from "@/types/product";

interface NewArrivalsSectionProps {
  products?: Product[];
  defaultLayout?: "slider" | "grid";
  className?: string;
}

export function NewArrivalsSection({
  products,
  defaultLayout = "grid",
  className,
}: NewArrivalsSectionProps) {
  const [liveProducts, setLiveProducts] = useState<Product[]>(products || []);
  const [loading, setLoading] = useState(!products || products.length === 0);

  useEffect(() => {
    let isMounted = true;
    async function loadFreshArrivals() {
      try {
        const data = await getNewArrivals(8);
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
    loadFreshArrivals();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && liveProducts.length === 0) {
    return null;
  }

  return (
    <ProductSection
      title="New Arrivals"
      subtitle="Latest sneaker drops, road runners and daily street kicks just landed in stock."
      badge="Just Dropped"
      products={liveProducts}
      defaultLayout={defaultLayout}
      allowLayoutToggle={true}
      viewAllHref="/products?filter=new-arrivals"
      viewAllText="View All Shoes"
      className={className}
    />
  );
}
