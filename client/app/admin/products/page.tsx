"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiArchiveLine,
  RiExternalLinkLine,
  RiRefreshLine,
} from "react-icons/ri";
import { DataTable, Column, FilterOption } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getAdminProducts, deleteAdminProduct } from "@/services/adminService";
import { Product } from "@/types/product";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>("all");

  // Delete modal state
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load product catalog");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products by selected tab
  const filteredProducts = useMemo(() => {
    if (filterTab === "active") {
      return products.filter((p) => p.inStock && (p.stock === undefined || p.stock > 0));
    }
    if (filterTab === "low_stock") {
      return products.filter((p) => (p.stock !== undefined ? p.stock <= 10 : false));
    }
    if (filterTab === "sale") {
      return products.filter(
        (p) => p.originalPrice && p.originalPrice > p.price
      );
    }
    return products;
  }, [products, filterTab]);

  // Counts for filter tabs
  const tabCounts = useMemo(() => {
    return {
      all: products.length,
      active: products.filter((p) => p.inStock && (p.stock === undefined || p.stock > 0)).length,
      low_stock: products.filter((p) => (p.stock !== undefined ? p.stock <= 10 : false)).length,
      sale: products.filter((p) => p.originalPrice && p.originalPrice > p.price).length,
    };
  }, [products]);

  const filterOptions: FilterOption[] = [
    { label: "ALL PRODUCTS", value: "all", count: tabCounts.all },
    { label: "IN STOCK", value: "active", count: tabCounts.active },
    { label: "LOW STOCK", value: "low_stock", count: tabCounts.low_stock },
    { label: "ON SALE", value: "sale", count: tabCounts.sale },
  ];

  const handleDelete = async () => {
    if (!deleteProductTarget) return;
    const targetId = deleteProductTarget._id || deleteProductTarget.id;
    setIsDeleting(true);
    try {
      await deleteAdminProduct(targetId);
      toast.success(`Product "${deleteProductTarget.name}" deleted`);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== targetId));
      setDeleteProductTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      header: "PRODUCT",
      className: "min-w-[280px]",
      render: (item) => {
        const thumb =
          (item.images && item.images[0]) ||
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80";
        return (
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 bg-[#F3F4F6] border border-[#E5E7EB] shrink-0 overflow-hidden">
              <Image
                src={thumb}
                alt={item.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs uppercase tracking-tight text-[#111111] truncate max-w-[220px]">
                {item.name}
              </span>
              <span className="text-[10px] text-[#6B7280] font-mono tracking-wider">
                SKU: {item.sku || "N/A"}
              </span>
              {item.badge?.text && (
                <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider text-black bg-[#E5E7EB] px-1 py-0.5 w-max">
                  {item.badge.text}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "CATEGORIES",
      render: (item) => {
        const slugs = Array.isArray(item.categorySlugs) && item.categorySlugs.length > 0
          ? item.categorySlugs
          : [item.categorySlug || (typeof item.category === "string" ? item.category : "SNEAKERS")];

        return (
          <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
            {slugs.map((cat, idx) => (
              <span
                key={idx}
                className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 border ${
                  idx === 0
                    ? "bg-[#111111] text-white border-black"
                    : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]"
                }`}
                title={idx === 0 ? "Primary Category" : undefined}
              >
                {cat}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: "PRICE",
      render: (item) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="font-bold text-[#111111]">
            ₹{item.price.toLocaleString("en-IN")}
          </span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-[10px] text-[#9CA3AF] line-through">
              ₹{item.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "STOCK / UNITS",
      render: (item) => {
        const totalStock = item.stock ?? (item.sizes?.reduce((acc: number, s: any) => acc + (s.stock || 0), 0) || 0);
        const isCritical = totalStock <= 5;
        const isLow = totalStock > 5 && totalStock <= 10;
        return (
          <div className="flex flex-col font-mono text-xs">
            <span
              className={`font-bold ${
                isCritical
                  ? "text-[#DC2626]"
                  : isLow
                  ? "text-[#D97706]"
                  : "text-[#111111]"
              }`}
            >
              {totalStock} units
            </span>
            {isCritical && (
              <span className="text-[9px] font-bold text-[#DC2626] uppercase tracking-wider">
                CRITICAL
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "STATUS",
      render: (item) => {
        const inStock = item.inStock && (item.stock === undefined || item.stock > 0);
        return (
          <StatusBadge
            status={inStock ? "IN STOCK" : "OUT OF STOCK"}
            type="inventory"
          />
        );
      },
    },
    {
      header: "ACTIONS",
      className: "text-right",
      render: (item) => {
        const itemId = item._id || item.id;
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/products/${item.slug || itemId}`}
              target="_blank"
              title="View on Storefront"
              className="p-1.5 border border-[#E5E7EB] text-[#6B7280] hover:text-[#111111] hover:border-[#111111] transition-colors rounded-none"
            >
              <RiExternalLinkLine className="text-sm" />
            </Link>
            <Link
              href={`/admin/products/${itemId}/edit`}
              title="Edit Product"
              className="p-1.5 bg-[#111111] text-white hover:bg-black transition-colors rounded-none"
            >
              <RiEditLine className="text-sm" />
            </Link>
            <button
              type="button"
              onClick={() => setDeleteProductTarget(item)}
              title="Delete Product"
              className="p-1.5 border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors rounded-none cursor-pointer"
            >
              <RiDeleteBinLine className="text-sm" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
            Product Catalog
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Manage men's footwear inventory, technical specifications, sizes, and pricing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadProducts}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#374151] hover:border-black hover:text-black transition-colors rounded-none bg-white cursor-pointer"
          >
            <RiRefreshLine className={isLoading ? "animate-spin text-sm" : "text-sm"} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none"
          >
            <RiAddLine className="text-sm" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable<Product>
        data={filteredProducts}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by product name, SKU, or category..."
        searchFilter={(item, q) =>
          Boolean(
            item.name.toLowerCase().includes(q) ||
            (item.sku && item.sku.toLowerCase().includes(q)) ||
            (item.categorySlug && item.categorySlug.toLowerCase().includes(q)) ||
            (Array.isArray(item.categorySlugs) &&
              item.categorySlugs.some((s: string) => s.toLowerCase().includes(q)))
          )
        }
        filterOptions={filterOptions}
        filterValue={filterTab}
        onFilterChange={setFilterTab}
        pageSize={15}
        emptyMessage="No footwear products found in this filter."
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        title="DELETE PRODUCT"
        message={`Are you sure you want to permanently delete "${deleteProductTarget?.name}"? This action removes size matrix stocks, image references, and cannot be undone.`}
        confirmLabel="DELETE PRODUCT"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteProductTarget(null)}
      />
    </div>
  );
}
