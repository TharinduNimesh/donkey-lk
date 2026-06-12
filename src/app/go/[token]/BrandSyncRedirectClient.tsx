"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Video } from "lucide-react";

interface BrandSyncRedirectClientProps {
  token: string;
  initialTitle: string | null;
  initialThumbnailUrl: string | null;
  initialFinalUrl: string | null;
}

export function BrandSyncRedirectClient({
  token,
  initialTitle,
  initialThumbnailUrl,
  initialFinalUrl,
}: BrandSyncRedirectClientProps) {
  const router = useRouter();

  const [statusMessage, setStatusMessage] = useState(initialThumbnailUrl ? "Link verified!" : "Connecting securely...");
  const [errorOccurred, setErrorOccurred] = useState(false);
  
  // Preview states
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialThumbnailUrl);
  const [campaignTitle, setCampaignTitle] = useState<string | null>(initialTitle);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(initialFinalUrl);
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    if (!token) return;

    let active = true;

    const processClick = async () => {
      try {
        if (!initialThumbnailUrl) {
          setStatusMessage("Verifying link connection...");
        }
        const response = await fetch("/api/go/click", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!active) return;

        if (response.ok && data.finalUrl) {
          setRedirectUrl(data.finalUrl);
          if (data.thumbnailUrl) {
            setThumbnailUrl(data.thumbnailUrl);
            setCampaignTitle(data.title || "Campaign Video");
            setStatusMessage("Link verified!");
          } else {
            setStatusMessage("Redirecting to campaign...");
            window.location.replace(data.finalUrl);
          }
        } else {
          setErrorOccurred(true);
          const errCode = data.error;
          if (errCode === "not_available") {
            router.replace("/brandsync/error?code=not_available");
          } else {
            router.replace("/dashboard/buyer");
          }
        }
      } catch (err) {
        console.error("Redirection fetch failed:", err);
        if (active) {
          setErrorOccurred(true);
          router.replace("/dashboard/buyer");
        }
      }
    };

    processClick();

    return () => {
      active = false;
    };
  }, [token, router, initialThumbnailUrl]);

  // Handle countdown timer
  useEffect(() => {
    if (!redirectUrl || !thumbnailUrl) return;

    if (countdown <= 0) {
      window.location.replace(redirectUrl);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, redirectUrl, thumbnailUrl]);

  const handleProceed = () => {
    if (redirectUrl) {
      window.location.replace(redirectUrl);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafa] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Subtle Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pink-500/[0.03] blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-[90%] max-w-sm bg-white border border-gray-100 p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col items-center text-center z-10">
        
        {/* Brand Logo Container */}
        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-2 mb-4 shadow-sm">
          <img src="/logo.png" alt="BrandSync Platform" className="object-contain w-full h-full" />
        </div>

        {/* BrandSync Brand Title */}
        <h2 className="text-gray-900 text-sm font-bold tracking-wide mb-0.5">BrandSync Platform</h2>
        <p className="text-gray-400 text-[10px] mb-6">Secure Campaign Redirect System</p>

        {thumbnailUrl ? (
          // Thumbnail Preview UI
          <div className="w-full flex flex-col items-center animate-fade-in">
            <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-inner relative group mb-4">
              <img 
                src={thumbnailUrl} 
                alt={campaignTitle || "Campaign Thumbnail"} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
                <span className="text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.75 bg-black/45 backdrop-blur rounded-md flex items-center gap-1">
                  <Video className="w-3 h-3 text-pink-500" /> Preview
                </span>
              </div>
            </div>

            <h3 className="text-gray-900 text-sm font-bold line-clamp-2 px-1 mb-1">
              {campaignTitle}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Redirecting to video in <span className="font-bold text-[#C8185A]">{countdown}s</span>...
            </p>

            <button 
              onClick={handleProceed}
              className="w-full bg-[#C8185A] text-white hover:bg-[#A61048] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-98"
            >
              Proceed to Video
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Original Spinner UI
          <div className="w-full flex flex-col items-center">
            {/* Loading Spinner / Arrow Indicator */}
            <div className="relative w-16 h-16 flex items-center justify-center mb-6">
              <div className="absolute inset-0 border border-gray-100 rounded-full" />

              {errorOccurred ? (
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <ArrowRight className="h-5 w-5" />
                </div>
              ) : (
                <>
                  {/* Spinning gradient ring */}
                  <div className="absolute inset-0 border-2 border-transparent border-t-[#C8185A] rounded-full animate-spin" />
                  <Loader2 className="h-5 w-5 text-[#C8185A] animate-spin" />
                </>
              )}
            </div>

            {/* Dynamic Status Text */}
            <p className="text-xs font-semibold text-gray-700 tracking-wide mb-2 transition-all duration-300">
              {statusMessage}
            </p>

            {/* Progress Dots */}
            {!errorOccurred && (
              <div className="flex gap-1 items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8185A] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8185A]/75 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8185A]/45 animate-bounce" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <p className="absolute bottom-6 text-[9px] text-gray-400 font-bold tracking-widest uppercase">
        Secured by BrandSync Link-Shield
      </p>
    </div>
  );
}
