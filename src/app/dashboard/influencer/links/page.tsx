"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { InfluencerSidebar, InfluencerTopbar } from "@/components/dashboard/influencer-sidebar";
import { ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PINK = "#C8185A";

type BrandSyncLinkEntry = {
  id: number;
  title: string;
  platform: Database['public']['Enums']['Platforms'];
  thumbnailUrl?: string | null;
  brandSyncUrl: string;
  createdAt: string;
  uniqueUrl?: string | null;
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
                  {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-50 rounded-lg animate-pulse" />)}
                </div>
              ) : brandSyncLinks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {brandSyncLinks.map((link) => (
                    <div key={link.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-pink-200 transition-colors">
                      {link.thumbnailUrl ? (
                        <img src={link.thumbnailUrl} alt={link.title} className="h-32 w-full object-cover" />
                      ) : (
                        <div className="h-32 w-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                          <ExternalLink className="h-8 w-8 text-pink-200" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">{link.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild className="flex-1 text-xs h-8 shadow-sm text-white" style={{ background: PINK }}>
                            <a href={link.uniqueUrl || link.brandSyncUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0 shrink-0 text-gray-500"
                            onClick={async () => {
                              await navigator.clipboard.writeText(link.uniqueUrl || link.brandSyncUrl);
                              toast.success("Link copied!");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
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
