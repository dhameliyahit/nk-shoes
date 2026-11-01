import React, { Suspense } from "react";
import { DynamicPageContent } from "./dynamic-page-content";

export const instant = false;

interface DynamicPageProps {
  params: Promise<{ slug: string }>;
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
