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

interface Withdrawal {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  bank_name: string;
  user_id: string;
}

type WithdrawalOption = Database["public"]["Tables"]["withdrawal_options"]["Row"];
type WithdrawalRequest = Database['public']['Tables']['withdrawal_requests']['Row'] & {
  withdrawal_options: Database['public']['Tables']['withdrawal_options']['Row'];
  withdrawal_request_status: Database['public']['Tables']['withdrawal_request_status']['Row'][];
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
  const [withdrawalOptions, setWithdrawalOptions] = useState<WithdrawalOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<WithdrawalOption | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

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
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          withdrawalOptionId: selectedOption.id
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit withdrawal request');
      }

      // Add the new request to the list
      setWithdrawalRequests(prev => [result.data, ...prev]);
      
      // Update local balance
      setBalance(prev => prev - amount);
      
      toast.success("Withdrawal request submitted successfully");
      setWithdrawAmount("");
      setShowConfirmDialog(false);

    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit withdrawal request");
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

      setWithdrawalOptions(prev => [data, ...prev]);
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

  const handleDeleteBankAccount = async (optionId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this bank account?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("withdrawal_options")
        .delete()
        .eq("id", optionId);

      if (error) throw error;

      setWithdrawalOptions(prev => prev.filter(opt => opt.id !== optionId));
      if (selectedOption?.id === optionId) {
        const remainingOptions = withdrawalOptions.filter(opt => opt.id !== optionId);
        if (remainingOptions.length > 0) {
          handleSelectBankAccount(remainingOptions[0]);
        } else {
          setSelectedOption(null);
          setBankDetails({
            accountName: "",
            accountNumber: "",
            bankName: "",
            branch: "",
          });
          setBankInfoSaved(false);
        }
      }
      toast.success("Bank account deleted successfully");
    } catch (error) {
      console.error("Error deleting bank account:", error);
      toast.error("Failed to delete bank account");
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
      <div className="flex flex-col md:flex-row gap-6">
        {/* Balance Card Skeleton */}
        <div className="w-full md:w-1/3 h-[180px] bg-gray-200 dark:bg-gray-800 rounded-xl"></div>

        {/* Bank Details Skeleton */}
        <div className="w-full md:w-2/3 h-[300px] bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>

      {/* History Skeleton */}
      <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
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
    async function fetchUserData() {
      setLoading(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
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
            .single(),
          supabase
            .from("withdrawal_options")
            .select("*")
            .eq("user_id", user.id)
            .order('created_at', { ascending: false })
        ]);

        // Fetch withdrawal requests from the API
        const withdrawalResponse = await fetch('/api/withdrawals');
        const withdrawalResult = await withdrawalResponse.json();

        if (balanceResponse.error && balanceResponse.error.code !== "PGRST116") {
          throw balanceResponse.error;
        }

        if (optionsResponse.error) {
          throw optionsResponse.error;
        }

        if (!withdrawalResponse.ok) {
          throw new Error(withdrawalResult.error || 'Failed to fetch withdrawal requests');
        }

        if (balanceResponse.data) {
          setBalance(balanceResponse.data.balance || 0);
        }

        if (optionsResponse.data) {
          setWithdrawalOptions(optionsResponse.data);
          // If there are saved options, select the first one by default
          if (optionsResponse.data.length > 0) {
            const firstOption = optionsResponse.data[0];
            setSelectedOption(firstOption);
            setBankDetails({
              accountName: firstOption.account_name,
              accountNumber: firstOption.account_number,
              bankName: firstOption.bank_name,
              branch: firstOption.branch_name,
            });
            setBankInfoSaved(true);
          }
        }

        setWithdrawalRequests(withdrawalResult.data || []);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load account data");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [supabase, router]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        {/* Minimum Balance Alert */}
        {balance < 1000 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Alert variant="destructive" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                Your balance is below the minimum withdrawal amount. You need at least LKR 1,000 to make a withdrawal.
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
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600">
                Withdraw Earnings
              </h1>
              <p className="text-muted-foreground">
                Manage your withdrawals and payment preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 md:mt-0">
            {bankInfoSaved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBankDetailsDialog(true)}
                className="border-pink-200 dark:border-pink-900 hover:bg-pink-50 dark:hover:bg-pink-900/20"
              >
                <Eye size={14} className="mr-1" /> View Bank Details
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.refresh()}
              className="border-pink-200 dark:border-pink-900 hover:bg-pink-50 dark:hover:bg-pink-900/20"
            >
              <RefreshCcw size={14} className="mr-1" /> Refresh
            </Button>
          </div>
        </motion.div>

        {loading ? (
          renderSkeleton()
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="withdraw" className="space-y-8">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="withdraw" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Balance Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="col-span-1"
                  >
                    <Card className="overflow-hidden border-pink-100 dark:border-pink-900/20 shadow-md hover:shadow-lg transition-shadow duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-medium">
                            Available Balance
                          </CardTitle>
                          <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                            <DollarSign className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                          </div>
                        </div>
                        <CardDescription>
                          Available for withdrawal
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative group hover:scale-[1.01] transition-transform duration-200">
                          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative bg-white dark:bg-gray-950 rounded-lg p-4 border border-pink-100 dark:border-pink-900/30">
                            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 font-display">
                              LKR {balance.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-2">
                              <div className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                Last updated: {new Date().toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Withdraw Card */}
                    <Card className="mt-6 border-pink-100 dark:border-pink-900/20 shadow-md hover:shadow-lg transition-shadow duration-300">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">
                          Request Withdrawal
                        </CardTitle>
                        <CardDescription>
                          Enter amount you want to withdraw
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label
                              htmlFor="withdrawAmount"
                              className="text-sm font-medium"
                            >
                              Amount
                            </Label>
                            <div className="relative mt-1.5">
                              <div className="relative flex items-center">
                                <Input
                                  id="withdrawAmount"
                                  type="number"
                                  value={withdrawAmount}
                                  onChange={(e) => setWithdrawAmount(e.target.value)}
                                  className="pl-[4.5rem] pr-20 bg-white dark:bg-gray-900 border-pink-100 dark:border-pink-900/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0.00"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-sm font-medium text-muted-foreground select-none border-r">
                                  LKR
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSetMaxAmount}
                                  className="absolute right-1 px-2 h-7 text-xs border-pink-200 dark:border-pink-900 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                                >
                                  Max
                                </Button>
                              </div>
                              {!bankInfoSaved && (
                                <p className="text-amber-600 dark:text-amber-400 text-xs mt-2 flex items-center">
                                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                                  Please complete and save your bank details first
                                </p>
                              )}
                            </div>
                          </div>

                          <Dialog
                            open={showConfirmDialog}
                            onOpenChange={setShowConfirmDialog}
                          >
                            <Button
                              onClick={() => setShowConfirmDialog(true)}
                              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                              disabled={
                                !withdrawAmount ||
                                parseFloat(withdrawAmount) <= 0 ||
                                parseFloat(withdrawAmount) > balance ||
                                !bankInfoSaved
                              }
                            >
                              Request Withdrawal
                            </Button>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Confirm Withdrawal</DialogTitle>
                                <DialogDescription>
                                  Review your withdrawal request details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800/30">
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600 dark:text-gray-300">Withdrawal Amount:</span>
                                      <span className="font-medium">LKR {parseFloat(withdrawAmount || "0").toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                                      <span>Platform Fee (10%):</span>
                                      <span>- LKR {(parseFloat(withdrawAmount || "0") * 0.1).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-pink-200 dark:border-pink-800">
                                      <div className="flex justify-between items-center font-medium">
                                        <span className="text-gray-700 dark:text-gray-200">You will receive:</span>
                                        <span className="text-pink-600 dark:text-pink-400">
                                          LKR {(parseFloat(withdrawAmount || "0") * 0.9).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                                  <p className="font-medium">Bank:</p>
                                  <p>{bankDetails.bankName}</p>
                                  <p className="font-medium">Account:</p>
                                  <p>{bankDetails.accountNumber}</p>
                                  <p className="font-medium">Name:</p>
                                  <p>{bankDetails.accountName}</p>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                  <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Withdrawal requests typically take 1-3 business days to process. You'll receive an email notification when the status changes.
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowConfirmDialog(false)}
                                  className="border-pink-200 dark:border-pink-800"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleSubmitWithdrawal}
                                  disabled={submitting}
                                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
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

                  {/* Bank Details Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="col-span-1 md:col-span-2"
                  >
                    <Card className="h-full border-pink-100 dark:border-pink-900/20 shadow-md hover:shadow-lg transition-shadow duration-300">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-medium">Bank Details</CardTitle>
                            <CardDescription>Add your bank information for withdrawals</CardDescription>
                          </div>
                          <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                            <Banknote className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-0">
                        {withdrawalOptions.length > 0 && (
                          <div className="mb-6">
                            <Label className="text-sm font-medium mb-2">Saved Bank Accounts</Label>
                            <div className="space-y-2">
                              {withdrawalOptions.map((option) => (
                                <div
                                  key={option.id}
                                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                    selectedOption?.id === option.id
                                      ? "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800"
                                      : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-800"
                                  } border`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1" onClick={() => handleSelectBankAccount(option)}>
                                      <p className="font-medium">{option.bank_name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {option.account_name} • {maskAccountNumber(option.account_number)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {selectedOption?.id === option.id && (
                                        <CheckCircle className="h-5 w-5 text-pink-500" />
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteBankAccount(option.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                                className="w-full border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                              >
                                + Add Another Bank Account
                              </Button>
                            </div>
                          </div>
                        )}

                        {(!withdrawalOptions.length || !selectedOption) && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="accountName"
                                  className="text-sm font-medium"
                                >
                                  Account Holder Name
                                  <span className="text-pink-500">*</span>
                                </Label>
                                <Input
                                  id="accountName"
                                  value={bankDetails.accountName}
                                  onChange={(e) =>
                                    setBankDetails({
                                      ...bankDetails,
                                      accountName: e.target.value,
                                    })
                                  }
                                  placeholder="Enter account name"
                                  className="bg-white dark:bg-gray-900 border-pink-100 dark:border-pink-900/30"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="accountNumber"
                                  className="text-sm font-medium"
                                >
                                  Account Number
                                  <span className="text-pink-500">*</span>
                                </Label>
                                <Input
                                  id="accountNumber"
                                  value={bankDetails.accountNumber}
                                  onChange={(e) =>
                                    setBankDetails({
                                      ...bankDetails,
                                      accountNumber: e.target.value,
                                    })
                                  }
                                  placeholder="Enter account number"
                                  className="bg-white dark:bg-gray-900 border-pink-100 dark:border-pink-900/30"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="bankName"
                                  className="text-sm font-medium"
                                >
                                  Bank Name
                                  <span className="text-pink-500">*</span>
                                </Label>
                                <Input
                                  id="bankName"
                                  value={bankDetails.bankName}
                                  onChange={(e) =>
                                    setBankDetails({
                                      ...bankDetails,
                                      bankName: e.target.value,
                                    })
                                  }
                                  placeholder="Enter bank name"
                                  className="bg-white dark:bg-gray-900 border-pink-100 dark:border-pink-900/30"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="branch"
                                  className="text-sm font-medium"
                                >
                                  Branch
                                </Label>
                                <Input
                                  id="branch"
                                  value={bankDetails.branch}
                                  onChange={(e) =>
                                    setBankDetails({
                                      ...bankDetails,
                                      branch: e.target.value,
                                    })
                                  }
                                  placeholder="Enter branch name (optional)"
                                  className="bg-white dark:bg-gray-900 border-pink-100 dark:border-pink-900/30"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      {(!withdrawalOptions.length || !selectedOption) && (
                        <CardFooter className="pt-6 pb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                          <p className="text-xs text-muted-foreground">
                            <span className="text-pink-500">*</span> Required fields
                          </p>
                          <Button
                            onClick={handleSaveBankDetails}
                            disabled={submittingOption}
                            className="sm:w-auto w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
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
                        </CardFooter>
                      )}
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="border-pink-100 dark:border-pink-900/20 shadow-md overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-medium">
                            Withdrawal History
                          </CardTitle>
                          <CardDescription>
                            Track your withdrawal requests
                          </CardDescription>
                        </div>
                        <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                          <CreditCard className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-pink-50/50 dark:bg-pink-900/10 border-b border-pink-100 dark:border-pink-900/20">
                              <th className="px-4 py-3 text-left text-xs font-medium text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                                Bank
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-pink-100 dark:divide-pink-900/20">
                            {withdrawalRequests.length > 0 ? (
                              withdrawalRequests.map((request) => (
                                <tr
                                  key={request.id}
                                  className="hover:bg-pink-50/30 dark:hover:bg-pink-900/5 transition-colors"
                                >
                                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    {new Date(request.created_at).toLocaleDateString(undefined, {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    LKR {request.amount.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    {request.withdrawal_options.bank_name}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    <Badge
                                      className={
                                        request.withdrawal_request_status?.[0]?.status === "ACCEPTED"
                                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                          : request.withdrawal_request_status?.[0]?.status === "REJECTED"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      }
                                    >
                                      {request.withdrawal_request_status?.[0]?.status || "PENDING"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-8 text-center text-muted-foreground"
                                >
                                  <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-full">
                                      <CreditCard className="h-6 w-6 text-pink-400" />
                                    </div>
                                    <div>No withdrawal history available</div>
                                    <Button
                                      variant="link"
                                      onClick={() => {
                                        const tabButton = document.querySelector(
                                          '[value="withdraw"]'
                                        ) as HTMLButtonElement;
                                        tabButton?.click();
                                      }}
                                      className="text-pink-500"
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
                        <div className="mt-6 pt-4 border-t border-pink-100 dark:border-pink-900/20">
                          <div className="text-xs text-muted-foreground">
                            <p className="mb-1">
                              <span className="font-medium">PENDING:</span> Your
                              withdrawal request is being processed
                            </p>
                            <p className="mb-1">
                              <span className="font-medium">ACCEPTED:</span>{" "}
                              Funds have been transferred to your account
                            </p>
                            <p className="mb-1">
                              <span className="font-medium">REJECTED:</span>{" "}
                              Request was declined - please contact support
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5 text-pink-500" />
                Your Saved Bank Details
              </DialogTitle>
              <DialogDescription>
                Review your bank account information used for withdrawals
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <Banknote className="h-5 w-5 text-pink-600 dark:text-pink-400 mr-2" />
                  <h3 className="font-medium text-pink-700 dark:text-pink-300">
                    Bank Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p className="font-medium text-gray-600 dark:text-gray-300">
                      Bank Name:
                    </p>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      {bankDetails.bankName}
                    </p>

                    <p className="font-medium text-gray-600 dark:text-gray-300">
                      Account Name:
                    </p>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      {bankDetails.accountName}
                    </p>

                    <p className="font-medium text-gray-600 dark:text-gray-300">
                      Account Number:
                    </p>
                    <div className="flex items-center">
                      <p className="text-gray-800 dark:text-gray-200 font-medium mr-2">
                        {showAccountNumber
                          ? bankDetails.accountNumber
                          : maskAccountNumber(bankDetails.accountNumber)}
                      </p>
                      <button
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300"
                      >
                        {showAccountNumber ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>

                    {bankDetails.branch && (
                      <>
                        <p className="font-medium text-gray-600 dark:text-gray-300">
                          Branch:
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {bankDetails.branch}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="mb-1 flex items-center">
                  <ShieldCheck size={14} className="mr-1 text-green-500" />
                  Your bank details are securely stored and encrypted
                </p>
                <p>
                  To update your bank details, use the form on the withdrawal
                  page
                </p>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setShowBankDetailsDialog(false)}
                className="border-pink-200 dark:border-pink-900"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const tabButton = document.querySelector('[value="withdraw"]') as HTMLButtonElement;
                  tabButton?.click();
                  setShowBankDetailsDialog(false);
                }}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
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
