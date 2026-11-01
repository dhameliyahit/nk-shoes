"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { ProductTabs } from "@/components/product/product-tabs";
import { StickyAddToCart } from "@/components/product/sticky-add-to-cart";
import { ProductSection } from "@/components/product/product-section";
import { recordProductView } from "@/services/productService";

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({
  product,
  relatedProducts,
}: ProductDetailViewProps) {
  const [currentProduct, setCurrentProduct] = useState<Product>(product);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes.find((s) => s.available)?.size || null
  );
  const [viewsCount, setViewsCount] = useState<number>(product.viewsCount || 0);

  useEffect(() => {
    setCurrentProduct(product);
  }, [product]);

  useEffect(() => {
    const identifier = product._id || product.id || product.slug;
    if (identifier) {
      recordProductView(identifier).then((res) => {
        if (res.viewsCount !== undefined) {
          setViewsCount(res.viewsCount);
        }
      });
    }
  }, [product]);

  const handleReviewAdded = (newReview: any, newRatings?: number, newCount?: number) => {
    setCurrentProduct((prev) => ({
      ...prev,
      rating: newRatings !== undefined ? newRatings : prev.rating,
      reviewCount: newCount !== undefined ? newCount : (prev.reviewCount || 0) + 1,
      reviews: [newReview, ...(prev.reviews || [])],
    }));
  };

  const activeColor = product.colors[selectedColorIndex];
  const activeColorImage = product.images[selectedColorIndex] || product.images[0];

  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Shoes", href: "/products" },
    {
      label:
        product.gender === "men"
          ? "Men's Footwear"
          : product.gender === "women"
          ? "Women's Footwear"
          : "Sneakers",
      href: `/products?gender=${product.gender}`,
    },
    { label: product.name },
  ];

  return (
    <div className="w-full">
      {/* REUSABLE BREADCRUMBS NAVIGATION */}
      <Breadcrumbs
        items={breadcrumbs}
        showBack={true}
        backHref="/products"
        backLabel="Back to Collection"
        className="mb-3"
      />

      {/* TOP SECTION: 2-COLUMN DISPLAY (GALLERY + STICKY PURCHASE PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pt-2">
        {/* LEFT: GALLERY WITH VERTICAL THUMBNAILS, MAGNIFIER & LIGHTBOX */}
        <div className="lg:col-span-7">
          <ProductGallery
            images={product.images}
            productName={product.name}
            badge={product.badge}
            activeColorImage={activeColorImage}
          />
        </div>

        {/* RIGHT: STICKY PURCHASE PANEL */}
        <div className="lg:col-span-5">
          <div className="sticky top-28">
            <ProductInfo
              product={currentProduct}
              selectedSize={selectedSize}
              onSizeChange={handleSizeChange}
              selectedColorIndex={selectedColorIndex}
              onColorChange={handleColorChange}
              viewsCount={viewsCount}
            />
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE TAB-WISE SECTION (DESCRIPTION, SPECS, REVIEWS + WRITE A REVIEW, SHIPPING, CARE) */}
      <ProductTabs product={currentProduct} onReviewAdded={handleReviewAdded} />

      {/* RELATED FOOTWEAR RECOMMENDATIONS */}
      <div className="mt-14 pt-10 border-t border-[#EAEAEA]">
        <ProductSection
          title="Complete Your Rotation"
          subtitle="Athletes who picked this style also viewed these performance models."
          products={relatedProducts}
          defaultLayout="slider"
          allowLayoutToggle={false}
          viewAllHref="/products"
          viewAllText="View Full Catalog"
          className="py-0"
        />
      </div>

      {/* STICKY ADD-TO-BAG CONVERSION BAR (APPEARS ON SCROLL) */}
      <StickyAddToCart
        product={currentProduct}
        selectedSize={selectedSize}
        onSelectSize={handleSizeChange}
        selectedColorName={activeColor?.name || "Standard"}
      />
    </div>
  );
}
