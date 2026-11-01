"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightSLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Reusable Breadcrumbs Navigation inspired by Nike & Adidas official online stores.
 * Features Schema.org SEO metadata, mobile back navigation, and clean typography.
 */
export function Breadcrumbs({
  items,
  showBack = true,
  backHref,
  backLabel = "Back",
  className,
}: BreadcrumbsProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    if (!backHref) {
      e.preventDefault();
      router.back();
    }
  };

  // Determine fallback back URL if backHref is not provided
  const resolvedBackHref =
    backHref || (items.length > 1 ? items[items.length - 2]?.href : "/products");

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("w-full py-3.5 sm:py-4 font-sans select-none", className)}
    >
      <div className="flex items-center justify-between gap-4 text-[12px] sm:text-[13px]">
        {/* DESKTOP & TABLET BREADCRUMB LIST */}
        <ol
          itemScope
          itemType="https://schema.org/BreadcrumbList"
          className="flex items-center flex-wrap gap-y-1 text-[#707072]"
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const position = index + 1;

            return (
              <li
                key={index}
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
                className="flex items-center"
              >
                {!isLast && item.href ? (
                  <Link
                    href={item.href}
                    itemProp="item"
                    className="hover:text-[#111111] transition-colors whitespace-nowrap"
                  >
                    <span itemProp="name">{item.label}</span>
                  </Link>
                ) : (
                  <span
                    itemProp="name"
                    aria-current={isLast ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap",
                      isLast ? "font-bold text-[#111111]" : "text-[#707072]"
                    )}
                  >
                    {item.label}
                  </span>
                )}
                <meta itemProp="position" content={String(position)} />

                {/* SLANTED DIVIDER */}
                {!isLast && (
                  <span
                    className="mx-2 text-[#CCCCCC] text-[11px] font-normal select-none"
                    aria-hidden="true"
                  >
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {/* COMPACT BACK BUTTON (NIKE / ADIDAS STYLE) */}
        {showBack && (
          <div className="shrink-0">
            {resolvedBackHref ? (
              <Link
                href={resolvedBackHref}
                className="inline-flex items-center gap-1.5 font-bold text-[#111111] hover:opacity-70 transition-opacity text-[12px] uppercase tracking-wider"
              >
                <RiArrowLeftLine className="text-sm" />
                <span>{backLabel}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 font-bold text-[#111111] hover:opacity-70 transition-opacity text-[12px] uppercase tracking-wider cursor-pointer"
              >
                <RiArrowLeftLine className="text-sm" />
                <span>{backLabel}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
