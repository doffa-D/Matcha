import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "matcha" | "neutral" | "coral";
  className?: string;
}

export const Badge = ({
  children,
  variant = "neutral",
  className,
}: BadgeProps) => {
  const variants = {
    matcha: "bg-matcha-light text-matcha border border-matcha/20",
    neutral: "bg-white/20 backdrop-blur-md text-white",
    coral: "bg-coral-light text-coral",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-[13px] font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
