"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  RiSaveLine,
  RiRefreshLine,
  RiMegaphoneLine,
  RiCouponLine,
  RiTruckLine,
  RiMoneyDollarCircleLine,
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiCloseLine,
  RiMailLine,
  RiSendPlaneLine,
} from "react-icons/ri";
import {
  getAdminSettingByKey,
  updateAdminSetting,
  testAdminEmail,
} from "@/services/adminService";
import {
  StoreSettings,
  CouponDefinition,
  EMPTY_STORE_SETTINGS,
} from "@/types/settings";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(EMPTY_STORE_SETTINGS);
  const [emailSettings, setEmailSettings] = useState({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    email: "",
    password: "",
    fromName: "NK-SHOES",
    fromEmail: "",
  });
  const [testRecipient, setTestRecipient] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"announcement" | "coupons" | "shipping" | "payment" | "email">("announcement");

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponIndex, setEditingCouponIndex] = useState<number | null>(null);
  const [couponForm, setCouponForm] = useState<CouponDefinition>({
    code: "",
    discountPercent: 10,
    description: "",
    minOrderAmount: 999,
    tag: "SPECIAL",
  });

  // Delete Coupon State
  const [deleteCouponIndex, setDeleteCouponIndex] = useState<number | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [storeData, emailData] = await Promise.all([
        getAdminSettingByKey("store_settings"),
        getAdminSettingByKey("email"),
      ]);

      if (storeData && storeData.value) {
        setSettings({
          announcement: {
            ...EMPTY_STORE_SETTINGS.announcement,
            ...(storeData.value.announcement || {}),
          },
          shipping: {
            ...EMPTY_STORE_SETTINGS.shipping,
            ...(storeData.value.shipping || {}),
          },
          payment: {
            ...EMPTY_STORE_SETTINGS.payment,
            ...(storeData.value.payment || {}),
          },
          coupons: Array.isArray(storeData.value.coupons) ? storeData.value.coupons : [],
        });
      }

      if (emailData && emailData.value) {
        setEmailSettings({
          service: emailData.value.service || "gmail",
          host: emailData.value.host || "smtp.gmail.com",
          port: emailData.value.port || 465,
          secure: emailData.value.secure !== undefined ? emailData.value.secure : true,
          email: emailData.value.auth?.user || emailData.value.email || "",
          password: "",
          fromName: emailData.value.fromName || "NK-SHOES",
          fromEmail: emailData.value.fromEmail || emailData.value.auth?.user || "",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load store settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateAdminSetting("store_settings", settings),
        updateAdminSetting("email", emailSettings),
      ]);
      toast.success("All store and email configurations saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim()) {
      toast.error("Please enter a recipient email address");
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await testAdminEmail(testRecipient.trim());
      toast.success(res.message || `Test email sent to ${testRecipient}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Coupon Handlers
  const openAddCoupon = () => {
    setEditingCouponIndex(null);
    setCouponForm({
      code: "",
      discountPercent: 15,
      description: "15% off orders above ₹1,999",
      minOrderAmount: 1999,
      tag: "NEW DROP",
      isNewUserOnly: false,
    });
    setIsCouponModalOpen(true);
  };

  const openEditCoupon = (idx: number) => {
    setEditingCouponIndex(idx);
    setCouponForm({
      ...settings.coupons[idx],
      isNewUserOnly: Boolean(settings.coupons[idx].isNewUserOnly),
    });
    setIsCouponModalOpen(true);
  };

  const saveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    const cleanCoupon: CouponDefinition = {
      code: couponForm.code.trim().toUpperCase(),
      discountPercent: Number(couponForm.discountPercent),
      description: couponForm.description.trim(),
      minOrderAmount: Number(couponForm.minOrderAmount) || 0,
      tag: couponForm.tag?.trim().toUpperCase() || "PROMO",
      isNewUserOnly: Boolean(couponForm.isNewUserOnly),
    };

    const updatedCoupons = [...settings.coupons];
    if (editingCouponIndex !== null) {
      updatedCoupons[editingCouponIndex] = cleanCoupon;
    } else {
      updatedCoupons.push(cleanCoupon);
    }

    setSettings({ ...settings, coupons: updatedCoupons });
    setIsCouponModalOpen(false);
    toast.success(`Coupon "${cleanCoupon.code}" saved. Click "Save Settings" to persist.`);
  };

  const deleteCoupon = () => {
    if (deleteCouponIndex === null) return;
    const updatedCoupons = settings.coupons.filter((_, idx) => idx !== deleteCouponIndex);
    setSettings({ ...settings, coupons: updatedCoupons });
    setDeleteCouponIndex(null);
    toast.success("Coupon removed from list. Remember to Save Settings.");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin rounded-none" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#6B7280]">
          Loading store configurations...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none pb-16">
      {/* 1. TOP HEADER & SAVE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
            Store Operational Settings
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Configure announcement ticker, promo coupons, shipping rates, and COD restrictions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#374151] hover:border-black hover:text-black transition-colors rounded-none bg-white cursor-pointer"
          >
            <RiRefreshLine className="text-sm" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none cursor-pointer disabled:opacity-50"
          >
            <RiSaveLine className="text-sm" />
            <span>{isSaving ? "Saving..." : "Save All Settings"}</span>
          </button>
        </div>
      </div>

      {/* 2. TABS NAVIGATION (HORIZONTALLY SCROLLABLE ON MOBILE) */}
      <div className="flex items-center gap-1.5 border-b border-[#E5E7EB] bg-[#FAFAFA] p-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("announcement")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-none shrink-0 whitespace-nowrap ${
            activeTab === "announcement"
              ? "bg-[#111111] text-white shadow-2xs"
              : "text-[#6B7280] hover:text-[#111111]"
          }`}
        >
          <RiMegaphoneLine className="text-sm" />
          <span>Announcement Bar</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("coupons")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-none shrink-0 whitespace-nowrap ${
            activeTab === "coupons"
              ? "bg-[#111111] text-white shadow-2xs"
              : "text-[#6B7280] hover:text-[#111111]"
          }`}
        >
          <RiCouponLine className="text-sm" />
          <span>Promo Coupons ({settings.coupons.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("shipping")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-none shrink-0 whitespace-nowrap ${
            activeTab === "shipping"
              ? "bg-[#111111] text-white shadow-2xs"
              : "text-[#6B7280] hover:text-[#111111]"
          }`}
        >
          <RiTruckLine className="text-sm" />
          <span>Shipping Rates</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payment")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-none shrink-0 whitespace-nowrap ${
            activeTab === "payment"
              ? "bg-[#111111] text-white shadow-2xs"
              : "text-[#6B7280] hover:text-[#111111]"
          }`}
        >
          <RiMoneyDollarCircleLine className="text-sm" />
          <span>COD & Prepaid Rules</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-none shrink-0 whitespace-nowrap ${
            activeTab === "email"
              ? "bg-[#111111] text-white shadow-2xs"
              : "text-[#6B7280] hover:text-[#111111]"
          }`}
        >
          <RiMailLine className="text-sm" />
          <span>Email & SMTP</span>
        </button>
      </div>

      {/* 3. TAB PANELS */}

      {/* TAB A: ANNOUNCEMENT BAR */}
      {activeTab === "announcement" && (
        <div className="bg-white border border-[#E5E7EB] p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-[#111111]">
                Top Announcement Bar
              </h3>
              <p className="text-xs text-[#6B7280]">
                Renders ticker text, coupon code, and countdown at the highest header position
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcement.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: {
                      ...settings.announcement,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-black rounded-none"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                {settings.announcement.enabled ? "ACTIVE (ENABLED)" : "DISABLED"}
              </span>
            </label>
          </div>

          {/* AUTO-POPULATE FROM ACTIVE COUPONS */}
          {settings.coupons.length > 0 && (
            <div className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#111111]">
                Auto-Populate From Active Coupons
              </label>
              <select
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  if (!selectedCode) return;
                  const c = settings.coupons.find((item) => item.code === selectedCode);
                  if (c) {
                    setSettings({
                      ...settings,
                      announcement: {
                        ...settings.announcement,
                        couponCode: c.code,
                        badgeText: c.tag || "SPECIAL DROP",
                        desktopText: `${c.description || `${c.discountPercent}% OFF`}. Use code ${c.code} at checkout.`,
                        mobileText: `${c.discountPercent}% OFF with code ${c.code}`,
                        discountPercent: c.discountPercent,
                      },
                    });
                    toast.success(`Announcement populated with coupon "${c.code}"`);
                  }
                }}
                defaultValue=""
                className="w-full bg-white border border-[#D1D5DB] text-xs font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none cursor-pointer"
              >
                <option value="" disabled>-- Select a coupon to populate announcement --</option>
                {settings.coupons.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.discountPercent}% OFF ({c.description || (c.isNewUserOnly ? "New Users Only" : "Active")})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-[#6B7280]">
                Select an active coupon above to automatically populate the announcement banner text and code.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                Badge Text
              </label>
              <input
                type="text"
                value={settings.announcement.badgeText || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: {
                      ...settings.announcement,
                      badgeText: e.target.value,
                    },
                  })
                }
                placeholder="e.g. MEGA DROP"
                className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                Promo Coupon Code
              </label>
              <input
                type="text"
                value={settings.announcement.couponCode || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: {
                      ...settings.announcement,
                      couponCode: e.target.value.toUpperCase(),
                    },
                  })
                }
                placeholder="e.g. NKMEN15"
                className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none uppercase"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                Desktop Banner Text
              </label>
              <input
                type="text"
                value={settings.announcement.desktopText || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: {
                      ...settings.announcement,
                      desktopText: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Free Express Shipping on orders above ₹2,999. Use code NKMEN15 for 15% OFF."
                className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                Mobile Banner Text
              </label>
              <input
                type="text"
                value={settings.announcement.mobileText || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: {
                      ...settings.announcement,
                      mobileText: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Extra 15% OFF with code NKMEN15"
                className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
              />
            </div>

            {/* COUNTDOWN TIMER CONFIGURATION (Task 7) */}
            <div className="sm:col-span-2 p-4 border border-[#E5E7EB] bg-[#FAFAFA] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.announcement.showTimer ?? true}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        announcement: {
                          ...settings.announcement,
                          showTimer: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-black rounded-none"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                    Display Countdown Timer on Right
                  </span>
                </label>
                <p className="text-[11px] text-[#6B7280]">
                  Renders a live ticking days/hours/minutes countdown clock on the right side of the announcement bar.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Campaign Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={
                    settings.announcement.targetDate
                      ? new Date(new Date(settings.announcement.targetDate).getTime() - new Date().getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement: {
                        ...settings.announcement,
                        targetDate: e.target.value ? new Date(e.target.value).toISOString() : "",
                      },
                    })
                  }
                  className="w-full bg-white border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
                <span className="text-[10px] text-[#6B7280]">
                  Select the deadline for this promotional campaign or drop.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: PROMO COUPONS */}
      {activeTab === "coupons" && (
        <div className="bg-white border border-[#E5E7EB] p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-[#111111]">
                Active Store Promo Codes
              </h3>
              <p className="text-xs text-[#6B7280]">
                Customer checkout automatically validates discounts against these active rules
              </p>
            </div>
            <button
              type="button"
              onClick={openAddCoupon}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none cursor-pointer"
            >
              <RiAddLine className="text-sm" />
              <span>Add Coupon</span>
            </button>
          </div>

          {settings.coupons.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#D1D5DB]">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider font-mono">
                No active coupon codes created yet. Click "Add Coupon" above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#E5E7EB]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#111111] text-white font-mono uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="p-3">COUPON CODE</th>
                    <th className="p-3">DISCOUNT</th>
                    <th className="p-3">MIN ORDER</th>
                    <th className="p-3">DESCRIPTION</th>
                    <th className="p-3">TAG</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {settings.coupons.map((coupon, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="p-3 font-mono font-black text-sm text-[#111111]">
                        <div className="flex items-center gap-2">
                          <span>{coupon.code}</span>
                          {coupon.isNewUserOnly && (
                            <span className="px-1.5 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-[9px] font-black uppercase tracking-wider">
                              New Users Only
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#059669]">
                        {coupon.discountPercent}% OFF
                      </td>
                      <td className="p-3 font-mono text-[#374151]">
                        ₹{(coupon.minOrderAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-[#4B5563]">
                        {coupon.description || "—"}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[9px] uppercase tracking-wider font-bold bg-[#F3F4F6] text-[#374151] px-1.5 py-0.5">
                          {coupon.tag || "PROMO"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditCoupon(idx)}
                            className="p-1.5 bg-[#111111] text-white hover:bg-black transition-colors rounded-none cursor-pointer"
                          >
                            <RiEditLine className="text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCouponIndex(idx)}
                            className="p-1.5 border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors rounded-none cursor-pointer"
                          >
                            <RiDeleteBinLine className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB C: SHIPPING RATES */}
      {activeTab === "shipping" && (
        <div className="bg-white border border-[#E5E7EB] p-6 space-y-6">
          <div className="pb-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-black uppercase tracking-tight text-[#111111]">
              Logistics & Delivery Pricing
            </h3>
            <p className="text-xs text-[#6B7280]">
              Automate free shipping thresholds and packaging add-ons
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                value={settings.shipping.freeShippingThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: {
                      ...settings.shipping,
                      freeShippingThreshold: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
              />
              <span className="text-[10px] text-[#6B7280]">
                Orders equal or exceeding this qualify for Free Delivery
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                Standard Shipping Fee (₹)
              </label>
              <input
                type="number"
                value={settings.shipping.standardShippingFee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: {
                      ...settings.shipping,
                      standardShippingFee: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
              />
              <span className="text-[10px] text-[#6B7280]">
                Applied to orders below the free shipping threshold
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                Premium Gift Wrapping (₹)
              </label>
              <input
                type="number"
                value={settings.shipping.giftWrapFee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: {
                      ...settings.shipping,
                      giftWrapFee: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
              />
              <span className="text-[10px] text-[#6B7280]">
                Optional checkout box packaging charge
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB D: PAYMENT & COD RULES */}
      {activeTab === "payment" && (
        <div className="bg-white border border-[#E5E7EB] p-6 space-y-6">
          <div className="pb-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-black uppercase tracking-tight text-[#111111]">
              Payment Methods & Cash on Delivery (COD) Rules
            </h3>
            <p className="text-xs text-[#6B7280]">
              Protect against bogus orders with minimum and maximum COD thresholds
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Prepaid Rules & PhonePe Gateway */}
            <div className="space-y-4 border border-[#E5E7EB] p-4 bg-[#FAFAFA]">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                  Prepaid (PhonePe Gateway)
                </h4>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.payment.prepaidEnabled !== false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          prepaidEnabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-black rounded-none"
                  />
                  <span className="text-[11px] font-bold text-[#111111] uppercase">
                    {settings.payment.prepaidEnabled !== false ? "PREPAID ACTIVE" : "PREPAID DISABLED"}
                  </span>
                </label>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.payment.prepaidFreeShipping}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: {
                        ...settings.payment,
                        prepaidFreeShipping: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-black rounded-none"
                />
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  Always Offer Free Shipping on Prepaid Orders
                </span>
              </label>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Prepaid Instant Discount (%)
                </label>
                <input
                  type="number"
                  value={settings.payment.prepaidDiscountPercent || 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: {
                        ...settings.payment,
                        prepaidDiscountPercent: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-white border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
              </div>

              {/* PhonePe Live / Sandbox Gateway Config (Task 12) */}
              <div className="pt-3 border-t border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#111111]">
                    PhonePe API Configuration
                  </span>
                  <span
                    className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 border ${
                      (settings.payment.phonepeEnv || "SANDBOX") === "PRODUCTION"
                        ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
                        : "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]"
                    }`}
                  >
                    {settings.payment.phonepeEnv || "SANDBOX"} MODE
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Environment Mode
                  </label>
                  <select
                    value={settings.payment.phonepeEnv || "SANDBOX"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          phonepeEnv: e.target.value as "SANDBOX" | "PRODUCTION",
                        },
                      })
                    }
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none cursor-pointer"
                  >
                    <option value="SANDBOX">SANDBOX (Simulation & Test Transactions)</option>
                    <option value="PRODUCTION">PRODUCTION (Live Real Money Transactions)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Client / Merchant ID (MID)
                  </label>
                  <input
                    type="text"
                    value={settings.payment.phonepeClientId || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          phonepeClientId: e.target.value.trim(),
                        },
                      })
                    }
                    placeholder="e.g. M23J6356GMKLB_25101"
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Client Secret / Salt Key
                  </label>
                  <input
                    type="password"
                    value={settings.payment.phonepeClientSecret || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          phonepeClientSecret: e.target.value.trim(),
                        },
                      })
                    }
                    placeholder="Enter PhonePe secret key"
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                  <span className="text-[10px] text-[#6B7280]">
                    Your secret key is safely stored and encrypted in backend settings.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    API Client Version
                  </label>
                  <input
                    type="number"
                    value={settings.payment.phonepeClientVersion || 1}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          phonepeClientVersion: Number(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-1.5 outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>
            </div>

            {/* COD Rules */}
            <div className="space-y-4 border border-[#E5E7EB] p-4 bg-[#FAFAFA]">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                  Cash on Delivery (COD)
                </h4>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.payment.codEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          codEnabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-black rounded-none"
                  />
                  <span className="text-[11px] font-bold text-[#111111] uppercase">
                    {settings.payment.codEnabled ? "COD ACTIVE" : "COD DISABLED"}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    COD Handling Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.payment.codFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          codFee: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-2 py-1.5 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Free COD Above (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.payment.codFreeAbove || 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          codFreeAbove: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-2 py-1.5 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Min COD Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.payment.codMinAmount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          codMinAmount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-2 py-1.5 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Max COD Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.payment.codMaxAmount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          codMaxAmount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-2 py-1.5 outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB E: EMAIL & SMTP CONFIGURATION */}
      {activeTab === "email" && (
        <div className="bg-white border border-[#E5E7EB] p-6 space-y-6">
          <div className="pb-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-[#111111]">
                System Email & SMTP Notifications
              </h3>
              <p className="text-xs text-[#6B7280]">
                Configures order dispatch notifications, customer invoices, and OTP delivery
              </p>
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#ECFDF5] text-[#047857] px-2 py-0.5 border border-[#A7F3D0] w-max">
              SMTP Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* SMTP Server Credentials */}
            <div className="space-y-4 border border-[#E5E7EB] p-4 bg-[#FAFAFA]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] border-b border-[#E5E7EB] pb-2">
                SMTP Server Configuration
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Service Provider
                  </label>
                  <input
                    type="text"
                    value={emailSettings.service}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, service: e.target.value })
                    }
                    placeholder="gmail"
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={emailSettings.host}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, host: e.target.value })
                    }
                    placeholder="smtp.gmail.com"
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Port
                  </label>
                  <input
                    type="number"
                    value={emailSettings.port}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, port: Number(e.target.value) })
                    }
                    placeholder="465"
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    Secure (SSL/TLS)
                  </label>
                  <select
                    value={emailSettings.secure ? "true" : "false"}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, secure: e.target.value === "true" })
                    }
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  >
                    <option value="true">SSL Enabled (Port 465)</option>
                    <option value="false">TLS / STARTTLS (Port 587)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                  SMTP Email / Username
                </label>
                <input
                  type="email"
                  value={emailSettings.email}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, email: e.target.value })
                  }
                  placeholder="admin@nk-shoes.com"
                  className="w-full bg-white border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                  App Password / Secret
                </label>
                <input
                  type="password"
                  value={emailSettings.password}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, password: e.target.value })
                  }
                  placeholder="Enter new app password to update (or leave empty to preserve)"
                  className="w-full bg-white border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
                <span className="text-[10px] text-[#6B7280]">
                  For Gmail, generate a 16-character App Password under Google Account Security.
                </span>
              </div>
            </div>

            {/* Sender Identity & Test Email Console */}
            <div className="space-y-4">
              <div className="border border-[#E5E7EB] p-4 bg-[#FAFAFA] space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] border-b border-[#E5E7EB] pb-2">
                  Sender Identity
                </h4>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    From Display Name
                  </label>
                  <input
                    type="text"
                    value={emailSettings.fromName}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, fromName: e.target.value })
                    }
                    placeholder="NK-SHOES"
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#374151]">
                    From Sender Email
                  </label>
                  <input
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
                    }
                    placeholder="support@nk-shoes.com"
                    className="w-full bg-white border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>

              {/* Test Email Box */}
              <div className="border border-black p-4 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <RiSendPlaneLine className="text-base text-black" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                    Send Live SMTP Test Email
                  </h4>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Dispatches a live verification message through your configured SMTP credentials to ensure deliverability.
                </p>

                <form onSubmit={handleSendTestEmail} className="flex gap-2 pt-1">
                  <input
                    type="email"
                    required
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="recipient@example.com"
                    className="flex-1 bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                  <button
                    type="submit"
                    disabled={isSendingTest}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RiSendPlaneLine className="text-xs" />
                    <span>{isSendingTest ? "Sending..." : "Send Test"}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. COUPON ADD / EDIT MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-black w-full max-w-md shadow-2xl overflow-hidden rounded-none animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#111111] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest">
                {editingCouponIndex !== null ? "EDIT PROMO COUPON" : "ADD NEW PROMO COUPON"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>

            <form onSubmit={saveCoupon} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. SNEAKER20"
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
                    value={couponForm.discountPercent}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discountPercent: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.minOrderAmount}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        minOrderAmount: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Description
                </label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, description: e.target.value })
                  }
                  placeholder="e.g. 20% off on premium collection"
                  className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#374151]">
                  Badge Tag
                </label>
                <input
                  type="text"
                  value={couponForm.tag}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, tag: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. FLASH DROP"
                  className="w-full bg-[#FAFAFA] border border-[#D1D5DB] text-xs font-mono uppercase text-[#111111] px-3 py-2 outline-none focus:border-black rounded-none"
                />
              </div>

              {/* NEW CUSTOMER ONLY OPTION (Task 4) */}
              <label className="flex items-start gap-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(couponForm.isNewUserOnly)}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, isNewUserOnly: e.target.checked })
                  }
                  className="w-4 h-4 accent-black rounded-none mt-0.5"
                />
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider text-[#111111]">
                    New Customers Only
                  </span>
                  <span className="text-[10px] text-[#6B7280] leading-tight block mt-0.5">
                    Valid only for first-time shoppers (verified against 0 past completed orders in the system).
                  </span>
                </div>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#4B5563] hover:text-black hover:border-black transition-colors rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none cursor-pointer"
                >
                  Apply Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={deleteCouponIndex !== null}
        title="REMOVE COUPON CODE"
        message={`Are you sure you want to remove "${
          deleteCouponIndex !== null ? settings.coupons[deleteCouponIndex]?.code : ""
        }"? It will become invalid upon saving settings.`}
        confirmLabel="REMOVE COUPON"
        isDestructive={true}
        onConfirm={deleteCoupon}
        onCancel={() => setDeleteCouponIndex(null)}
      />
    </div>
  );
}
