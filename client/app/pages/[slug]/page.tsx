import React, { Suspense } from "react";
import { DynamicPageContent } from "./dynamic-page-content";

import type { Metadata } from "next";

export const instant = false;

interface DynamicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DynamicPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/pages/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const page = await res.json();
      const pageTitle = page.metaTitle || page.title;
      const pageDesc = page.metaDescription || page.excerpt || `Read ${page.title} at NK-SHOES Jamnagar.`;
      return {
        title: `${pageTitle} | NK-SHOES Jamnagar`,
        description: pageDesc,
        alternates: {
          canonical: `https://nkshoes.in/pages/${slug}`,
        },
        openGraph: {
          title: pageTitle,
          description: pageDesc,
          url: `https://nkshoes.in/pages/${slug}`,
          siteName: "NK-SHOES Jamnagar",
        },
      };
    }
  } catch {
    // Fallback if backend isn't ready
  }

  const formattedTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${formattedTitle} | NK-SHOES Jamnagar`,
    description: `Official policy and documentation for ${formattedTitle} at NK-SHOES.`,
    alternates: {
      canonical: `https://nkshoes.in/pages/${slug}`,
    },
  };
}

export default async function StorefrontDynamicPage({ params }: DynamicPageProps) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 font-sans">
          <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin rounded-none" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#6B7280]">
            Loading document...
          </p>
        </div>
      }
    >
      <DynamicPageContent slug={slug} />
    </Suspense>
  );
}
