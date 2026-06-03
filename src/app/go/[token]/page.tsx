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
    <div className="min-h-screen w-full bg-[#fafafa] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Subtle Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pink-500/[0.03] blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-[90%] max-w-sm bg-white border border-gray-100 p-8 rounded-2xl shadow-sm flex flex-col items-center text-center z-10">

        {/* Brand Logo Container */}
        <div className="w-14 h-14 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-2.5 mb-5 shadow-sm">
          <img src="/logo.png" alt="BrandSync Platform" className="object-contain w-full h-full" />
        </div>

        {/* BrandSync Brand Title */}
        <h2 className="text-gray-900 text-base font-bold tracking-wide mb-1">BrandSync Platform</h2>
        <p className="text-gray-400 text-[11px] mb-8">Secure Campaign Redirect System</p>

        {/* Loading Spinner / Arrow Indicator */}
        <div className="relative w-16 h-16 flex items-center justify-center mb-8">
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

      {/* Footer Info */}
      <p className="absolute bottom-6 text-[9px] text-gray-400 font-bold tracking-widest uppercase">
        Secured by BrandSync Link-Shield
      </p>
    </div>
  );
}