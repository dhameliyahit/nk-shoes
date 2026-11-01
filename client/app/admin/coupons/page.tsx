"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  RiCouponLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiFileCopyLine,
  RiCloseLine,
  RiSaveLine,
  RiPercentLine,
} from "react-icons/ri";
import { DataTable, Column, FilterOption } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  getAdminSettingByKey,
  updateAdminSetting,
} from "@/services/adminService";
import {
  StoreSettings,
  CouponDefinition,
  EMPTY_STORE_SETTINGS,
} from "@/types/settings";

interface ExtendedCoupon extends CouponDefinition {
  _id?: string;
  id?: string;
}

export default function AdminCouponsPage() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(EMPTY_STORE_SETTINGS);
  const [coupons, setCoupons] = useState<ExtendedCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState<CouponDefinition>({
    code: "",
    discountPercent: 15,
    description: "",
    minOrderAmount: 1499,
    tag: "PROMO",
  });

  // Delete State
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminSettingByKey("store_settings");
      if (data && data.value) {
        setStoreSettings(data.value);
        const list: ExtendedCoupon[] = Array.isArray(data.value.coupons)
          ? data.value.coupons.map((c: CouponDefinition, idx: number) => ({
              ...c,
              _id: `coupon-${idx}-${c.code}`,
            }))
          : [];
        setCoupons(list);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const filteredCoupons = useMemo(() => {
    if (filterTab === "high") {
      return coupons.filter((c) => c.discountPercent >= 20);
    }
    if (filterTab === "zero_min") {
      return coupons.filter((c) => !c.minOrderAmount || c.minOrderAmount === 0);
    }
    return coupons;
  }, [coupons, filterTab]);

  const tabCounts = useMemo(() => {
    return {
      all: coupons.length,
      high: coupons.filter((c) => c.discountPercent >= 20).length,
      zero_min: coupons.filter((c) => !c.minOrderAmount || c.minOrderAmount === 0).length,
    };
  }, [coupons]);

  const filterOptions: FilterOption[] = [
    { label: "ALL COUPONS", value: "all", count: tabCounts.all },
    { label: "HIGH DISCOUNT (≥ 20%)", value: "high", count: tabCounts.high },
    { label: "NO MINIMUM ORDER", value: "zero_min", count: tabCounts.zero_min },
  ];

  const openCreateModal = () => {
    setEditingIndex(null);
    setFormData({
      code: "",
      discountPercent: 15,
      description: "15% OFF on orders above ₹1,499",
      minOrderAmount: 1499,
      tag: "SPECIAL",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    setEditingIndex(idx);
    setFormData({ ...coupons[idx] });
    setIsModalOpen(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied to clipboard`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    const cleanCoupon: CouponDefinition = {
      code: formData.code.trim().toUpperCase(),
      discountPercent: Number(formData.discountPercent),
      description: formData.description.trim(),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      tag: formData.tag?.trim().toUpperCase() || "PROMO",
    };

    setIsSubmitting(true);
    try {
      const updatedCoupons = [...coupons];
      if (editingIndex !== null) {
        updatedCoupons[editingIndex] = {
          ...cleanCoupon,
          _id: updatedCoupons[editingIndex]._id,
        };
      } else {
        updatedCoupons.push({
          ...cleanCoupon,
          _id: `coupon-${Date.now()}-${cleanCoupon.code}`,
        });
      }

      // Persist to store_settings
      const updatedStoreSettings: StoreSettings = {
        ...storeSettings,
        coupons: updatedCoupons.map(({ _id, id, ...rest }) => rest),
      };

      await updateAdminSetting("store_settings", updatedStoreSettings);
      setStoreSettings(updatedStoreSettings);
      setCoupons(updatedCoupons);
      setIsModalOpen(false);
      toast.success(
        `Coupon "${cleanCoupon.code}" ${editingIndex !== null ? "updated" : "created"} successfully`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to save coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteIndex === null) return;
    setIsDeleting(true);
    try {
      const targetCoupon = coupons[deleteIndex];
      const updatedCoupons = coupons.filter((_, idx) => idx !== deleteIndex);

      const updatedStoreSettings: StoreSettings = {
        ...storeSettings,
        coupons: updatedCoupons.map(({ _id, id, ...rest }) => rest),
      };

      await updateAdminSetting("store_settings", updatedStoreSettings);
      setStoreSettings(updatedStoreSettings);
      setCoupons(updatedCoupons);
      setDeleteIndex(null);
      toast.success(`Coupon "${targetCoupon.code}" removed successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<ExtendedCoupon>[] = [
    {
      header: "COUPON CODE",
      className: "min-w-[200px]",
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-sm text-[#111111] uppercase tracking-wider bg-[#F3F4F6] px-2.5 py-1 border border-[#D1D5DB]">
            {item.code}
          </span>
          <button
            type="button"
            onClick={() => handleCopyCode(item.code)}
            title="Copy Code"
            className="p-1 text-[#6B7280] hover:text-black transition-colors cursor-pointer"
          >
            <RiFileCopyLine className="text-sm" />
          </button>
        </div>
      ),
    },
    {
      header: "DISCOUNT VALUE",
      render: (item) => (
        <span className="font-mono text-xs font-black text-[#059669] flex items-center gap-0.5">
          <RiPercentLine className="text-xs" />
          <span>{item.discountPercent}% OFF</span>
        </span>
      ),
    },
    {
      header: "MINIMUM ORDER",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[#111111]">
          {item.minOrderAmount && item.minOrderAmount > 0
            ? `₹${item.minOrderAmount.toLocaleString("en-IN")}`
            : "No Minimum"}
        </span>
      ),
    },
    {
      header: "TERMS / DESCRIPTION",
      className: "max-w-xs",
      render: (item) => (
        <span className="text-xs text-[#4B5563] line-clamp-1">
          {item.description || "—"}
        </span>
      ),
    },
    {
      header: "TAG",
      render: (item) => (
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-[#111111] text-white px-2 py-0.5">
          {item.tag || "PROMO"}
        </span>
      ),
    },
    {
      header: "ACTIONS",
      className: "text-right",
      render: (item) => {
        const itemIdx = coupons.findIndex((c) => c.code === item.code);
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => openEditModal(itemIdx)}
              title="Edit Coupon"
              className="p-1.5 bg-[#111111] text-white hover:bg-black transition-colors rounded-none cursor-pointer"
            >
              <RiEditLine className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteIndex(itemIdx)}
              title="Delete Coupon"
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
            Promo Coupons & Discounts
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Create promotional discount codes with custom order minimums and percentage deductions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCoupons}
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
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable<ExtendedCoupon>
        data={filteredCoupons}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search coupons by code, description, or tag..."
        searchFilter={(item, q) =>
          Boolean(
            item.code.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            (item.tag && item.tag.toLowerCase().includes(q))
          )
        }
        filterOptions={filterOptions}
        filterValue={filterTab}
        onFilterChange={setFilterTab}
        pageSize={15}
        emptyMessage="No promo coupons found matching filter criteria."
      />

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-black w-full max-w-md shadow-2xl overflow-hidden rounded-none animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#111111] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiCouponLine className="text-lg text-[#E53E3E]" />
                <h3 className="text-xs font-black uppercase tracking-widest">
                  {editingIndex !== null ? "EDIT PROMO COUPON" : "CREATE NEW PROMO COUPON"}
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

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. SNEAKER25"
                  className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono font-bold uppercase text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Discount % *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={formData.discountPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPercent: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderAmount: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Description / Offer Terms
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g. 25% OFF on marathon performance line"
                  className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Badge Tag
                </label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. FLASH DROP"
                  className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono uppercase text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
              </div>

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
                  <span>{isSubmitting ? "Saving..." : "Save Coupon"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={deleteIndex !== null}
        title="DELETE PROMO COUPON"
        message={`Are you sure you want to permanently delete coupon "${
          deleteIndex !== null ? coupons[deleteIndex]?.code : ""
        }"? Customers will no longer be able to apply this code during checkout.`}
        confirmLabel="DELETE COUPON"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}
