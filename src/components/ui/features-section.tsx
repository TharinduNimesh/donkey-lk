"use client";
import Image from "next/image";
import React from "react";
import { WobbleCard } from "./wobble-card";

export function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full p-4">
      <WobbleCard
        containerClassName="col-span-1 lg:col-span-2 h-full bg-gradient-to-br from-pink-50/90 via-pink-100/80 to-pink-200/90 dark:from-pink-950/40 dark:via-pink-900/30 dark:to-pink-800/40 min-h-[500px] lg:min-h-[300px] backdrop-blur-sm"
        className=""
      >
        <div className="max-w-xs">
          <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-display font-semibold tracking-tight text-pink-950 dark:text-white">
            Connect with Top Brands Worldwide
          </h2>
          <p className="mt-4 text-left text-base/6 text-pink-950/70 dark:text-pink-100/70">
            Join thousands of creators collaborating with leading brands. Our platform makes it easy to find partnerships that match your niche and style.
          </p>
        </div>
        <Image
          src="/images/social-media-banner.webp"
          width={600}
          height={600}
          alt="Global brands network"
          className="absolute -right-4 lg:-right-[20%] -bottom-10 object-contain rounded-2xl opacity-40 dark:opacity-20"
        />
      </WobbleCard>

      <WobbleCard 
        containerClassName="col-span-1 min-h-[300px] bg-gradient-to-br from-pink-100/90 via-pink-50/80 to-pink-100/90 dark:from-pink-900/40 dark:via-pink-950/30 dark:to-pink-900/40 backdrop-blur-sm"
      >
        <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-display font-semibold tracking-tight text-pink-950 dark:text-white">
          Monetize Your Influence
        </h2>
        <p className="mt-4 max-w-[26rem] text-left text-base/6 text-pink-950/70 dark:text-pink-100/70">
          Turn your social media presence into a sustainable income. Get paid for promoting products you believe in.
        </p>
      </WobbleCard>

      <WobbleCard 
        containerClassName="col-span-1 lg:col-span-3 bg-gradient-to-br from-pink-200/90 via-pink-100/80 to-pink-50/90 dark:from-pink-800/40 dark:via-pink-900/30 dark:to-pink-950/40 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px] backdrop-blur-sm"
      >
        <div className="max-w-sm">
          <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-display font-semibold tracking-tight text-pink-950 dark:text-white">
            Grow Your Brand with Authentic Creators
          </h2>
          <p className="mt-4 max-w-[26rem] text-left text-base/6 text-pink-950/70 dark:text-pink-100/70">
            Connect with creators who truly understand your brand. Our AI-powered matching system ensures authentic partnerships that drive real engagement.
          </p>
        </div>
        <Image
          src="/images/influencer-banner.webp"
          width={600}
          height={600}
          alt="Analytics dashboard"
          className="absolute -right-10 md:-right-[10%] -bottom-10 object-contain rounded-2xl opacity-40 dark:opacity-20"
        />
      </WobbleCard>
    </div>
  );
}