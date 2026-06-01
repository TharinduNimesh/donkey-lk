"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";
import { format } from "date-fns";
import { getStorageUrl } from "@/lib/utils/storage";
import { toast } from "sonner";
import { sendMail } from "@/lib/utils/email";
import { PaymentConfirmationModal, type RejectionReason, rejectionReasonsList, type RejectionReasonItem } from "@/components/dashboard/payment-confirmation-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, X, ExternalLink, FileImage } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 10;

type BankTransferSlip = Database["public"]["Tables"]["bank_transfer_slip"]["Row"];
type BankTransferStatus = Database["public"]["Tables"]["bank_transfer_status"]["Row"];
type TaskDetail = Database["public"]["Views"]["task_details"]["Row"];

interface TaskCost {
  id: number;
  amount: number;
  is_paid: boolean;
  payment_method: Database["public"]["Enums"]["PaymentMethod"];
  metadata: any;
  paid_at: string | null;
  created_at: string;
}

interface PaymentWithDetails extends BankTransferSlip {
  task: TaskDetail & {
    cost: TaskCost;
  };
  slipUrl: string | null;
  status?: BankTransferStatus;
  buyer?: {
    id: string;
    name: string;
    email: string;
    totalPaid: number;
    totalPending: number;
  };
}

const getActionRequired = (reason: RejectionReason, customReason: string, expectedAmount: string) => {
  switch (reason) {
    case 'INSUFFICIENT_AMOUNT':
      return `The payment amount does not match the task cost. Please submit a new payment with the correct amount of Rs. ${expectedAmount}.`;
    case 'INVALID_ACCOUNT':
      return 'The bank account details in the transfer slip do not match our records. Please ensure you\'re transferring to the correct account and submit a new payment.';
    case 'FAKE_RECEIPT':
      return 'We could not verify the authenticity of the submitted receipt. Please submit a valid bank transfer receipt.';
    case 'REFERENCE_NOT_FOUND':
      return 'We could not locate the transfer using the provided reference number. Please ensure the transfer has been completed and submit the correct receipt.';
    case 'OTHER':
      return customReason;
    default:
      return 'Please submit a new payment after addressing the issue mentioned above.';
  }
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Database["public"]["Enums"]["BankTransferStatus"]>("ALL");
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    action: 'accept' | 'reject';
    payment: PaymentWithDetails | null;
  }>({
    isOpen: false,
    action: 'accept',
    payment: null
  });
  const [slipPreview, setSlipPreview] = useState<PaymentWithDetails | null>(null);

  const fetchPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profile')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile?.role.includes('ADMIN')) {
        router.push('/dashboard');
        return;
      }

      // ── 1. Fetch TASK-based bank transfer slips ──
      const { data: taskSlips, error: taskSlipsError } = await supabase
        .from('bank_transfer_slip')
        .select(`
          *,
          task:task_details!inner(
            task_id,
            title,
            description,
            status,
            cost,
            created_at,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (taskSlipsError) {
        console.error('Error fetching task slips:', taskSlipsError);
      }

      // Fetch statuses for task slips
      const taskSlipIds = (taskSlips || []).map(slip => slip.id);
      const { data: taskStatuses } = taskSlipIds.length
        ? await supabase
            .from('bank_transfer_status')
            .select('*')
            .in('transfer_id', taskSlipIds)
        : { data: [] };

      let combinedData = (taskSlips || []).map(slip => ({
        ...slip,
        slipUrl: null,
        status: taskStatuses?.find(status => status.transfer_id === slip.id)
      })) as PaymentWithDetails[];

      // ── 2. Fetch BRANDSYNC-based bank transfer slips via admin API ──
      // Uses server-side supabaseAdmin to bypass RLS on brandsync_links
      try {
        const bsResp = await fetch('/api/admin/brandsync-payments');
        if (bsResp.ok) {
          const { payments: bsPayments } = await bsResp.json();
          if (bsPayments && bsPayments.length > 0) {
            // Remove any already picked up by the task query
            const existingIds = new Set(combinedData.map(p => p.id));
            const uniqueBsPayments = bsPayments
              .filter((p: any) => !existingIds.has(p.id))
              .map((p: any) => ({
                ...p,
                slipUrl: null, // will be fetched in enrichment step
              }));
            combinedData = combinedData.concat(uniqueBsPayments) as PaymentWithDetails[];
          }
        }
      } catch (bsErr) {
        console.error('Error fetching BrandSync payments:', bsErr);
      }

      // Sort combined data by created_at descending
      combinedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (statusFilter !== "ALL") {
        combinedData = combinedData.filter(
          payment => payment.status?.status === statusFilter
        );
      }

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const paginatedData = combinedData.slice(start, end);

      const paymentsWithDetails = await Promise.all(
        paginatedData.map(async (payment) => {
          const slipPath = (payment as any).slip || payment.slip;
          const isBrandSync = (payment as any).isBrandSync === true;

          // Always fetch the slip URL first
          let slipUrl: string | null = null;
          if (slipPath) {
            slipUrl = await getStorageUrl('bank-transfer-slips', slipPath);
          }

          // For BrandSync payments, if the join didn't return brandsync data, fetch it separately
          let brandSyncData = (payment as any).brandsync;
          if (isBrandSync && !brandSyncData && (payment as any).brandsync_id) {
            const { data: bsLink } = await (supabase as any)
              .from('brandsync_links')
              .select('id, title, amount, user_id')
              .eq('id', (payment as any).brandsync_id)
              .single();
            if (bsLink) {
              brandSyncData = bsLink;
              // Update the payment task title and amount
              (payment as any).brandsync = bsLink;
              if (payment.task) {
                payment.task.title = bsLink.title || 'BrandSync Link';
              }
            }
          }

          // Determine the user ID
          const userId = isBrandSync
            ? brandSyncData?.user_id
            : payment.task?.user_id;

          if (!userId) {
            return { ...payment, slipUrl };
          }

          const [buyerProfile, buyerTasks, buyerLinks] = await Promise.all([
            supabase
              .from('profile')
              .select('*')
              .eq('id', userId)
              .single(),
            supabase
              .from('tasks')
              .select(`
                id,
                task_cost (
                  amount,
                  is_paid
                )
              `)
              .eq('user_id', userId),
            supabase
              .from('brandsync_links')
              .select('amount, is_paid')
              .eq('user_id', userId),
          ]);

          const totalPaidTasks = buyerTasks.data?.reduce((sum, task) => {
            const cost = task.task_cost as { amount: number; is_paid: boolean } | null;
            return sum + (cost?.is_paid ? cost.amount : 0);
          }, 0) || 0;

          const totalPaidLinks = buyerLinks.data?.reduce((sum, link) => {
            return sum + (link.is_paid ? Number(link.amount || 0) : 0);
          }, 0) || 0;

          const totalPendingTasks = buyerTasks.data?.reduce((sum, task) => {
            const cost = task.task_cost as { amount: number; is_paid: boolean } | null;
            return sum + (!cost?.is_paid ? cost?.amount || 0 : 0);
          }, 0) || 0;

          const totalPendingLinks = buyerLinks.data?.reduce((sum, link) => {
            return sum + (!link.is_paid ? Number(link.amount || 0) : 0);
          }, 0) || 0;

          const totalPaid = totalPaidTasks + totalPaidLinks;
          const totalPending = totalPendingTasks + totalPendingLinks;

          return {
            ...payment,
            slipUrl,
            buyer: buyerProfile.data ? {
              ...buyerProfile.data,
              totalPaid,
              totalPending
            } : undefined
          };
        })
      );

      setPayments(paymentsWithDetails);
      setTotalPayments(combinedData.length);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, statusFilter]);

  const getStatusBadgeClass = (status?: BankTransferStatus['status']) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50/80 border-0 font-semibold';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 hover:bg-red-50/80 border-0 font-semibold';
      case 'PENDING':
      default:
        return 'bg-amber-50 text-amber-700 hover:bg-amber-50/80 border-0 font-semibold';
    }
  };

  const handlePaymentAction = (payment: PaymentWithDetails, action: 'accept' | 'reject') => {
    setConfirmationModal({
      isOpen: true,
      action,
      payment
    });
  };

  const handlePaymentUpdate = async (
    isAccepted: boolean, 
    rejectionReason?: RejectionReason, 
    customReason?: string
  ) => {
    const payment = confirmationModal.payment;
    if (!payment) return;
    const isBrand = (payment as any).isBrandSync === true;
    if (!isBrand && !payment.task?.cost) return;
    try {
      setProcessingPayment(payment.id);

      if ((payment as any).isBrandSync) {
        // Call admin endpoint for BrandSync slips
        const resp = await fetch(`/api/admin/brandsync-payments/${payment.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: isAccepted ? 'accept' : 'reject', reason: customReason || undefined })
        });

        if (!resp.ok) throw new Error('Failed to update BrandSync payment');

        toast.success(`Payment ${isAccepted ? 'accepted' : 'rejected'} successfully`);
      } else {
        const { error } = await supabase.rpc('update_bank_transfer_payment', {
          transfer_id_param: payment.id,
          task_cost_id_param: payment.task.cost.id,
          is_accepted_param: isAccepted
        });

        if (error) throw error;

        // Send email notification
        const emailContext: Record<string, string> = {
          name: payment.buyer?.name || 'User',
          taskTitle: payment.task.title || '',
          taskId: payment.task.task_id?.toString() || '',
          amount: payment.task.cost.amount.toString(),
          date: format(new Date(), 'MMMM d, yyyy'),
        };

        if (isAccepted) {
          await sendMail({
            to: payment.buyer?.email || '',
            subject: 'Payment Accepted - BrandSync',
            template: 'payment-accepted',
            context: emailContext,
            from: 'accounts@brandsync.lk'
          });
        } else if (rejectionReason) {
          const rejectionLabel = rejectionReasonsList.find(
            (r) => r.value === rejectionReason
          )?.label || 'Payment Rejected';

          await sendMail({
            to: payment.buyer?.email || '',
            subject: 'Payment Rejected - BrandSync',
            template: 'payment-rejected',
            context: {
              ...emailContext,
              reason: rejectionLabel,
              actionRequired: getActionRequired(
                rejectionReason,
                customReason || '',
                payment.task.cost.amount.toString()
              )
            },
            from: 'accounts@brandsync.lk'
          });
        }

        toast.success(`Payment ${isAccepted ? 'accepted' : 'rejected'} successfully`);
      }

      router.refresh();
      await fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(`Failed to ${isAccepted ? 'accept' : 'reject'} payment`);
    } finally {
      setProcessingPayment(null);
      setConfirmationModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const totalPages = Math.ceil(totalPayments / ITEMS_PER_PAGE);

  const PaginationControls = () => (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-sm">
        Page {currentPage} of {totalPages}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Task Payments</h1>
          <p className="text-xs text-gray-500">Verify and process bank transfer payment slips uploaded by buyers.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value: typeof statusFilter) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] bg-white border-gray-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Bank Transfer Payments</h2>
          <p className="text-xs text-gray-400">Click &quot;Review&quot; to view the uploaded bank slip and verify the payment.</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-sm">
              No bank transfer payments found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Buyer Information</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Task Details</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Amount</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Payment Status</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Submitted</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const cost = payment.task?.cost;
                    const isBrandSync = (payment as any).isBrandSync === true;
                    const amount = isBrandSync
                      ? (payment as any).brandsync?.amount
                      : cost?.amount;
                    
                    return (
                      <TableRow key={payment.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                        <TableCell className="py-3.5 px-4">
                          {payment.buyer && (
                            <div className="space-y-1">
                              <div className="font-semibold text-sm text-gray-800">{payment.buyer.name}</div>
                              <div className="text-xs text-gray-500">{payment.buyer.email}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          <div className="max-w-[200px]">
                            <div className="font-semibold text-sm text-gray-800 truncate">{payment.task?.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{payment.task?.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                          Rs. {amount !== undefined && amount !== null ? amount.toLocaleString() : "0"}
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border-0 ${getStatusBadgeClass(payment.status?.status)}`}>
                            {payment.status?.status || 'PENDING'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-gray-500">
                          {format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Review Slip Button */}
                            {payment.slipUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-pink-600 border-pink-200 bg-pink-50/30 hover:bg-pink-50 hover:text-pink-700 font-semibold gap-1"
                                onClick={() => setSlipPreview(payment)}
                              >
                                <Eye className="h-3 w-3" />
                                Review
                              </Button>
                            )}
                            {/* Accept / Reject (only for pending) */}
                            {payment.status?.status === "PENDING" && (cost || isBrandSync) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-emerald-600 border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 hover:text-emerald-700"
                                  onClick={() => handlePaymentAction(payment, 'accept')}
                                  disabled={processingPayment === payment.id}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-red-600 border-red-200 bg-red-50/30 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handlePaymentAction(payment, 'reject')}
                                  disabled={processingPayment === payment.id}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="px-4 border-t border-gray-100">
                <PaginationControls />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Slip Review Modal ── */}
      <Dialog open={!!slipPreview} onOpenChange={(open) => { if (!open) setSlipPreview(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {slipPreview && (() => {
            const cost = slipPreview.task?.cost;
            const isBrandSync = (slipPreview as any).isBrandSync === true;
            const amount = isBrandSync
              ? (slipPreview as any).brandsync?.amount
              : cost?.amount;

            return (
              <>
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileImage className="h-5 w-5 text-pink-500" />
                        Payment Slip Review
                      </DialogTitle>
                      <p className="text-xs text-gray-500 mt-1">
                        Verify the uploaded bank transfer slip below
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(slipPreview.status?.status)}`}>
                      {slipPreview.status?.status || 'PENDING'}
                    </span>
                  </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-h-[calc(90vh-140px)] overflow-y-auto">
                  {/* Slip Image – takes 1 column (50%) */}
                  <div className="md:col-span-1 bg-gray-50 flex items-center justify-center p-4 min-h-[300px] border-r border-gray-100">
                    {slipPreview.slipUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={slipPreview.slipUrl}
                          alt="Bank Transfer Slip"
                          className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm border border-gray-200"
                        />
                        <a
                          href={slipPreview.slipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white transition-all shadow-sm"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 space-y-2">
                        <FileImage className="h-12 w-12 mx-auto text-gray-300" />
                        <p className="text-sm">No slip image available</p>
                      </div>
                    )}
                  </div>

                  {/* Details Panel – takes 1 column (50%) */}
                  <div className="md:col-span-1 p-5 space-y-5">
                    {/* Buyer Info */}
                    {slipPreview.buyer && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Buyer</h4>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
                          <p className="font-semibold text-sm text-gray-800">{slipPreview.buyer.name}</p>
                          <p className="text-xs text-gray-500">{slipPreview.buyer.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Task Info */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Task</h4>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
                        <p className="font-semibold text-sm text-gray-800">{slipPreview.task?.title}</p>
                        {slipPreview.task?.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{slipPreview.task.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</h4>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Amount</span>
                          <span className="text-sm font-bold text-gray-900">Rs. {amount !== undefined && amount !== null ? amount.toLocaleString() : "0"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Submitted</span>
                          <span className="text-xs font-medium text-gray-700">{format(new Date(slipPreview.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {slipPreview.status?.reviewed_at && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Reviewed</span>
                            <span className="text-xs font-medium text-gray-700">{format(new Date(slipPreview.status.reviewed_at), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {isBrandSync && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Type</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold">BrandSync Link</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {(!slipPreview.status || slipPreview.status?.status === "PENDING") && (cost || isBrandSync) && (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                            onClick={() => {
                              setSlipPreview(null);
                              handlePaymentAction(slipPreview, 'accept');
                            }}
                            disabled={processingPayment === slipPreview.id}
                          >
                            Accept Payment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 text-xs text-red-600 border-red-200 bg-red-50/30 hover:bg-red-50 hover:text-red-700 font-semibold"
                            onClick={() => {
                              setSlipPreview(null);
                              handlePaymentAction(slipPreview, 'reject');
                            }}
                            disabled={processingPayment === slipPreview.id}
                          >
                            Reject Payment
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Confirmation Modal (accept/reject with reason) ── */}
      {confirmationModal.payment && (
        <PaymentConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handlePaymentUpdate}
          action={confirmationModal.action}
          paymentDetails={{
            taskTitle: (confirmationModal.payment as any).isBrandSync ? ((confirmationModal.payment as any).brandsync?.title || '') : (confirmationModal.payment.task?.title || ''),
            amount: (confirmationModal.payment as any).isBrandSync ? ((confirmationModal.payment as any).brandsync?.amount || 0) : (confirmationModal.payment.task?.cost?.amount || 0),
          }}
        />
      )}
    </div>
  );
}