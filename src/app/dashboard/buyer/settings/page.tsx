"use client";

import { useState, useEffect } from "react";
import { BuyerSidebar, BuyerTopbar } from "@/components/dashboard/buyer-sidebar";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const PINK = "#C8185A";

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profile")
          .select("name, email")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setProfile(data);
          setNameInput(data.name || "");
        }
      } catch (err) {
        console.error("Error loading profile settings:", err);
        toast.error("Failed to load profile details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!nameInput.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profile")
        .update({ name: nameInput.trim() })
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, name: nameInput.trim() } : null);
      setIsEditing(false);
      toast.success("Profile details updated successfully");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setNameInput(profile?.name || "");
    setIsEditing(false);
  };

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <BuyerSidebar activePage="settings" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <BuyerTopbar />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 flex items-start justify-center">
          <div className="max-w-2xl w-full space-y-6 mt-4">
            
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your brand profile and identity details.</p>
            </div>

            {/* Profile Identity Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-gray-900">Brand Identity</h2>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="text-xs font-semibold hover:underline" 
                    style={{ color: PINK }}
                    disabled={isLoading}
                  >
                    Edit Detail
                  </button>
                ) : (
                  <button 
                    onClick={handleDiscard} 
                    className="text-xs font-semibold hover:underline text-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-gray-100 rounded-xl" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1.5 block">Legal Brand Name</label>
                    <Input 
                      value={isEditing ? nameInput : (profile?.name || "")} 
                      onChange={(e) => setNameInput(e.target.value)}
                      disabled={!isEditing} 
                      className={`h-9 text-sm ${isEditing ? "bg-white border-pink-300" : "bg-gray-50 text-gray-700"}`} 
                      placeholder="Enter Legal Brand Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1.5 block">Associated Account Email</label>
                    <Input value={profile?.email || ""} readOnly disabled className="h-9 bg-gray-50 text-sm text-gray-500 border-gray-200" />
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button 
                    onClick={handleDiscard} 
                    className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isSaving}
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 flex items-center justify-center" 
                    style={{ background: PINK }}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
