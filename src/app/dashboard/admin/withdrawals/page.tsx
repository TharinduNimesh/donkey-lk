"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
  Building,
} from "lucide-react";
import { PaymentWithdrawalModal, type WithdrawalRejectionReason, withdrawalRejectionReasons } from "@/components/dashboard/payment-withdrawal-modal";
import { sendMail } from "@/lib/utils/email";
import { format } from "date-fns";

type ProfileType = Database["public"]["Tables"]["profile"]["Row"];
type WithdrawalOptionType = Database["public"]["Tables"]["withdrawal_options"]["Row"];
type WithdrawalStatusType = Database["public"]["Tables"]["withdrawal_request_status"]["Row"];

interface WithdrawalRequest {
  id: number;
  amount: number;
  created_at: string;
  user_id: string;
  withdrawal_option_id: number;
  withdrawal_option: WithdrawalOptionType;
  status: WithdrawalStatusType | null;
  profile: ProfileType;
}

type ApplicationProof = {
  id: number;
  proof_status: {
    status: Database["public"]["Enums"]["ProofStatus"];
    reviewed_at: string | null;
    reviewed_by: {
      name: string;
    } | null;
  };
};

type ApplicationPromise = {
  platform: Database["public"]["Enums"]["Platforms"];
  promised_reach: string;
};

