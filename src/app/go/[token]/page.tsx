"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

export default function BrandSyncRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [statusMessage, setStatusMessage] = useState("Connecting securely...");
  const [errorOccurred, setErrorOccurred] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;

    const processClick = async () => {
      try {
        setStatusMessage("Verifying link connection...");
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
          setStatusMessage("Redirecting to campaign...");
          // Use replace to avoid keeping the redirect page in browser history
          window.location.replace(data.finalUrl);
        } else {
          setErrorOccurred(true);
          const errCode = data.error;
          if (errCode === "already_clicked") {
            router.replace("/brandsync/error?code=already_clicked");
          } else if (errCode === "not_available") {
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

    // A small timeout to make the transitions smooth and give a premium feel
    const timer = setTimeout(() => {
      processClick();
    }, 600);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [token, router]);

  return (
    <div className="min-h-screen w-full bg-[#0a0b10] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-pink-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[90px] pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="w-[90%] max-w-md bg-white/[0.02] border border-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center z-10">
        
        {/* Animated Brand Logo Container */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/10 animate-pulse">
          <span className="text-white font-extrabold text-2xl tracking-tighter">B</span>
        </div>

        {/* BrandSync Brand Title */}
        <h2 className="text-white text-lg font-bold tracking-wide mb-1">BrandSync Platform</h2>
        <p className="text-gray-400 text-xs mb-8">Secure Campaign Redirect System</p>

        {/* Loading Spinner / Arrow Indicator */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-8">
          <div className="absolute inset-0 border border-white/5 rounded-full" />
          
          {errorOccurred ? (
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <ArrowRight className="h-6 w-6" />
            </div>
          ) : (
            <>
              {/* Spinning gradient ring */}
              <div className="absolute inset-0 border-2 border-transparent border-t-pink-500 border-r-pink-500/50 rounded-full animate-spin" />
              <Loader2 className="h-6 w-6 text-pink-500 animate-spin" />
            </>
          )}
        </div>

        {/* Dynamic Status Text */}
        <p className="text-sm font-semibold text-white/90 tracking-wide mb-2 transition-all duration-300">
          {statusMessage}
        </p>
        
        {/* Progress Dots */}
        {!errorOccurred && (
          <div className="flex gap-1.5 items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500/80 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 animate-bounce" />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <p className="absolute bottom-6 text-[10px] text-gray-500 font-medium tracking-widest uppercase">
        Secured by BrandSync Link-Shield
      </p>
    </div>
  );
}