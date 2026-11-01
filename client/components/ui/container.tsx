import React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  size?: "sm" | "md" | "default" | "wide" | "fluid";
  clean?: boolean; // If true, removes horizontal padding
  className?: string;
  children: React.ReactNode;
}

/**
 * Reusable layout container just like Bootstrap's .container
 * Centers content with maximum width and responsive gutters.
 */
export function Container({
  as: Component = "div",
  size = "default",
  clean = false,
  className,
  children,
  ...props
}: ContainerProps) {
  const sizeMap = {
    sm: "max-w-4xl",
    md: "max-w-5xl",
    default: "max-w-[1440px]",
    wide: "max-w-[1600px]",
    fluid: "max-w-full",
  };

  return (
    <Component
      className={cn(
        "w-full mx-auto",
        !clean && "px-4 sm:px-6 md:px-8 lg:px-10",
        sizeMap[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
