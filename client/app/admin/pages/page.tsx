"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiRefreshLine,
  RiFileTextLine,
  RiCloseLine,
  RiSaveLine,
} from "react-icons/ri";
import { DataTable, Column, FilterOption } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  getAdminPages,
  createAdminPage,
  updateAdminPage,
  deleteAdminPage,
  AdminPage,
} from "@/services/adminService";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

const CATEGORIES = ["Support", "Policy", "Company", "General"] as const;

export default function AdminPagesPage() {
  const [pages, setPages] = useState<AdminPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<AdminPage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Policy" as AdminPage["category"],
    excerpt: "",
    content: "",
    isPublished: true,
    metaTitle: "",
    metaDescription: "",
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<AdminPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPages = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminPages();
      setPages(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load CMS pages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const filteredPages = useMemo(() => {
    if (filterTab === "published") {
      return pages.filter((p) => p.isPublished);
    }
    if (filterTab === "draft") {
      return pages.filter((p) => !p.isPublished);
    }
    if (filterTab === "policy") {
      return pages.filter((p) => p.category === "Policy");
    }
    if (filterTab === "support") {
      return pages.filter((p) => p.category === "Support");
    }
    return pages;
  }, [pages, filterTab]);

  const tabCounts = useMemo(() => {
    return {
      all: pages.length,
      published: pages.filter((p) => p.isPublished).length,
      draft: pages.filter((p) => !p.isPublished).length,
      policy: pages.filter((p) => p.category === "Policy").length,
      support: pages.filter((p) => p.category === "Support").length,
    };
  }, [pages]);

  const filterOptions: FilterOption[] = [
    { label: "ALL PAGES", value: "all", count: tabCounts.all },
    { label: "PUBLISHED", value: "published", count: tabCounts.published },
    { label: "DRAFTS", value: "draft", count: tabCounts.draft },
    { label: "POLICIES", value: "policy", count: tabCounts.policy },
    { label: "SUPPORT", value: "support", count: tabCounts.support },
  ];

  const openCreateModal = () => {
    setEditingPage(null);
    setFormData({
      title: "",
      slug: "",
      category: "Policy",
      excerpt: "",
      content: "",
      isPublished: true,
      metaTitle: "",
      metaDescription: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (page: AdminPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title || "",
      slug: page.slug || "",
      category: page.category || "General",
      excerpt: page.excerpt || "",
      content: page.content || "",
      isPublished: page.isPublished !== false,
      metaTitle: page.metaTitle || page.title || "",
      metaDescription: page.metaDescription || page.excerpt || "",
    });
    setIsModalOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: !editingPage ? generatedSlug : prev.slug,
      metaTitle: !editingPage ? val : prev.metaTitle,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error("Page title and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPage) {
        const updated = await updateAdminPage(editingPage._id, formData);
        toast.success(`Page "${formData.title}" updated successfully`);
        setPages((prev) =>
          prev.map((p) => (p._id === editingPage._id ? updated : p))
        );
      } else {
        const created = await createAdminPage(formData);
        toast.success(`Page "${formData.title}" created successfully`);
        setPages((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save CMS page");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminPage(deleteTarget._id);
      toast.success(`Page "${deleteTarget.title}" deleted`);
      setPages((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete page");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<AdminPage>[] = [
    {
      header: "PAGE TITLE",
      className: "min-w-[240px]",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#111111] text-white flex items-center justify-center font-mono text-sm shrink-0">
            <RiFileTextLine />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs uppercase tracking-tight text-[#111111] truncate">
              {item.title}
            </span>
            <span className="text-[10px] text-[#6B7280] font-mono tracking-wider">
              /pages/{item.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "CATEGORY",
      render: (item) => (
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#374151] bg-[#F3F4F6] px-2 py-1">
          {item.category}
        </span>
      ),
    },
    {
      header: "EXCERPT",
      className: "max-w-xs",
      render: (item) => (
        <span className="text-xs text-[#4B5563] line-clamp-1">
          {item.excerpt || "—"}
        </span>
      ),
    },
    {
      header: "STATUS",
      render: (item) => (
        <StatusBadge
          status={item.isPublished ? "PUBLISHED" : "DRAFT"}
          variant={item.isPublished ? "active" : "inactive"}
        />
      ),
    },
    {
      header: "LAST UPDATED",
      render: (item) => (
        <span className="font-mono text-[10px] text-[#6B7280]">
          {new Date(item.updatedAt || item.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "ACTIONS",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/pages/${item.slug}`}
            target="_blank"
            title="Preview Page"
            className="p-1.5 border border-[#E5E7EB] text-[#6B7280] hover:text-[#111111] hover:border-[#111111] transition-colors rounded-none"
          >
            <RiExternalLinkLine className="text-sm" />
          </Link>
          <button
            type="button"
            onClick={() => openEditModal(item)}
            title="Edit Page"
            className="p-1.5 bg-[#111111] text-white hover:bg-black transition-colors rounded-none cursor-pointer"
          >
            <RiEditLine className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            title="Delete Page"
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
            Dynamic CMS Pages
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Manage storefront content, terms, shipping policies, returns, and support documentation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPages}
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
            <span>Create Page</span>
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable<AdminPage>
        data={filteredPages}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search pages by title, slug, or content..."
        searchFilter={(item, q) =>
          Boolean(
            item.title.toLowerCase().includes(q) ||
            item.slug.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            (item.excerpt && item.excerpt.toLowerCase().includes(q))
          )
        }
        filterOptions={filterOptions}
        filterValue={filterTab}
        onFilterChange={setFilterTab}
        pageSize={15}
        emptyMessage="No CMS pages found in this category."
      />

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-black w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl rounded-none animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#111111] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-black uppercase tracking-widest">
                {editingPage ? "EDIT CMS PAGE" : "CREATE NEW CMS PAGE"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Page Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Shipping & Delivery Policy"
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as AdminPage["category"] })
                    }
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-bold uppercase text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  URL Slug * (Access via /pages/[slug])
                </label>
                <div className="flex items-center">
                  <span className="bg-[#E5E7EB] border border-r-0 border-[#D1D5DB] px-3 py-2 text-xs font-mono text-[#6B7280]">
                    /pages/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
                      })
                    }
                    placeholder="shipping-policy"
                    className="flex-1 bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Short Excerpt / Summary
                </label>
                <input
                  type="text"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="A concise summary of this page for preview cards and SEO"
                  className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Page Content & Body (WYSIWYG Visual Editor)
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                  placeholder="Format headings, policies, terms, bullet points, and links with the toolbar above..."
                />
              </div>

              {/* SEO Meta Fields */}
              <div className="border border-[#E5E7EB] p-3.5 bg-[#FAFAFA] space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#111111]">
                  Search Engine Optimization (SEO)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder="Title tag for Google results"
                      className="w-full bg-white border border-[#D1D5DB] text-xs text-[#111111] px-3 py-1.5 outline-none focus:border-black rounded-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Meta Description
                    </label>
                    <input
                      type="text"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="Snippet for search listings"
                      className="w-full bg-white border border-[#D1D5DB] text-xs text-[#111111] px-3 py-1.5 outline-none focus:border-black rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Publish Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 accent-black rounded-none"
                  />
                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Publish Immediately on Storefront
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E5E7EB]">
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
                  <span>{isSubmitting ? "Saving..." : "Save Page"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="DELETE CMS PAGE"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}" (/pages/${deleteTarget?.slug})? Storefront visitors accessing this URL will encounter a 404.`}
        confirmLabel="DELETE PAGE"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
