"use client";

import { useState, useEffect } from "react";
import { InfluencerSidebar, InfluencerTopbar } from "@/components/dashboard/influencer-sidebar";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Banknote, 
  Trash2,
  Plus, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  User
} from "lucide-react";

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-0 transition duration-500 group-hover/input:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover/input:opacity-100" />
  </>
);

const LabelInputContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex w-full flex-col space-y-2 ${className ?? ""}`}>{children}</div>
);

type WithdrawalOption = Database["public"]["Tables"]["withdrawal_options"]["Row"];

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Bank payout settings states
  const [withdrawalOptions, setWithdrawalOptions] = useState<WithdrawalOption[]>([]);
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
  });
  const [showAccountNumberId, setShowAccountNumberId] = useState<number | null>(null);
  const [submittingOption, setSubmittingOption] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchData = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("name, email")
          .eq("id", user.id)
          .neq("name", "non_existent_name_" + new Date().getTime()) // cache buster
          .single();

        if (!profileError && profileData) {
          setProfile(profileData);
          setNameInput(profileData.name || "");
        }

        // Fetch bank details — exclude soft-deleted rows
        const { data: bankData, error: bankError } = await supabase
          .from("withdrawal_options")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });

        if (!bankError && bankData) {
          setWithdrawalOptions(bankData);
          if (bankData.length === 0) {
            setShowAddForm(true);
          }
        }
      } catch (err) {
        console.error("Error loading settings data:", err);
        toast.error("Failed to load settings details");
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    fetchData(true);

    const handleFocus = () => {
      fetchData(false);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("popstate", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("popstate", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [supabase]);

  const handleSave = async () => {
    if (!nameInput.trim()) {
      toast.error("Please enter your name");
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

  const handleSaveBankDetails = async () => {
    if (
      !bankDetails.accountName ||
      !bankDetails.accountNumber ||
      !bankDetails.bankName
    ) {
      toast.error("Please fill all required bank details");
      return;
    }

    setSubmittingOption(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user");
      }

      const { data, error } = await supabase
        .from("withdrawal_options")
        .insert([
          {
            account_name: bankDetails.accountName,
            account_number: bankDetails.accountNumber,
            bank_name: bankDetails.bankName,
            branch_name: bankDetails.branch,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setWithdrawalOptions((prev) => [data, ...prev]);
      setBankDetails({
        accountName: "",
        accountNumber: "",
        bankName: "",
        branch: "",
      });
      setShowAddForm(false);
      toast.success("Bank details saved successfully");
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast.error("Failed to save bank details");
    } finally {
      setSubmittingOption(false);
    }
  };

  const handleHideBankAccount = async (optionId: number) => {
    try {
      const res = await fetch(`/api/withdrawals?optionId=${optionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to hide");
      }
      const updated = withdrawalOptions.filter((opt) => opt.id !== optionId);
      setWithdrawalOptions(updated);
      if (updated.length === 0) setShowAddForm(true);
      toast.success("Bank account hidden successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to hide bank account");
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return "";
    if (accountNumber.length <= 4) return accountNumber;

    const lastFourDigits = accountNumber.slice(-4);
    const maskedPart = accountNumber.slice(0, -4).replace(/./g, "•");
    return maskedPart + lastFourDigits;
  };

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 font-sans overflow-hidden relative">
      {/* Decorative Aurora background blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-pink-400/10 dark:bg-pink-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-400/15 dark:bg-purple-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-100/5 dark:bg-blue-900/5 blur-3xl opacity-50 pointer-events-none" />

      <InfluencerSidebar activePage="settings" />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <InfluencerTopbar title="Settings" />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 flex items-start justify-center">
          <div className="max-w-2xl w-full space-y-6 mt-4 pb-12">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 dark:from-pink-400 dark:via-pink-300 dark:to-purple-400">Settings</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Manage your personal profile, display details, and payout options.</p>
            </div>

            {/* Profile Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border border-white/25 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl p-6 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-pink-650 dark:text-pink-400" />
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Personal Identity</h2>
                </div>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="text-xs font-semibold hover:underline text-pink-600 dark:text-pink-400" 
                    disabled={isLoading}
                  >
                    Edit Detail
                  </button>
                ) : (
                  <button 
                    onClick={handleDiscard} 
                    className="text-xs font-semibold hover:underline text-zinc-500 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-zinc-200 dark:bg-zinc-800/40 rounded-xl" />
                  <div className="h-10 bg-zinc-200 dark:bg-zinc-800/40 rounded-xl" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1.5 block">Full Display Name</label>
                    <Input 
                      value={isEditing ? nameInput : (profile?.name || "")} 
                      onChange={(e) => setNameInput(e.target.value)}
                      disabled={!isEditing} 
                      className={`h-11 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-pink-500/20 focus-visible:border-pink-500/50 ${isEditing ? "bg-white/80 dark:bg-zinc-900/80 border-pink-500/30" : "bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-705 dark:text-zinc-350 border-zinc-200/50 dark:border-zinc-800/50"}`} 
                      placeholder="Enter Display Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1.5 block">Registered Account Email</label>
                    <Input value={profile?.email || ""} readOnly disabled className="h-11 bg-zinc-100/50 dark:bg-zinc-900/50 text-sm text-zinc-500 border-zinc-200/50 dark:border-zinc-800/50 rounded-xl" />
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="mt-6 pt-6 border-t border-zinc-200/30 dark:border-zinc-800/30 flex items-center justify-end gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleDiscard} 
                    className="px-5 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-750 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    disabled={isSaving}
                  >
                    Discard
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    className="px-5 h-10 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 shadow-md shadow-pink-500/10 transition-opacity hover:opacity-90 flex items-center justify-center" 
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Bank Details & Payout Settings Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="border border-white/25 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl p-6 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-pink-650 dark:text-pink-400" />
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Payout & Bank Settings</h2>
                </div>
                {!showAddForm && withdrawalOptions.length > 0 && (
                  <button 
                    onClick={() => setShowAddForm(true)} 
                    className="text-xs font-semibold hover:underline text-pink-600 dark:text-pink-400 flex items-center gap-1"
                    disabled={isLoading}
                  >
                    <Plus size={14} /> Add Bank Option
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-zinc-200 dark:bg-zinc-800/40 rounded-2xl" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Saved accounts list */}
                  {!showAddForm && withdrawalOptions.length > 0 && (
                    <div className="space-y-3">
                      {withdrawalOptions.map((option) => (
                        <div
                          key={option.id}
                          className="p-4 rounded-2xl bg-white/30 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 transition-all duration-200"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {option.bank_name}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                                {option.account_name} •{" "}
                                <span className="font-mono text-xs font-semibold">
                                  {showAccountNumberId === option.id
                                    ? option.account_number
                                    : maskAccountNumber(option.account_number)}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setShowAccountNumberId(showAccountNumberId === option.id ? null : option.id)}
                                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors"
                              >
                                {showAccountNumberId === option.id ? (
                                  <EyeOff size={15} />
                                ) : (
                                  <Eye size={15} />
                                )}
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleHideBankAccount(option.id)}
                                title="Delete bank account"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/30 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add form */}
                  {showAddForm && (
                    <div className="space-y-5 border border-pink-500/10 dark:border-pink-500/5 bg-pink-50/20 dark:bg-pink-950/10 p-5 rounded-2xl">
                      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {withdrawalOptions.length === 0 ? "Setup Bank Payout Details" : "Add Bank Account"}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <LabelInputContainer>
                          <Label htmlFor="accountName" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Account Holder Name <span className="text-pink-500">*</span>
                          </Label>
                          <div className="group/input relative">
                            <Input
                              id="accountName"
                              value={bankDetails.accountName}
                              onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                              placeholder="Enter account name"
                            />
                            <BottomGradient />
                          </div>
                        </LabelInputContainer>
                        <LabelInputContainer>
                          <Label htmlFor="accountNumber" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Account Number <span className="text-pink-500">*</span>
                          </Label>
                          <div className="group/input relative">
                            <Input
                              id="accountNumber"
                              value={bankDetails.accountNumber}
                              onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                              placeholder="Enter account number"
                            />
                            <BottomGradient />
                          </div>
                        </LabelInputContainer>
                        <LabelInputContainer>
                          <Label htmlFor="bankName" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Bank Name <span className="text-pink-500">*</span>
                          </Label>
                          <div className="group/input relative">
                            <Input
                              id="bankName"
                              value={bankDetails.bankName}
                              onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                              placeholder="Enter bank name"
                            />
                            <BottomGradient />
                          </div>
                        </LabelInputContainer>
                        <LabelInputContainer>
                          <Label htmlFor="branch" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Branch
                          </Label>
                          <div className="group/input relative">
                            <Input
                              id="branch"
                              value={bankDetails.branch}
                              onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                              placeholder="Enter branch name (optional)"
                            />
                            <BottomGradient />
                          </div>
                        </LabelInputContainer>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4 mt-2">
                        <div className="text-xs text-zinc-550 dark:text-zinc-400 font-medium flex items-center">
                          <ShieldCheck size={14} className="mr-1.5 text-emerald-500" /> Secure Encryption
                        </div>
                        <div className="flex gap-2">
                          {withdrawalOptions.length > 0 && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setBankDetails({
                                  accountName: "",
                                  accountNumber: "",
                                  bankName: "",
                                  branch: "",
                                });
                                setShowAddForm(false);
                              }}
                              className="h-9 px-4 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            onClick={handleSaveBankDetails}
                            disabled={submittingOption}
                            className="h-9 px-5 text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 shadow-md shadow-pink-500/10 rounded-xl"
                          >
                            {submittingOption ? "Saving..." : "Save Details"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
