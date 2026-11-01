import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  badgeVariant?: "positive" | "warning" | "neutral" | "danger";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtext,
  badge,
  badgeVariant = "neutral",
  icon,
  className,
}: StatCardProps) {
  const badgeStyles = {
    positive: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    warning: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    danger: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
    neutral: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
  };

  return (
    <div
      className={cn(
        "bg-white border border-[#E5E7EB] p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-[#111111]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
          {title}
        </span>
        {icon && <div className="text-[#9CA3AF] text-lg">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-3 my-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#111111] tabular-nums tracking-tight">
          {value}
        </span>
        {badge && (
          <span
            className={cn(
              "px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-none",
              badgeStyles[badgeVariant]
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-[#6B7280] font-normal mt-1 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
}

export default StatCard;
