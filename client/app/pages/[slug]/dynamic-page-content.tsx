"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RiArrowRightSLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiFileTextLine,
  RiAlertLine,
  RiHomeLine,
} from "react-icons/ri";
import { api } from "@/lib/api";
import { AdminPage } from "@/services/adminService";

interface DynamicPageContentProps {
  slug: string;
}

export function DynamicPageContent({ slug }: DynamicPageContentProps) {
  const [page, setPage] = useState<AdminPage | null>(null);
  const [allPages, setAllPages] = useState<AdminPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch current page
        const pageRes = await fetch(`${api.pages}/${slug}`, {
          cache: "no-store",
        });

        if (!pageRes.ok) {
          throw new Error("Page not found or is currently private.");
        }
        const pageData = await pageRes.json();
        if (isMounted) setPage(pageData);

        // 2. Fetch all public pages for sidebar
        const listRes = await fetch(api.pages, { cache: "no-store" });
        if (listRes.ok) {
          const listData = await listRes.json();
          if (isMounted && Array.isArray(listData)) setAllPages(listData);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load content.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin rounded-none" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#6B7280]">
          Loading document...
        </p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-sans">
        <div className="bg-[#FAFAFA] border border-[#E5E7EB] p-10 max-w-lg mx-auto">
          <RiAlertLine className="text-4xl text-[#DC2626] mx-auto mb-3" />
          <h2 className="text-xl font-black uppercase tracking-tight text-[#111111]">
            Document Not Found
          </h2>
          <p className="text-xs text-[#6B7280] mt-2 mb-6">
            The page you requested is either unavailable or has been archived.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none"
          >
            <RiHomeLine className="text-sm" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-24">
      {/* 1. TOP BREADCRUMB */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#6B7280]">
            <Link href="/" className="hover:text-black transition-colors">
              HOME
            </Link>
            <RiArrowRightSLine className="text-xs text-[#9CA3AF]" />
            <span className="text-[#9CA3AF]">{page.category || "POLICY"}</span>
            <RiArrowRightSLine className="text-xs text-[#9CA3AF]" />
            <span className="text-black font-bold truncate max-w-[200px]">
              {page.title}
            </span>
          </div>
        </div>
      </div>

      {/* 2. PAGE HEADER HERO */}
      <section className="bg-[#111111] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white text-[10px] font-mono uppercase tracking-widest mb-4">
              <RiShieldCheckLine className="text-xs text-[#10B981]" />
              <span>OFFICIAL NK-SHOES PROTOCOL</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none mb-3">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="text-sm sm:text-base font-semibold text-[#FA003F] uppercase tracking-wide mb-3">
                {page.subtitle}
              </p>
            )}
            {page.excerpt && (
              <p className="text-sm sm:text-base text-[#D1D5DB] font-normal leading-relaxed">
                {page.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-6 text-[11px] font-mono text-[#9CA3AF]">
              {page.displayDate ? (
                <span className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 text-white font-bold">
                  <RiTimeLine className="text-[#10B981]" />
                  <span>DATE: {page.displayDate}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <RiTimeLine />
                  <span>
                    LAST REVISED:{" "}
                    {new Date(page.updatedAt || page.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
              )}
              <span>•</span>
              <span className="uppercase">{page.category}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT LAYOUT WITH NAVIGATION SIDEBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* SIDEBAR NAVIGATION */}
          <aside className="lg:col-span-4 order-2 lg:order-1 space-y-6">
            <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#111111] pb-3 border-b border-[#E5E7EB] mb-3">
                Store Policies & Help
              </h3>
              <nav className="space-y-1">
                {allPages.map((p) => {
                  const isActive = p.slug === slug;
                  return (
                    <Link
                      key={p._id || p.slug}
                      href={`/pages/${p.slug}`}
                      className={`flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-none ${
                        isActive
                          ? "bg-[#111111] text-white"
                          : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111111]"
                      }`}
                    >
                      <span className="truncate">{p.title}</span>
                      <RiArrowRightSLine className={isActive ? "text-white" : "text-[#9CA3AF]"} />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* NEED HELP BOX */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#111111]">
                <RiFileTextLine className="text-base text-black" />
                <span>Need Direct Assistance?</span>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Our support team is available Monday to Saturday, 9:00 AM – 7:00 PM IST.
              </p>
              <div className="pt-2 text-xs font-mono space-y-1">
                <p className="text-[#111111] font-bold">nkshoes7@gmail.com</p>
                <p className="text-[#6B7280] font-mono">+91 97243 13238</p>
              </div>
            </div>
          </aside>

          {/* DOCUMENT BODY */}
          <main className="lg:col-span-8 order-1 lg:order-2">
            <article className="bg-white border border-[#E5E7EB] p-6 sm:p-10 shadow-2xs">
              <div
                className="prose prose-sm max-w-none text-[#1F2937] leading-relaxed
                  prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-[#111111]
                  prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#E5E7EB]
                  prose-h3:text-sm prose-h3:mt-6 prose-h3:mb-2
                  prose-p:text-xs sm:prose-p:text-sm prose-p:mb-4 prose-p:leading-relaxed prose-p:text-[#374151]
                  prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-4 prose-ul:text-xs sm:prose-ul:text-sm
                  prose-li:mb-1.5 prose-li:text-[#374151]
                  prose-strong:text-[#111111] prose-strong:font-bold"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}
