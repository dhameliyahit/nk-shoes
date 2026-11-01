"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  RiUser3Line,
  RiShoppingBag3Line,
  RiMapPinLine,
  RiHeartLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiCloseLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiAddLine,
  RiArrowRightLine,
  RiLogoutBoxRLine,
  RiFileCopyLine,
  RiShieldUserLine,
  RiAlertLine,
  RiCheckboxCircleFill,
  RiExternalLinkLine,
} from "react-icons/ri";
import { useAuth } from "@/context/auth-context";
import { getCustomerOrders, cancelCustomerOrder } from "@/services/orderService";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils";

type ActiveTab = "profile" | "orders" | "addresses";

interface OrderItem {
  product?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface CustomerOrder {
  _id: string;
  orderNumber?: string;
  createdAt: string;
  orderItems: OrderItem[];
  shippingAddress: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    address?: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  isPaid?: boolean;
  paidAt?: string;
  orderStatus: "processing" | "confirmed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  itemsPrice: number;
  shippingPrice: number;
  discountAmount?: number;
  totalPrice: number;
  trackingNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  cancelReason?: string;
}

export function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    isLoggedIn,
    isHydrated,
    token,
    logout,
    updateProfile,
    addAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();

  // Tab State: default to tab param if present
  const initialTab = (searchParams.get("tab") as ActiveTab) || "profile";
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialTab === "orders" ? "orders" : "profile"
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync tab with query params
  useEffect(() => {
    const tabParam = searchParams.get("tab") as ActiveTab;
    if (tabParam === "orders" || tabParam === "profile" || tabParam === "addresses") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}`, { scroll: false });
  };

  // Profile Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync form with user
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // Address Modal / Form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  // Delete Address state
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("ALL");

  // Order Cancellation State
  const [orderToCancel, setOrderToCancel] = useState<CustomerOrder | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [cancelNotesInput, setCancelNotesInput] = useState("");
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load customer orders
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const data = await getCustomerOrders(token);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setOrdersError(err.message || "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchOrders();
    }
  }, [isLoggedIn, token, fetchOrders]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMessage({ type: "error", text: "Full name is required." });
      return;
    }
    setIsUpdatingProfile(true);
    setProfileMessage(null);
    try {
      const payload: { name: string; phone?: string; password?: string } = {
        name: name.trim(),
        phone: phone.trim(),
      };
      if (newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        payload.password = newPassword.trim();
      }
      await updateProfile(payload);
      setNewPassword("");
      setProfileMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Could not update profile." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Add Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");

    if (!addressForm.fullName.trim() || !addressForm.phone.trim() || !addressForm.addressLine1.trim()) {
      setAddressError("Please complete all required address fields.");
      return;
    }
    if (!addressForm.city.trim() || !addressForm.state.trim() || !addressForm.pincode.trim()) {
      setAddressError("City, State, and PIN Code are required.");
      return;
    }
    const cleanPin = addressForm.pincode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setAddressError("PIN Code must be a 6-digit number.");
      return;
    }

    setIsSavingAddress(true);
    try {
      await addAddress({
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        addressLine1: addressForm.addressLine1.trim(),
        addressLine2: addressForm.addressLine2.trim() || undefined,
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: cleanPin,
        isDefault: addressForm.isDefault,
      });
      setShowAddressForm(false);
      setAddressForm({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false,
      });
    } catch (err: any) {
      setAddressError(err.message || "Failed to save address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Handle Delete Address
  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    setIsDeletingAddress(true);
    try {
      await deleteAddress(addressToDelete);
      setAddressToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete address");
    } finally {
      setIsDeletingAddress(false);
    }
  };

  // Handle Set Default Address
  const handleSetDefault = async (addrId: string) => {
    try {
      await setDefaultAddress(addrId);
    } catch (err: any) {
      alert(err.message || "Failed to update default address");
    }
  };

  // Handle Order Cancellation
  const confirmCancelOrder = async () => {
    if (!orderToCancel || !token) return;
    setIsCancellingOrder(true);
    try {
      await cancelCustomerOrder(
        orderToCancel._id,
        cancelReasonInput.trim() || "Customer requested cancellation",
        cancelNotesInput.trim() || undefined,
        token
      );
      await fetchOrders();
      setOrderToCancel(null);
      setCancelReasonInput("");
      setCancelNotesInput("");
    } catch (err: any) {
      alert(err.message || "Failed to cancel order");
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // If hydrating or not logged in
  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F9F9F9] px-4 py-16">
        <div className="max-w-md w-full bg-white border border-[#E5E5E5] p-8 text-center rounded-none shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F5F5] flex items-center justify-center text-[#111111]">
            <RiUser3Line className="text-3xl" />
          </div>
          <h1
            className="text-2xl font-black uppercase tracking-tight text-[#111111]"
            style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
          >
            CUSTOMER DOSSIER & ORDERS
          </h1>
          <p className="text-sm text-[#666666] mt-2 mb-6">
            Please log in with your NK-SHOES account to manage your profile information, saved addresses, and track footwear orders.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="flex-1 bg-[#111111] text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-black transition-colors rounded-none text-center"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex-1 border border-[#111111] text-[#111111] py-3 text-xs font-black uppercase tracking-widest hover:bg-[#F5F5F5] transition-colors rounded-none text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (orderFilter === "ALL") return true;
    if (orderFilter === "PROCESSING") return order.orderStatus === "processing" || order.orderStatus === "confirmed";
    if (orderFilter === "SHIPPED") return order.orderStatus === "shipped" || order.orderStatus === "out_for_delivery";
    if (orderFilter === "DELIVERED") return order.orderStatus === "delivered";
    if (orderFilter === "CANCELLED") return order.orderStatus === "cancelled";
    return true;
  });

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "NK";

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#111111]">
      {/* Top Banner Breadcrumb */}
      <div className="border-b border-[#E5E5E5] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#767677]">
            <Link href="/" className="hover:text-[#111111] transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#111111] font-bold">My Account</span>
          </div>
          <span className="text-xs font-mono text-[#767677] uppercase hidden sm:inline-block">
            Member Since: {user.createdAt ? new Date(user.createdAt).getFullYear() : "2026"}
          </span>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111]"
            style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
          >
            CUSTOMER DOSSIER & ORDERS
          </h1>
          <p className="text-sm text-[#767677] mt-1">
            Manage your personal credentials, dispatch addresses, and track real-time delivery status.
          </p>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================
              LEFT COLUMN: BUTTON GROUP SIDEBAR NAVIGATION
              Sharp rectangular geometry, pure Adidas YARN styling
              ========================================================= */}
          <aside className="lg:col-span-4 xl:col-span-3">
            {/* User Profile Card Summary */}
            <div className="bg-white border border-[#E5E5E5] p-5 mb-4 rounded-none">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-[#111111] text-white flex items-center justify-center text-lg font-black tracking-wider rounded-none shrink-0">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-[#111111] truncate uppercase">
                      {user.name}
                    </h2>
                    <RiShieldCheckLine
                      className="text-[#10B981] shrink-0 text-base"
                      title="Verified NK Account"
                    />
                  </div>
                  <p className="text-xs text-[#767677] truncate font-mono">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Sharp ButtonGroup Navigation */}
            <nav
              className="bg-white border border-[#E5E5E5] flex flex-col rounded-none divide-y divide-[#E5E5E5]"
              aria-label="Profile navigation"
            >
              {/* Button: Profile Info */}
              <button
                type="button"
                onClick={() => handleTabChange("profile")}
                className={cn(
                  "w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-none",
                  activeTab === "profile"
                    ? "bg-[#111111] text-white border-l-4 border-black"
                    : "text-[#111111] hover:bg-[#F5F5F5]"
                )}
              >
                <div className="flex items-center gap-3">
                  <RiUser3Line className="text-base shrink-0" />
                  <span>Profile Information</span>
                </div>
                <RiArrowRightLine
                  className={cn(
                    "text-sm transition-transform",
                    activeTab === "profile" ? "translate-x-1 text-white" : "text-[#767677]"
                  )}
                />
              </button>

              {/* Button: Orders & Tracking */}
              <button
                type="button"
                onClick={() => handleTabChange("orders")}
                className={cn(
                  "w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-none",
                  activeTab === "orders"
                    ? "bg-[#111111] text-white border-l-4 border-black"
                    : "text-[#111111] hover:bg-[#F5F5F5]"
                )}
              >
                <div className="flex items-center gap-3">
                  <RiShoppingBag3Line className="text-base shrink-0" />
                  <span>My Orders & Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  {orders.length > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-none",
                        activeTab === "orders"
                          ? "bg-white text-[#111111]"
                          : "bg-[#111111] text-white"
                      )}
                    >
                      {orders.length}
                    </span>
                  )}
                  <RiArrowRightLine
                    className={cn(
                      "text-sm transition-transform",
                      activeTab === "orders" ? "translate-x-1 text-white" : "text-[#767677]"
                    )}
                  />
                </div>
              </button>

              {/* Button: Saved Addresses */}
              <button
                type="button"
                onClick={() => handleTabChange("addresses")}
                className={cn(
                  "w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-none",
                  activeTab === "addresses"
                    ? "bg-[#111111] text-white border-l-4 border-black"
                    : "text-[#111111] hover:bg-[#F5F5F5]"
                )}
              >
                <div className="flex items-center gap-3">
                  <RiMapPinLine className="text-base shrink-0" />
                  <span>Saved Addresses</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-none",
                      activeTab === "addresses"
                        ? "bg-white text-[#111111]"
                        : "bg-[#F5F5F5] text-[#111111]"
                    )}
                  >
                    {user.addresses?.length || 0}
                  </span>
                  <RiArrowRightLine
                    className={cn(
                      "text-sm transition-transform",
                      activeTab === "addresses" ? "translate-x-1 text-white" : "text-[#767677]"
                    )}
                  />
                </div>
              </button>

              {/* Wishlist Link */}
              <Link
                href="/wishlist"
                className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#111111] hover:bg-[#F5F5F5] transition-all cursor-pointer rounded-none"
              >
                <div className="flex items-center gap-3">
                  <RiHeartLine className="text-base shrink-0" />
                  <span>Footwear Wishlist</span>
                </div>
                <RiArrowRightLine className="text-sm text-[#767677]" />
              </Link>

              {/* Admin Link if role is admin */}
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#080808] bg-[#F5F5F5] hover:bg-[#EAEAEA] transition-all cursor-pointer rounded-none"
                >
                  <div className="flex items-center gap-3">
                    <RiShieldUserLine className="text-base shrink-0 text-[#111111]" />
                    <span>Admin Control Console</span>
                  </div>
                  <span className="text-[9px] bg-[#111111] text-white px-1.5 py-0.5 font-bold uppercase">
                    Admin
                  </span>
                </Link>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => logout()}
                className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#E53E3E] hover:bg-[#FEF2F2] transition-all cursor-pointer rounded-none"
              >
                <div className="flex items-center gap-3">
                  <RiLogoutBoxRLine className="text-base shrink-0" />
                  <span>Log Out</span>
                </div>
              </button>
            </nav>
          </aside>

          {/* =========================================================
              RIGHT COLUMN: ACTIVE TAB CONTENT AREA
              ========================================================= */}
          <main className="lg:col-span-8 xl:col-span-9">
            {/* -------------------------------------------------------
                TAB 1: PROFILE INFORMATION & PERSONAL DETAILS
                ------------------------------------------------------- */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                {/* Profile Overview Card */}
                <div className="bg-white border border-[#E5E5E5] p-6 sm:p-8 rounded-none">
                  <div className="flex items-center justify-between pb-6 border-b border-[#E5E5E5]">
                    <div>
                      <h2
                        className="text-2xl font-black uppercase tracking-tight text-[#111111]"
                        style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
                      >
                        PERSONAL INFORMATION
                      </h2>
                      <p className="text-xs text-[#767677] mt-0.5">
                        Update your athlete details and security credentials.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      <RiShieldCheckLine />
                      Verified
                    </span>
                  </div>

                  {/* Feedback Message */}
                  {profileMessage && (
                    <div
                      className={cn(
                        "mt-6 p-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2",
                        profileMessage.type === "success"
                          ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                          : "bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]"
                      )}
                    >
                      {profileMessage.type === "success" ? (
                        <RiCheckboxCircleFill className="text-base shrink-0" />
                      ) : (
                        <RiAlertLine className="text-base shrink-0" />
                      )}
                      <span>{profileMessage.text}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-11 px-3.5 bg-white border border-[#CCCCCC] focus:border-[#111111] focus:ring-0 text-sm font-medium rounded-none outline-none transition-colors"
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-2">
                          Mobile Phone (10 digits)
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          maxLength={10}
                          className="w-full h-11 px-3.5 bg-white border border-[#CCCCCC] focus:border-[#111111] focus:ring-0 text-sm font-medium rounded-none outline-none transition-colors font-mono"
                          placeholder="e.g. 9876543210"
                        />
                      </div>

                      {/* Email (Read-only) */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#767677] mb-2">
                          Email Address (Verified)
                        </label>
                        <input
                          type="email"
                          disabled
                          value={user.email}
                          className="w-full h-11 px-3.5 bg-[#F5F5F5] border border-[#E5E5E5] text-sm font-medium text-[#666666] cursor-not-allowed rounded-none font-mono"
                        />
                        <p className="text-[11px] text-[#888888] mt-1">
                          Primary identity email cannot be altered directly.
                        </p>
                      </div>

                      {/* New Password (Optional) */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-2">
                          Change Password (Optional)
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Leave blank to keep unchanged"
                          className="w-full h-11 px-3.5 bg-white border border-[#CCCCCC] focus:border-[#111111] focus:ring-0 text-sm font-medium rounded-none outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E5E5E5] flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="bg-[#111111] text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors rounded-none cursor-pointer flex items-center gap-2"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <span>Save Profile Changes</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Quick Saved Addresses Teaser */}
                <div className="bg-white border border-[#E5E5E5] p-6 rounded-none">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-xl font-black uppercase tracking-tight text-[#111111]"
                        style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
                      >
                        SAVED DELIVERY ADDRESSES ({user.addresses?.length || 0})
                      </h3>
                      <p className="text-xs text-[#767677]">
                        Fast 1-click checkout destinations for your footwear orders.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange("addresses")}
                      className="text-xs font-black uppercase tracking-wider text-[#111111] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage All</span>
                      <RiArrowRightLine />
                    </button>
                  </div>

                  {user.addresses && user.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {user.addresses.slice(0, 2).map((addr, idx) => (
                        <div
                          key={addr._id || idx}
                          className="border border-[#E5E5E5] p-4 bg-[#FAFAFA] text-xs space-y-1 relative"
                        >
                          {addr.isDefault && (
                            <span className="absolute top-3 right-3 bg-[#111111] text-white text-[9px] font-black uppercase px-1.5 py-0.5">
                              DEFAULT
                            </span>
                          )}
                          <p className="font-bold text-sm text-[#111111]">{addr.fullName}</p>
                          <p className="text-[#666666]">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className="text-[#666666]">{addr.addressLine2}</p>}
                          <p className="text-[#666666]">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="font-mono text-[#111111] pt-1">Phone: {addr.phone}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-[#CCCCCC] bg-[#FAFAFA]">
                      <p className="text-xs text-[#767677]">No saved addresses yet.</p>
                      <button
                        type="button"
                        onClick={() => {
                          handleTabChange("addresses");
                          setShowAddressForm(true);
                        }}
                        className="mt-2 text-xs font-bold uppercase tracking-wider text-[#111111] hover:underline cursor-pointer"
                      >
                        + Add Your First Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------
                TAB 2: CUSTOMER ORDERS & TRACKING MODULE
                High density order cards, status badges, tracking details, items list
                ------------------------------------------------------- */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                {/* Orders Header & Filter Tabs */}
                <div className="bg-white border border-[#E5E5E5] p-6 rounded-none">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
                    <div>
                      <h2
                        className="text-2xl font-black uppercase tracking-tight text-[#111111]"
                        style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
                      >
                        MY ORDERS & LOGISTICS TRACKING
                      </h2>
                      <p className="text-xs text-[#767677] mt-0.5">
                        Track live package status, view shipment numbers, and review invoices.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchOrders}
                      className="text-xs font-bold uppercase tracking-wider text-[#111111] hover:underline cursor-pointer self-start sm:self-auto"
                    >
                      ↻ Refresh Status
                    </button>
                  </div>

                  {/* Filter Sub-Tabs */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {[
                      { key: "ALL", label: "All Orders", count: orders.length },
                      {
                        key: "PROCESSING",
                        label: "Processing",
                        count: orders.filter((o) => o.orderStatus === "processing" || o.orderStatus === "confirmed").length,
                      },
                      {
                        key: "SHIPPED",
                        label: "Shipped / In Transit",
                        count: orders.filter((o) => o.orderStatus === "shipped" || o.orderStatus === "out_for_delivery").length,
                      },
                      {
                        key: "DELIVERED",
                        label: "Delivered",
                        count: orders.filter((o) => o.orderStatus === "delivered").length,
                      },
                      {
                        key: "CANCELLED",
                        label: "Cancelled",
                        count: orders.filter((o) => o.orderStatus === "cancelled").length,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setOrderFilter(tab.key)}
                        className={cn(
                          "px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-none cursor-pointer flex items-center gap-1.5",
                          orderFilter === tab.key
                            ? "bg-[#111111] text-white"
                            : "bg-[#F5F5F5] text-[#555555] hover:bg-[#EBEBEB] hover:text-[#111111]"
                        )}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-none",
                            orderFilter === tab.key ? "bg-white/20 text-white" : "bg-white text-[#767677]"
                          )}
                        >
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders Content */}
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white border border-[#E5E5E5] p-6 animate-pulse space-y-4">
                        <div className="h-6 bg-[#F5F5F5] w-1/3" />
                        <div className="h-20 bg-[#F5F5F5] w-full" />
                        <div className="h-6 bg-[#F5F5F5] w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : ordersError ? (
                  <div className="bg-[#FEF2F2] border border-[#FECACA] p-6 text-center text-xs font-bold uppercase text-[#991B1B]">
                    {ordersError}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-white border border-[#E5E5E5] p-12 text-center rounded-none">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F5F5] flex items-center justify-center text-[#767677]">
                      <RiShoppingBag3Line className="text-3xl" />
                    </div>
                    <h3
                      className="text-2xl font-black uppercase tracking-tight text-[#111111]"
                      style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
                    >
                      NO ORDERS FOUND
                    </h3>
                    <p className="text-xs text-[#767677] mt-1 mb-6 max-w-sm mx-auto">
                      {orderFilter === "ALL"
                        ? "You haven't placed any footwear orders yet. Start exploring our latest drops and performance sneakers."
                        : `No orders matching filter "${orderFilter}".`}
                    </p>
                    <Link
                      href="/products"
                      className="inline-block bg-[#111111] text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest hover:bg-black transition-colors rounded-none"
                    >
                      Shop All Footwear
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredOrders.map((order) => {
                      const orderRef = order.orderNumber || `#NK-${order._id.slice(-8).toUpperCase()}`;
                      const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      const isCancellable = order.orderStatus === "processing" || order.orderStatus === "confirmed";

                      return (
                        <div
                          key={order._id}
                          className="bg-white border border-[#E5E5E5] rounded-none overflow-hidden transition-shadow hover:shadow-md"
                        >
                          {/* Order Card Header */}
                          <div className="bg-[#FAFAFA] border-b border-[#E5E5E5] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                              <div>
                                <span className="text-[#767677] uppercase text-[10px] block">Order Ref</span>
                                <span className="font-mono font-bold text-[#111111]">{orderRef}</span>
                              </div>
                              <div>
                                <span className="text-[#767677] uppercase text-[10px] block">Placed On</span>
                                <span className="font-bold text-[#111111]">{orderDate}</span>
                              </div>
                              <div>
                                <span className="text-[#767677] uppercase text-[10px] block">Total Amount</span>
                                <span className="font-bold text-[#111111]">
                                  ₹{order.totalPrice?.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#767677] uppercase text-[10px] block">Payment</span>
                                <span className="font-bold uppercase text-[#111111]">
                                  {order.paymentMethod === "cod" ? "Cash On Delivery" : "Online / PhonePe"}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                              {order.orderStatus === "processing" && (
                                <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[11px] font-black uppercase tracking-wider px-2.5 py-1">
                                  Processing
                                </span>
                              )}
                              {order.orderStatus === "confirmed" && (
                                <span className="bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] text-[11px] font-black uppercase tracking-wider px-2.5 py-1">
                                  Confirmed
                                </span>
                              )}
                              {order.orderStatus === "shipped" && (
                                <span className="bg-[#E0E7FF] text-[#3730A3] border border-[#C7D2FE] text-[11px] font-black uppercase tracking-wider px-2.5 py-1 flex items-center gap-1">
                                  <RiTruckLine /> Dispatched / Shipped
                                </span>
                              )}
                              {order.orderStatus === "out_for_delivery" && (
                                <span className="bg-[#CFFAFE] text-[#155E75] border border-[#A5F3FC] text-[11px] font-black uppercase tracking-wider px-2.5 py-1 flex items-center gap-1">
                                  <RiTruckLine /> Out For Delivery
                                </span>
                              )}
                              {order.orderStatus === "delivered" && (
                                <span className="bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] text-[11px] font-black uppercase tracking-wider px-2.5 py-1 flex items-center gap-1">
                                  <RiCheckLine /> Delivered
                                </span>
                              )}
                              {order.orderStatus === "cancelled" && (
                                <span className="bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] text-[11px] font-black uppercase tracking-wider px-2.5 py-1">
                                  Cancelled
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Logistics / Tracking Banner (if shipped/tracking exists) */}
                          {(order.trackingNumber || order.courierName) && (
                            <div className="bg-[#F0FDF4] border-b border-[#DCFCE7] px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 text-[#166534]">
                                <RiTruckLine className="text-base" />
                                <span>
                                  Courier: <strong>{order.courierName || "Express Courier"}</strong>
                                </span>
                                {order.trackingNumber && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      AWB Tracking:{" "}
                                      <strong className="font-mono">{order.trackingNumber}</strong>
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {order.trackingNumber && (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(order.trackingNumber!, order._id)}
                                    className="bg-white border border-[#BBF7D0] px-2 py-1 text-[11px] font-bold text-[#166534] hover:bg-[#DCFCE7] cursor-pointer flex items-center gap-1"
                                  >
                                    <RiFileCopyLine />
                                    <span>{copiedId === order._id ? "Copied!" : "Copy AWB"}</span>
                                  </button>
                                )}
                                {order.trackingUrl && (
                                  <a
                                    href={order.trackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-[#166534] text-white px-2.5 py-1 text-[11px] font-bold hover:bg-[#14532D] flex items-center gap-1"
                                  >
                                    <span>Track Live</span>
                                    <RiExternalLinkLine />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Cancellation Banner (if cancelled) */}
                          {order.orderStatus === "cancelled" && order.cancelReason && (
                            <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-6 py-2.5 text-xs text-[#991B1B] font-semibold flex items-center gap-2">
                              <RiAlertLine className="shrink-0" />
                              <span>Reason: {order.cancelReason}</span>
                            </div>
                          )}

                          {/* Order Items List */}
                          <div className="p-6 divide-y divide-[#F0F0F0]">
                            {order.orderItems?.map((item, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                                  idx > 0 && "pt-4"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="relative w-16 h-16 bg-[#F5F5F5] border border-[#E5E5E5] shrink-0 flex items-center justify-center">
                                    {item.image ? (
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <RiShoppingBag3Line className="text-[#AAAAAA] text-2xl" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold uppercase text-[#111111]">
                                      {item.name}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#767677]">
                                      {item.size && (
                                        <span className="bg-[#F5F5F5] text-[#111111] px-1.5 py-0.5 font-bold uppercase text-[10px]">
                                          Size: {item.size}
                                        </span>
                                      )}
                                      {item.color && (
                                        <span className="bg-[#F5F5F5] text-[#111111] px-1.5 py-0.5 font-bold uppercase text-[10px]">
                                          {item.color}
                                        </span>
                                      )}
                                      <span>Qty: {item.quantity}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right sm:text-right font-bold text-sm text-[#111111]">
                                  ₹{item.price?.toLocaleString("en-IN")}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Delivery Address & Summary Footer */}
                          <div className="bg-[#FAFAFA] border-t border-[#E5E5E5] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                            <div className="text-[#666666] max-w-md">
                              <span className="font-bold text-[#111111] uppercase block mb-0.5">
                                Delivery Destination:
                              </span>
                              <p>
                                {order.shippingAddress?.fullName} • {order.shippingAddress?.addressLine1 || order.shippingAddress?.address},{" "}
                                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                                {order.shippingAddress?.pincode}
                              </p>
                              {order.shippingAddress?.phone && (
                                <p className="font-mono mt-0.5">Phone: {order.shippingAddress.phone}</p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 self-end md:self-auto">
                              {isCancellable && (
                                <button
                                  type="button"
                                  onClick={() => setOrderToCancel(order)}
                                  className="border border-[#E53E3E] text-[#E53E3E] px-4 py-2 font-bold uppercase tracking-wider text-xs hover:bg-[#FEF2F2] transition-colors rounded-none cursor-pointer"
                                >
                                  Cancel Order
                                </button>
                              )}
                              <Link
                                href="/products"
                                className="bg-[#111111] text-white px-5 py-2 font-bold uppercase tracking-wider text-xs hover:bg-black transition-colors rounded-none"
                              >
                                Buy Again / Browse
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------
                TAB 3: SAVED ADDRESSES MANAGEMENT MODULE
                ------------------------------------------------------- */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="bg-white border border-[#E5E5E5] p-6 sm:p-8 rounded-none">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
                    <div>
                      <h2
                        className="text-2xl font-black uppercase tracking-tight text-[#111111]"
                        style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
                      >
                        SAVED DELIVERY ADDRESSES
                      </h2>
                      <p className="text-xs text-[#767677] mt-0.5">
                        Manage your shipping destinations for instant 1-click checkout.
                      </p>
                    </div>
                    {!showAddressForm && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="bg-[#111111] text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-black transition-colors rounded-none cursor-pointer flex items-center gap-2 self-start sm:self-auto"
                      >
                        <RiAddLine className="text-base" />
                        <span>Add New Address</span>
                      </button>
                    )}
                  </div>

                  {/* Add Address Form Accordion / Form */}
                  {showAddressForm && (
                    <div className="my-6 p-6 bg-[#FAFAFA] border border-[#CCCCCC] rounded-none">
                      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E5E5E5]">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#111111]">
                          Enter Delivery Address Details
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="text-[#767677] hover:text-[#111111] p-1 cursor-pointer"
                        >
                          <RiCloseLine className="text-xl" />
                        </button>
                      </div>

                      {addressError && (
                        <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold uppercase text-[#991B1B]">
                          {addressError}
                        </div>
                      )}

                      <form onSubmit={handleSaveAddress} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                              Recipient Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={addressForm.fullName}
                              onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                              placeholder="e.g. Rahul Sharma"
                              className="w-full h-10 px-3 bg-white border border-[#CCCCCC] focus:border-[#111111] text-xs font-medium rounded-none outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                              10-Digit Mobile Phone *
                            </label>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                              placeholder="9876543210"
                              className="w-full h-10 px-3 bg-white border border-[#CCCCCC] focus:border-[#111111] text-xs font-medium rounded-none outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                            Address Line 1 (House/Flat, Street) *
                          </label>
                          <input
                            type="text"
                            required
                            value={addressForm.addressLine1}
                            onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                            placeholder="e.g. Flat 402, Skyline Towers, MG Road"
                            className="w-full h-10 px-3 bg-white border border-[#CCCCCC] focus:border-[#111111] text-xs font-medium rounded-none outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                            Address Line 2 (Landmark, Colony - Optional)
                          </label>
                          <input
                            type="text"
                            value={addressForm.addressLine2}
                            onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                            placeholder="e.g. Near City Center Mall"
                            className="w-full h-10 px-3 bg-white border border-[#CCCCCC] focus:border-[#111111] text-xs font-medium rounded-none outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                              PIN Code *
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={addressForm.pincode}
                              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                              placeholder="400001"
                              className="w-full h-10 px-3 bg-white border border-[#CCCCCC] focus:border-[#111111] text-xs font-medium rounded-none outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              required
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              placeholder="Mumbai"
                              className="w-full h-10 px-3 bg-white border border-[#CCCCCC] focus:border-[#111111] text-xs font-medium rounded-none outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              required
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                              placeholder="Maharashtra"
                              className="w-full h-10 px-3 bg-white border border-[#CCCCCC] focus:border-[#111111] text-xs font-medium rounded-none outline-none"
                            />
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isDefaultCheckbox"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                            className="w-4 h-4 rounded-none accent-[#111111] cursor-pointer"
                          />
                          <label htmlFor="isDefaultCheckbox" className="text-xs font-bold uppercase text-[#111111] cursor-pointer">
                            Set as default delivery address
                          </label>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E5E5]">
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(false)}
                            className="px-5 py-2.5 text-xs font-bold uppercase text-[#767677] hover:text-[#111111] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingAddress}
                            className="bg-[#111111] text-white px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-black transition-colors rounded-none cursor-pointer disabled:opacity-50"
                          >
                            {isSavingAddress ? "Saving..." : "Save Address"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Saved Addresses List */}
                  {user.addresses && user.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {user.addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className="bg-white border-2 border-[#E5E5E5] p-5 rounded-none flex flex-col justify-between relative group hover:border-[#111111] transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold uppercase text-[#111111]">
                                {addr.fullName}
                              </h4>
                              {addr.isDefault && (
                                <span className="bg-[#111111] text-white text-[9px] font-black uppercase px-2 py-0.5">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#555555] leading-relaxed">
                              {addr.addressLine1}
                            </p>
                            {addr.addressLine2 && (
                              <p className="text-xs text-[#555555] leading-relaxed">
                                {addr.addressLine2}
                              </p>
                            )}
                            <p className="text-xs text-[#555555] leading-relaxed">
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <p className="text-xs font-mono text-[#111111] mt-2 font-bold">
                              Phone: {addr.phone}
                            </p>
                          </div>

                          <div className="pt-4 mt-4 border-t border-[#F0F0F0] flex items-center justify-between text-xs">
                            {!addr.isDefault ? (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(addr._id!)}
                                className="font-bold text-[#111111] uppercase hover:underline cursor-pointer"
                              >
                                Set As Default
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-[#10B981] uppercase flex items-center gap-1">
                                <RiCheckLine /> Active Default
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setAddressToDelete(addr._id!)}
                              className="text-[#E53E3E] hover:underline uppercase font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <RiDeleteBinLine />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <RiMapPinLine className="text-4xl text-[#CCCCCC] mx-auto mb-3" />
                      <h3
                        className="text-xl font-black uppercase tracking-tight text-[#111111]"
                        style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
                      >
                        NO SAVED ADDRESSES YET
                      </h3>
                      <p className="text-xs text-[#767677] mt-1 max-w-sm mx-auto">
                        Add your primary delivery address so future footwear checkout takes only seconds.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Delete Address Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(addressToDelete)}
        title="DELETE SAVED ADDRESS"
        message="Are you sure you want to remove this delivery address from your profile? This action cannot be reversed."
        confirmText="Delete Address"
        cancelText="Keep Address"
        isDestructive={true}
        isLoading={isDeletingAddress}
        onConfirm={confirmDeleteAddress}
        onCancel={() => setAddressToDelete(null)}
      />

      {/* Order Cancellation Confirmation Dialog */}
      {orderToCancel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setOrderToCancel(null)}
          />
          <div className="relative bg-white w-full max-w-md border-2 border-[#111111] p-6 shadow-2xl z-10 rounded-none">
            <div className="flex items-start justify-between pb-3 border-b border-[#ECEFF1]">
              <div className="flex items-center gap-2">
                <RiAlertLine className="text-xl text-[#B91C1C]" />
                <h3 className="text-base font-extrabold uppercase text-[#111111]">
                  CANCEL ORDER
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="text-[#666666] hover:text-[#111111] p-1 cursor-pointer"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-[#555555]">
                Are you sure you wish to cancel order{" "}
                <strong>
                  {orderToCancel.orderNumber || `#NK-${orderToCancel._id.slice(-8).toUpperCase()}`}
                </strong>
                ? If payment was captured online, refund will be credited to original source within 3-5 banking days.
              </p>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                  Cancellation Reason
                </label>
                <input
                  type="text"
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="e.g. Changed shoe size / Ordered by mistake"
                  className="w-full h-10 px-3 bg-white border border-[#CCCCCC] focus:border-[#111111] text-xs font-medium rounded-none outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={cancelNotesInput}
                  onChange={(e) => setCancelNotesInput(e.target.value)}
                  placeholder="Any extra feedback or cancellation note for the team"
                  className="w-full p-2.5 bg-white border border-[#CCCCCC] focus:border-[#111111] text-xs font-medium rounded-none outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECEFF1] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2 text-xs font-bold uppercase text-[#767677] hover:text-[#111111] cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isCancellingOrder}
                onClick={confirmCancelOrder}
                className="bg-[#B91C1C] text-white px-5 py-2 text-xs font-black uppercase tracking-wider hover:bg-[#991B1B] transition-colors rounded-none cursor-pointer disabled:opacity-50"
              >
                {isCancellingOrder ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
