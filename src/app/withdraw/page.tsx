"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  CheckCircle, 
  ArrowLeft, 
  RefreshCcw, 
  DollarSign, 
  Calendar,  
  CreditCard,
  ShieldCheck,
  Eye,
  EyeOff,
  Banknote
} from "lucide-react";

export default function WithdrawPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
  });
  
  interface Withdrawal {
    id: string;
    created_at: string;
    amount: number;
    status: string;
    bank_name: string;
    user_id: string;
  }
  
  const [withdrawalHistory, setWithdrawalHistory] = useState<Withdrawal[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bankInfoSaved, setBankInfoSaved] = useState(false);
  const [showBankDetailsDialog, setShowBankDetailsDialog] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);

      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          router.push("/auth");
          return;
        }

        // Fetch user's balance
        const { data: balanceData, error: balanceError } = await supabase
          .from("earnings")
          .select("current_balance")
          .eq("user_id", user.id)
          .single();

        if (balanceError && balanceError.code !== "PGRST116") {
          throw balanceError;
        }

        if (balanceData) {
          setBalance(balanceData.current_balance || 0);
        }

        // Fetch user's bank details
        const { data: bankData, error: bankError } = await supabase
          .from("user_profiles")
          .select(
            "bank_account_name, bank_account_number, bank_name, bank_branch"
          )
          .eq("id", user.id)
          .single();

        if (bankError && bankError.code !== "PGRST116") {
          throw bankError;
        }

        if (bankData) {
          setBankDetails({
            accountName: bankData.bank_account_name || "",
            accountNumber: bankData.bank_account_number || "",
            bankName: bankData.bank_name || "",
            branch: bankData.bank_branch || "",
          });
          
          // Check if bank info is complete
          if (bankData.bank_account_name && 
              bankData.bank_account_number && 
              bankData.bank_name) {
            setBankInfoSaved(true);
          }
        }

        // Fetch withdrawal history
        const { data: withdrawalData, error: withdrawalError } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (withdrawalError) throw withdrawalError;

        setWithdrawalHistory(withdrawalData || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load account information");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [supabase, router]);

  const handleSubmitWithdrawal = async () => {
    if (
      !bankDetails.accountName ||
      !bankDetails.accountNumber ||
      !bankDetails.bankName
    ) {
      toast.error("Please complete your bank details first");
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

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      // Create withdrawal request
      const { data, error } = await supabase
        .from("withdrawals")
        .insert({
          user_id: user.id,
          amount,
          status: "PENDING",
          bank_account_name: bankDetails.accountName,
          bank_account_number: bankDetails.accountNumber,
          bank_name: bankDetails.bankName,
          bank_branch: bankDetails.branch,
        })
        .select();

      if (error) throw error;

      // Update user balance
      const { error: updateError } = await supabase.rpc(
        "update_user_balance_after_withdrawal",
        {
          user_id_param: user.id,
          withdrawal_amount_param: amount,
        }
      );

      if (updateError) throw updateError;

      toast.success("Withdrawal request submitted successfully");
      setWithdrawAmount("");
      setShowConfirmDialog(false);

      // Refresh data
      router.refresh();

      // Add the new withdrawal to the history
      if (data && data[0]) {
        setWithdrawalHistory([data[0], ...withdrawalHistory]);
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.error("Failed to submit withdrawal request");
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

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({
          bank_account_name: bankDetails.accountName,
          bank_account_number: bankDetails.accountNumber,
          bank_name: bankDetails.bankName,
          bank_branch: bankDetails.branch,
        })
        .eq("id", user.id);

      if (error) throw error;

      setBankInfoSaved(true);
      toast.success("Bank details updated successfully");
    } catch (error) {
      console.error("Error updating bank details:", error);
      toast.error("Failed to update bank details");
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
    const maskedPart = accountNumber.slice(0, -4).replace(/./g, '•');
    return maskedPart + lastFourDigits;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-muted-foreground hover:text-foreground text-sm mb-2 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600">
              Withdraw Earnings
            </h1>
            <p className="text-muted-foreground">
              Manage your withdrawals and payment preferences
            </p>
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
                          <CardTitle className="text-lg font-medium">Available Balance</CardTitle>
                          <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                            <DollarSign className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                          </div>
                        </div>
                        <CardDescription>Available for withdrawal</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative group hover:scale-[1.01] transition-transform duration-200">
                          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative bg-white dark:bg-gray-950 rounded-lg p-4 border border-pink-100 dark:border-pink-900/30">
                            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 font-display">
                              ${balance.toFixed(2)}
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
                        <CardTitle className="text-lg font-medium">Request Withdrawal</CardTitle>
                        <CardDescription>Enter amount you want to withdraw</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="withdrawAmount" className="text-sm font-medium">Amount</Label>
                            <div className="relative mt-1.5">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                id="withdrawAmount"
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="pl-8 bg-white dark:bg-gray-900 border-pink-100 dark:border-pink-900/30"
                                placeholder="0.00"
                                disabled={!bankInfoSaved}
                              />
                            </div>
                            {!bankInfoSaved && (
                              <p className="text-amber-600 dark:text-amber-400 text-xs mt-2 flex items-center">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                                Please complete and save your bank details first
                              </p>
                            )}
                          </div>

                          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
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
                                  You are about to request a withdrawal of ${parseFloat(withdrawAmount || "0").toFixed(2)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800/30">
                                  <p className="text-sm text-pink-700 dark:text-pink-300">
                                    Withdrawal requests typically take 1-3 business days to process. You'll receive an email notification when the status changes.
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                                  <p className="font-medium">Amount:</p>
                                  <p className="font-bold text-pink-600 dark:text-pink-400">${parseFloat(withdrawAmount || "0").toFixed(2)}</p>
                                  <p className="font-medium">Bank:</p>
                                  <p>{bankDetails.bankName}</p>
                                  <p className="font-medium">Account:</p>
                                  <p>{bankDetails.accountNumber}</p>
                                  <p className="font-medium">Name:</p>
                                  <p>{bankDetails.accountName}</p>
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
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="accountName" className="text-sm font-medium">Account Holder Name<span className="text-pink-500">*</span></Label>
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
                              <Label htmlFor="accountNumber" className="text-sm font-medium">Account Number<span className="text-pink-500">*</span></Label>
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
                              <Label htmlFor="bankName" className="text-sm font-medium">Bank Name<span className="text-pink-500">*</span></Label>
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
                              <Label htmlFor="branch" className="text-sm font-medium">Branch</Label>
                              <Input
                                id="branch"
                                value={bankDetails.branch}
                                onChange={(e) =>
                                  setBankDetails({ ...bankDetails, branch: e.target.value })
                                }
                                placeholder="Enter branch name (optional)"
                                className="bg-white dark:bg-gray-900 border-pink-100 dark:border-pink-900/30"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-6 pb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                          <span className="text-pink-500">*</span> Required fields
                        </p>
                        <Button
                          onClick={handleSaveBankDetails}
                          className="sm:w-auto w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                        >
                          {bankInfoSaved ? (
                            <>
                              <CheckCircle size={16} className="mr-2" /> Bank Details Saved
                            </>
                          ) : (
                            "Save Bank Details"
                          )}
                        </Button>
                      </CardFooter>
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
                          <CardTitle className="text-lg font-medium">Withdrawal History</CardTitle>
                          <CardDescription>Track your previous withdrawal requests</CardDescription>
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
                            {withdrawalHistory.length > 0 ? (
                              withdrawalHistory.map((withdrawal) => (
                                <tr
                                  key={withdrawal.id}
                                  className="hover:bg-pink-50/30 dark:hover:bg-pink-900/5 transition-colors"
                                >
                                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    {new Date(withdrawal.created_at).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    ${withdrawal.amount.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    {withdrawal.bank_name}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    <Badge className={getStatusBadgeClass(withdrawal.status)}>
                                      {withdrawal.status}
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
                                      onClick={() => document.querySelector('[value="withdraw"]')?.click()}
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
                      
                      {withdrawalHistory.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-pink-100 dark:border-pink-900/20">
                          <div className="text-xs text-muted-foreground">
                            <p className="mb-1">
                              <span className="font-medium">PENDING:</span> Your withdrawal request is being processed
                            </p>
                            <p className="mb-1">
                              <span className="font-medium">COMPLETED:</span> Funds have been transferred to your account
                            </p>
                            <p className="mb-1">
                              <span className="font-medium">REJECTED:</span> Request was declined - please contact support
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
        <Dialog open={showBankDetailsDialog} onOpenChange={setShowBankDetailsDialog}>
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
                    <p className="font-medium text-gray-600 dark:text-gray-300">Bank Name:</p>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{bankDetails.bankName}</p>
                    
                    <p className="font-medium text-gray-600 dark:text-gray-300">Account Name:</p>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{bankDetails.accountName}</p>
                    
                    <p className="font-medium text-gray-600 dark:text-gray-300">Account Number:</p>
                    <div className="flex items-center">
                      <p className="text-gray-800 dark:text-gray-200 font-medium mr-2">
                        {showAccountNumber ? bankDetails.accountNumber : maskAccountNumber(bankDetails.accountNumber)}
                      </p>
                      <button 
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300"
                      >
                        {showAccountNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    
                    {bankDetails.branch && (
                      <>
                        <p className="font-medium text-gray-600 dark:text-gray-300">Branch:</p>
                        <p className="text-gray-800 dark:text-gray-200">{bankDetails.branch}</p>
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
                  To update your bank details, use the form on the withdrawal page
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
                  document.querySelector('[value="withdraw"]')?.click();
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
