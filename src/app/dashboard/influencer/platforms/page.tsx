"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import type { Database } from "@/types/database.types";
import { SocialVerification } from "@/components/ui/social-verification";
import { InfluencerSidebar, InfluencerTopbar } from "@/components/dashboard/influencer-sidebar";
import { Plus, Users } from "lucide-react";
import { 
  IconBrandYoutube, 
  IconBrandFacebook, 
  IconBrandTiktok, 
  IconBrandInstagram 
} from "@tabler/icons-react";

type InfluencerProfile = Database["public"]["Tables"]["influencer_profile"]["Row"];
type ContactDetail = {
  id: number;
  type: Database["public"]["Enums"]["ContactTypes"];
  detail: string;
  contactStatus: {
    is_verified: boolean;
    verified_at: string | null;
  } | null;
};
type UserProfile = Database["public"]["Tables"]["profile"]["Row"];

const PINK = "#C8185A";

export default function PlatformsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient<Database>();
  
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contactDetails, setContactDetails] = useState<ContactDetail[]>([]);
  const activePlatform = searchParams.get("platform") as Database["public"]["Enums"]["Platforms"] | null;

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: profileData } = await supabase.from("profile").select("*").eq("id", user.id).single();
      if (profileData) setUserProfile(profileData);

      const { data: profilesData } = await supabase.from("influencer_profile").select("*").eq("user_id", user.id);
      if (profilesData) setProfiles(profilesData);

      const { data: contactData } = await supabase.from("contact_details").select(`
        id, type, detail, contactStatus:contact_status(is_verified, verified_at)
      `).eq("user_id", user.id);
      
      if (contactData) setContactDetails(contactData);
    };

    fetchData();
  }, [supabase, router]);

  const getPlatformColor = (platform: Database["public"]["Enums"]["Platforms"]) => {
    const colors = { YOUTUBE: "bg-red-500", FACEBOOK: "bg-blue-600", INSTAGRAM: "bg-pink-500", TIKTOK: "bg-black" };
    return colors[platform] || "bg-gray-500";
  };

  const getPlatformIcon = (platform: Database["public"]["Enums"]["Platforms"], className = "w-2.5 h-2.5 text-white") => {
    const icons = {
      YOUTUBE: IconBrandYoutube,
      FACEBOOK: IconBrandFacebook,
      INSTAGRAM: IconBrandInstagram,
      TIKTOK: IconBrandTiktok,
    };
    const IconComponent = icons[platform];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  const handleConnect = (platform: Database["public"]["Enums"]["Platforms"]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("platform", platform);
    router.push(`/dashboard/influencer/platforms?${params.toString()}`);
  };

  const handleVerificationComplete = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("platform");
    router.push(`/dashboard/influencer/platforms?${params.toString()}`);

    const fetchProfiles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data: profilesData } = await supabase.from("influencer_profile").select("*").eq("user_id", user.id);
      if (profilesData) setProfiles(profilesData);
    };
    fetchProfiles();
  };

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <InfluencerSidebar activePage="platforms" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <InfluencerTopbar title="Connected Platforms" />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {!activePlatform ? (
            <>
              {/* Connected Platforms Header */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Your Connected Accounts</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Manage your linked social media profiles</p>
                  </div>
                </div>
                
                {profiles.length > 0 ? (
                  <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {profiles.map((profile) => (
                      <div key={profile.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-pink-200 transition-colors shadow-sm relative overflow-hidden">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold overflow-hidden border border-gray-100 ${!profile.profile_pic ? getPlatformColor(profile.platform) : ""}`}>
                              {profile.profile_pic ? (
                                <img src={profile.profile_pic} alt={profile.name} className="w-full h-full object-cover" />
                              ) : profile.platform.charAt(0)}
                            </div>
                            {/* Platform badge overlay */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center ${getPlatformColor(profile.platform)} shadow-sm`}>
                              {getPlatformIcon(profile.platform)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h3 className="font-semibold text-gray-900 truncate pr-2">{profile.name}</h3>
                              <Badge variant={profile.is_verified ? "success" : "secondary"} className={`text-[10px] pointer-events-none ${profile.is_verified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                {profile.is_verified ? "Verified" : "Pending"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${getPlatformColor(profile.platform)}`}>
                                {profile.platform}
                              </span>
                              <span className="text-xs text-gray-500">
                                {profile.followers?.toLocaleString()} followers
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white">
                    <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-pink-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">No platforms connected</h3>
                    <p className="text-xs text-gray-500 mt-1">Connect your first social media account below to start applying for tasks.</p>
                  </div>
                )}
              </div>

              {/* Connect New Platform Grid */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-base font-semibold text-gray-900">Add New Platform</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Select a network to link to your BrandSync profile</p>
                </div>
                <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {["YOUTUBE", "FACEBOOK", "TIKTOK", "INSTAGRAM"].map((platform) => {
                    const isConnected = profiles.some(p => p.platform === platform);
                    const connectedCount = profiles.filter(p => p.platform === platform).length;
                    
                    return (
                      <button
                        key={platform}
                        onClick={() => handleConnect(platform as Database["public"]["Enums"]["Platforms"])}
                        className={`group relative p-4 rounded-xl text-left border transition-all ${
                          isConnected 
                            ? "border-gray-200 hover:border-gray-300 bg-white" 
                            : "border-pink-100 hover:border-pink-300 bg-pink-50/30 hover:bg-pink-50/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getPlatformColor(platform as Database["public"]["Enums"]["Platforms"])} shadow-sm`}>
                            {getPlatformIcon(platform as Database["public"]["Enums"]["Platforms"], "w-5 h-5 text-white")}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{platform}</div>
                            <div className="text-[10px] text-gray-500">
                              {isConnected ? `${connectedCount} account(s)` : "Not connected"}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className={isConnected ? "text-gray-500" : "text-pink-600"}>
                            {isConnected ? "Connect another" : "Connect now"}
                          </span>
                          <Plus className={`h-4 w-4 ${isConnected ? "text-gray-400" : "text-pink-500"} group-hover:scale-110 transition-transform`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Verification Flow */
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Verify {activePlatform} Account</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Follow the steps below to authenticate your profile</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("platform");
                      router.push(`/dashboard/influencer/platforms?${params.toString()}`);
                    }}
                    className="h-8 text-xs bg-white text-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="p-6 bg-white">
                  <SocialVerification
                    verifiedEmail={userProfile?.email}
                    contactDetails={contactDetails}
                    platform={activePlatform}
                    onVerify={handleVerificationComplete}
                    onSubmitUrl={handleVerificationComplete}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}