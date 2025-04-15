"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface FancyTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
}

export function FancyText({ 
  children, 
  className,
  as: Component = "span" 
}: FancyTextProps) {
  return (
    <Component className={cn("relative inline-block font-display", className)}>
      {children}
      <div 
        className="-z-10 absolute bottom-1 -right-3 h-[0.6em] w-[105%] -rotate-5 bg-contain bg-center bg-no-repeat opacity-60"
        style={{ 
          backgroundImage: "url('/images/fancy-underline.webp')",
          transform: "translateY(0.3em) rotate(-3deg) scale(1.05, 1)"
        }}
        aria-hidden="true"
      />
    </Component>
  );
}