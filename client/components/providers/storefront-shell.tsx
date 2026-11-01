"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/common/announcement-bar";
import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <div className="min-h-screen w-full flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <AnnouncementBar />
        <Header />
        <main>{children}</main>
      </div>
      <Footer />
    </div>
  );
}

export default StorefrontShell;
