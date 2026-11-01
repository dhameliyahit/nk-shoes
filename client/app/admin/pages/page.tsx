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
  const [modalTab, setModalTab] = useState<"edit" | "preview">("edit");

  // Form Fields
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Policy" as AdminPage["category"],
    subtitle: "",
    displayDate: "",
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

  const getTodayDateFormatted = () => {
    return new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const openCreateModal = () => {
    setEditingPage(null);
    setModalTab("edit");
    setFormData({
      title: "",
      slug: "",
      category: "Policy",
      subtitle: "",
      displayDate: getTodayDateFormatted(),
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
    setModalTab("edit");
    setFormData({
      title: page.title || "",
      slug: page.slug || "",
      category: page.category || "General",
      subtitle: page.subtitle || "",
      displayDate: page.displayDate || "",
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

            {/* Modal Subheader with Edit vs Preview Tabs */}
            <div className="bg-[#FAFAFA] border-b border-[#E5E7EB] px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalTab("edit")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none ${
                    modalTab === "edit"
                      ? "bg-black text-white"
                      : "bg-white border border-[#D1D5DB] text-[#4B5563] hover:text-black"
                  }`}
                >
                  Editor & Form
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("preview")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none ${
                    modalTab === "preview"
                      ? "bg-black text-white"
                      : "bg-white border border-[#D1D5DB] text-[#4B5563] hover:text-black"
                  }`}
                >
                  Live Preview
                </button>
              </div>

              {/* Quick Template Selector for Non-Technical Admins */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  1-Click Templates:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      title: "About NK-SHOES Jamnagar & Heritage",
                      slug: "about",
                      category: "Company",
                      subtitle: "Jamnagar Showroom & All-India Footwear Store",
                      excerpt:
                        "Jamnagar's premier athletic footwear retail store, delivering genuine sneakers across India at nkshoes.in.",
                      content: `<h2>Welcome to NK-SHOES — Jamnagar's Trusted Shoe Showroom</h2>\n<p>NK-SHOES is a physical footwear retail showroom situated in the heart of <strong>Jamnagar, Gujarat</strong>. For years, runners, gym enthusiasts, and sneaker collectors across Jamnagar have trusted our physical store for 100% authentic athletic footwear and lifestyle kicks.</p>\n\n<div style="background-color: #f3f4f6; border-left: 4px solid #111111; padding: 16px; margin: 20px 0;">\n  <h3 style="margin-top: 0; color: #111111; font-weight: 800;">VISIT OUR PHYSICAL STORE IN JAMNAGAR</h3>\n  <p style="margin: 4px 0;"><strong>Address:</strong> Ground Floor, Super Market Complex, Near Teen Batti, Jamnagar, Gujarat - 361001</p>\n  <p style="margin: 4px 0;"><strong>Store Timings:</strong> Monday to Saturday: 10:00 AM – 9:30 PM | Sunday: 11:00 AM – 8:00 PM</p>\n  <p style="margin: 4px 0;"><strong>Store Helpline & WhatsApp:</strong> +91 97243 13238</p>\n</div>\n\n<h3>Why We Expanded Online to nkshoes.in</h3>\n<p>Due to high demand from our loyal Jamnagar customers and clients across Gujarat, <strong>nkshoes.in</strong> now brings our entire physical showroom inventory online with fast delivery to every pin code in India.</p>\n\n<ul>\n  <li><strong>100% Genuine Guarantee:</strong> Every single pair is physically verified before dispatch from Jamnagar.</li>\n  <li><strong>Try In-Store:</strong> Located in or visiting Jamnagar? Step right in, try sizes, and take your pair home immediately.</li>\n  <li><strong>Cash on Delivery (COD) Nationwide:</strong> Safe and secure doorstep payments available across India.</li>\n  <li><strong>7-Day Easy Doorstep Exchanges:</strong> If your size isn't 100% perfect, our exchange team has your back.</li>\n</ul>`,
                      metaTitle: "About NK-SHOES | Jamnagar Shoe Store & Online Footwear India",
                      metaDescription:
                        "Discover NK-SHOES, Jamnagar's premier footwear showroom now delivering authentic athletic shoes and sneakers across India.",
                    }));
                    toast.success("Loaded 'Jamnagar Store' template!");
                  }}
                  className="px-2 py-1 bg-white border border-[#D1D5DB] hover:border-black text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  🏬 Jamnagar Store
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      title: "Delivery & Shipping Guidelines",
                      slug: "shipping",
                      category: "Policy",
                      subtitle: "Fast Shipping from Jamnagar Hub across India",
                      excerpt:
                        "Information regarding express dispatch from Jamnagar, delivery timelines, and free shipping thresholds.",
                      content: `<h2>Fast Nationwide Shipping from Jamnagar Hub</h2>\n<p>All online orders placed on <strong>nkshoes.in</strong> are dispatched directly from our Jamnagar central fulfillment showroom via premium courier partners (BlueDart, Delhivery, DTDC).</p>\n\n<div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">\n  <strong style="color: #065f46;">FREE DELIVERY ON ORDERS ABOVE ₹2,999:</strong>\n  <p style="margin: 4px 0 0 0; color: #047857;">Enjoy 100% free express shipping on all footwear orders above ₹2,999 anywhere in India.</p>\n</div>\n\n<h3>Estimated Delivery Timelines</h3>\n<ul>\n  <li><strong>Gujarat State (Jamnagar, Rajkot, Ahmedabad, Surat):</strong> 1 to 2 business days.</li>\n  <li><strong>Major Metro Cities (Mumbai, Delhi NCR, Bengaluru):</strong> 2 to 4 business days.</li>\n  <li><strong>Rest of India:</strong> 4 to 6 business days.</li>\n</ul>`,
                    }));
                    toast.success("Loaded 'Shipping Policy' template!");
                  }}
                  className="px-2 py-1 bg-white border border-[#D1D5DB] hover:border-black text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  🚚 Shipping
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      title: "7-Day Returns & Exchanges",
                      slug: "returns",
                      category: "Policy",
                      subtitle: "Hassle-Free Doorstep Size Exchange",
                      excerpt: "Unworn 7-day doorstep return and size exchange policy for all shoe orders.",
                      content: `<h2>7-Day Doorstep Returns & Exchanges</h2>\n<p>We want you to be 100% thrilled with your new pair from NK-SHOES. If your shoe size doesn't fit or you need a different style, we make returns simple.</p>\n\n<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">\n  <strong style="color: #92400e;">7-DAY RETURN WINDOW:</strong>\n  <p style="margin: 4px 0 0 0; color: #78350f;">Return or size exchange requests must be submitted within 7 days of delivery with original box and tags intact.</p>\n</div>\n\n<h3>How to Request an Exchange</h3>\n<ol>\n  <li>Message our Jamnagar customer desk at <strong>+91 97243 13238</strong> or email <strong>support@nkshoes.in</strong> with your order ID.</li>\n  <li>Our courier partner will pick up the unworn pair directly from your doorstep.</li>\n  <li>Your replacement size will be dispatched immediately upon pickup.</li>\n</ol>`,
                    }));
                    toast.success("Loaded 'Returns & Exchanges' template!");
                  }}
                  className="px-2 py-1 bg-white border border-[#D1D5DB] hover:border-black text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  🔄 Returns
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      title: "Festive Season Drop & Offers",
                      slug: "festive-offer",
                      category: "General",
                      subtitle: "Limited-Time Exclusive Jamnagar Store Offer",
                      excerpt: "Special festive season shoe discounts and coupon codes at NK-SHOES.",
                      content: `<h2>Festive Season Drop & Exclusive Discounts</h2>\n<p>Celebrate with exclusive shoe drops and instant discount coupons at NK-SHOES Jamnagar & online on nkshoes.in.</p>\n\n<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">\n  <h3 style="margin: 0; color: #991b1b;">FESTIVE COUPON CODE: CODEPEN50</h3>\n  <p style="margin: 6px 0 0 0; color: #7f1d1d;">Get 50% discount on selected performance shoes and sneakers during the sale period.</p>\n</div>\n\n<h3>Terms of the Festival Sale</h3>\n<ul>\n  <li>Offer valid both at our Jamnagar retail showroom and online on nkshoes.in.</li>\n  <li>Limited stock available on high-demand running sneakers.</li>\n  <li>Cash on Delivery and Prepaid PhonePe/UPI available.</li>\n</ul>`,
                    }));
                    toast.success("Loaded 'Festival Offer' template!");
                  }}
                  className="px-2 py-1 bg-white border border-[#D1D5DB] hover:border-black text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  🏷️ Offer
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            {modalTab === "preview" ? (
              <div className="p-6 overflow-y-auto flex-1 font-sans bg-[#FDFDFD]">
                <div className="border border-[#E5E7EB] bg-white p-6 sm:p-10 shadow-2xs space-y-4">
                  <div className="border-b border-[#E5E7EB] pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
                      {formData.category} • PREVIEW
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111] mt-1">
                      {formData.title || "Untitled Page"}
                    </h1>
                    {formData.subtitle && (
                      <p className="text-xs sm:text-sm font-semibold text-[#FA003F] uppercase tracking-wide mt-1">
                        {formData.subtitle}
                      </p>
                    )}
                    {formData.displayDate && (
                      <p className="text-xs font-mono text-[#6B7280] mt-2">
                        📅 Display Date: <strong>{formData.displayDate}</strong>
                      </p>
                    )}
                    {formData.excerpt && (
                      <p className="text-xs sm:text-sm text-[#4B5563] mt-2 italic">
                        {formData.excerpt}
                      </p>
                    )}
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-[#1F2937] leading-relaxed pt-2"
                    dangerouslySetInnerHTML={{
                      __html:
                        formData.content ||
                        "<p className='text-gray-400'>No content written yet. Switch to Editor tab to add content or click a template above.</p>",
                    }}
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
                {/* Row 1: Title & Category */}
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
                      placeholder="e.g. About NK-SHOES Jamnagar & Heritage"
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

                {/* Row 2: Display Date & Subtitle (Easy for non-technical users) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#F9FAFB] p-3 border border-[#E5E7EB]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-[#111111]">
                        Display Date / Effective Date
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, displayDate: getTodayDateFormatted() }))
                        }
                        className="text-[10px] text-black underline font-bold uppercase cursor-pointer"
                      >
                        Set to Today
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.displayDate}
                      onChange={(e) => setFormData({ ...formData, displayDate: e.target.value })}
                      placeholder="e.g. 01 Nov 2026 or Diwali 2026"
                      className="w-full bg-white border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                    />
                    <p className="text-[10px] text-[#6B7280]">
                      Displays prominently at the top of the dynamic page on the live website.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-[#111111]">
                      Subtitle / Header Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g. Jamnagar Retail Showroom & All-India Footwear Store"
                      className="w-full bg-white border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                    />
                    <p className="text-[10px] text-[#6B7280]">
                      Highlighted sub-heading under the page title.
                    </p>
                  </div>
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    URL Slug * (Access via nkshoes.in/pages/[slug])
                  </label>
                  <div className="flex items-center">
                    <span className="bg-[#E5E7EB] border border-r-0 border-[#D1D5DB] px-3 py-2 text-xs font-mono text-[#6B7280]">
                      nkshoes.in/pages/
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
                      placeholder="about"
                      className="flex-1 bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Short Summary (For Google SEO preview)
                  </label>
                  <input
                    type="text"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Short 1-2 line summary for search cards and social shares"
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                {/* Quick Content Inserters for Non-Technical Users */}
                <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Quick Add to Content:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `\n<div style="background-color: #f3f4f6; border-left: 4px solid #111111; padding: 16px; margin: 16px 0;">\n  <h4 style="margin: 0; font-weight: 800; color: #111111;">NK-SHOES JAMNAGAR RETAIL STORE</h4>\n  <p style="margin: 6px 0 0 0; font-size: 13px;">Ground Floor, Super Market Complex, Near Teen Batti, Jamnagar, Gujarat - 361001<br/>Timings: Mon-Sat 10:00 AM – 9:30 PM | Sun 11:00 AM – 8:00 PM<br/>Helpline: +91 97243 13238</p>\n</div>\n`;
                      setFormData((prev) => ({ ...prev, content: (prev.content || "") + snippet }));
                      toast.success("Added Jamnagar Store Address block!");
                    }}
                    className="px-2 py-1 bg-white border border-[#D1D5DB] hover:border-black text-[10px] font-bold text-[#111111] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    + Jamnagar Shop Address
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `\n<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; margin: 16px 0;">\n  <strong style="color: #991b1b;">IMPORTANT STORE NOTICE:</strong>\n  <p style="margin: 4px 0 0 0; font-size: 13px; color: #7f1d1d;">Write your important update or offer notice here for customers.</p>\n</div>\n`;
                      setFormData((prev) => ({ ...prev, content: (prev.content || "") + snippet }));
                      toast.success("Added Notice Box!");
                    }}
                    className="px-2 py-1 bg-white border border-[#D1D5DB] hover:border-black text-[10px] font-bold text-[#111111] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    + Notice / Alert Box
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `\n<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px; margin: 16px 0;">\n  <strong style="color: #166534;">WHATSAPP & PHONE SUPPORT:</strong>\n  <p style="margin: 4px 0 0 0; font-size: 13px; color: #14532d;">Call or WhatsApp our Jamnagar store team directly at <strong>+91 97243 13238</strong> or email <strong>support@nkshoes.in</strong>.</p>\n</div>\n`;
                      setFormData((prev) => ({ ...prev, content: (prev.content || "") + snippet }));
                      toast.success("Added WhatsApp & Phone Support Box!");
                    }}
                    className="px-2 py-1 bg-white border border-[#D1D5DB] hover:border-black text-[10px] font-bold text-[#111111] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    + WhatsApp & Phone Support
                  </button>
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Page Content & Body (Visual Editor)
                  </label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                    placeholder="Format headings, store details, policies, terms, and links with the toolbar above..."
                  />
                </div>

                {/* SEO Meta Fields */}
                <div className="border border-[#E5E7EB] p-3.5 bg-[#FAFAFA] space-y-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#111111]">
                    Search Engine Optimization (SEO for nkshoes.in)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Meta Title (Google Heading)
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        placeholder="e.g. About NK-SHOES | Best Shoes in Jamnagar & Online Store"
                        className="w-full bg-white border border-[#D1D5DB] text-xs text-[#111111] px-3 py-1.5 outline-none focus:border-black rounded-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Meta Description (Google Snippet)
                      </label>
                      <input
                        type="text"
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        placeholder="1-2 sentences summarizing page for Google search results"
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
                      Publish Immediately on Storefront (nkshoes.in)
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
            )}
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
