import React, { Suspense } from "react";
import { Metadata } from "next";
import { ProfileContent } from "./profile-content";

export const metadata: Metadata = {
  title: "My Account & Orders | NK-SHOES Official",
  description: "View and manage your profile credentials, saved delivery addresses, and track real-time footwear shipment logistics.",
};

export const instant = false;

function ProfileLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#FDFDFD]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent animate-spin rounded-none" />
        <span className="text-xs font-black uppercase tracking-widest text-[#767677]">
          Loading Athlete Dossier...
        </span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  );
}
