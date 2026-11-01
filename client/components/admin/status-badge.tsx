import React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "processing"
  | "confirmed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "paid"
  | "pending"
  | "failed"
  | "active"
  | "inactive"
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  type?: string;
  className?: string;
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const normalized = (variant || status || "").toLowerCase().replace(/\s+/g, "_") as StatusVariant;

  const styleMap: Record<StatusVariant, string> = {
    // Orders
    processing: "bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]",
    confirmed: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    shipped: "bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]",
    out_for_delivery: "bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]",
    delivered: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    cancelled: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",

    // Payments
    paid: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    pending: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    failed: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",

    // Products / Pages
    active: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    inactive: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
    in_stock: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    low_stock: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    out_of_stock: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
  };

  const badgeStyle = styleMap[normalized] || "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";

  const formatText = (text: string) => {
    return text.replace(/_/g, " ").toUpperCase();
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border rounded-none whitespace-nowrap",
        badgeStyle,
        className
      )}
    >
      {formatText(status)}
    </span>
  );
}

export default StatusBadge;
