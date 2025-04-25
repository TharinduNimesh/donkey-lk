import React from "react";
import Image from "next/image";

interface PlatformIconProps {
  platform: string;
  size?: "sm" | "md" | "lg";
}

export function PlatformIcon({ platform, size = "md" }: PlatformIconProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };

  const imageSizes = {
    sm: 32,
    md: 40,
    lg: 48
  };

  // Map platform names to their image files
  const platformImageMap: Record<string, string> = {
    'YOUTUBE': '/platforms/youtube.png',
    'FACEBOOK': '/platforms/facebook.png',
    'TIKTOK': '/platforms/tiktok.png',
    'INSTAGRAM': '/platforms/instagram.png'
  };

  // Get the image path for the platform
  const imagePath = platformImageMap[platform] || '';

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden flex items-center justify-center bg-white border border-gray-200 dark:border-gray-700`}>
      {imagePath ? (
        <Image
          src={imagePath}
          alt={`${platform} logo`}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="object-contain p-1"
        />
      ) : (
        // Fallback for unknown platforms
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300`}>
          {platform?.charAt(0)}
        </div>
      )}
    </div>
  );
}
