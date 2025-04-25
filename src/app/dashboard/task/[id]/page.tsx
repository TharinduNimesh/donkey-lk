"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { toast } from "sonner";
import { uploadBankTransferSlip } from "@/lib/utils/storage";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import { TaskDetailsHeader } from "@/components/dashboard/task-details/task-details-header";
import { PlatformTargetsCard } from "@/components/dashboard/task-details/platform-targets-card";
import { PaymentDetailsCard } from "@/components/dashboard/task-details/payment-details-card";
import { ApplicationsListCard } from "@/components/dashboard/task-details/applications-list-card";
import { TaskActionsFooter } from "@/components/dashboard/task-details/task-actions-footer";

// Using the same type as in the buyer dashboard
type TaskDetail = {
  task_id: number | null;
  title: string | null;
  description: string | null;
  status: Database['public']['Enums']['TaskStatus'] | null;
  created_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  cost: any;
  source: string | null;
  total_influencers: number | null;
  total_promised_views: number | null;
  total_proof_views?: number | null;
  total_target_views: number | null;
  targets: any;
};
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
type ApplicationProof = Database['public']['Tables']['application_proofs']['Row'] & {
  status?: {
    id: number;
    status: Database['public']['Enums']['ProofStatus'];
    proof_id: number;
    created_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
  } | null;
};

interface ApplicationWithDetails extends TaskApplication {
  promises: ApplicationPromise[];
  influencer: InfluencerProfile | null;
  proofs: ApplicationProof[];
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
    const fetchTaskDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch task details
        const { data: taskData, error: taskError } = await supabase
          .from('task_details_view')
          .select('*')
          .eq('task_id', parseInt(id))
          .single();

        if (taskError) throw taskError;
        if (!taskData) throw new Error('Task not found');

        // Ensure we have all the required properties for our TaskDetail type
        const enhancedTaskData: TaskDetail = {
          ...taskData,
          // Add the properties needed for our enhanced UI
          total_influencers: taskData.total_influencers !== undefined ? taskData.total_influencers : 0,
          total_promised_views: taskData.total_promised_views !== undefined ? taskData.total_promised_views : 0,
          total_proof_views: 0, // Default value if not available
          total_target_views: taskData.total_target_views !== undefined ? taskData.total_target_views : 0
        };
        
        setTask(enhancedTaskData);

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

          // Fetch influencer profiles and proofs for each application
          const applicationsWithDetails = await Promise.all(
            applicationsData.map(async (application) => {
              const platform = application.promises[0]?.platform;
              if (!platform || !application.user_id) {
                return { ...application, influencer: null, proofs: [] };
              }

              // Fetch influencer profile
              const { data: profileData } = await supabase
                .from('influencer_profile')
                .select('*')
                .eq('user_id', application.user_id)
                .eq('platform', platform)
                .single();
              
              // Fetch proofs with their status
              const { data: proofsData, error: proofsError } = await supabase
                .from('application_proofs')
                .select(`
                  *,
                  status:proof_status(*)
                `)
                .eq('application_id', application.id);
              
              // Filter only approved proofs if task is active
              const filteredProofs = taskData.status === 'ACTIVE' 
                ? proofsData?.filter(proof => proof.status?.status === 'ACCEPTED') || []
                : proofsData || [];

              return {
                ...application,
                influencer: profileData || null,
                proofs: filteredProofs
              };
            })
          );

          setApplications(applicationsWithDetails);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Error fetching task details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetails();
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

  const handleDeleteTask = async () => {
    if (!task?.task_id) return;

    setIsLoading(true);
    try {
      // Delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.task_id);

      if (error) throw error;
      
      toast.success("Task deleted successfully");
      router.push('/dashboard/buyer');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error("Failed to delete task");
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

  const handleUnarchiveTask = async () => {
    if (!task?.task_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.task_id);

      if (error) throw error;
      
      toast.success("Task unarchived successfully");
      router.push('/dashboard/buyer');
    } catch (error) {
      console.error('Error unarchiving task:', error);
      toast.error("Failed to unarchive task");
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
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-950 font-['Roboto']">
        <div className="container mx-auto py-8 px-4">
          <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse mb-8" />
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full h-[300px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-950 font-['Roboto']">
        <div className="container mx-auto py-16 px-4 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full text-center space-y-6 p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Task not found</h2>
            <p className="text-muted-foreground">The task you're looking for doesn't exist or has been removed.</p>
            <Button 
              onClick={() => router.push('/dashboard/buyer')} 
              className="mt-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </div>
    );
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
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 font-['Roboto']">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TaskDetailsHeader task={task} />
        </motion.div>
        
        <div className="space-y-8 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <PlatformTargetsCard targets={targets} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <PaymentDetailsCard
              cost={cost}
              taskStatus={task.status}
              bankSlips={bankSlips}
              payment={payment}
              isLoading={isLoading}
              onMethodSelect={handlePaymentMethodSelect}
              onSlipUpload={handleBankSlipUpload}
              onProceedToPayment={handleProceedToPayment}
              onDeleteSlip={handleDeleteSpecificSlip}
            />
          </motion.div>

          {task.status === 'ACTIVE' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <ApplicationsListCard applications={applications} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <TaskActionsFooter
              taskStatus={task.status}
              isLoading={isLoading}
              onBack={() => router.push('/dashboard/buyer')}
              onArchive={handleArchiveTask}
              onComplete={handleCompleteTask}
              onDelete={handleDeleteTask}
              onUnarchive={handleUnarchiveTask}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}