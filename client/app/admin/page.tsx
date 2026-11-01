"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RiMoneyDollarCircleLine,
  RiShoppingBag3Line,
  RiStore2Line,
  RiUser3Line,
  RiAlertLine,
  RiArrowRightLine,
  RiRefreshLine,
} from "react-icons/ri";
import { getAdminStats, AdminDashboardStats } from "@/services/adminService";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* 1. TOP HEADER & REFRESH ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
            Executive Operations Overview
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Real-time storefront metrics, pending shipments, and inventory watchlist.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-[#D1D5DB] hover:border-black text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RiRefreshLine className={`text-sm ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>

          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Orders Board</span>
            <RiArrowRightLine className="text-sm" />
          </Link>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiAlertLine className="text-base shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            className="font-bold underline uppercase text-[11px] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Paid Revenue"
          value={formatPrice(stats?.totalRevenue || 0)}
          subtext="Net confirmed sales across UPI, Cards & COD"
          badge="Live"
          badgeVariant="positive"
          icon={<RiMoneyDollarCircleLine />}
        />

        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          subtext={`${stats?.pendingOrders || 0} orders awaiting fulfillment`}
          badge={stats?.pendingOrders ? `${stats.pendingOrders} Pending` : "Up to date"}
          badgeVariant={stats?.pendingOrders ? "warning" : "positive"}
          icon={<RiShoppingBag3Line />}
        />

        <StatCard
          title="Footwear Catalog"
          value={stats?.totalProducts || 0}
          subtext={`${stats?.lowStockProducts || 0} styles low in stock`}
          badge={stats?.lowStockProducts ? `${stats.lowStockProducts} Low Stock` : "Optimal"}
          badgeVariant={stats?.lowStockProducts ? "danger" : "neutral"}
          icon={<RiStore2Line />}
        />

        <StatCard
          title="Registered Members"
          value={stats?.totalUsers || 0}
          subtext="Verified customer accounts"
          badge="Store Club"
          badgeVariant="neutral"
          icon={<RiUser3Line />}
        />
      </div>

      {/* 3. OPERATIONAL ACTION PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* RECENT ORDERS TABLE (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#111111]">
                Recent Inbound Drops & Orders
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Latest customer purchases requiring packaging and courier dispatch.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold uppercase tracking-wider text-[#111111] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <RiArrowRightLine className="text-sm" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider text-[10px]">
                  <th className="pb-2.5 font-bold">Order ID</th>
                  <th className="pb-2.5 font-bold">Recipient / City</th>
                  <th className="pb-2.5 font-bold">Payment</th>
                  <th className="pb-2.5 font-bold">Status</th>
                  <th className="pb-2.5 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                      Loading recent orders...
                    </td>
                  </tr>
                ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 font-mono font-bold text-[#111111]">
                        <Link href={`/admin/orders/${ord._id}`} className="hover:underline">
                          #{ord._id.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="py-3 text-[#374151]">
                        <div className="font-bold text-[#111111] truncate max-w-[140px]">
                          {ord.shippingAddress?.fullName || "Guest Customer"}
                        </div>
                        <div className="text-[10px] text-[#6B7280]">
                          {ord.shippingAddress?.city}, {ord.shippingAddress?.state}
                        </div>
                      </td>
                      <td className="py-3 text-[#4B5563] uppercase font-bold text-[11px]">
                        {ord.paymentMethod}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={ord.orderStatus} />
                      </td>
                      <td className="py-3 text-right font-extrabold text-[#111111] tabular-nums">
                        {formatPrice(ord.totalPrice)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK MANAGEMENT SHORTCUTS (1 col on lg) */}
        <div className="bg-white border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#111111]">
              Quick Operations
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              Direct shortcuts to manage inventory, store settings, and pages.
            </p>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/admin/products/new"
              className="flex items-center justify-between p-3 border border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F9FAFB] transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#111111] group-hover:text-black">
                  + Add New Shoe Drop
                </p>
                <p className="text-[10px] text-[#6B7280]">
                  Configure sizes, pricing, and colorways
                </p>
              </div>
              <RiArrowRightLine className="text-base text-[#9CA3AF] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center justify-between p-3 border border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F9FAFB] transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#111111] group-hover:text-black">
                  Promotions & Coupons
                </p>
                <p className="text-[10px] text-[#6B7280]">
                  Announcement banner, promo codes, and COD rules
                </p>
              </div>
              <RiArrowRightLine className="text-base text-[#9CA3AF] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/admin/pages"
              className="flex items-center justify-between p-3 border border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F9FAFB] transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#111111] group-hover:text-black">
                  Dynamic Pages (CMS)
                </p>
                <p className="text-[10px] text-[#6B7280]">
                  Edit Help, Shipping, and Returns content
                </p>
              </div>
              <RiArrowRightLine className="text-base text-[#9CA3AF] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/admin/reviews"
              className="flex items-center justify-between p-3 border border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F9FAFB] transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#111111] group-hover:text-black">
                  Review Moderation
                </p>
                <p className="text-[10px] text-[#6B7280]">
                  Inspect customer feedback and star ratings
                </p>
              </div>
              <RiArrowRightLine className="text-base text-[#9CA3AF] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
