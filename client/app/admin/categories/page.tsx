"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCloseLine,
  RiSaveLine,
  RiRefreshLine,
  RiFolderLine,
  RiImageLine,
} from "react-icons/ri";
import { DataTable, Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  AdminCategory,
} from "@/services/adminService";

interface ExtendedCategory extends AdminCategory {
  tag?: string;
  badge?: string;
  bannerImage?: string;
  startingPrice?: string;
  itemCount?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ExtendedCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExtendedCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    bannerImage: "",
    badge: "",
    startingPrice: "",
    displayOrder: 0,
    isActive: true,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<ExtendedCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminCategories();
      // Sort by displayOrder ascending
      const sorted = (data as ExtendedCategory[]).sort(
        (a, b) => (a.displayOrder ?? a.order ?? 0) - (b.displayOrder ?? b.order ?? 0)
      );
      setCategories(sorted);
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
      bannerImage: "",
      badge: "",
      startingPrice: "From ₹2,499",
      displayOrder: categories.length * 10,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ExtendedCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      image: cat.image || "",
      bannerImage: cat.bannerImage || "",
      badge: cat.badge || "",
      startingPrice: cat.startingPrice || "",
      displayOrder: cat.displayOrder ?? cat.order ?? 0,
      isActive: cat.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setFormData((prev) => ({
      ...prev,
      name: val,
      // only auto-update slug if it was empty or matched previously generated
      slug: !editingCategory ? generatedSlug : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const catId = editingCategory._id;
        const updated = await updateAdminCategory(catId, formData);
        toast.success(`Category "${formData.name}" updated successfully`);
        setCategories((prev) =>
          prev.map((c) => (c._id === catId ? { ...c, ...formData } : c))
        );
      } else {
        const created = await createAdminCategory(formData);
        toast.success(`Category "${formData.name}" created successfully`);
        setCategories((prev) => [...prev, created as ExtendedCategory]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminCategory(deleteTarget._id);
      toast.success(`Category "${deleteTarget.name}" deleted`);
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<ExtendedCategory>[] = [
    {
      header: "CATEGORY",
      className: "min-w-[240px]",
      render: (item) => {
        const thumb =
          item.image ||
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80";
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
              <span className="font-bold text-xs uppercase tracking-tight text-[#111111] truncate">
                {item.name}
              </span>
              <span className="text-[10px] text-[#6B7280] font-mono tracking-wider">
                /{item.slug}
              </span>
              {item.badge && (
                <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider text-black bg-[#E5E7EB] px-1 py-0.5 w-max">
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "DESCRIPTION",
      className: "max-w-xs",
      render: (item) => (
        <span className="text-xs text-[#4B5563] line-clamp-1">
          {item.description || "—"}
        </span>
      ),
    },
    {
      header: "STARTING PRICE",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[#111111]">
          {item.startingPrice || "Standard"}
        </span>
      ),
    },
    {
      header: "ORDER",
      render: (item) => (
        <span className="font-mono text-xs text-[#6B7280]">
          #{item.displayOrder ?? item.order ?? 0}
        </span>
      ),
    },
    {
      header: "STATUS",
      render: (item) => (
        <StatusBadge
          status={item.isActive !== false ? "ACTIVE" : "INACTIVE"}
          type="order"
        />
      ),
    },
    {
      header: "ACTIONS",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openEditModal(item)}
            title="Edit Category"
            className="p-1.5 bg-[#111111] text-white hover:bg-black transition-colors rounded-none cursor-pointer"
          >
            <RiEditLine className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            title="Delete Category"
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
            Categories Management
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Organize catalog footwear taxonomy, navigation groups, and storefront banners
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCategories}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#374151] hover:border-black hover:text-black transition-colors rounded-none bg-white cursor-pointer"
          >
            <RiRefreshLine className={isLoading ? "animate-spin text-sm" : "text-sm"} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none cursor-pointer"
          >
            <RiAddLine className="text-sm" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable<ExtendedCategory>
        data={categories}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search categories by name or slug..."
        searchFilter={(item, q) =>
          Boolean(
            item.name.toLowerCase().includes(q) ||
            item.slug.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q))
          )
        }
        pageSize={15}
        emptyMessage="No footwear categories found."
      />

      {/* ADD / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-black w-full max-w-lg shadow-2xl overflow-hidden rounded-none animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#111111] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiFolderLine className="text-lg text-[#9CA3AF]" />
                <h3 className="text-xs font-black uppercase tracking-widest !text-white text-white">
                  {editingCategory ? "EDIT CATEGORY" : "CREATE NEW CATEGORY"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Running Shoes"
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. running-shoes"
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short summary for SEO and catalog headers"
                  className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none resize-none"
                />
              </div>

              {/* Image URL & Live Preview */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                  {formData.image && (
                    <div className="relative w-9 h-9 border border-[#D1D5DB] bg-[#F3F4F6] shrink-0 overflow-hidden">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Meta Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. POPULAR"
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs uppercase text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Starting Price
                  </label>
                  <input
                    type="text"
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                    placeholder="From ₹2,499"
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: Number(e.target.value) })
                    }
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 border-t border-[#E5E7EB]">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 accent-black rounded-none"
                  />
                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Category Active on Storefront
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#4B5563] hover:text-black hover:border-black transition-colors rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none cursor-pointer disabled:opacity-50"
                >
                  <RiSaveLine className="text-sm" />
                  <span>{isSubmitting ? "Saving..." : "Save Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="DELETE CATEGORY"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Products assigned to this category will become unassigned.`}
        confirmLabel="DELETE CATEGORY"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
