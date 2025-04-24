"use client"

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/ui/stepper";
import { ViewsSelect, viewOptions } from "@/components/ui/views-select";
import { DeadlineSelect, deadlineOptions } from "@/components/ui/deadline-select";
import { FileUpload } from "@/components/ui/file-upload";
import { PaymentMethodSelect } from "@/components/ui/payment-method-select";
import { createTask } from "@/lib/utils/tasks";
import { uploadBankTransferSlip } from "@/lib/utils/storage";
import { calculateCostClient } from "@/lib/utils/cost";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";
import { toast } from "sonner";
import { Database } from "@/types/database.types";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  Target, 
  CreditCard, 
  Save, 
  CheckCircle, 
  Youtube, 
  Facebook, 
  Instagram, 
  MessageCircle,
  Clock,
  DollarSign,
  PieChart,
  Tags,
  UploadCloud,
  Trash2,
  Plus,
  ChevronRight,
  EyeIcon,
  AlertCircle,
  Receipt
} from "lucide-react";

type Platform = Database["public"]["Enums"]["Platforms"];

interface TaskForm {
  title: string;
  description: string;
  contentFile: File | null;
  platforms: {
    platform: Platform;
    target_views: string;
    deadline_option: "3d" | "1w" | "2w" | "1m" | "2m" | "3m" | "6m" | "flexible";
    deadline: string | null;
    estimatedCost?: number;
  }[];
  payment?: {
    method: 'bank-transfer' | 'card';
    bankSlip?: File;
  };
}

interface PlatformIcon {
  [key: string]: React.ComponentType<{ className?: string; size?: number }>;
}

const PLATFORMS = ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'] as const;

