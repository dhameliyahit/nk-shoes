"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  RiStarFill,
  RiDeleteBinLine,
  RiRefreshLine,
  RiExternalLinkLine,
  RiCheckboxCircleFill,
  RiThumbUpLine,
} from "react-icons/ri";
import { DataTable, Column, FilterOption } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getAdminReviews, deleteAdminReview, AdminReview } from "@/services/adminService";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>("all");

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminReviews();
      setReviews(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load customer reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    if (filterTab === "five_stars") {
      return reviews.filter((r) => r.rating === 5);
    }
    if (filterTab === "four_stars") {
      return reviews.filter((r) => r.rating === 4);
    }
    if (filterTab === "critical") {
      return reviews.filter((r) => r.rating <= 2);
    }
    if (filterTab === "verified") {
      return reviews.filter((r) => r.verified);
    }
    return reviews;
  }, [reviews, filterTab]);

  const tabCounts = useMemo(() => {
    return {
      all: reviews.length,
      five_stars: reviews.filter((r) => r.rating === 5).length,
      four_stars: reviews.filter((r) => r.rating === 4).length,
      critical: reviews.filter((r) => r.rating <= 2).length,
      verified: reviews.filter((r) => r.verified).length,
    };
  }, [reviews]);

  const filterOptions: FilterOption[] = [
    { label: "ALL REVIEWS", value: "all", count: tabCounts.all },
    { label: "5 STARS", value: "five_stars", count: tabCounts.five_stars },
    { label: "4 STARS", value: "four_stars", count: tabCounts.four_stars },
    { label: "CRITICAL (1-2★)", value: "critical", count: tabCounts.critical },
    { label: "VERIFIED BUYERS", value: "verified", count: tabCounts.verified },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminReview(deleteTarget.productId, deleteTarget.reviewId);
      toast.success("Customer review deleted successfully");
      setReviews((prev) =>
        prev.filter((r) => r.reviewId !== deleteTarget.reviewId)
      );
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<AdminReview>[] = [
    {
      header: "PRODUCT",
      className: "min-w-[200px]",
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 bg-[#F3F4F6] border border-[#E5E7EB] shrink-0 overflow-hidden">
            <Image
              src={
                item.productImage ||
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80"
              }
              alt={item.productName}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              href={`/products/${item.productSlug}`}
              target="_blank"
              className="font-bold text-xs uppercase tracking-tight text-[#111111] hover:underline truncate max-w-[160px] inline-flex items-center gap-1"
            >
              <span>{item.productName}</span>
              <RiExternalLinkLine className="text-[10px] text-[#9CA3AF] shrink-0" />
            </Link>
            <span className="text-[10px] text-[#6B7280] font-mono">
              ID: {item.productId.slice(-6)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "CUSTOMER",
      render: (item) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-bold text-xs text-[#111111] uppercase tracking-tight">
              {item.author}
            </span>
            {item.verified && (
              <RiCheckboxCircleFill
                className="text-[#059669] text-xs shrink-0"
                title="Verified Buyer"
              />
            )}
          </div>
          <span className="text-[10px] text-[#6B7280]">
            {item.city || "India"}
          </span>
        </div>
      ),
    },
    {
      header: "RATING & FIT",
      render: (item) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <RiStarFill
                key={star}
                className={`text-xs ${
                  star <= item.rating ? "text-[#111111]" : "text-[#E5E7EB]"
                }`}
              />
            ))}
            <span className="text-[10px] font-mono font-bold ml-1 text-[#111111]">
              {item.rating}/5
            </span>
          </div>
          {item.fit && (
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#4B5563] bg-[#F3F4F6] px-1 py-0.5 w-max">
              Fit: {item.fit}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "FEEDBACK DOSSIER",
      className: "max-w-md",
      render: (item) => (
        <div className="flex flex-col space-y-1">
          <span className="font-bold text-xs text-[#111111] uppercase tracking-tight line-clamp-1">
            {item.title}
          </span>
          <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
            "{item.content}"
          </p>
          <div className="flex items-center gap-3 pt-0.5 text-[10px] text-[#9CA3AF] font-mono">
            <span>
              {new Date(item.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            {item.helpfulCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[#059669]">
                <RiThumbUpLine className="text-xs" />
                <span>{item.helpfulCount} helpful</span>
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "ACTION",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            title="Delete Review"
            className="p-1.5 border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors rounded-none cursor-pointer"
          >
            <RiDeleteBinLine className="text-sm" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
            Customer Reviews Moderation
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Audit customer ratings, size fit feedback, and sanitize spam submissions
          </p>
        </div>
        <button
          type="button"
          onClick={loadReviews}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#374151] hover:border-black hover:text-black transition-colors rounded-none bg-white cursor-pointer self-start sm:self-auto"
        >
          <RiRefreshLine className={isLoading ? "animate-spin text-sm" : "text-sm"} />
          <span>Refresh</span>
        </button>
      </div>

      {/* DATA TABLE */}
      <DataTable<AdminReview>
        data={filteredReviews}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search reviews by customer name, title, or keyword..."
        searchFilter={(item, q) =>
          Boolean(
            item.author.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q) ||
            item.content.toLowerCase().includes(q) ||
            item.productName.toLowerCase().includes(q)
          )
        }
        filterOptions={filterOptions}
        filterValue={filterTab}
        onFilterChange={setFilterTab}
        pageSize={15}
        emptyMessage="No customer reviews found matching filter criteria."
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="DELETE REVIEW"
        message={`Are you sure you want to permanently remove the review by "${deleteTarget?.author}" on "${deleteTarget?.productName}"? This recalculates overall shoe rating.`}
        confirmLabel="DELETE REVIEW"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
