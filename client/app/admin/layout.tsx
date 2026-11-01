"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RiShieldUserLine, RiLockLine, RiArrowRightLine } from "react-icons/ri";
import { useAuth } from "@/context/auth-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isHydrated } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Loading state while mounting & checking localStorage auth token
  if (!mounted || !isHydrated) {
    return (
      <div 
        suppressHydrationWarning
        className="w-full h-screen bg-[#111111] flex items-center justify-center font-sans text-white"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#A3A3A3]">
            Authenticating Admin Portal...
          </span>
        </div>
      </div>
    );
  }

  // 2. Access Guard: Check if user is logged in & has admin role
  const isAdmin = isLoggedIn && user && user.role === "admin";

  if (!isAdmin) {
    return (
      <div className="w-full min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 font-sans select-none">
        <div className="w-full max-w-md bg-white border-2 border-[#111111] p-8 shadow-xl text-center">
          <div className="w-14 h-14 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] mx-auto flex items-center justify-center mb-5">
            <RiShieldUserLine className="text-3xl" />
          </div>

          <h1 className="text-xl font-black uppercase tracking-tight text-[#111111]">
            Admin Access Required
          </h1>
          <p className="text-xs text-[#6B7280] leading-relaxed mt-2 max-w-sm mx-auto">
            This area is restricted to authenticated store administrators. Please sign in with an account that possesses administrative privileges.
          </p>

          <div className="mt-8 flex flex-col gap-2.5">
            <Link
              href="/login?redirect=/admin"
              className="w-full py-3 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RiLockLine className="text-sm" />
              <span>Login with Admin Credentials</span>
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 bg-white hover:bg-[#F3F4F6] text-[#4B5563] text-xs font-bold uppercase tracking-wider border border-[#D1D5DB] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Return to Store</span>
              <RiArrowRightLine className="text-sm" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Shell
  return (
    <div 
      suppressHydrationWarning
      className="flex w-full min-h-screen bg-[#F9FAFB] font-sans antialiased text-[#111111]"
    >
      {/* SIDEBAR NAVIGATION */}
      <AdminSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[250px]">
        <AdminHeader onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
