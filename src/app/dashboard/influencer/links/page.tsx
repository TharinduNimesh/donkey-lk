"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { InfluencerSidebar, InfluencerTopbar } from "@/components/dashboard/influencer-sidebar";
import { ExternalLink, Copy, Eye, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PINK = "#C8185A";

const platformColors: Record<string, string> = {
  YOUTUBE: "bg-red-500",
  FACEBOOK: "bg-blue-600",
  TIKTOK: "bg-black",
  INSTAGRAM: "bg-pink-500",
};

type BrandSyncLinkEntry = {
  id: number;
  title: string;
  platform: Database['public']['Enums']['Platforms'];
  thumbnailUrl?: string | null;
  brandSyncUrl: string;
  createdAt: string;
  uniqueUrl?: string | null;
  clicks?: number;
  myClicks?: number;
  shares?: number;
};

export default function InfluencerLinksPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const [brandSyncLinks, setBrandSyncLinks] = useState<BrandSyncLinkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/auth"); return; }

        const response = await fetch("/api/brandsync-links?scope=public");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load BrandSync links");

        const links: BrandSyncLinkEntry[] = data.links || [];
        const linksWithTokens = await Promise.all(
          links.map(async (link) => {
            try {
              const tokenResp = await fetch(`/api/brandsync-links/${link.id}/influencer-token`, { credentials: 'include' });
              if (tokenResp.ok) return { ...link, uniqueUrl: (await tokenResp.json()).uniqueUrl as string };
            } catch {}
            return { ...link, uniqueUrl: link.brandSyncUrl };
          })
        );
        setBrandSyncLinks(linksWithTokens);
      } catch (error) {
        console.error("Error fetching BrandSync links:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, [supabase, router]);

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <InfluencerSidebar activePage="links" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <InfluencerTopbar title="BrandSync Links" />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-900">All BrandSync Links</h2>
              <p className="text-xs text-gray-500 mt-0.5">Your unique tracking links for active campaigns.</p>
            </div>

            <div className="p-5">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-52 bg-gray-50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : brandSyncLinks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {brandSyncLinks.map((link) => (
                    <div
                      key={link.id}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-pink-100 transition-all duration-200 group"
                    >
                      {/* Thumbnail */}
                      <div className="relative">
                        {link.thumbnailUrl ? (
                          <img src={link.thumbnailUrl} alt={link.title} className="h-36 w-full object-cover" />
                        ) : (
                          <div className="h-36 w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                            <ExternalLink className="h-7 w-7 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="px-4 pt-3 pb-4">
                        {/* Title */}
                        <div className="mb-2">
                          <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">{link.title}</h3>
                        </div>

                        {/* Clicks stats block */}
                        <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100/50">
                          <div className="flex flex-col items-center justify-center py-1 border-r border-gray-200">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1 mb-0.5">
                              <Eye className="h-3 w-3" /> Total Clicks
                            </span>
                            <span className="text-xs font-bold text-gray-700">{(link.clicks ?? 0).toLocaleString()} / {(link.shares ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center py-1">
                            <span className="text-[10px] text-pink-500 font-semibold uppercase tracking-wider flex items-center gap-1 mb-0.5">
                              <MousePointerClick className="h-3 w-3" /> My Clicks
                            </span>
                            <span className="text-xs font-bold text-pink-600 bg-pink-50/50 px-1.5 py-0.5 rounded-md">{(link.myClicks ?? 0).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            className="flex-1 text-xs h-8 font-medium text-white shadow-none"
                            style={{ background: PINK }}
                            onClick={async () => {
                              await navigator.clipboard.writeText(link.uniqueUrl || link.brandSyncUrl);
                              toast.success("Link copied!");
                            }}
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-gray-450 border-gray-200 hover:text-gray-900"
                            asChild
                          >
                            <a href={link.uniqueUrl || link.brandSyncUrl} target="_blank" rel="noopener noreferrer" title="Open Link">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-5 w-5 text-pink-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No links yet</p>
                  <p className="text-xs text-gray-500 mt-1">Check back when you have an active campaign.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
