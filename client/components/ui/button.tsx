"use client";

import React, { forwardRef } from "react";
import Link from "next/link";
import { SyncLoader } from "react-spinners";
import { cn } from "@/lib/utils";

export type ButtonVariant = "bag" | "slide" | "diagonal" | "accent" | "outline";
export type ButtonSize = "default" | "compact";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant from NK-SHOES Design System:
   * - 'bag': Signature Add to Bag with shine sweep & offset shadow
   * - 'slide': Solid sliding background fill
   * - 'diagonal': Diagonal geometric reveal
   * - 'accent': Terracotta accent sweep from bottom
   * - 'outline': Clean outline with bottom black fill
   * @default "bag"
   */
  variant?: ButtonVariant;
  /**
   * Button sizing:
   * - 'default': 54px - 60px height
   * - 'compact': 44px height (ideal for product cards and quick-add)
   * @default "default"
   */
  size?: ButtonSize;
  /**
   * Full-width button block
   */
  fullWidth?: boolean;
  /**
   * Custom icon element or symbol.
   */
  icon?: React.ReactNode;
  /**
   * Enables arrow translation micro-interaction on hover.
   */
  arrow?: boolean;
  /**
   * Shows a loading spinner and disables interactions.
   */
  isLoading?: boolean;
  /**
   * If provided, renders as an accessible Next.js Link instead of a button.
   */
  href?: string;
}

/**
 * Signature NK-SHOES Add-to-Bag SVG icon with badge cutout.
 */
export function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 34"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 11h22v20H5z" />
      <path d="M10 11V7a6 6 0 0 1 12 0v4" />
      <circle cx="25" cy="27" r="6" fill="currentColor" />
      <path d="M25 24v6M22 27h6" stroke="var(--nk-page, #ffffff)" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "bag",
      size = "default",
      fullWidth = false,
      arrow = false,
      isLoading = false,
      icon,
      href,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Map variants to their playground CSS classes
    const variantClass = {
      bag: "nk-btn--bag",
      slide: "nk-btn--slide",
      diagonal: "nk-btn--diagonal",
      accent: "nk-btn--accent",
      outline: "nk-btn--outline",
    }[variant];

    const sizeClass = size === "compact" ? "nk-btn--compact" : "";
    const blockClass = fullWidth ? "nk-btn--block" : "";
    const arrowClass = arrow ? "nk-btn--arrow" : "";

    // Resolve icon
    const resolvedIcon = icon !== undefined ? icon : variant === "bag" ? <BagIcon /> : null;

    const content = (
      <>
        <span className="nk-btn__label">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <SyncLoader
                color="currentColor"
                size={5}
                margin={2}
                aria-label="Loading..."
              />
              <span>Processing...</span>
            </span>
          ) : (
            children
          )}
        </span>

        {resolvedIcon && !isLoading && (
          <span className="nk-btn__icon" aria-hidden="true">
            {resolvedIcon}
          </span>
        )}
      </>
    );

    const buttonClasses = cn(
      "nk-btn",
      variantClass,
      sizeClass,
      blockClass,
      arrowClass,
      className
    );

    if (href && !disabled && !isLoading) {
      return (
        <Link href={href} className={buttonClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={props.type || "button"}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        className={buttonClasses}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
