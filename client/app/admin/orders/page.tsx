"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiShoppingBag3Line,
  RiRefreshLine,
  RiArrowRightLine,
  RiTruckLine,
  RiCheckLine,
  RiMailLine,
  RiPhoneLine,
} from "react-icons/ri";
import { getAdminOrders, AdminOrder } from "@/services/adminService";
import { DataTable, Column, FilterOption } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatPrice } from "@/lib/utils";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter tabs with live counts
  const filterOptions: FilterOption[] = [
    { label: "All Orders", value: "all", count: orders.length },
    {
      label: "Pending / Processing",
      value: "processing",
      count: orders.filter((o) => ["processing", "confirmed"].includes(o.orderStatus)).length,
    },
    {
      label: "Shipped",
      value: "shipped",
      count: orders.filter((o) => o.orderStatus === "shipped").length,
    },
    {
      label: "Delivered",
      value: "delivered",
      count: orders.filter((o) => o.orderStatus === "delivered").length,
    },
    {
      label: "Cancelled",
      value: "cancelled",
      count: orders.filter((o) => o.orderStatus === "cancelled").length,
    },
  ];

  // Apply status and payment filters
  const filteredOrders = orders.filter((order) => {
    // 1. Status Filter
    if (statusFilter === "processing") {
      if (!["processing", "confirmed"].includes(order.orderStatus)) return false;
    } else if (statusFilter !== "all") {
      if (order.orderStatus !== statusFilter) return false;
    }

    // 2. Payment Method Filter
    if (paymentFilter === "cod" && order.paymentMethod !== "cod") return false;
    if (paymentFilter === "prepaid" && order.paymentMethod === "cod") return false;

    return true;
  });

  // Search filter across ID, Name, Phone, City, PIN code
  const searchFilter = (order: AdminOrder, query: string) => {
    const id = order._id.toLowerCase();
    const shortId = order._id.slice(-6).toLowerCase();
    const name = (order.shippingAddress?.fullName || "").toLowerCase();
    const phone = (order.shippingAddress?.phone || "").toLowerCase();
    const city = (order.shippingAddress?.city || "").toLowerCase();
    const pincode = (order.shippingAddress?.pincode || "").toLowerCase();
    const promo = (order.promoCode || "").toLowerCase();

    return (
      id.includes(query) ||
      shortId.includes(query) ||
      name.includes(query) ||
      phone.includes(query) ||
      city.includes(query) ||
      pincode.includes(query) ||
      promo.includes(query)
    );
  };

  // Define Table Columns
  const columns: Column<AdminOrder>[] = [
    {
      header: "Order ID & Date",
      className: "w-[170px]",
      render: (ord) => {
        const dateStr = ord.createdAt
          ? new Date(ord.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently";

        return (
          <div>
            <span className="font-mono font-black text-[#111111] text-xs">
              #{ord._id.slice(-6).toUpperCase()}
            </span>
            <div className="text-[10px] text-[#6B7280] mt-0.5">{dateStr}</div>
          </div>
        );
      },
    },
    {
      header: "Customer & Destination",
      className: "min-w-[210px]",
      render: (ord) => {
        const customerEmail = ord.guestEmail || ord.user?.email;

        return (
          <div className="space-y-0.5">
            <div className="font-bold text-[#111111] truncate max-w-[200px]">
              {ord.shippingAddress?.fullName || ord.user?.name || "Guest Customer"}
            </div>
            {customerEmail && (
              <div className="text-[11px] text-[#2563EB] font-medium truncate max-w-[200px] flex items-center gap-1">
                <RiMailLine className="text-xs shrink-0 text-[#3B82F6]" />
                <a href={`mailto:${customerEmail}`} className="hover:underline">
                  {customerEmail}
                </a>
              </div>
            )}
            {ord.shippingAddress?.phone && (
              <div className="text-[11px] text-[#374151] font-mono truncate flex items-center gap-1">
                <RiPhoneLine className="text-xs shrink-0 text-[#059669]" />
                <a href={`tel:${ord.shippingAddress.phone}`} className="hover:underline">
                  {ord.shippingAddress.phone}
                </a>
              </div>
            )}
            <div className="text-[10px] text-[#6B7280] truncate max-w-[210px]">
              {ord.shippingAddress?.city}, {ord.shippingAddress?.state} ({ord.shippingAddress?.pincode})
            </div>
          </div>
        );
      },
    },
    {
      header: "Footwear Items",
      className: "min-w-[180px]",
      render: (ord) => {
        const count = ord.orderItems?.length || 0;
        const firstItem = ord.orderItems?.[0];

        return (
          <div className="flex items-center gap-2">
            {firstItem?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firstItem.image}
                alt={firstItem.name}
                className="w-9 h-9 object-contain bg-[#F5F5F5] border border-[#E5E7EB] shrink-0 p-0.5"
              />
            ) : (
              <div className="w-9 h-9 bg-[#F5F5F5] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                <RiShoppingBag3Line className="text-sm text-[#9CA3AF]" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#111111] truncate max-w-[150px]">
                {firstItem?.name || "Footwear"}
              </p>
              <p className="text-[10px] text-[#6B7280]">
                {firstItem ? `${firstItem.size} · ${firstItem.color}` : ""}
                {count > 1 ? ` (+${count - 1} more)` : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Payment",
      className: "w-[120px]",
      render: (ord) => (
        <div>
          <span className="font-bold uppercase text-[11px] text-[#111111]">
            {ord.paymentMethod}
          </span>
          <div className="mt-0.5">
            <span
              className={`inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider border rounded-none ${
                ord.isPaid
                  ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                  : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
              }`}
            >
              {ord.isPaid ? "Paid" : "Unpaid"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Fulfillment Status",
      className: "w-[140px]",
      render: (ord) => (
        <div className="space-y-1">
          <StatusBadge status={ord.orderStatus} />
          {ord.courierName && ord.trackingNumber && (
            <div className="text-[10px] text-[#4338CA] font-semibold truncate flex items-center gap-1">
              <RiTruckLine className="text-xs shrink-0" />
              <span>{ord.courierName}: {ord.trackingNumber}</span>
            </div>
          )}
          {ord.orderStatus === "cancelled" && ord.cancelReason && (
            <div
              className="text-[10px] text-[#B91C1C] font-semibold truncate max-w-[130px]"
              title={`Cancellation Reason: ${ord.cancelReason}`}
            >
              Reason: {ord.cancelReason}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Grand Total",
      className: "w-[110px] text-right",
      render: (ord) => (
        <div className="text-right">
          <span className="font-black text-[#111111] text-xs tabular-nums">
            {formatPrice(ord.totalPrice)}
          </span>
          {ord.discountAmount && ord.discountAmount > 0 ? (
            <div className="text-[10px] text-[#059669] font-bold">
              Saved {formatPrice(ord.discountAmount)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      header: "Action",
      className: "w-[90px] text-right",
      render: (ord) => (
        <div className="text-right">
          <Link
            href={`/admin/orders/${ord._id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111111] hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <span>Manage</span>
            <RiArrowRightLine className="text-xs" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans select-none">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
            Orders & Delivery Logistics
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Track customer orders, manage Indian postal delivery, assign AWB numbers, and update shipment status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Payment Method Quick Filter */}
          <div className="flex items-center border border-[#D1D5DB] bg-white text-xs">
            <button
              type="button"
              onClick={() => setPaymentFilter("all")}
              className={`px-3 py-1.5 font-bold uppercase text-[11px] cursor-pointer transition-colors ${
                paymentFilter === "all" ? "bg-[#111111] text-white" : "text-[#4B5563] hover:text-black"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter("cod")}
              className={`px-3 py-1.5 font-bold uppercase text-[11px] cursor-pointer transition-colors ${
                paymentFilter === "cod" ? "bg-[#111111] text-white" : "text-[#4B5563] hover:text-black"
              }`}
            >
              COD
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter("prepaid")}
              className={`px-3 py-1.5 font-bold uppercase text-[11px] cursor-pointer transition-colors ${
                paymentFilter === "prepaid" ? "bg-[#111111] text-white" : "text-[#4B5563] hover:text-black"
              }`}
            >
              Prepaid
            </button>
          </div>

          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white border border-[#D1D5DB] hover:border-black text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RiRefreshLine className={`text-sm ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchOrders}
            className="font-bold underline uppercase text-[11px] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. REUSABLE DATA TABLE */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        searchPlaceholder="Search by Order ID, Customer Name, Phone, City, or PIN code..."
        searchFilter={searchFilter}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        isLoading={loading}
        emptyMessage="No customer orders found matching your criteria."
        pageSize={15}
        onRowClick={(ord) => router.push(`/admin/orders/${ord._id}`)}
      />
    </div>
  );
}
