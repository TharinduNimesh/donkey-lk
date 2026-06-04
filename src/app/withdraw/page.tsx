"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FancyText } from "@/components/ui/fancy-text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  RefreshCcw,
  DollarSign,
  Calendar,
  CreditCard,
  ShieldCheck,
  Eye,
  EyeOff,
  Banknote,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-0 transition duration-500 group-hover/input:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover/input:opacity-100" />
  </>
);

const LabelInputContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex w-full flex-col space-y-2 ${className ?? ""}`}>{children}</div>
);

interface Withdrawal {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  bank_name: string;
  user_id: string;
}

type WithdrawalOption =
  Database["public"]["Tables"]["withdrawal_options"]["Row"];
type WithdrawalRequest =
  Database["public"]["Tables"]["withdrawal_requests"]["Row"] & {
    withdrawal_options: Database["public"]["Tables"]["withdrawal_options"]["Row"];
    withdrawal_request_status: Database["public"]["Tables"]["withdrawal_request_status"]["Row"][];
  };

export default function WithdrawPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingOption, setSubmittingOption] = useState(false);
  const [balance, setBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
  });

  const [withdrawalHistory, setWithdrawalHistory] = useState<Withdrawal[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bankInfoSaved, setBankInfoSaved] = useState(false);
  const [showBankDetailsDialog, setShowBankDetailsDialog] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [withdrawalOptions, setWithdrawalOptions] = useState<
    WithdrawalOption[]
  >([]);
  const [selectedOption, setSelectedOption] = useState<WithdrawalOption | null>(
    null
  );
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Static FX rate from env: 1 USD = NEXT_PUBLIC_LKR_PER_USD LKR
  const LKR_PER_USD = Number(process.env.NEXT_PUBLIC_LKR_PER_USD ?? "295");
  const LKR_TO_USD = 1 / (LKR_PER_USD || 295);
  const formatUSD = (lkrAmount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(lkrAmount * LKR_TO_USD);

  const handleSubmitWithdrawal = async () => {
    if (!selectedOption) {
      toast.error("Please select a bank account");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (amount < 1000) {
      toast.error("Minimum withdrawal amount is LKR 1,000");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          withdrawalOptionId: selectedOption.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit withdrawal request");
      }

      // Add the new request to the list
      setWithdrawalRequests((prev) => [result.data, ...prev]);

      // Update local balance
      setBalance((prev) => prev - amount);

      toast.success("Withdrawal request submitted successfully");
      setWithdrawAmount("");
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit withdrawal request"
      );
    } finally {
      setSubmitting(false);
    }
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      setSelectedOption(data);
      setBankInfoSaved(true);
      toast.success("Bank details saved successfully");
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast.error("Failed to save bank details");
    } finally {
      setSubmittingOption(false);
    }
  };

  const handleSelectBankAccount = (option: WithdrawalOption) => {
    setSelectedOption(option);
    setBankDetails({
      accountName: option.account_name,
      accountNumber: option.account_number,
      bankName: option.bank_name,
      branch: option.branch_name,
    });
    setBankInfoSaved(true);
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
      const remaining = withdrawalOptions.filter((opt) => opt.id !== optionId);
      setWithdrawalOptions(remaining);
      if (selectedOption?.id === optionId) {
        if (remaining.length > 0) {
          handleSelectBankAccount(remaining[0]);
        } else {
          setSelectedOption(null);
          setBankDetails({ accountName: "", accountNumber: "", bankName: "", branch: "" });
          setBankInfoSaved(false);
        }
      }
      toast.success("Bank account hidden successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to hide bank account");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="h-[210px] bg-zinc-200 dark:bg-zinc-800/40 rounded-3xl"></div>
          <div className="h-[210px] bg-zinc-200 dark:bg-zinc-800/40 rounded-3xl"></div>
        </div>
        <div className="col-span-1 md:col-span-2 h-[440px] bg-zinc-200 dark:bg-zinc-800/40 rounded-3xl"></div>
      </div>
    </div>
  );

  // Function to mask account number for security
  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return "";
    if (accountNumber.length <= 4) return accountNumber;

    const lastFourDigits = accountNumber.slice(-4);
    const maskedPart = accountNumber.slice(0, -4).replace(/./g, "•");
    return maskedPart + lastFourDigits;
  };

  const handleSetMaxAmount = () => {
    setWithdrawAmount(balance.toString());
  };

  useEffect(() => {
    async function fetchUserData(showLoading = true) {
      if (showLoading) setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth");
          return;
        }

        // Fetch balance and withdrawal options in parallel
        const [balanceResponse, optionsResponse] = await Promise.all([
          supabase
            .from("account_balance")
            .select("balance")
            .eq("user_id", user.id)
            .neq("balance", -new Date().getTime()) // cache buster
            .single(),
          supabase
            .from("withdrawal_options")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false }),
        ]);

        // Fetch withdrawal requests from the API
        const withdrawalResponse = await fetch("/api/withdrawals", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          },
        });
        const withdrawalResult = await withdrawalResponse.json();

        if (
          balanceResponse.error &&
          balanceResponse.error.code !== "PGRST116"
        ) {
          throw balanceResponse.error;
        }

        if (optionsResponse.error) {
          throw optionsResponse.error;
        }

        if (!withdrawalResponse.ok) {
          throw new Error(
            withdrawalResult.error || "Failed to fetch withdrawal requests"
          );
        }

        if (balanceResponse.data) {
          setBalance(balanceResponse.data.balance || 0);
        }

        if (optionsResponse.data) {
          setWithdrawalOptions(optionsResponse.data);
          
          // Re-evaluate selected option to make sure it still exists
          setSelectedOption((prev) => {
            const stillExists = optionsResponse.data.find(
              (opt: WithdrawalOption) => opt.id === prev?.id
            );
            if (stillExists) {
              setBankDetails({
                accountName: stillExists.account_name,
                accountNumber: stillExists.account_number,
                bankName: stillExists.bank_name,
                branch: stillExists.branch_name,
              });
              setBankInfoSaved(true);
              return stillExists;
            } else if (optionsResponse.data.length > 0) {
              const firstOption = optionsResponse.data[0];
              setBankDetails({
                accountName: firstOption.account_name,
                accountNumber: firstOption.account_number,
                bankName: firstOption.bank_name,
                branch: firstOption.branch_name,
              });
              setBankInfoSaved(true);
              return firstOption;
            } else {
              setBankDetails({
                accountName: "",
                accountNumber: "",
                bankName: "",
                branch: "",
              });
              setBankInfoSaved(false);
              return null;
            }
          });
        }

        setWithdrawalRequests(withdrawalResult.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load account data");
      } finally {
        if (showLoading) setLoading(false);
      }
    }

    fetchUserData(true);

    const handleFocus = () => {
      fetchUserData(false);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("popstate", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("popstate", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [supabase, router, refreshTrigger]);

  return (
    <div className="min-h-screen w-full bg-[#fafafa] dark:bg-zinc-950 relative overflow-hidden flex flex-col font-sans">
      {/* Decorative Aurora background blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-pink-400/10 dark:bg-pink-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-400/15 dark:bg-purple-900/5 blur-3xl opacity-75 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-100/5 dark:bg-blue-900/5 blur-3xl opacity-50 pointer-events-none" />

      <div className="container mx-auto py-12 px-4 max-w-6xl relative z-10 flex-1">
        {/* Minimum Balance Alert */}
        {balance < 1000 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Alert
              variant="destructive"
              className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 dark:border-amber-900/30 rounded-2xl shadow-sm"
            >
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-800 dark:text-amber-300 font-medium text-sm ml-2">
                Your balance is below the minimum withdrawal amount. You need at
                least LKR 1,000.00 to make a withdrawal.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.back()}
              className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-2 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm shadow-sm"
            >
              <ArrowLeft size={18} />
            </motion.button>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 dark:from-pink-400 dark:via-pink-300 dark:to-purple-400">
                Withdraw Earnings
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 font-medium">
                Manage your withdrawals and payment preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 md:mt-0">
            {bankInfoSaved && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBankDetailsDialog(true)}
                  className="border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl h-9 transition-colors"
                >
                  <Eye size={14} className="mr-1.5 text-pink-600 dark:text-pink-400" /> View Bank Details
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.refresh();
                  setRefreshTrigger((prev) => prev + 1);
                }}
                className="border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl h-9 transition-colors"
              >
                <RefreshCcw size={14} className="mr-1.5 text-pink-600 dark:text-pink-400" /> Refresh
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {loading ? (
          renderSkeleton()
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >            <Tabs defaultValue="withdraw" className="space-y-8">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-zinc-100/50 dark:bg-zinc-900/50 p-1 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm rounded-xl">
                <TabsTrigger
                  value="withdraw"
                  className="rounded-lg transition-all duration-200 text-zinc-600 dark:text-zinc-400 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 font-semibold text-sm py-2"
                >
                  Withdraw
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-lg transition-all duration-200 text-zinc-600 dark:text-zinc-400 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 font-semibold text-sm py-2"
                >
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="withdraw" className="space-y-8 mt-4 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Balance Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="col-span-1"
                  >
                    <Card className="border border-white/20 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Available Balance
                          </CardTitle>
                          <div className="bg-pink-100/80 dark:bg-pink-950/40 p-2.5 rounded-2xl border border-pink-200/20 dark:border-pink-900/30">
                            <DollarSign className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                          </div>
                        </div>
                        <CardDescription className="text-zinc-500 dark:text-zinc-400">
                          Available for withdrawal
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative bg-white/40 dark:bg-zinc-950/40 rounded-2xl p-5 border border-white/20 dark:border-zinc-900/20 backdrop-blur-md">
                            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-pink-500 dark:from-pink-400 dark:to-pink-300">
                              {formatUSD(balance)}
                            </div>
                            <div className="text-sm text-zinc-650 dark:text-zinc-300 mt-1 font-medium">
                              ≈ LKR {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 flex items-center gap-1.5 border-t border-zinc-200/30 dark:border-zinc-800/30 pt-3">
                              <Calendar size={13} />
                              <span>Last updated: {new Date().toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Withdraw Card */}
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="mt-6"
                    >
                      <Card className="border border-white/20 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Request Withdrawal
                          </CardTitle>
                          <CardDescription className="text-zinc-500 dark:text-zinc-400">
                            Enter amount you want to withdraw
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <LabelInputContainer>
                              <Label htmlFor="withdrawAmount" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Amount
                              </Label>
                              <div className="group/input relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-sm font-semibold text-zinc-500 select-none border-r border-zinc-200 dark:border-zinc-700 z-10">LKR</div>
                                <Input
                                  id="withdrawAmount"
                                  type="number"
                                  value={withdrawAmount}
                                  onChange={(e) => setWithdrawAmount(e.target.value)}
                                  className="pl-[4.5rem] pr-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0.00"
                                />
                                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSetMaxAmount}
                                    className="px-3 h-8 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:bg-pink-50/50 dark:hover:bg-pink-950/30 rounded-lg"
                                  >
                                    Max
                                  </Button>
                                </div>
                                <BottomGradient />
                              </div>
                              {!bankInfoSaved && (
                                <p className="text-amber-600 dark:text-amber-400 text-xs flex items-center font-medium">
                                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 border border-white/20 animate-pulse"></span>
                                  Please complete and save your bank details first
                                </p>
                              )}
                            </LabelInputContainer>

                            <Dialog
                              open={showConfirmDialog}
                              onOpenChange={setShowConfirmDialog}
                            >
                              <Button
                                onClick={() => setShowConfirmDialog(true)}
                                className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-medium shadow-md shadow-pink-500/10 hover:shadow-pink-500/20 transition-all duration-200 rounded-xl h-11"
                                disabled={
                                  !withdrawAmount ||
                                  parseFloat(withdrawAmount) <= 0 ||
                                  parseFloat(withdrawAmount) > balance ||
                                  !bankInfoSaved
                                }
                              >
                                Request Withdrawal
                              </Button>
                              <DialogContent className="sm:max-w-md border border-white/20 dark:border-zinc-900/30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Confirm Withdrawal</DialogTitle>
                                  <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                                    Review your withdrawal request details
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="bg-pink-50/50 dark:bg-pink-950/20 p-5 rounded-2xl border border-pink-100/50 dark:border-pink-900/20">
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-650 dark:text-zinc-400">
                                          Withdrawal Amount:
                                        </span>
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                          LKR{" "}
                                          {parseFloat(
                                            withdrawAmount || "0"
                                          ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center text-sm text-red-650 dark:text-red-450">
                                        <span>Platform Fee (10%):</span>
                                        <span className="font-medium">
                                          - LKR{" "}
                                          {(
                                            parseFloat(withdrawAmount || "0") *
                                            0.1
                                          ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      <div className="pt-3 border-t border-pink-200/30 dark:border-pink-800/30">
                                        <div className="flex justify-between items-center font-semibold">
                                          <span className="text-zinc-700 dark:text-zinc-300">
                                            You will receive:
                                          </span>
                                          <span className="text-lg text-pink-600 dark:text-pink-400 font-bold">
                                            LKR{" "}
                                            {(
                                              parseFloat(withdrawAmount || "0") *
                                              0.9
                                            ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                                    <p className="font-semibold text-zinc-500 dark:text-zinc-400">Bank:</p>
                                    <p className="text-zinc-800 dark:text-zinc-200 font-medium">{bankDetails.bankName}</p>
                                    <p className="font-semibold text-zinc-500 dark:text-zinc-400">Account:</p>
                                    <p className="text-zinc-800 dark:text-zinc-200 font-mono text-xs font-medium">{bankDetails.accountNumber}</p>
                                    <p className="font-semibold text-zinc-500 dark:text-zinc-400">Name:</p>
                                    <p className="text-zinc-800 dark:text-zinc-200 font-medium">{bankDetails.accountName}</p>
                                  </div>

                                  <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                      Withdrawal requests typically take 1-3
                                      business days to process. You'll receive an
                                      email notification when the status changes.
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter className="gap-2 sm:gap-0">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="border-zinc-200 dark:border-zinc-855 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleSubmitWithdrawal}
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-medium rounded-xl shadow-md shadow-pink-500/10"
                                  >
                                    {submitting ? (
                                      <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Processing...
                                      </>
                                    ) : (
                                      "Confirm Withdrawal"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>

                  {/* Bank Details Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="col-span-1 md:col-span-2"
                  >
                    <Card className="h-full border border-white/20 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                              Bank Details
                            </CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400">
                              Add your bank information for withdrawals
                            </CardDescription>
                          </div>
                          <div className="bg-pink-100/80 dark:bg-pink-950/40 p-2.5 rounded-2xl border border-pink-200/20 dark:border-pink-900/30">
                            <Banknote className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-6">
                        {withdrawalOptions.length > 0 && (
                          <div className="mb-6">
                            <Label className="text-sm font-medium mb-3 block text-zinc-700 dark:text-zinc-350">
                              Saved Bank Accounts
                            </Label>
                            <div className="space-y-3">
                              {withdrawalOptions.map((option) => (
                                <div
                                  key={option.id}
                                  className={`p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                                    selectedOption?.id === option.id
                                      ? "bg-pink-50/50 dark:bg-pink-950/30 border-pink-500/30 dark:border-pink-500/20 shadow-sm"
                                      : "bg-white/30 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/60 hover:border-pink-500/30 dark:hover:border-pink-500/20"
                                  } border`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div
                                      className="flex-1"
                                      onClick={() =>
                                        handleSelectBankAccount(option)
                                      }
                                    >
                                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {option.bank_name}
                                      </p>
                                      <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 font-medium">
                                        {option.account_name} •{" "}
                                        <span className="font-mono text-[11px]">
                                          {maskAccountNumber(
                                            option.account_number
                                          )}
                                        </span>
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {selectedOption?.id === option.id && (
                                        <CheckCircle className="h-5 w-5 text-pink-600 dark:text-pink-400 fill-pink-500/10" />
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleHideBankAccount(option.id)
                                        }
                                        title="Delete bank account"
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-lg"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setBankDetails({
                                    accountName: "",
                                    accountNumber: "",
                                    bankName: "",
                                    branch: "",
                                  });
                                  setSelectedOption(null);
                                  setBankInfoSaved(false);
                                }}
                                className="w-full border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl h-10 transition-colors"
                              >
                                + Add Another Bank Account
                              </Button>
                            </div>
                          </div>
                        )}

                        {(!withdrawalOptions.length || !selectedOption) && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <LabelInputContainer>
                                <Label htmlFor="accountName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                                <Label htmlFor="accountNumber" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                                <Label htmlFor="bankName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                                <Label htmlFor="branch" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                          </div>
                        )}
                      </CardContent>
                      {(!withdrawalOptions.length || !selectedOption) && (
                        <CardFooter className="pt-6 pb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between border-t border-zinc-200/25 dark:border-zinc-800/25 mt-6 bg-white/20 dark:bg-zinc-900/20 rounded-b-3xl">
                          <p className="text-xs text-zinc-550 dark:text-zinc-400 font-medium">
                            <span className="text-pink-500 mr-0.5">*</span> Required fields
                          </p>
                          <div className="flex gap-2 w-full sm:w-auto">
                            {withdrawalOptions.length > 0 && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  handleSelectBankAccount(withdrawalOptions[0]);
                                }}
                                className="border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 text-zinc-750 dark:text-zinc-300 font-semibold rounded-xl h-11 px-4"
                              >
                                Cancel
                              </Button>
                            )}
                            <Button
                              onClick={handleSaveBankDetails}
                              disabled={submittingOption}
                              className="sm:w-auto w-full flex-1 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-semibold rounded-xl h-11 px-6 shadow-md shadow-pink-500/10"
                            >
                              {submittingOption ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  Saving...
                                </>
                              ) : (
                                "Save Bank Details"
                              )}
                            </Button>
                          </div>
                        </CardFooter>
                      )}
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="border border-white/20 dark:border-zinc-900/30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-md rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Withdrawal History
                          </CardTitle>
                          <CardDescription className="text-zinc-500 dark:text-zinc-400">
                            Track your withdrawal requests
                          </CardDescription>
                        </div>
                        <div className="bg-pink-100/80 dark:bg-pink-950/40 p-2.5 rounded-2xl border border-pink-200/20 dark:border-pink-900/30">
                          <CreditCard className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800/80">
                              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Bank
                              </th>
                              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                            {withdrawalRequests.length > 0 ? (
                              withdrawalRequests.map((request) => (
                                <tr
                                  key={request.id}
                                  className="hover:bg-zinc-500/5 dark:hover:bg-zinc-350/5 transition-colors"
                                >
                                  <td className="px-5 py-4.5 whitespace-nowrap text-sm text-zinc-650 dark:text-zinc-305 font-medium">
                                    {new Date(
                                      request.created_at
                                    ).toLocaleDateString(undefined, {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </td>
                                  <td className="px-5 py-4.5 whitespace-nowrap text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                    LKR {request.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-5 py-4.5 whitespace-nowrap text-sm text-zinc-650 dark:text-zinc-305 font-medium">
                                    {request.withdrawal_options.bank_name}
                                  </td>
                                  <td className="px-5 py-4.5 whitespace-nowrap text-sm">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                        request.withdrawal_request_status?.[0]
                                          ?.status === "ACCEPTED"
                                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                          : request
                                              .withdrawal_request_status?.[0]
                                              ?.status === "REJECTED"
                                          ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                          : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                      }`}
                                    >
                                      {request.withdrawal_request_status?.[0]
                                        ?.status || "PENDING"}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-5 py-12 text-center text-zinc-500"
                                >
                                  <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="bg-pink-100/50 dark:bg-pink-950/20 p-4 rounded-2xl border border-pink-200/10 dark:border-pink-850/20">
                                      <CreditCard className="h-6 w-6 text-pink-500" />
                                    </div>
                                    <div className="font-semibold text-zinc-700 dark:text-zinc-300">No withdrawal history available</div>
                                    <Button
                                      variant="link"
                                      onClick={() => {
                                        const tabButton =
                                          document.querySelector(
                                            '[value="withdraw"]'
                                          ) as HTMLButtonElement;
                                        tabButton?.click();
                                      }}
                                      className="text-pink-650 dark:text-pink-400 font-semibold"
                                    >
                                      Make your first withdrawal
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {withdrawalRequests.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-zinc-200/50 dark:border-zinc-800/50">
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium space-y-2">
                            <p className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 border border-white/20"></span>
                              <span><span className="font-semibold text-zinc-700 dark:text-zinc-300">PENDING:</span> Your withdrawal request is being processed.</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 border border-white/20"></span>
                              <span><span className="font-semibold text-zinc-700 dark:text-zinc-300">ACCEPTED:</span> Funds have been transferred to your account.</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 border border-white/20"></span>
                              <span><span className="font-semibold text-zinc-700 dark:text-zinc-300">REJECTED:</span> Request was declined - please contact support.</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Bank Details Dialog */}
        <Dialog
          open={showBankDetailsDialog}
          onOpenChange={setShowBankDetailsDialog}
        >
          <DialogContent className="sm:max-w-md border border-white/20 dark:border-zinc-900/30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                <ShieldCheck className="mr-2.5 h-5 w-5 text-pink-600 dark:text-pink-400" />
                Saved Bank Details
              </DialogTitle>
              <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                Review your bank account information used for withdrawals
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="bg-pink-50/50 dark:bg-pink-950/20 p-5 rounded-2xl border border-pink-100/50 dark:border-pink-900/20">
                <div className="flex items-center mb-4">
                  <Banknote className="h-5 w-5 text-pink-600 dark:text-pink-400 mr-2" />
                  <h3 className="font-semibold text-pink-700 dark:text-pink-300">
                    Bank Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-sm">
                    <p className="font-semibold text-zinc-500 dark:text-zinc-400">
                      Bank Name:
                    </p>
                    <p className="text-zinc-800 dark:text-zinc-200 font-semibold">
                      {bankDetails.bankName}
                    </p>

                    <p className="font-semibold text-zinc-500 dark:text-zinc-400">
                      Account Name:
                    </p>
                    <p className="text-zinc-800 dark:text-zinc-200 font-semibold">
                      {bankDetails.accountName}
                    </p>

                    <p className="font-semibold text-zinc-500 dark:text-zinc-400">
                      Account Number:
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-zinc-850 dark:text-zinc-200 font-semibold font-mono text-xs">
                        {showAccountNumber
                          ? bankDetails.accountNumber
                          : maskAccountNumber(bankDetails.accountNumber)}
                      </p>
                      <button
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"
                      >
                        {showAccountNumber ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>

                    {bankDetails.branch && (
                      <>
                        <p className="font-semibold text-zinc-500 dark:text-zinc-400">
                          Branch:
                        </p>
                        <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                          {bankDetails.branch}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                <p className="flex items-center">
                  <ShieldCheck size={14} className="mr-1.5 text-emerald-500" />
                  Your bank details are securely stored and encrypted
                </p>
                <p className="leading-relaxed">
                  To update your bank details, use the form on the withdrawal page
                </p>
              </div>
            </div>

            <DialogFooter className="sm:justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBankDetailsDialog(false)}
                className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 rounded-xl"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const tabButton = document.querySelector(
                    '[value="withdraw"]'
                  ) as HTMLButtonElement;
                  tabButton?.click();
                  setShowBankDetailsDialog(false);
                }}
                className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-medium rounded-xl"
              >
                Update Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
