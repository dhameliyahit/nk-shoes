"use client";

import { SyncLoader } from "react-spinners";
import { cn } from "@/lib/utils";

export interface LoaderProps {
  /**
   * Size of the individual dots in pixels.
   * @default 10
   */
  size?: number;
  /**
   * Dot color. Defaults to premium minimalist black (#111111).
   * @default "#111111"
   */
  color?: string;
  /**
   * Optional text label displayed below the spinner.
   */
  text?: string;
  /**
   * If true, renders the loader centered across the entire viewport.
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Custom wrapper CSS classes.
   */
  className?: string;
}

export function Loader({
  size = 10,
  color = "#111111",
  text,
  fullScreen = false,
  className,
}: LoaderProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-4",
        fullScreen ? "fixed inset-0 z-50 bg-white/80 backdrop-blur-sm min-h-screen" : "w-full py-8",
        className
      )}
    >
      <SyncLoader
        color={color}
        size={size}
        margin={4}
        speedMultiplier={0.85}
        aria-label="Loading spinner"
      />
      {text && (
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {text}
        </p>
      )}
    </div>
  );

  return content;
}

export default Loader;
