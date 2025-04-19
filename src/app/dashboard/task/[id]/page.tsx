"use client";

import { useState, useEffect, useRef } from "react";
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
type BankTransferSlip = Database['public']['Tables']['bank_transfer_slip']['Row'] & {
  status?: {
    status: Database['public']['Enums']['BankTransferStatus'];
    reviewed_at: string | null;
    reviewed_by: string | null;
  } | null;
};
type TaskApplication = Database['public']['Tables']['task_applications']['Row'];
type ApplicationPromise = Database['public']['Tables']['application_promises']['Row'];
type InfluencerProfile = Database['public']['Tables']['influencer_profile']['Row'];

interface ApplicationWithDetails extends TaskApplication {
  promises: ApplicationPromise[];
  influencer: InfluencerProfile | null;
}

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [bankSlips, setBankSlips] = useState<BankTransferSlip[]>([]);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState<{
    method?: 'bank-transfer' | 'card';
    bankSlip?: File;
  }>({});
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchTaskAndData = async () => {
      try {
        // Fetch task details
        const { data: taskData, error: taskError } = await supabase
          .from('task_details')
          .select('*')
          .eq('task_id', parseInt(id))
          .single();

        if (taskError) throw taskError;
        setTask(taskData);

        // Fetch all bank transfer slips with status if exists
        if (taskData?.task_id) {
          const { data: slipsData, error: slipsError } = await supabase
            .from('bank_transfer_slip')
            .select(`
              *,
              status:bank_transfer_status (
                status,
                reviewed_at,
                reviewed_by
              )
            `)
            .eq('task_id', taskData.task_id)
            .order('created_at', { ascending: false });

          if (!slipsError && slipsData) {
            setBankSlips(slipsData);
          }

          // Fetch applications with promises
          const { data: applicationsData, error: applicationsError } = await supabase
            .from('task_applications')
            .select(`
              *,
              promises: application_promises(*)
            `)
            .eq('task_id', taskData.task_id)
            .eq('is_cancelled', false);

          if (applicationsError) throw applicationsError;

          // Fetch influencer profiles for each application
          const applicationsWithProfiles = await Promise.all(
            applicationsData.map(async (application) => {
              const platform = application.promises[0]?.platform;
              if (!platform || !application.user_id) {
                return { ...application, influencer: null };
              }

              const { data: profileData } = await supabase
                .from('influencer_profile')
                .select('*')
                .eq('user_id', application.user_id)
                .eq('platform', platform)
                .single();

              return {
                ...application,
                influencer: profileData || null
              };
            })
          );

          setApplications(applicationsWithProfiles);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Error fetching task details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskAndData();
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
        
        toast.success("Payment verification in progress");
        router.push('/dashboard/buyer');
      } else {
        console.log("Processing card payment");
        // Initialize PayHere payment
        const response = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.task_id })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize payment');
        }

        const formData = await response.json();
        console.log("Payment form data:", formData);

        // Create and submit PayHere form
        const paymentForm = document.createElement("form");
        paymentForm.method = "post";
        paymentForm.action = formData.checkout_url;
        paymentForm.target = "_blank";

        // Add form fields
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value.toString();
            paymentForm.appendChild(input);
          }
        });

        // Append to body, submit, then remove
        document.body.appendChild(paymentForm);
        console.log("Submitting payment form...");
        paymentForm.submit();
        setTimeout(() => {
          document.body.removeChild(paymentForm);
        }, 100);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment");
      setIsLoading(false);
    }
  };

  const handleDeleteSpecificSlip = async (slipId: number, slipName: string) => {
    setIsLoading(true);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('bank-transfer-slips')
        .remove([slipName]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('bank_transfer_slip')
        .delete()
        .eq('id', slipId);

      if (dbError) throw dbError;

      setBankSlips(bankSlips.filter(slip => slip.id !== slipId));
      toast.success("Bank transfer slip deleted successfully");
    } catch (error) {
      console.error('Error deleting slip:', error);
      toast.error("Failed to delete bank transfer slip");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveTask = async () => {
    if (!task?.task_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'ARCHIVED',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.task_id);

      if (error) throw error;
      
      toast.success("Task archived successfully");
      router.push('/dashboard/buyer');
    } catch (error) {
      console.error('Error archiving task:', error);
      toast.error("Failed to archive task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!task?.task_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', task.task_id);

      if (error) throw error;
      
      toast.success("Task marked as completed");
      router.push('/dashboard/buyer');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error("Failed to complete task");
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
                  {bankSlips.length > 0 ? (
                    <div className="space-y-4">
                      {bankSlips.map((slip) => (
                        <div key={slip.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-medium ${
                                slip.status?.status === 'ACCEPTED' ? 'text-green-600 dark:text-green-400' :
                                slip.status?.status === 'REJECTED' ? 'text-red-600 dark:text-red-400' :
                                'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {slip.status?.status === 'ACCEPTED' ? 'Payment Accepted' :
                                 slip.status?.status === 'REJECTED' ? 'Payment Rejected' :
                                 'Payment Verification in Progress'}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Bank transfer slip uploaded on {format(new Date(slip.created_at), 'MMM d, yyyy')}
                                {slip.status?.reviewed_at && (
                                  <> • Reviewed on {format(new Date(slip.status.reviewed_at), 'MMM d, yyyy')}</>
                                )}
                              </p>
                            </div>
                            {slip.status?.status !== 'ACCEPTED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:border-red-600"
                                onClick={() => handleDeleteSpecificSlip(slip.id, slip.slip)}
                                disabled={isLoading}
                              >
                                Delete Slip
                              </Button>
                            )}
                          </div>
                          {slip.status?.status === 'REJECTED' ? (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              Your payment was rejected. Please upload a new bank transfer slip or try a different payment method.
                            </p>
                          ) : slip.status?.status === 'ACCEPTED' ? (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Your payment has been verified and your task is now active.
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Our team will verify your payment shortly. Once verified, your task will be activated automatically.
                            </p>
                          )}
                        </div>
                      ))}
                      
                      {/* Show payment form only if no pending or accepted slips */}
                      {!bankSlips.some(slip => 
                        slip.status?.status === 'PENDING' || 
                        slip.status?.status === 'ACCEPTED'
                      ) && (
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
                      )}
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
              <CardTitle>Task Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="p-4 border rounded-lg">
                      {application.influencer ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{application.influencer.name}</h4>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="capitalize">{application.influencer.platform.toLowerCase()}</span>
                              <span className="mx-2">•</span>
                              <span>{application.influencer.followers} followers</span>
                              {application.promises[0] && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>Promised reach: {application.promises[0].promised_reach}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Applied on {format(new Date(application.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Application data unavailable
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  No applications yet
                </div>
              )}
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
          
          <div className="space-x-4">
            {(task.status === 'DRAFT' || task.status === 'ACTIVE') && (
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={handleArchiveTask}
                disabled={isLoading}
              >
                {isLoading ? 'Archiving...' : 'Archive Task'}
              </Button>
            )}
            
            {task.status === 'ACTIVE' && (
              <Button
                className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:opacity-90"
                onClick={handleCompleteTask}
                disabled={isLoading}
              >
                {isLoading ? 'Completing...' : 'Mark as Completed'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}