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

type BankTransferSlip = Database["public"]["Tables"]["bank_transfer_slip"]["Row"];
type BankTransferStatus = Database["public"]["Tables"]["bank_transfer_status"]["Row"];
type TaskDetail = Database["public"]["Views"]["task_details"]["Row"];

type PaymentWithDetails = BankTransferSlip & {
  task: TaskDetail;
  slipUrl: string | null;
  status?: BankTransferStatus;
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);

  const fetchPayments = async () => {
    try {
      // First verify admin access
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

      // Fetch bank transfer slips with task details and status
      const { data, error } = await supabase
        .from('bank_transfer_slip')
        .select(`
          *,
          task:task_details (
            task_id,
            title,
            description,
            status,
            cost,
            created_at,
            user_id
          ),
          status:bank_transfer_status (
            status,
            reviewed_at,
            reviewed_by
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate storage URLs for each slip
      const paymentsWithUrls = await Promise.all(
        (data as PaymentWithDetails[]).map(async (payment) => {
          const slipUrl = await getStorageUrl('bank-transfer-slips', payment.slip);
          return { ...payment, slipUrl };
        })
      );

      setPayments(paymentsWithUrls);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

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

  const handlePaymentUpdate = async (transferId: number, taskCost: any, isAccepted: boolean) => {
    try {
      setProcessingPayment(transferId);

      // Call the update_bank_transfer_payment function
      const { error } = await supabase.rpc('update_bank_transfer_payment', {
        transfer_id_param: transferId,
        task_cost_id_param: taskCost.id,
        is_accepted_param: isAccepted
      });

      if (error) throw error;

      // Show success message
      toast.success(`Payment ${isAccepted ? 'accepted' : 'rejected'} successfully`);
      
      // Refresh the data
      router.refresh();
      // Refetch payments to update the UI
      await fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(`Failed to ${isAccepted ? 'accept' : 'reject'} payment`);
    } finally {
      setProcessingPayment(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Task Payments</h1>
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
                    <th className="text-left py-3 px-4">Task</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Payment Status</th>
                    <th className="text-left py-3 px-4">Reviewed</th>
                    <th className="text-left py-3 px-4">Submitted</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const cost = payment.task?.cost as { 
                      id: number;
                      amount: number;
                      is_paid: boolean;
                      payment_method: Database["public"]["Enums"]["PaymentMethod"];
                      metadata: any;
                      paid_at: string | null;
                      created_at: string;
                    } | null;
                    
                    return (
                      <tr key={payment.id} className="border-b">
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
                                  onClick={() => handlePaymentUpdate(payment.id, cost, true)}
                                  disabled={processingPayment === payment.id}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handlePaymentUpdate(payment.id, cost, false)}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}