const platformIcons: PlatformIcon = {
  'YOUTUBE': Youtube,
  'FACEBOOK': Facebook,
  'INSTAGRAM': Instagram,
  'TIKTOK': MessageCircle, // Using MessageCircle as a placeholder for TikTok
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function CreateTaskPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<TaskForm>({
    title: "",
    description: "",
    contentFile: null,
    platforms: []
  });
  const formRef = useRef<HTMLFormElement>(null);

  const steps = [
    { title: "Basic Info", icon: <FileText size={18} /> },
    { title: "Content", icon: <Upload size={18} /> },
    { title: "Targeting", icon: <Target size={18} /> },
    { title: "Review", icon: <CheckCircle size={18} /> },
    { title: "Payment", icon: <CreditCard size={18} /> }
  ];

  const calculateTotalEstimatedCost = useCallback(() => {
    const totals = form.platforms.reduce((acc, platform) => {
      if (platform.target_views && platform.deadline_option) {
        const viewsCount = parseViewCount(platform.target_views);
        const costs = calculateCostClient(
          platform.platform,
          viewsCount,
          platform.deadline_option
        );
        return {
          baseCost: acc.baseCost + costs.baseCost,
          serviceFee: acc.serviceFee + costs.serviceFee,
          totalCost: acc.totalCost + costs.totalCost
        };
      }
      return acc;
    }, { baseCost: 0, serviceFee: 0, totalCost: 0 });

    return totals;
  }, [form.platforms]);

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCurrentStep(1);
  };

  const handleContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contentFile) {
      toast.error("Please upload your content file");
      return;
    }
    setCurrentStep(2);
  };

  const handlePlatformAdd = (platform: typeof PLATFORMS[number]) => {
    if (form.platforms.some(p => p.platform === platform)) {
      toast.error("Platform already added");
      return;
    }
    setForm(prev => ({
      ...prev,
      platforms: [...prev.platforms, {
        platform,
        target_views: "0",
        deadline_option: "flexible",
        deadline: null
      }]
    }));
  };

  const handlePlatformRemove = (platform: typeof PLATFORMS[number]) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.filter(p => p.platform !== platform)
    }));
  };

  const handlePlatformUpdate = (
    platform: typeof PLATFORMS[number], 
    field: 'target_views' | 'deadline_option', 
    value: any
  ) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.map(p => {
        if (p.platform === platform) {
          let updatedPlatform = { ...p, [field]: value };

          if (field === 'deadline_option') {
            if (value === 'flexible') {
              updatedPlatform.deadline = null;
            } else {
              const option = deadlineOptions.find(opt => opt.value === value);
              if (option) {
                updatedPlatform.deadline = option.getFutureDate().toISOString();
              }
            }
          }

          if (updatedPlatform.target_views && updatedPlatform.deadline_option) {
            const viewsCount = parseViewCount(updatedPlatform.target_views);
            const costs = calculateCostClient(
              updatedPlatform.platform,
              viewsCount,
              updatedPlatform.deadline_option
            );
            updatedPlatform.estimatedCost = costs.totalCost;
          }

          return updatedPlatform;
        }
        return p;
      })
    }));
  };

  const handleSaveAsDraft = async () => {
    if (!form.contentFile) {
      toast.error("Please upload your content file");
      return;
    }

    setIsLoading(true);
    try {
      const { task } = await createTask({
        title: form.title,
        description: form.description,
        contentFile: form.contentFile,
        platforms: form.platforms.map(platform => ({
          platform: platform.platform,
          views: parseViewCount(platform.target_views),
          due_date: platform.deadline
        }))
      }, true);

      toast.success("Task saved as draft");
      router.push('/dashboard/buyer');
      router.refresh();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method: 'bank-transfer' | 'card') => {
    setForm(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        method
      }
    }));
  };

  const handleBankSlipUpload = (file: File) => {
    setForm(prev => ({
      ...prev,
      payment: {
        method: 'bank-transfer',
        bankSlip: file
      }
    }));
  };

  const handleProceedToPayment = async () => {
    if (!form.contentFile) {
      toast.error("Please upload your content file");
      return;
    }

    if (!form.payment?.method) {
      toast.error("Please select a payment method");
      return;
    }

    setIsLoading(true);
    try {
      // Save as draft first
      const { task } = await createTask({
        title: form.title,
        description: form.description,
        contentFile: form.contentFile,
        platforms: form.platforms.map(platform => ({
          platform: platform.platform,
          views: parseViewCount(platform.target_views),
          due_date: platform.deadline
        }))
      }, true);

      if (!task?.id) {
        throw new Error('Failed to create task');
      }

      if (form.payment.method === 'bank-transfer') {
        if (!form.payment.bankSlip) {
          toast.error("Please upload your bank transfer slip");
          return;
        }
        
        await uploadBankTransferSlip(form.payment.bankSlip, task.id);
        toast.success("Payment verification in progress");
        router.push('/dashboard/buyer');
        router.refresh();
      } else {
        console.log("Initializing card payment for task:", task.id);
        
        // Initialize PayHere payment
        const response = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.id })
        });

        let errorMessage = 'Failed to initialize payment';
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          throw new Error(errorMessage);
        }

        let formData;
        try {
          formData = await response.json();
        } catch (e) {
          console.error('Error parsing payment form data:', e);
          throw new Error('Invalid payment response from server');
        }

        if (!formData || !formData.checkout_url) {
          throw new Error('Invalid payment configuration received');
        }

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
        
        // Add a small delay before removing the form
        setTimeout(() => {
          document.body.removeChild(paymentForm);
        }, 100);

        // Optionally redirect to dashboard after opening payment window
        router.push('/dashboard/buyer');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.contentFile) {
      toast.error("Please upload your content file");
      return;
    }

    if (form.platforms.length === 0) {
      toast.error("Please add at least one platform target");
      return;
    }

    // Validate platform details
    const invalidPlatform = form.platforms.find(p => 
      !p.target_views || !p.deadline
    );
    if (invalidPlatform) {
      toast.error("Please complete all platform details");
      return;
    }

    setIsLoading(true);
    try {
      await createTask({
        title: form.title,
        description: form.description,
        contentFile: form.contentFile,
        platforms: form.platforms.map(platform => ({
          platform: platform.platform,
          views: parseViewCount(platform.target_views),
          due_date: platform.deadline
        }))
      }, false);

      toast.success("Task created successfully!");
      router.push('/dashboard/buyer');
      router.refresh();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error("Failed to create task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlatformIcon = (platform: string) => {
    const Icon = platformIcons[platform] || MessageCircle;
    return <Icon size={20} className="mr-2" />;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pink-50/30 to-white dark:from-gray-900/50 dark:to-gray-950">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Hidden form for PayHere submission */}
        <form ref={formRef} method="post" style={{ display: 'none' }} />

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <button 
              onClick={() => router.back()}
              className="flex items-center text-muted-foreground hover:text-foreground text-sm mb-2 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold font-display">
              Create <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600">Campaign</span>
            </h1>
            <p className="text-muted-foreground">
              Set up your content promotion requirements and reach targets
            </p>
          </div>
        </motion.div>

        <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <Card className="border-pink-100 dark:border-pink-900/20 shadow-md overflow-hidden">
            {currentStep === 0 && (
              <motion.div variants={itemVariants}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                    </div>
                    <div>
                      <CardTitle>Campaign Details</CardTitle>
                      <CardDescription>Provide basic information about your campaign</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="flex items-center gap-2">
                        <Tags size={16} className="text-pink-500" />
                        Campaign Title
                      </Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Promote New Music Video"
                        className="bg-white dark:bg-gray-900 border-pink-100 dark:border-pink-900/30"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-pink-500" />
                        Description
                      </Label>
                      <textarea
                        id="description"
                        className="w-full min-h-[150px] px-3 py-2 rounded-md border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-gray-900 focus:border-pink-300 dark:focus:border-pink-700 outline-none"
                        value={form.description}
                        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your requirements and goals..."
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Include details on the target audience, content style preferences, and any specific promotional guidelines.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.back()}
                        className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                      >
                        <ArrowLeft size={16} className="mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                      >
                        Continue
                        <ChevronRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div variants={itemVariants}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                      <UploadCloud className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                    </div>
                    <div>
                      <CardTitle>Upload Content</CardTitle>
                      <CardDescription>Upload the content you want influencers to promote</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContentSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-8 border-2 border-dashed border-pink-100 dark:border-pink-900/30 rounded-lg bg-pink-50/30 dark:bg-pink-900/5">
                        <FileUpload
                          onFileSelect={(file) => setForm(prev => ({ ...prev, contentFile: file }))}
                          selectedFile={form.contentFile}
                          className="w-full"
                        />
                        <div className="mt-4 text-sm text-muted-foreground text-center">
                          <p>Upload the content you want to promote (video file, image, etc.)</p>
                          <p>Max file size: 100MB</p>
                        </div>
                      </div>
                      
                      {form.contentFile && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <div>
                              <p className="font-medium">{form.contentFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(form.contentFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setForm(prev => ({ ...prev, contentFile: null }))}
                            className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                          >
                            <Trash2 size={14} className="text-pink-500" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCurrentStep(0)}
                        className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                      >
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                      >
                        Continue
                        <ChevronRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div variants={itemVariants}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                      <Target className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                    </div>
                    <div>
                      <CardTitle>Platform Targeting</CardTitle>
                      <CardDescription>Define your reach goals across social media platforms</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mt-4">
                      <h3 className="font-semibold flex items-center">
                        <PieChart size={18} className="mr-2 text-pink-500" />
                        Choose Platforms
                      </h3>
                      <p className="text-sm text-muted-foreground">Select where you want your content promoted</p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {PLATFORMS.map(platform => {
                        const isSelected = form.platforms.some(p => p.platform === platform);
                        const Icon = platformIcons[platform] || MessageCircle;
                        return (
                        <Button
                          key={platform}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => isSelected ? handlePlatformRemove(platform) : handlePlatformAdd(platform)}
                          className={`flex items-center transition-all ${
                          isSelected 
                            ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white" 
                            : "border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                          }`}
                        >
                          <Icon size={16} className="mr-2" />
                          {platform}
                        </Button>
                        );
                      })}
                      </div>
                      
                      {form.platforms.length === 0 && (
                      <div className="flex items-center p-4 border border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10 rounded-lg text-yellow-800 dark:text-yellow-200">
                        <AlertCircle size={18} className="text-yellow-500 mr-2 flex-shrink-0" />
                        <p className="text-sm">Please select at least one platform to promote your content.</p>
                      </div>
                      )}
                    </div>
                  </div>

                  {form.platforms.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center">
                          <Target size={18} className="mr-2 text-pink-500" />
                          Platform Details
                        </h3>
                        <p className="text-sm text-muted-foreground">Set your targets for each platform</p>
                      </div>
                      
                      <div className="space-y-4">
                        {form.platforms.map(platform => {
                          const Icon = platformIcons[platform.platform] || MessageCircle;
                          return (
                            <Card 
                              key={platform.platform} 
                              className="overflow-hidden border-pink-100 dark:border-pink-900/20 hover:shadow-md transition-shadow"
                            >
                              <CardHeader className="bg-gradient-to-r from-pink-50/80 to-white dark:from-pink-900/10 dark:to-transparent py-3">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 p-2 rounded-full mr-2">
                                      <Icon className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                                    </div>
                                    <h4 className="font-medium">{platform.platform}</h4>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {platform.estimatedCost && (
                                      <span className="text-sm flex items-center">
                                        <DollarSign size={14} className="mr-1 text-green-500" />
                                        <span className="font-medium text-green-700 dark:text-green-400">
                                          Rs. {platform.estimatedCost}
                                        </span>
                                      </span>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePlatformRemove(platform.platform)}
                                      className="h-8 w-8 p-0 text-pink-500 hover:text-red-500 dark:text-pink-400 dark:hover:text-red-400"
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                      <EyeIcon size={14} className="text-pink-500" />
                                      Target Views
                                    </Label>
                                    <ViewsSelect
                                      value={platform.target_views}
                                      onValueChange={(value) => handlePlatformUpdate(
                                        platform.platform, 
                                        'target_views',
                                        value
                                      )}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      The estimated number of views you want to achieve
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                      <Clock size={14} className="text-pink-500" />
                                      Deadline
                                    </Label>
                                    <DeadlineSelect
                                      value={platform.deadline_option}
                                      onValueChange={(value, date) => handlePlatformUpdate(
                                        platform.platform,
                                        'deadline_option',
                                        value
                                      )}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Set when you want to achieve these views
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        
                        <Button 
                          type="button"
                          onClick={() => {
                            const unaddedPlatform = PLATFORMS.find(
                              platform => !form.platforms.some(p => p.platform === platform)
                            );
                            if (unaddedPlatform) {
                              handlePlatformAdd(unaddedPlatform);
                            }
                          }}
                          disabled={form.platforms.length === PLATFORMS.length}
                          variant="outline"
                          className="w-full flex items-center justify-center py-6 border-dashed border-2 border-pink-200 dark:border-pink-800 hover:border-pink-500 dark:hover:border-pink-600 bg-pink-50/50 dark:bg-pink-900/10"
                        >
                          <Plus size={16} className="mr-2" />
                          Add Another Platform
                        </Button>
                      </div>

                      <Card className="bg-gradient-to-b from-white to-pink-50/30 dark:from-gray-900 dark:to-pink-950/10 border-pink-100 dark:border-pink-900/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center text-lg">
                            <DollarSign size={18} className="mr-2 text-pink-500" />
                            Campaign Cost Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm flex items-center gap-1">
                                <MessageCircle size={14} className="text-muted-foreground" />
                                Base Cost
                              </span>
                              <span className="font-medium">Rs. {calculateTotalEstimatedCost().baseCost}</span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span className="text-sm flex items-center gap-1">
                                <PieChart size={14} />
                                Service Fee (10%)
                              </span>
                              <span className="font-medium">Rs. {calculateTotalEstimatedCost().serviceFee}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-pink-100 dark:border-pink-900/20">
                              <span className="font-semibold flex items-center">
                                <Receipt size={16} className="mr-2 text-pink-500" />
                                Total Cost
                              </span>
                              <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
                                Rs. {calculateTotalEstimatedCost().totalCost}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-pink-100 dark:border-pink-900/20 flex items-start gap-2">
                            <AlertCircle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">
                              Final cost includes a 10% service fee for the BrandSync platform. Real-time analytics and influencer selection are included in the price.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCurrentStep(1)}
                      className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(3)}
                      disabled={form.platforms.length === 0}
                      className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                    >
                      Review
                      <ChevronRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div variants={itemVariants}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                    </div>
                    <div>
                      <CardTitle>Review Campaign</CardTitle>
                      <CardDescription>Review all details before proceeding to payment</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <Card className="overflow-hidden border-pink-100 dark:border-pink-900/20 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-pink-50/80 to-white dark:from-pink-900/10 dark:to-transparent py-3">
                      <CardTitle className="text-base flex items-center">
                        <FileText size={16} className="mr-2 text-pink-500" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Campaign Title</h4>
                          <p className="font-medium text-lg">{form.title}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                          <p className="text-sm whitespace-pre-wrap">{form.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-pink-100 dark:border-pink-900/20 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-pink-50/80 to-white dark:from-pink-900/10 dark:to-transparent py-3">
                      <CardTitle className="text-base flex items-center">
                        <UploadCloud size={16} className="mr-2 text-pink-500" />
                        Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {form.contentFile ? (
                        <div className="flex items-center gap-4 bg-pink-50/50 dark:bg-pink-900/5 p-3 rounded-lg border border-pink-100 dark:border-pink-900/20">
                          <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 p-2 rounded-full">
                            <FileText className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                          </div>
                          <div>
                            <p className="font-medium">{form.contentFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(form.contentFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">No content uploaded</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-pink-100 dark:border-pink-900/20 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-pink-50/80 to-white dark:from-pink-900/10 dark:to-transparent py-3">
                      <CardTitle className="text-base flex items-center">
                        <Target size={16} className="mr-2 text-pink-500" />
                        Platform Targets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {form.platforms.map(platform => {
                          const Icon = platformIcons[platform.platform] || MessageCircle;
                          return (
                            <div 
                              key={platform.platform} 
                              className="p-4 border border-pink-100 dark:border-pink-900/20 rounded-lg bg-gradient-to-r from-pink-50/50 to-white dark:from-pink-900/5 dark:to-transparent"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center">
                                  <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 p-1.5 rounded-full mr-2">
                                    <Icon className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                                  </div>
                                  <span className="font-semibold">{platform.platform}</span>
                                </div>
                                {platform.estimatedCost && (
                                  <span className="text-sm flex items-center">
                                    <DollarSign size={14} className="mr-1 text-green-500" />
                                    <span className="font-medium text-green-700 dark:text-green-400">
                                      Rs. {platform.estimatedCost}
                                    </span>
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Target Views:</span>
                                  <p className="font-medium flex items-center">
                                    <EyeIcon size={14} className="mr-1 text-pink-500" />
                                    {formatViewCount(parseViewCount(platform.target_views))} views
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Deadline:</span>
                                  <p className="font-medium flex items-center">
                                    <Clock size={14} className="mr-1 text-pink-500" />
                                    {platform.deadline ? (
                                      new Date(platform.deadline).toLocaleDateString()
                                    ) : (
                                      "Flexible deadline"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-white dark:from-pink-900/10 dark:to-transparent rounded-lg border border-pink-100 dark:border-pink-900/20">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center gap-1">
                              <MessageCircle size={14} className="text-muted-foreground" />
                              Base Cost
                            </span>
                            <span className="font-medium">Rs. {calculateTotalEstimatedCost().baseCost}</span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span className="text-sm flex items-center gap-1">
                              <PieChart size={14} />
                              Service Fee (10%)
                            </span>
                            <span className="font-medium">Rs. {calculateTotalEstimatedCost().serviceFee}</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-pink-100 dark:border-pink-900/20">
                            <span className="font-semibold flex items-center">
                              <Receipt size={16} className="mr-1 text-pink-500" />
                              Total Campaign Cost
                            </span>
                            <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
                              Rs. {calculateTotalEstimatedCost().totalCost}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCurrentStep(2)}
                      className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      Back
                    </Button>
                    <div className="space-x-4">
                      <Button
                        variant="outline"
                        onClick={handleSaveAsDraft}
                        disabled={isLoading}
                        className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                      >
                        <Save size={16} className="mr-2" />
                        Save as Draft
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(4)}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                      >
                        Proceed to Payment
                        <ChevronRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div variants={itemVariants}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                      <CreditCard className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                    </div>
                    <div>
                      <CardTitle>Payment</CardTitle>
                      <CardDescription>Select your preferred payment method</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <Card className="overflow-hidden border-pink-100 dark:border-pink-900/20 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-pink-50/80 to-white dark:from-pink-900/10 dark:to-transparent py-3">
                      <CardTitle className="text-base flex items-center">
                        <CreditCard size={16} className="mr-2 text-pink-500" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <PaymentMethodSelect
                        selectedMethod={form.payment?.method}
                        onMethodSelect={handlePaymentMethodSelect}
                        onSlipUpload={handleBankSlipUpload}
                        bankSlip={form.payment?.bankSlip}
                      />
                    </CardContent>
                  </Card>

                  <Card className="p-4 bg-gradient-to-r from-pink-50 to-white dark:from-pink-900/10 dark:to-transparent border border-pink-100 dark:border-pink-900/20">
                    <CardContent className="p-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold flex items-center">
                          <Receipt size={16} className="mr-2 text-pink-500" />
                          Total Payment
                        </span>
                        <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
                          Rs. {calculateTotalEstimatedCost().totalCost}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCurrentStep(3)}
                      className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      Back
                    </Button>
                    <div className="space-x-4">
                      <Button
                        variant="outline"
                        onClick={handleSaveAsDraft}
                        disabled={isLoading}
                        className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                      >
                        <Save size={16} className="mr-2" />
                        Save as Draft
                      </Button>
                      <Button 
                        onClick={handleProceedToPayment}
                        disabled={isLoading || !form.payment?.method}
                        className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                      >
                        {isLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Complete Payment
                            <CheckCircle size={16} className="ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}