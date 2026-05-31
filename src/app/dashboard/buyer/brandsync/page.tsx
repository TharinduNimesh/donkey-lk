"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, CreditCard, Link2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Stepper } from "@/components/ui/stepper";
import { toast } from "sonner";
import { motion } from "framer-motion";


export default function BrandSyncCreatePage() {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [thumbnailName, setThumbnailName] = React.useState("");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = React.useState<string | null>(null);
  const [shares, setShares] = React.useState<number>(100);
  const [requiresPaymentAmount, setRequiresPaymentAmount] = React.useState<number | null>(null);
  const [pendingBrandSyncId, setPendingBrandSyncId] = React.useState<number | null>(null);
  const [slipFile, setSlipFile] = React.useState<File | null>(null);
  const [slipUploadProgress, setSlipUploadProgress] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [thumbnailFile]);

  const handleThumbnailChange = (file: File | null) => {
    if (!file) {
      setThumbnailFile(null);
      setThumbnailName("");
      return;
    }
    setThumbnailFile(file);
    setThumbnailName(file.name);
  };

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !videoUrl.trim()) {
      toast.error("Add a title and video URL first");
      return;
    }

    try {
      new URL(videoUrl);
    } catch {
      toast.error("Enter a valid video URL");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        shares: shares ?? 0,
        title: title.trim(),
        platform: "YOUTUBE" as const,
        videoUrl: videoUrl.trim(),
        createOnly: true,
      };

      const initResp = await fetch("/api/payment/initialize/brandsync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await initResp.json().catch(() => ({}));

      if (!initResp.ok) {
        toast.error((data.error as string) || "Failed to create pending BrandSync link");
        return;
      }

      const brandsyncId = Number(data.brandsyncId);
      setPendingBrandSyncId(brandsyncId);
      setRequiresPaymentAmount(Number(data.amount));

      // Upload thumbnail if one was selected
      if (thumbnailFile) {
        try {
          const fd = new FormData();
          fd.append("thumbnail", thumbnailFile);
          await fetch(`/api/brandsync-links/${brandsyncId}/thumbnail`, {
            method: "POST",
            credentials: "include",
            body: fd,
          });
        } catch (thumbErr) {
          console.warn("Thumbnail upload failed (non-critical):", thumbErr);
        }
      }

      toast.success("BrandSync link created! Complete payment to activate it.");
      setTitle("");
      setVideoUrl("");
      setThumbnailFile(null);
      setThumbnailName("");
      setShares(100);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to create pending BrandSync link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayPending = async () => {
    if (!pendingBrandSyncId) {
      toast.error("No pending BrandSync to pay");
      return;
    }
    try {
      setIsSubmitting(true);
      const resp = await fetch(`/api/payment/initialize/brandsync/${pendingBrandSyncId}`, { method: "POST" });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err?.error || "Failed to initialize payment");
        return;
      }
      const formData = await resp.json();
      const paymentForm = document.createElement("form");
      paymentForm.method = "post";
      paymentForm.action = formData.checkout_url;
      paymentForm.target = "_blank";
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          paymentForm.appendChild(input);
        }
      });
      document.body.appendChild(paymentForm);
      paymentForm.submit();
      setTimeout(() => document.body.removeChild(paymentForm), 100);
      toast.success("Opening payment checkout...");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSlip = async () => {
    if (!pendingBrandSyncId) {
      toast.error("Create a pending payment first");
      return;
    }
    if (!slipFile) {
      toast.error("Please choose a slip file");
      return;
    }
    try {
      setIsSubmitting(true);
      setSlipUploadProgress(0);

      await new Promise<void>((resolve, reject) => {
        const fd = new FormData();
        fd.append("slip", slipFile as File);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/brandsync-links/${pendingBrandSyncId}/bank-transfer`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setSlipUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let parsed: any = null;
            try { parsed = JSON.parse(xhr.responseText); } catch {}
            reject(new Error(parsed?.error || parsed?.message || `Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Upload network error"));
        xhr.send(fd);
      });

      toast.success("Slip uploaded. Admin will verify and activate your link.");
      setSlipFile(null);
      setPendingBrandSyncId(null);
      setRequiresPaymentAmount(null);
      setTimeout(() => router.push("/dashboard/buyer"), 1500);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to upload slip");
    } finally {
      setIsSubmitting(false);
      setSlipUploadProgress(null);
    }
  };

  const currentStepperStep = pendingBrandSyncId ? 1 : 0;
  const stepperSteps = [{ title: "Create Link" }, { title: "Payment" }];

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 font-['Roboto']">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/buyer")}
            className="mb-4 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 shadow-sm dark:border-pink-900/50 dark:bg-pink-950/30 dark:text-pink-300 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            BrandSync Link Creator
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Create a BrandSync Link
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
            Share your video with influencers using a hidden proxy link. Each influencer receives
            their own unique URL — protecting your original link while tracking individual shares.
          </p>
        </motion.div>

        {/* Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Stepper steps={stepperSteps} currentStep={currentStepperStep} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
        >
          {/* Step 1 — Create Link */}
          <Card className="overflow-hidden border-pink-100/70 bg-white/95 shadow-sm dark:border-gray-800 dark:bg-gray-950/90">
            <CardHeader className="space-y-2 border-b border-gray-100 bg-gradient-to-r from-pink-50/80 to-white dark:border-gray-800 dark:from-pink-950/20 dark:to-gray-950">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-white shadow-sm shadow-pink-200 dark:shadow-pink-950/30">
                  1
                </div>
                Create your link
              </CardTitle>
              <CardDescription>
                Enter the video details. The original URL stays hidden — influencers only see their unique link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="brandsync-title">Video Title</Label>
                    <Input
                      id="brandsync-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a title for the video"
                      disabled={!!pendingBrandSyncId}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="brandsync-shares">Shares Count</Label>
                    <Input
                      id="brandsync-shares"
                      type="number"
                      value={shares}
                      min={100}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        if (!Number.isNaN(v)) setShares(Math.max(0, Math.floor(v)));
                      }}
                      placeholder="Enter number of shares"
                      disabled={!!pendingBrandSyncId}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 100 shares. Price LKR 6 per share.</p>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="brandsync-url">
                      Original Video URL
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(only you can see this)</span>
                    </Label>
                    <Input
                      id="brandsync-url"
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                      disabled={!!pendingBrandSyncId}
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                      Your video URL is never shared with influencers
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandsync-thumbnail">Thumbnail (optional)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="brandsync-thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbnailChange(e.target.files?.[0] || null)}
                      disabled={!!pendingBrandSyncId}
                    />
                    {thumbnailFile && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleThumbnailChange(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {thumbnailName && <p className="text-xs text-muted-foreground">Selected: {thumbnailName}</p>}
                </div>

                {thumbnailPreviewUrl && (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-pink-200 bg-pink-50/60 p-3 dark:border-pink-900/60 dark:bg-pink-950/20">
                    <img src={thumbnailPreviewUrl} alt="Thumbnail preview" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{title || "Untitled video"}</p>
                      <p className="text-xs text-muted-foreground">Thumbnail preview</p>
                    </div>
                  </div>
                )}

                {!pendingBrandSyncId && (
                  <Button
                    type="submit"
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white shadow-sm shadow-pink-200 dark:shadow-pink-950/30"
                    disabled={isSubmitting}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Creating link..." : "Create Link"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {pendingBrandSyncId && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
                    ✅ Link created successfully! Complete payment below to activate it.
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Step 2 — Payment */}
          <Card className={`overflow-hidden border-gray-200 bg-gray-50/90 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 transition-opacity duration-300 ${!pendingBrandSyncId ? 'opacity-60' : ''}`}>
            <CardHeader className="space-y-2 border-b border-gray-200/70 bg-white/80 dark:border-gray-800 dark:bg-gray-900/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors ${pendingBrandSyncId ? "bg-emerald-600" : "bg-gray-400"}`}>
                  2
                </div>
                Payment
              </CardTitle>
              <CardDescription>
                Pay online with PayHere or upload a bank transfer slip for approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              {requiresPaymentAmount !== null ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
                  <p className="font-semibold">Payment required</p>
                  <p className="text-2xl font-bold mt-1">LKR {requiresPaymentAmount.toLocaleString()}</p>
                  <p className="text-xs mt-1 opacity-80">{shares} shares × LKR 6 = LKR {requiresPaymentAmount.toLocaleString()}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-950/50 dark:text-gray-400">
                  Step 2 becomes active after you create the link.
                </div>
              )}

              {/* Pay Online */}
              <Button
                type="button"
                onClick={handlePayPending}
                disabled={isSubmitting || !pendingBrandSyncId}
                className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Online
              </Button>

              {/* Bank Transfer */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 dark:border-gray-800 dark:bg-gray-950/60">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <Upload className="h-4 w-4 text-pink-600" />
                  Bank transfer
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload your bank transfer slip. The link activates after admin verifies payment.
                </p>

                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                    disabled={!pendingBrandSyncId}
                  />
                  <Button
                    type="button"
                    onClick={handleUploadSlip}
                    disabled={isSubmitting || !pendingBrandSyncId || !slipFile}
                    className="w-full bg-gray-900 text-white hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Slip
                  </Button>
                  {slipUploadProgress != null && (
                    <div className="space-y-1">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className="h-2 rounded-full bg-pink-600 transition-all"
                          style={{ width: `${slipUploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Uploading: {slipUploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Done — go back */}
              {pendingBrandSyncId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/buyer")}
                  className="w-full"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Done — Back to Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
