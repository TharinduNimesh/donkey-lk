"use client";

import { ReactNode } from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-pink-50 container relative min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative h-full flex-col p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-800 via-purple-700 to-pink-700 dark:from-pink-800/95 dark:via-purple-800/95 dark:to-pink-700/95 rounded-3xl m-2">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.18),transparent_50%),radial-gradient(circle_at_0%_0%,rgba(236,72,153,0.18),transparent_50%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-pink-500/[0.05] to-transparent">
            <SparklesCore
              id="tsparticlesfullpage"
              background="transparent"
              minSize={0.6}
              maxSize={1.4}
              particleDensity={100}
              className="h-full w-full"
              particleColor="#fdf2f8"
            />
          </div>
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/logo.png" alt="BrandSync" className="h-8 w-8 mr-2" />
          BrandSync
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &quot;BrandSync has revolutionized how I collaborate with brands. The platform makes monetization seamless and authentic!&quot;
            </p>
            <footer className="text-sm text-pink-100/80">Sofia Chen - Lifestyle Influencer</footer>
          </blockquote>
        </div>
      </div>
      {children}
    </div>
  );
}