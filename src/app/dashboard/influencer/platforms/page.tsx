"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import type { Database } from "@/types/database.types";
import { SocialVerification } from "@/components/ui/social-verification";
import { useState } from "react";

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setUserProfile(profileData);
      }

      // Fetch connected social media profiles
      const { data: profilesData } = await supabase
        .from("influencer_profile")
        .select("*")
        .eq("user_id", user.id);

      if (profilesData) {
        setProfiles(profilesData);
      }

      // Fetch contact details with verification status
      const { data: contactData } = await supabase
        .from("contact_details")
        .select(`
          id,
          type,
          detail,
          contactStatus:contact_status(
            is_verified,
            verified_at
          )
        `)
        .eq("user_id", user.id);

      if (contactData) {
        setContactDetails(contactData);
      }
    };

    fetchData();
  }, [supabase, router]);

  const getPlatformColor = (platform: Database["public"]["Enums"]["Platforms"]) => {
    const colors = {
      YOUTUBE: "bg-red-500",
      FACEBOOK: "bg-blue-600",
      INSTAGRAM: "bg-pink-500",
      TIKTOK: "bg-black",
    };
    return colors[platform] || "bg-gray-500";
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

      const { data: profilesData } = await supabase
        .from("influencer_profile")
        .select("*")
        .eq("user_id", user.id);

      if (profilesData) {
        setProfiles(profilesData);
      }
    };
    fetchProfiles();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600 font-['P22MackinacPro-Bold']">
              Connected Platforms
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your social media platforms and connect new accounts
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            Back to Dashboard
          </Button>
        </motion.div>

        {!activePlatform ? (
          <>
            {/* Connected Platforms */}
            {profiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
              >
                {profiles.map((profile) => (
                  <motion.div
                    key={profile.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-6 border border-pink-100 dark:border-pink-900/20 hover:shadow-lg transition-all">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white overflow-hidden ${
                            !profile.profile_pic ? getPlatformColor(profile.platform) : ""
                          }`}
                        >
                          {profile.profile_pic ? (
                            <img
                              src={profile.profile_pic}
                              alt={profile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            profile.platform.charAt(0)
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold font-['P22MackinacPro-Medium']">
                              {profile.name}
                            </h3>
                            <Badge
                              variant={profile.is_verified ? "success" : "secondary"}
                              className={profile.is_verified 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                : ""}
                            >
                              {profile.is_verified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {profile.followers?.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Connect New Platform */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border border-pink-100 dark:border-pink-900/20">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 font-['P22MackinacPro-Medium']">
                    Connect New Platform
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {["YOUTUBE", "FACEBOOK", "TIKTOK", "INSTAGRAM"].map((platform) => (
                      <motion.div
                        key={platform}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full h-auto p-4 border-2 hover:border-pink-400 dark:hover:border-pink-500"
                          onClick={() => handleConnect(platform as Database["public"]["Enums"]["Platforms"])}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getPlatformColor(platform as Database["public"]["Enums"]["Platforms"])}`}>
                              {platform.charAt(0)}
                            </div>
                            <div className="text-left">
                              <div className="font-semibold">{platform}</div>
                              <div className="text-sm text-muted-foreground">
                                {profiles.filter(p => p.platform === platform).length > 0
                                  ? `${profiles.filter(p => p.platform === platform).length} account(s) connected`
                                  : "Connect account"}
                              </div>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border border-pink-100 dark:border-pink-900/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold font-['P22MackinacPro-Medium']">
                    Verify {activePlatform} Account
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("platform");
                      router.push(`/dashboard/influencer/platforms?${params.toString()}`);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Back to platforms
                  </Button>
                </div>
                <SocialVerification
                  verifiedEmail={userProfile?.email}
                  contactDetails={contactDetails}
                  platform={activePlatform}
                  onVerify={handleVerificationComplete}
                  onSubmitUrl={handleVerificationComplete}
                />
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}