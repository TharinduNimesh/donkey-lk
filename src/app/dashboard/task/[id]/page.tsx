"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelect } from "@/components/ui/payment-method-select";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";
import { uploadBankTransferSlip } from "@/lib/utils/storage";

type TaskDetail = Database['public']['Views']['task_details']['Row'];
type BankTransferSlip = Database['public']['Tables']['bank_transfer_slip']['Row'];

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [bankSlip, setBankSlip] = useState<BankTransferSlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState<{
    method?: 'bank-transfer' | 'card';
    bankSlip?: File;
  }>({});
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchTaskAndSlip = async () => {
      try {
        // Fetch task details
        const { data: taskData, error: taskError } = await supabase
          .from('task_details')
          .select('*')
          .eq('task_id', parseInt(id))
          .single();

        if (taskError) throw taskError;
        
        setTask(taskData);

        // Fetch bank transfer slip if exists
        if (taskData?.task_id) {
          const { data: slipData, error: slipError } = await supabase
            .from('bank_transfer_slip')
            .select('*')
            .eq('task_id', taskData.task_id)
            .single();

          if (!slipError) {
            setBankSlip(slipData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Error fetching task details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskAndSlip();
  }, [id]);

  const handlePaymentMethodSelect = (method: 'bank-transfer' | 'card') => {
    setPayment(prev => ({
      ...prev,
      method
    }));
  };

  const handleBankSlipUpload = (file: File) => {
    setPayment({
      method: 'bank-transfer',
      bankSlip: file
    });
  };

  const handleProceedToPayment = async () => {
    if (!task?.task_id || !payment.method) return;

    setIsLoading(true);
    try {
      if (payment.method === 'bank-transfer') {
        if (!payment.bankSlip) {
          toast.error("Please upload your bank transfer slip");
          return;
        }
        
        // Upload bank transfer slip
        await uploadBankTransferSlip(payment.bankSlip, task.task_id);
        
        // Update task status to ACTIVE after successful slip upload
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'ACTIVE' })
          .eq('id', task.task_id);

        if (error) throw error;
        toast.success("Payment verification in progress");
      } else {
        // TODO: Implement PayHere integration
        toast.success("Redirecting to payment gateway...");
      }

      router.push('/dashboard/buyer');
      router.refresh();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error("Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlip = async () => {
    if (!bankSlip || !task?.task_id) return;

    setIsLoading(true);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('bank-transfer-slips')
        .remove([bankSlip.slip]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('bank_transfer_slip')
        .delete()
        .eq('id', bankSlip.id);

      if (dbError) throw dbError;

      setBankSlip(null);
      toast.success("Bank transfer slip deleted successfully");
    } catch (error) {
      console.error('Error deleting slip:', error);
      toast.error("Failed to delete bank transfer slip");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!task) {
    return <div className="flex items-center justify-center min-h-screen">Task not found</div>;
  }

  const targets = task.targets as Array<{
    platform: Database['public']['Enums']['Platforms'];
    views: string;
    due_date: string | null;
  }>;

  const cost = task.cost as {
    amount: number;
    payment_method: Database['public']['Enums']['PaymentMethod'];
    is_paid: boolean;
  };

  // Get earliest deadline from task targets
  const earliestDeadline = targets?.reduce((earliest, target) => {
    if (!target.due_date) return earliest;
    return earliest ? (new Date(target.due_date) < new Date(earliest) ? target.due_date : earliest) : target.due_date;
  }, "");

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{task.title}</h1>
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${task.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
            ${task.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
            ${task.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' : ''}
            ${task.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
          `}>
            {task.status ? task.status.charAt(0) + task.status.slice(1).toLowerCase() : 'Unknown'}
          </span>
        </div>
        <p className="text-muted-foreground mt-2">{task.description}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {targets?.map((target, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{target.platform}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="block text-foreground font-medium">Target Views</span>
                    {formatViewCount(parseViewCount(target.views))}
                  </div>
                  <div>
                    <span className="block text-foreground font-medium">Deadline</span>
                    {target.due_date ? format(new Date(target.due_date), 'MMM d, yyyy') : 'No deadline set'}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <span className="font-medium">Total Amount</span>
                <span className="text-xl font-bold">${cost?.amount.toLocaleString()}</span>
              </div>
              
              {cost?.is_paid ? (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg">
                  <p className="font-medium">Payment Completed</p>
                  <p className="text-sm mt-1">Payment Method: {cost.payment_method.replace('_', ' ')}</p>
                </div>
              ) : task?.status === 'DRAFT' ? (
                <div className="space-y-4">
                  {bankSlip ? (
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-yellow-600 dark:text-yellow-400">
                            Payment Verification in Progress
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Bank transfer slip uploaded on {format(new Date(bankSlip.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:border-red-600"
                          onClick={handleDeleteSlip}
                          disabled={isLoading}
                        >
                          Delete Slip
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Our team will verify your payment shortly. Once verified, your task will be activated automatically.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg">
                        <p className="font-medium">Payment Required</p>
                        <p className="text-sm mt-1">Complete payment to activate your task</p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Select Payment Method</h3>
                        <PaymentMethodSelect
                          selectedMethod={payment.method}
                          onMethodSelect={handlePaymentMethodSelect}
                          onSlipUpload={handleBankSlipUpload}
                          bankSlip={payment.bankSlip}
                        />
                        
                        <div className="mt-6 flex justify-end">
                          <Button
                            onClick={handleProceedToPayment}
                            disabled={isLoading || !payment.method}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                          >
                            {isLoading ? 'Processing...' : 'Complete Payment'}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {task.status === 'ACTIVE' && (
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground p-8">
                Progress tracking feature coming soon
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Back
          </Button>
          
          {task.status === 'ACTIVE' && (
            <Button
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => {
                // TODO: Implement archive functionality
                toast.info("Archive functionality coming soon");
              }}
            >
              Archive Task
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}