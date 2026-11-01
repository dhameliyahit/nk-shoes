"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  RiArrowLeftLine,
  RiTruckLine,
  RiCheckLine,
  RiCloseLine,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiMoneyDollarCircleLine,
  RiAlertLine,
  RiExternalLinkLine,
  RiPrinterLine,
} from "react-icons/ri";
import {
  getAdminOrderById,
  updateAdminOrderStatus,
  AdminOrder,
  UpdateOrderStatusPayload,
} from "@/services/adminService";
import { StatusBadge } from "@/components/admin/status-badge";
import { TaxInvoiceModal } from "@/components/order/tax-invoice";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { formatPrice } from "@/lib/utils";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Logistics / Tracking Modal State
  const [isLogisticsModalOpen, setIsLogisticsModalOpen] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  // Cancel Confirmation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOrderById(id);
      setOrder(data);
      setCourierName(data.courierName || "Blue Dart");
      setTrackingNumber(data.trackingNumber || "");
      setTrackingUrl(data.trackingUrl || "");
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  // Handle generic status updates
  const handleUpdateStatus = async (payload: UpdateOrderStatusPayload, successMsg: string) => {
    setIsUpdating(true);
    try {
      const updated = await updateAdminOrderStatus(id, payload);
      setOrder(updated);
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Dispatch / Assign Courier Tracking
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error("Please provide a tracking / AWB number");
      return;
    }

    await handleUpdateStatus(
      {
        orderStatus: "shipped",
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim(),
      },
      `Order marked as Shipped via ${courierName}!`
    );
    setIsLogisticsModalOpen(false);
  };

  // Handle Cancel Order
  const handleConfirmCancel = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalReason = cancelReason.trim() || "Administrative cancellation";
    const payload: UpdateOrderStatusPayload = {
      orderStatus: "cancelled",
      cancelReason: finalReason,
    };
    if (cancelNotes.trim()) {
      payload.orderNotes = order?.orderNotes
        ? `${order.orderNotes} | Cancel Note: ${cancelNotes.trim()}`
        : `Cancel Note: ${cancelNotes.trim()}`;
    }
    await handleUpdateStatus(payload, "Order cancelled successfully");
    setIsCancelModalOpen(false);
    setCancelReason("");
    setCancelNotes("");
  };

  if (loading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center font-sans text-[#6B7280]">
        <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Order Dossier...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 bg-white border border-[#E5E7EB] font-sans">
        <div className="flex items-center gap-2 text-[#B91C1C] text-sm font-bold mb-3">
          <RiAlertLine className="text-lg" />
          <span>{error || "Order not found"}</span>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider"
        >
          <RiArrowLeftLine className="text-sm" />
          <span>Return to Orders Board</span>
        </Link>
      </div>
    );
  }

  const placedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* 1. TOP BREADCRUMB & ORDER TITLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-black uppercase tracking-wider mb-2 transition-colors cursor-pointer"
          >
            <RiArrowLeftLine className="text-sm" />
            <span>Back to Orders List</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
              Order #{order._id.slice(-6).toUpperCase()}
            </h2>
            <StatusBadge status={order.orderStatus} />
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-none ${
                order.isPaid
                  ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                  : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
              }`}
            >
              {order.isPaid ? "Paid" : "Payment Pending"}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1 font-mono">
            Full ID: {order._id} · Placed on {placedDate}
          </p>
        </div>

        {/* TOP QUICK ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
            <button
              type="button"
              onClick={() => setIsLogisticsModalOpen(true)}
              disabled={isUpdating}
              className="px-3.5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RiTruckLine className="text-sm" />
              <span>{order.orderStatus === "shipped" ? "Update Tracking" : "Dispatch / Ship Order"}</span>
            </button>
          )}

          {order.orderStatus === "shipped" && (
            <button
              type="button"
              onClick={() =>
                handleUpdateStatus(
                  { orderStatus: "delivered", isDelivered: true },
                  "Order marked as Delivered!"
                )
              }
              disabled={isUpdating}
              className="px-3.5 py-2 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RiCheckLine className="text-sm" />
              <span>Mark Delivered</span>
            </button>
          )}

          {!order.isPaid && order.paymentMethod === "cod" && (
            <button
              type="button"
              onClick={() =>
                handleUpdateStatus({ isPaid: true }, "COD Payment confirmed as received!")
              }
              disabled={isUpdating}
              className="px-3 py-2 bg-white border border-[#047857] text-[#047857] hover:bg-[#ECFDF5] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RiMoneyDollarCircleLine className="text-sm" />
              <span>Confirm COD Cash Paid</span>
            </button>
          )}

          {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isUpdating}
              className="px-3 py-2 bg-white border border-[#B91C1C] text-[#B91C1C] hover:bg-[#FEF2F2] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Cancel Order</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsInvoiceOpen(true)}
            className="px-3.5 py-2 bg-white border border-[#111111] text-[#111111] hover:bg-[#F3F4F6] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RiPrinterLine className="text-sm" />
            <span>Print Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN DOSSIER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN: ORDER ITEMS & FINANCIALS (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ITEMS LIST CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-4 pb-2 border-b border-[#E5E7EB]">
              Purchased Footwear ({order.orderItems?.length || 0} styles)
            </h3>

            <div className="divide-y divide-[#E5E7EB]">
              {order.orderItems?.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 object-contain bg-[#F5F5F5] border border-[#E5E7EB] shrink-0 p-1"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-[#F5F5F5] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                        <RiTruckLine className="text-xl text-[#9CA3AF]" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#111111]">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-0.5">
                        <span className="font-semibold text-black">Size: {item.size}</span>
                        <span>·</span>
                        <span>Color: {item.color}</span>
                        <span>·</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-extrabold text-[#111111] tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <div className="text-[10px] text-[#6B7280]">
                      {formatPrice(item.price)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FINANCIAL SUMMARY BOX */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#E5E7EB]">
              Payment & Fee Breakdown
            </h3>

            <div className="space-y-2 text-xs text-[#4B5563]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-[#111111] tabular-nums">
                  {formatPrice(order.itemsPrice || 0)}
                </span>
              </div>

              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="flex justify-between text-[#059669]">
                  <span className="flex items-center gap-1.5">
                    <span>Coupon Discount</span>
                    {order.promoCode && (
                      <span className="px-1.5 py-0.2 bg-[#ECFDF5] border border-[#A7F3D0] text-[10px] font-bold uppercase">
                        {order.promoCode}
                      </span>
                    )}
                  </span>
                  <span className="font-bold tabular-nums">
                    -{formatPrice(order.discountAmount)}
                  </span>
                </div>
              ) : null}

              <div className="flex justify-between">
                <span>Delivery / Shipping Fee</span>
                <span className="font-bold text-[#111111] tabular-nums">
                  {order.shippingPrice === 0 ? "FREE" : formatPrice(order.shippingPrice)}
                </span>
              </div>

              {order.giftWrap && (
                <div className="flex justify-between">
                  <span>Gift Box & Packaging</span>
                  <span className="font-bold text-[#111111] tabular-nums">₹99</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-between text-sm font-black text-[#111111]">
                <span>Total Amount Paid / Payable</span>
                <span className="text-base sm:text-lg tabular-nums">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* CANCELLATION DETAILS (If Cancelled) */}
          {order.orderStatus === "cancelled" && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 text-xs font-sans">
              <div className="flex items-center gap-2 text-[#991B1B] font-bold uppercase mb-1">
                <RiAlertLine className="text-base shrink-0" />
                <span>Order Cancelled</span>
              </div>
              <p className="text-[#B91C1C]">
                <strong>Reason:</strong> {order.cancelReason || "No cancellation reason provided"}
              </p>
            </div>
          )}

          {/* ORDER NOTES */}
          {order.orderNotes && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 text-xs font-sans">
              <span className="font-bold text-[#92400E] uppercase block mb-1">
                Order Notes & Activity:
              </span>
              <p className="text-[#78350F] whitespace-pre-line">{order.orderNotes}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LOGISTICS, COURIER & RECIPIENT (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* COURIER LOGISTICS CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                Courier & Tracking
              </h3>
              <StatusBadge status={order.orderStatus} />
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">
                  Assigned Courier
                </span>
                <span className="font-bold text-[#111111] text-sm">
                  {order.courierName || "Not assigned yet"}
                </span>
              </div>

              <div>
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">
                  Tracking / AWB Number
                </span>
                <span className="font-mono font-bold text-sm text-[#4338CA]">
                  {order.trackingNumber || "Pending dispatch"}
                </span>
              </div>

              {order.trackingUrl && (
                <div className="pt-1">
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111111] hover:underline"
                  >
                    <span>Track on Courier Portal</span>
                    <RiExternalLinkLine className="text-xs" />
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsLogisticsModalOpen(true)}
                className="w-full mt-2 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111111] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
              >
                {order.trackingNumber ? "Edit Courier & AWB" : "+ Assign Courier & Tracking"}
              </button>
            </div>
          </div>

          {/* SHIPPING DESTINATION CARD */}
          <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                Recipient & Delivery Address
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-sm font-black text-[#111111] block">
                  {order.shippingAddress?.fullName}
                </span>
                <div className="flex items-center gap-2 mt-1 text-[#4B5563]">
                  <a
                    href={`tel:${order.shippingAddress?.phone}`}
                    className="flex items-center gap-1 hover:underline text-[#111111] font-bold"
                  >
                    <RiPhoneLine className="text-sm text-[#059669]" />
                    <span>{order.shippingAddress?.phone}</span>
                  </a>
                  {order.shippingAddress?.alternatePhone && (
                    <span className="text-[#6B7280]">
                      / Alt: {order.shippingAddress.alternatePhone}
                    </span>
                  )}
                </div>

                {(order.guestEmail || order.user?.email) && (
                  <div className="flex items-center gap-1.5 mt-1 text-[#2563EB]">
                    <RiMailLine className="text-sm text-[#3B82F6] shrink-0" />
                    <a
                      href={`mailto:${order.guestEmail || order.user?.email}`}
                      className="hover:underline font-medium text-xs truncate"
                    >
                      {order.guestEmail || order.user?.email}
                    </a>
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] ml-1">
                      {order.user ? "Registered Member" : "Guest Customer"}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#F3F4F6]">
                <div className="flex items-start gap-1.5 text-[#374151]">
                  <RiMapPinLine className="text-base text-[#111111] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium leading-relaxed">
                      {order.shippingAddress?.addressLine1}
                    </p>
                    {order.shippingAddress?.addressLine2 && (
                      <p className="text-[#6B7280]">{order.shippingAddress.addressLine2}</p>
                    )}
                    <p className="font-bold text-[#111111] mt-1">
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} —{" "}
                      <span className="font-mono text-[#059669]">
                        {order.shippingAddress?.pincode}
                      </span>
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[10px] font-bold uppercase tracking-wider">
                      Verified Indian Postal PIN
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ASSIGN LOGISTICS MODAL */}
      {isLogisticsModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setIsLogisticsModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md border-2 border-[#111111] p-6 shadow-2xl z-10 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECEFF1]">
              <h3 className="text-base font-extrabold uppercase tracking-wide text-[#111111]">
                Assign Courier & Tracking Details
              </h3>
              <button
                type="button"
                onClick={() => setIsLogisticsModalOpen(false)}
                className="text-[#6B7280] hover:text-black cursor-pointer p-1"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Courier Partner
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full h-10 px-3 border border-[#D1D5DB] text-xs font-bold text-[#111111] bg-white rounded-none outline-none focus:border-black"
                >
                  <option value="Blue Dart">Blue Dart</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="DTDC">DTDC</option>
                  <option value="India Post">India Post Speed Post</option>
                  <option value="Shadowfax">Shadowfax</option>
                  <option value="XpressBees">XpressBees</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Tracking / AWB Number *
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. BLU774920194"
                  required
                  className="w-full h-10 px-3 border border-[#D1D5DB] text-xs font-mono font-bold text-[#111111] rounded-none outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Direct Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://track.bluedart.com/..."
                  className="w-full h-10 px-3 border border-[#D1D5DB] text-xs text-[#111111] rounded-none outline-none focus:border-black"
                />
              </div>

              <div className="pt-4 border-t border-[#ECEFF1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogisticsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#4B5563] hover:bg-[#F3F4F6] border border-[#D1D5DB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-[#111111] hover:bg-black text-white"
                >
                  {isUpdating ? "Saving..." : "Save & Mark Shipped"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CANCEL MODAL WITH REASON & NOTES */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsCancelModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md border-2 border-[#111111] p-6 shadow-2xl z-10 font-sans">
            <div className="flex items-start justify-between pb-3 border-b border-[#ECEFF1]">
              <div className="flex items-center gap-2 text-[#B91C1C]">
                <RiAlertLine className="text-xl" />
                <h3 className="text-base font-extrabold uppercase">
                  Cancel Customer Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="text-[#6B7280] hover:text-[#111111]"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="pt-4 space-y-4">
              <p className="text-xs text-[#4B5563]">
                Are you sure you want to cancel this order? This will mark the order as Cancelled and adjust records.
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Cancellation Reason *
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Out of stock / Customer requested cancellation"
                  className="w-full h-10 px-3 border border-[#D1D5DB] text-xs text-[#111111] rounded-none outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#374151] mb-1">
                  Internal Notes / Refund Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="e.g. Refund initiated on PhonePe PG ref #123456"
                  className="w-full p-2.5 border border-[#D1D5DB] text-xs text-[#111111] rounded-none outline-none focus:border-black"
                />
              </div>

              <div className="pt-3 border-t border-[#ECEFF1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#4B5563] hover:bg-[#F3F4F6] border border-[#D1D5DB]"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-[#B91C1C] hover:bg-[#991B1B] text-white"
                >
                  {isUpdating ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Official Tax Invoice Modal */}
      {order && (
        <TaxInvoiceModal
          order={order}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </div>
  );
}
