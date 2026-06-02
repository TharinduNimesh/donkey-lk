import React from "react";
import { 
  IconBrandYoutube, 
  IconBrandFacebook, 
  IconBrandTiktok, 
  IconBrandInstagram,
  IconShare
} from "@tabler/icons-react";

interface PlatformIconProps {
  platform: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function PlatformIcon({ platform, size = "md" }: PlatformIconProps) {
  const normPlatform = (platform || "").toUpperCase();

  const containerSizes = {
    xs: "w-5 h-5",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4.5 h-4.5",
    md: "w-5.5 h-5.5",
    lg: "w-6.5 h-6.5"
  };

  // Modern gradients for each platform to match connected platforms page
  const platformStyleMap: Record<string, { gradient: string; icon: React.ComponentType<any> }> = {
    YOUTUBE: {
      gradient: "from-red-600 via-red-500 to-rose-500 shadow-red-500/20",
      icon: IconBrandYoutube
    },
    FACEBOOK: {
      gradient: "from-blue-700 via-blue-600 to-sky-500 shadow-blue-600/20",
      icon: IconBrandFacebook
    },
    TIKTOK: {
      gradient: "from-slate-950 via-slate-900 to-zinc-800 shadow-slate-950/20",
      icon: IconBrandTiktok
    },
    INSTAGRAM: {
      gradient: "from-amber-500 via-pink-500 to-purple-600 shadow-pink-500/20",
      icon: IconBrandInstagram
    }
  };

  const config = platformStyleMap[normPlatform];

  if (config) {
    const IconComponent = config.icon;
    return (
      <div className={`
        ${containerSizes[size]} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        bg-gradient-to-tr 
        ${config.gradient} 
        text-white 
        shadow-sm 
        transition-all 
        duration-300
        shrink-0
      `}>
        <IconComponent className={iconSizes[size]} stroke={1.5} />
      </div>
    );
  }

  // Fallback for unknown platforms
  return (
    <div className={`
      ${containerSizes[size]} 
      rounded-full 
      flex 
      items-center 
      justify-center 
      bg-gradient-to-tr 
      from-gray-600 
      to-gray-400 
      text-white 
      shadow-sm
      shrink-0
    `}>
      <IconShare className={iconSizes[size]} stroke={1.5} />
    </div>
  );
}

