import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { getProductBySlug } from "@/services/productService";

export const instant = false;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | NK-SHOES",
    };
  }

    return {
      title: `${product.name} | Authentic Athletic Footwear | NK-SHOES Jamnagar`,
      description: `${product.description} Buy authentic ${product.name} with fast all-India delivery and COD from NK-SHOES Jamnagar showroom.`,
      alternates: {
        canonical: `https://nkshoes.in/products/${slug}`,
      },
      openGraph: {
        title: `${product.name} - ${product.subtitle} | NK-SHOES Jamnagar`,
        description: product.description,
        url: `https://nkshoes.in/products/${slug}`,
        siteName: "NK-SHOES Jamnagar",
        images: product.images[0]
          ? [
              {
                url: product.images[0],
                width: 800,
                height: 800,
                alt: product.name,
              },
            ]
          : [],
      },
    };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product, relatedProducts } = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="w-full min-h-screen bg-white font-sans overflow-x-hidden pt-2 pb-24">
      <Container>
        <ProductDetailView product={product} relatedProducts={relatedProducts} />
      </Container>
    </main>
  );
}