interface InfluencerApplication {
  id: number;
  created_at: string;
  tasks: {
    title: string;
  };
  application_proofs: ApplicationProof[];
  application_promises: ApplicationPromise[];
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [applicationsByUser, setApplicationsByUser] = useState<{ [key: string]: InfluencerApplication[] }>({});
  const [loadingApplications, setLoadingApplications] = useState<{ [key: string]: boolean }>({});

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    checkAdminStatus();
    loadWithdrawals();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Unauthorized access");
      return;
    }

    const { data, error } = await supabase
      .rpc('is_a_superadmin', { user_id_input: user.id });

    if (error) {
      toast.error("Failed to verify admin status");
      return;
    }

    setIsSuperAdmin(!!data);
    if (!data) {
      toast.error("You don't have permission to access this page");
    }
  };

  const loadWithdrawals = async () => {
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from("withdrawal_requests")
      .select(`
        *,
        withdrawal_option:withdrawal_options(*),
        profile:profile(*)
      `)
      .order("created_at", { ascending: false });

    if (withdrawalError) {
      toast.error("Failed to load withdrawal requests");
      return;
    }

    // Fetch status separately for each withdrawal request
    const withdrawalsWithStatus = await Promise.all(
      (withdrawalData || []).map(async (withdrawal) => {
        const { data: statusData } = await supabase
          .from("withdrawal_request_status")
          .select("*")
          .eq("request_id", withdrawal.id)
          .single();

        return {
          ...(withdrawal as any),
          status: statusData || null
        } as WithdrawalRequest;
      })
    );

    setWithdrawals(withdrawalsWithStatus);
  };

  const loadUserApplications = async (userId: string) => {
    if (applicationsByUser[userId]) return;

    setLoadingApplications(prev => ({ ...prev, [userId]: true }));
    
    const { data, error } = await supabase
      .from("task_applications")
      .select(`
        id,
        created_at,
        tasks!inner(title),
        application_promises!inner(platform, promised_reach),
        application_proofs!inner(
          id,
          proof_status:proof_status(
            status,
            reviewed_at,
            reviewed_by(name)
          )
        )
      `)
      .eq("user_id", userId)
      .eq("application_proofs.proof_status.status", "ACCEPTED")
      .order("created_at", { ascending: false })
      .limit(5);

    setLoadingApplications(prev => ({ ...prev, [userId]: false }));

    if (error) {
      toast.error("Failed to load influencer applications");
      return;
    }

    setApplicationsByUser(prev => ({
      ...prev,
      [userId]: data as unknown as InfluencerApplication[]
    }));
  };

  const toggleRow = (withdrawalId: number, userId: string) => {
    if (expandedRows.includes(withdrawalId)) {
      setExpandedRows(expandedRows.filter(id => id !== withdrawalId));
    } else {
      setExpandedRows([...expandedRows, withdrawalId]);
      loadUserApplications(userId);
    }
  };

  const getActionRequired = (reason: WithdrawalRejectionReason, customReason: string) => {
    switch (reason) {
      case 'INSUFFICIENT_FUNDS':
        return 'Please wait until your completed tasks are verified and your earnings are reflected in your account balance.';
      case 'INVALID_BANK_DETAILS':
        return 'Please update your bank account details with correct information and submit a new withdrawal request.';
      case 'SUSPICIOUS_ACTIVITY':
        return 'Your account shows suspicious activity patterns. Please contact support for assistance.';
      case 'MINIMUM_THRESHOLD':
        return 'Your withdrawal amount is below our minimum threshold. Please accumulate more earnings before requesting a withdrawal.';
      case 'VERIFICATION_REQUIRED':
        return 'Please complete your account verification process before requesting withdrawals.';
      case 'PENDING_TASKS':
        return 'You have pending task verifications. Please wait until all your submitted proofs are reviewed.';
      case 'ACCOUNT_RESTRICTED':
        return 'Your account is temporarily restricted. Please contact support for more information.';
      case 'OTHER':
        return customReason;
      default:
        return 'Please review the rejection reason and submit a new withdrawal request once resolved.';
    }
  };

  const handleWithdrawalAction = async (
    isAccepted: boolean,
    rejectionReason?: WithdrawalRejectionReason,
    customReason?: string
  ) => {
    if (!selectedWithdrawal || !isSuperAdmin) return;

    setIsProcessing(true);

    const { data: { user } } = await supabase.auth.getUser();
    const reviewerId = user?.id;

    // Start a transaction for rejection to handle both status update and balance update
    if (!isAccepted) {
      const { data: currentBalance, error: balanceCheckError } = await supabase
        .from("account_balance")
        .select("balance")
        .eq("user_id", selectedWithdrawal.user_id)
        .single();

      if (balanceCheckError) {
        toast.error("Failed to fetch current balance");
        setIsProcessing(false);
        return;
      }

      const { error: balanceError } = await supabase
        .from("account_balance")
        .update({
          balance: (currentBalance?.balance || 0) + selectedWithdrawal.amount,
          last_withdrawal: null
        })
        .eq("user_id", selectedWithdrawal.user_id);

      if (balanceError) {
        toast.error("Failed to update account balance");
        setIsProcessing(false);
        return;
      }
    }

    // Update withdrawal status
    const { error } = await supabase
      .from("withdrawal_request_status")
      .update({
        status: isAccepted ? "ACCEPTED" : "REJECTED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId
      })
      .eq("request_id", selectedWithdrawal.id);

    if (error) {
      toast.error(`Failed to ${isAccepted ? 'accept' : 'reject'} withdrawal request`);
    } else {
      // Send email notification
      const emailContext = {
        name: selectedWithdrawal.profile.name,
        amount: selectedWithdrawal.amount.toFixed(2),
        date: format(new Date(), 'MMMM d, yyyy')
      };

      if (isAccepted) {
        await sendMail({
          to: selectedWithdrawal.profile.email,
          subject: 'Withdrawal Request Approved - BrandSync',
          template: 'payment-accepted',
          context: emailContext,
          from: 'accounts@brandsync.lk'
        });
      } else {
        await sendMail({
          to: selectedWithdrawal.profile.email,
          subject: 'Withdrawal Request Update - BrandSync',
          template: 'payment-rejected',
          context: {
            ...emailContext,
            reason: withdrawalRejectionReasons.find(r => r.value === rejectionReason)?.label || 'Request Rejected',
            message: 'Your funds have been returned to your BrandSync account balance.'
          },
          from: 'accounts@brandsync.lk'
        });
      }

      toast.success(`Withdrawal request ${isAccepted ? 'accepted' : 'rejected'} successfully`);
      loadWithdrawals();
    }

    setIsProcessing(false);
    setShowConfirmDialog(false);
    setSelectedWithdrawal(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Withdrawal Requests</h1>
        <p className="text-muted-foreground mt-2">Manage and review withdrawal requests from influencers</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Influencer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Requested On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <React.Fragment key={withdrawal.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRow(withdrawal.id, withdrawal.user_id)}
                    >
                      {expandedRows.includes(withdrawal.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{withdrawal.profile.name}</p>
                      <p className="text-sm text-muted-foreground">{withdrawal.profile.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>Rs. {withdrawal.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <span>After 10% fee:</span>
                        <span>Rs. {(withdrawal.amount * 0.9).toFixed(2)}</span>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{withdrawal.withdrawal_option.bank_name}</p>
                      <p className="text-sm text-muted-foreground">{withdrawal.withdrawal_option.account_number}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(withdrawal.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        withdrawal.status?.status === "ACCEPTED" ? "success" :
                        withdrawal.status?.status === "REJECTED" ? "destructive" :
                        "default"
                      }
                    >
                      {withdrawal.status?.status || "PENDING"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {(!withdrawal.status || withdrawal.status.status === "PENDING") && isSuperAdmin && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const now = new Date().toISOString();
                            setSelectedWithdrawal({
                              ...withdrawal,
                              status: withdrawal.status ? {
                                ...withdrawal.status,
                                status: "ACCEPTED"
                              } : {
                                created_at: now,
                                id: 0, // Will be set by the database
                                request_id: withdrawal.id,
                                reviewed_at: null,
                                reviewed_by: null,
                                status: "ACCEPTED"
                              }
                            });
                            setShowConfirmDialog(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const now = new Date().toISOString();
                            setSelectedWithdrawal({
                              ...withdrawal,
                              status: withdrawal.status ? {
                                ...withdrawal.status,
                                status: "REJECTED"
                              } : {
                                created_at: now,
                                id: 0, // Will be set by the database
                                request_id: withdrawal.id,
                                reviewed_at: null,
                                reviewed_by: null,
                                status: "REJECTED"
                              }
                            });
                            setShowConfirmDialog(true);
                          }}
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                <AnimatePresence>
                  {expandedRows.includes(withdrawal.id) && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <Card className="mx-4 my-2">
                            <CardHeader>
                              <CardTitle className="text-lg">Latest Completed Tasks</CardTitle>
                              <CardDescription>
                                Recently completed and approved tasks by this influencer
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {loadingApplications[withdrawal.user_id] ? (
                                <div className="flex justify-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                                </div>
                              ) : applicationsByUser[withdrawal.user_id]?.length > 0 ? (
                                <div className="space-y-4">
                                  {applicationsByUser[withdrawal.user_id].map((app) => (
                                    <div key={app.id} className="flex items-center justify-between p-4 rounded-lg border">
                                      <div className="space-y-2">
                                        <h3 className="font-medium">{app.tasks.title}</h3>
                                        <div className="flex flex-wrap gap-2">
                                          {app.application_promises.map((promise, idx) => (
                                            <Badge key={idx} variant="outline">
                                              {promise.platform} • {promise.promised_reach} views
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                          <span>
                                            {app.application_proofs.length} proof{app.application_proofs.length !== 1 ? 's' : ''} verified
                                          </span>
                                          {app.application_proofs[0]?.proof_status.reviewed_by && (
                                            <span className="text-xs ml-2">
                                              by {app.application_proofs[0].proof_status.reviewed_by.name} on{' '}
                                              {new Date(app.application_proofs[0].proof_status.reviewed_at || '').toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">
                                          Completed on {new Date(app.created_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-center py-8 text-muted-foreground">
                                  No completed tasks found
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
            {withdrawals.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No withdrawal requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentWithdrawalModal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleWithdrawalAction}
        action={selectedWithdrawal?.status?.status === "ACCEPTED" ? "accept" : "reject"}
        withdrawalDetails={selectedWithdrawal ? {
          amount: selectedWithdrawal.amount,
          bankName: selectedWithdrawal.withdrawal_option.bank_name,
          accountNumber: selectedWithdrawal.withdrawal_option.account_number
        } : {
          amount: 0,
          bankName: '',
          accountNumber: ''
        }}
      />
    </div>
  );
}