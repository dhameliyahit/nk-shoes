"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboardLine,
  RiShoppingBag3Line,
  RiStore2Line,
  RiFolder3Line,
  RiStarLine,
  RiPagesLine,
  RiSettings3Line,
  RiExternalLinkLine,
  RiLogoutBoxRLine,
  RiCloseLine,
  RiTeamLine,
  RiCouponLine,
} from "react-icons/ri";
import { useAuth } from "@/context/auth-context";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navLinks = [
    { label: "Dashboard", href: "/admin", icon: <RiDashboardLine />, exact: true },
    { label: "Orders & Delivery", href: "/admin/orders", icon: <RiShoppingBag3Line /> },
    { label: "Products Catalog", href: "/admin/products", icon: <RiStore2Line /> },
    { label: "Categories", href: "/admin/categories", icon: <RiFolder3Line /> },
    { label: "Promo Coupons", href: "/admin/coupons", icon: <RiCouponLine /> },
    { label: "Reviews Moderation", href: "/admin/reviews", icon: <RiStarLine /> },
    { label: "Users & Access", href: "/admin/users", icon: <RiTeamLine /> },
    { label: "Dynamic Pages (CMS)", href: "/admin/pages", icon: <RiPagesLine /> },
    { label: "Store Settings", href: "/admin/settings", icon: <RiSettings3Line /> },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sidebarContent = (
    <aside className="w-[250px] h-screen bg-[#111111] text-white flex flex-col justify-between shrink-0 font-sans border-r border-[#262626] select-none">
      {/* BRAND & HEADER */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="h-[68px] px-6 flex items-center justify-between border-b border-[#242424] shrink-0">
          <Link href="/admin" className="flex items-center gap-1.5" onClick={onClose}>
            <span
              className="text-2xl font-black italic tracking-[-1px] uppercase text-white leading-none font-barlow"
            >
              NK<span className="font-bold text-[#E53E3E] ml-[2px]">ADMIN</span>
            </span>
            <span className="px-1.5 py-0.5 bg-[#262626] text-[9px] font-bold tracking-wider text-[#A3A3A3] uppercase ml-1">
              v1.0
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-[#A3A3A3] hover:text-white cursor-pointer p-1"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="p-3.5 space-y-1 flex-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#737373]">
            Operations
          </p>
          {navLinks.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 rounded-none ${
                  active
                    ? "bg-white text-[#111111] shadow-xs font-black"
                    : "text-[#A3A3A3] hover:bg-[#1C1C1C] hover:text-white"
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER & LOGOUT */}
      <div className="p-4 border-t border-[#242424] space-y-2 shrink-0">
        {/* Active Admin Profile */}
        {user && (
          <div className="px-2 py-1.5 flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-[#737373] truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* View Storefront */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-white hover:bg-[#1C1C1C] transition-colors"
        >
          <span className="flex items-center gap-2">
            <RiExternalLinkLine className="text-sm" />
            <span>View Live Store</span>
          </span>
          <span className="text-[10px] text-[#737373]">↗</span>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#EF4444] hover:bg-[#261515] transition-colors cursor-pointer text-left"
        >
          <RiLogoutBoxRLine className="text-sm" />
          <span>Exit / Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* DESKTOP FIXED SIDEBAR */}
      <div className="hidden lg:block fixed top-0 left-0 h-screen w-[250px] z-30">
        {sidebarContent}
      </div>

      {/* MOBILE DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative z-10 animate-slideRight">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

export default AdminSidebar;
