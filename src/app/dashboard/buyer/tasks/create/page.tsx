"use client"

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/ui/stepper";
import { ViewsSelect, viewOptions } from "@/components/ui/views-select";
import { DeadlineSelect, deadlineOptions } from "@/components/ui/deadline-select";
import { FileUpload } from "@/components/ui/file-upload";
import { PaymentMethodSelect } from "@/components/ui/payment-method-select";
import { createTask } from "@/lib/utils/tasks";
import { calculateCostClient } from "@/lib/utils/cost";
import { parseViewCount, formatViewCount } from "@/lib/utils/views";
import { toast } from "sonner";
import { Database } from "@/types/database.types";

type Platform = Database["public"]["Enums"]["Platforms"];

interface TaskForm {
  title: string;
  description: string;
  contentFile: File | null;
  platforms: {
    platform: Platform;
    target_views: string; // Changed from number to string
    deadline_option: "3d" | "1w" | "2w" | "1m" | "2m" | "3m" | "6m" | "flexible";
    deadline: string;
    estimatedCost?: number;
  }[];
  payment?: {
    method: 'bank-transfer' | 'card';
    bankSlip?: File;
  };
}

const PLATFORMS = ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'] as const;

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

  const steps = [
    { title: "Basic Info" },
    { title: "Content" },
    { title: "Platform Targets" },
    { title: "Review" },
    { title: "Payment" }
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
        target_views: "0", // Changed to string
        deadline_option: "flexible",
        deadline: ""
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
            const option = deadlineOptions.find(opt => opt.value === value);
            if (option) {
              updatedPlatform.deadline = option.getFutureDate().toISOString();
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

      // Calculate and store cost after task creation
      const response = await fetch('/api/tasks/calculate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id })
      });

      if (!response.ok) {
        console.error('Failed to calculate cost:', await response.json());
      }

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
      }, false);

      // Handle payment based on selected method
      if (form.payment?.method === 'bank-transfer') {
        if (!form.payment.bankSlip) {
          toast.error("Please upload your bank transfer slip");
          return;
        }
        // TODO: Handle bank transfer slip upload and payment verification
        toast.success("Task created. Please wait while we verify your payment.");
      } else {
        // TODO: Implement PayHere integration
        toast.success("Redirecting to payment gateway...");
      }

      router.push('/dashboard/buyer');
      router.refresh();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error("Failed to create task. Please try again.");
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

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Task</h1>
        <p className="text-muted-foreground">Set up your campaign requirements and targets</p>
      </div>

      <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

      <Card className="p-6">
        {currentStep === 0 && (
          <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Promote New Music Video"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-transparent"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your requirements and goals..."
                required
              />
            </div>

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        )}

        {currentStep === 1 && (
          <form onSubmit={handleContentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Content</Label>
              <FileUpload
                onFileSelect={(file) => setForm(prev => ({ ...prev, contentFile: file }))}
                selectedFile={form.contentFile}
              />
              <p className="text-sm text-muted-foreground">
                Upload the content you want to promote (video file, image, etc.)
              </p>
            </div>

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep(0)}
              >
                Back
              </Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Select Platforms</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PLATFORMS.map(platform => {
                  const isSelected = form.platforms.some(p => p.platform === platform);
                  return (
                    <Button
                      key={platform}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => isSelected ? handlePlatformRemove(platform) : handlePlatformAdd(platform)}
                    >
                      {platform}
                    </Button>
                  );
                })}
              </div>
            </div>

            {form.platforms.length > 0 && (
              <div className="space-y-6">
                <h3 className="font-semibold">Platform Details</h3>
                {form.platforms.map(platform => (
                  <div key={platform.platform} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{platform.platform}</h4>
                      {platform.estimatedCost && (
                        <span className="text-sm">
                          Estimated Total: ${platform.estimatedCost}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Target Views</Label>
                        <ViewsSelect
                          value={platform.target_views}
                          onValueChange={(value) => handlePlatformUpdate(
                            platform.platform, 
                            'target_views',
                            value
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Deadline</Label>
                        <DeadlineSelect
                          value={platform.deadline_option}
                          onValueChange={(value, date) => handlePlatformUpdate(
                            platform.platform,
                            'deadline_option',
                            value
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {form.platforms.length > 0 && (
                  <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Base Cost</span>
                        <span className="font-medium">${calculateTotalEstimatedCost().baseCost}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span className="text-sm">Service Fee (10%)</span>
                        <span className="font-medium">${calculateTotalEstimatedCost().serviceFee}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">Total Cost</span>
                        <span className="text-xl font-bold">
                          ${calculateTotalEstimatedCost().totalCost}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      * Final cost includes a 10% service fee and may vary slightly based on exact calculation from our server
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={form.platforms.length === 0}
              >
                Review
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Review Your Task</h3>
              
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <p className="font-semibold">{form.title}</p>
                  <p className="text-sm text-muted-foreground">{form.description}</p>
                </div>

                <div className="border-b pb-4">
                  <h4 className="font-medium mb-2">Content</h4>
                  <p className="text-sm font-mono">{form.contentFile?.name}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Platform Targets</h4>
                  <div className="space-y-4">
                    {form.platforms.map(platform => (
                      <div key={platform.platform} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">{platform.platform}</span>
                          {platform.estimatedCost && (
                            <span className="text-sm font-semibold">
                              Estimated Cost: ${platform.estimatedCost}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>{formatViewCount(parseViewCount(platform.target_views))} views by {new Date(platform.deadline).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep(2)}
              >
                Back
              </Button>
              <div className="space-x-4">
                <Button
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
                <Button 
                  onClick={() => setCurrentStep(4)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                >
                  Continue to Payment
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-6">Select Payment Method</h3>
              <PaymentMethodSelect
                selectedMethod={form.payment?.method}
                onMethodSelect={handlePaymentMethodSelect}
                onSlipUpload={handleBankSlipUpload}
                bankSlip={form.payment?.bankSlip}
              />
            </div>

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep(3)}
              >
                Back
              </Button>
              <div className="space-x-4">
                <Button
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
                <Button 
                  onClick={handleProceedToPayment}
                  disabled={isLoading || !form.payment?.method}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                >
                  {isLoading ? 'Processing...' : 'Complete Payment'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}