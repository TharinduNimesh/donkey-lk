"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

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

      let query = supabase
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
        `, { count: 'exact' });

      const { data: slipsWithStatus, error: slipsError } = await query
        .order('created_at', { ascending: false });

      if (slipsError) throw slipsError;

      const { data: statuses, error: statusError } = await supabase
        .from('bank_transfer_status')
        .select('*')
        .in('transfer_id', slipsWithStatus?.map(slip => slip.id) || []);

      if (statusError) throw statusError;

      let combinedData = (slipsWithStatus || []).map(slip => ({
        ...slip,
        slipUrl: null,
        status: statuses?.find(status => status.transfer_id === slip.id)
      })) as PaymentWithDetails[];

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
          const userId = payment.task?.user_id;
          if (!userId) return payment;

          const [buyerProfile, buyerTasks, slipUrl] = await Promise.all([
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
            getStorageUrl('bank-transfer-slips', payment.slip)
          ]);

          const totalPaid = buyerTasks.data?.reduce((sum, task) => {
            const cost = task.task_cost as { amount: number; is_paid: boolean } | null;
            return sum + (cost?.is_paid ? cost.amount : 0);
          }, 0) || 0;

          const totalPending = buyerTasks.data?.reduce((sum, task) => {
            const cost = task.task_cost as { amount: number; is_paid: boolean } | null;
            return sum + (!cost?.is_paid ? cost?.amount || 0 : 0);
          }, 0) || 0;

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
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
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
    if (!payment || !payment.task?.cost) return;

    try {
      setProcessingPayment(payment.id);

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
            rejectionReason: rejectionLabel,
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Task Payments</h1>
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value: typeof statusFilter) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
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
      
      <Card>
        <CardHeader>
          <CardTitle>Bank Transfer Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bank transfer payments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Buyer Information</th>
                    <th className="text-left py-3 px-4">Task Details</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Payment Status</th>
                    <th className="text-left py-3 px-4">Reviewed</th>
                    <th className="text-left py-3 px-4">Submitted</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const cost = payment.task?.cost;
                    
                    return (
                      <tr key={payment.id} className="border-b">
                        <td className="py-3 px-4">
                          {payment.buyer && (
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{payment.buyer.name}</div>
                              <div className="text-xs text-muted-foreground">{payment.buyer.email}</div>
                              <div className="text-xs text-muted-foreground">
                                Total Paid: Rs. {payment.buyer.totalPaid.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Pending Payments: Rs. {payment.buyer.totalPending.toLocaleString()}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{payment.task?.title}</div>
                            <div className="text-sm text-muted-foreground">{payment.task?.description}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          Rs. {cost?.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${getStatusBadgeClass(payment.status?.status)}
                          `}>
                            {payment.status?.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {payment.status?.reviewed_at ? (
                            format(new Date(payment.status.reviewed_at), 'MMM d, yyyy')
                          ) : (
                            <span className="text-muted-foreground">Not reviewed</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {payment.slipUrl && (
                              <a 
                                href={payment.slipUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                              >
                                View Slip
                              </a>
                            )}
                            {payment.status?.status === "PENDING" && cost && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                  onClick={() => handlePaymentAction(payment, 'accept')}
                                  disabled={processingPayment === payment.id}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handlePaymentAction(payment, 'reject')}
                                  disabled={processingPayment === payment.id}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <PaginationControls />
            </div>
          )}
        </CardContent>
      </Card>

      {confirmationModal.payment && (
        <PaymentConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handlePaymentUpdate}
          action={confirmationModal.action}
          paymentDetails={{
            taskTitle: confirmationModal.payment.task?.title || '',
            amount: confirmationModal.payment.task?.cost?.amount || 0,
          }}
        />
      )}
    </div>
  );
}