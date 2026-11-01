"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { RiCloseLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import "./announcement-bar.css";

export interface AnnouncementBarProps {
  badgeText?: string;
  desktopText?: string;
  mobileText?: string;
  couponCode?: string;
  targetDate?: string | Date;
  primaryColor?: string;
  secondaryColor?: string;
  dockOnMobile?: boolean;
  showTimer?: boolean;
  onClose?: () => void;
  className?: string;
}

export function AnnouncementBar(props: AnnouncementBarProps) {
  const { storeSettings } = useCart();
  const dbAnnouncement = storeSettings?.announcement;

  // Determine if announcement is enabled from backend settings
  const isBackendEnabled = dbAnnouncement ? dbAnnouncement.enabled : false;

  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Merge props with backend database announcement configuration
  const badgeText = props.badgeText ?? dbAnnouncement?.badgeText ?? "";
  const desktopText = props.desktopText ?? dbAnnouncement?.desktopText ?? "";
  const mobileText = props.mobileText ?? dbAnnouncement?.mobileText ?? "";
  const couponCode = props.couponCode ?? dbAnnouncement?.couponCode ?? "";
  const targetDate = props.targetDate ?? dbAnnouncement?.targetDate ?? "";
  const primaryColor = props.primaryColor ?? dbAnnouncement?.primaryColor ?? "#FA003F";
  const secondaryColor = props.secondaryColor ?? dbAnnouncement?.secondaryColor ?? "#ffffff";
  const showTimer = props.showTimer ?? true;

  // Countdown timer logic
  useEffect(() => {
    if (!showTimer || !targetDate) return;

    const countDownTime = new Date(targetDate).getTime();
    if (isNaN(countDownTime)) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = countDownTime - now;

      if (distance <= 0) {
        setTimeLeft("EXPIRED");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate, showTimer]);

  const handleCopy = async () => {
    if (!couponCode) return;
    try {
      if (inputRef.current) {
        inputRef.current.select();
        inputRef.current.setSelectionRange(0, 99999);
      }
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      toast.success(`Coupon code ${couponCode} copied!`);
    } catch {
      if (inputRef.current) {
        document.execCommand("copy");
        setCopied(true);
        toast.success(`Coupon code ${couponCode} copied!`);
      }
    }
  };

  const handleMouseOut = () => {
    setTimeout(() => {
      setCopied(false);
    }, 400);
  };

  const handleClose = () => {
    setIsDismissed(true);
    if (props.onClose) props.onClose();
  };

  // If dismissed or not enabled in backend database, don't render anything
  if (isDismissed || !isBackendEnabled || (!desktopText && !couponCode)) {
    return null;
  }

  return (
    <aside
      role="banner"
      aria-label="Promotion Announcement"
      className={cn(
        "announcement",
        props.dockOnMobile && "dock-mobile",
        props.className
      )}
      style={
        {
          "--primary-color": primaryColor,
          "--secondary-color": secondaryColor,
        } as React.CSSProperties
      }
    >
      {/* Dismiss / Close Button */}
      <button
        type="button"
        className="close"
        onClick={handleClose}
        aria-label="Close promotion"
      >
        <RiCloseLine className="w-4 h-4" />
      </button>

      {/* Promotion Text */}
      <div className="text">
        {/* Desktop view */}
        <span className="hidden md:inline">
          {badgeText && <strong>{badgeText}</strong>}
          {badgeText && ". "}
          {desktopText}
        </span>

        {/* Mobile view */}
        <span className="inline md:hidden">
          {mobileText || desktopText}
        </span>
      </div>

      {/* Coupon Code & Copy Action */}
      {couponCode && (
        <div className="coupon">
          <input
            ref={inputRef}
            type="text"
            value={couponCode}
            id="couponCode"
            readOnly
            aria-label="Coupon Code"
          />
          <div className="tooltip">
            <button
              type="button"
              className="copy-btn"
              onClick={handleCopy}
              onMouseLeave={handleMouseOut}
              aria-label="Copy coupon code"
            >
              <span className="tooltiptext" id="myTooltip">
                {copied ? `Copied: ${couponCode}` : "Copy to clipboard"}
              </span>
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Countdown Timer */}
      {showTimer && timeLeft && (
        <span id="timer" className="inline-flex text-[10px] md:text-xs">
          {timeLeft}
        </span>
      )}
    </aside>
  );
}

export default AnnouncementBar;
