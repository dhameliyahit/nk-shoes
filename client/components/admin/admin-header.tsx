"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiMenuLine, RiExternalLinkLine, RiShieldCheckLine } from "react-icons/ri";
import { useAuth } from "@/context/auth-context";

interface AdminHeaderProps {
  onToggleMobileSidebar: () => void;
}

export function AdminHeader({ onToggleMobileSidebar }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard & Overview";
    if (pathname.startsWith("/admin/orders")) return "Orders & Delivery Logistics";
    if (pathname.startsWith("/admin/products/new")) return "Add New Shoe Drop";
    if (pathname.startsWith("/admin/products")) return "Footwear Inventory & Catalog";
    if (pathname.startsWith("/admin/categories")) return "Categories Management";
    if (pathname.startsWith("/admin/reviews")) return "Customer Reviews Moderation";
    if (pathname.startsWith("/admin/pages")) return "Dynamic Content Pages (CMS)";
    if (pathname.startsWith("/admin/settings")) return "Store Settings & Promotions";
    return "Administration";
  };

  return (
    <header className="h-[68px] bg-white border-b border-[#E5E7EB] px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 font-sans shadow-2xs select-none">
      {/* LEFT: HAMBURGER & TITLE */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 -ml-2 text-[#111111] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          aria-label="Toggle navigation sidebar"
        >
          <RiMenuLine className="text-2xl" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#111111]">{pathname.replace("/admin", "") || "Overview"}</span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-[#111111] uppercase tracking-tight leading-none mt-0.5">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* RIGHT: BADGE & STORE SHORTCUT */}
      <div className="flex items-center gap-3">
        {/* Admin Role Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] font-bold text-[#111111]">
          <RiShieldCheckLine className="text-sm text-[#059669]" />
          <span>SUPER ADMIN</span>
          {user?.name && (
            <span className="text-[#6B7280] font-normal">({user.name.split(" ")[0]})</span>
          )}
        </div>

        {/* Live Storefront Link */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Live Store</span>
          <RiExternalLinkLine className="text-xs" />
        </Link>
      </div>
    </header>
  );
}

export default AdminHeader;
