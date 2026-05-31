"use client";

import * as React from "react";
import { ArrowRight, CheckCircle, Copy, CreditCard, FileText, Globe2, ImageIcon, Link2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { toast } from "sonner";

type Platform = "YOUTUBE" | "TIKTOK" | "FACEBOOK";

type BrandSyncLinkEntry = {
  id: number;
  title: string;
  platform: Platform;
  thumbnailUrl?: string | null;
  brandSyncUrl: string;
  createdAt: string;
  shares?: number;
  isPaid?: boolean;
  amount?: number;
};

interface BrandSyncLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandSyncLinkModal({ open, onOpenChange }: BrandSyncLinkModalProps) {
  const [title, setTitle] = React.useState("");
  const [platform, setPlatform] = React.useState<Platform>("YOUTUBE");
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

  const readJsonResponse = async (response: Response) => {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { error: text };
    }
  };

  React.useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [thumbnailFile]);

  const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e?.target?.value || "");
  };

  const handleVideoUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e?.target?.value || "");
  };

  const handleSharesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e?.target?.value || 0);
    if (Number.isNaN(v)) return setShares(0);
    setShares(Math.max(0, Math.floor(v)));
  };

  const handleThumbnailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e?.target?.files?.[0] || null;
      handleThumbnailChange(file);
    } catch (err) {
      console.error('Thumbnail input change error', err);
    }
  };

  const handleSlipInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e?.target?.files?.[0] || null;
      handleSlipChange(file);
    } catch (err) {
      console.error('Slip input change error', err);
    }
  };

  React.useEffect(() => {
    return;
  }, [open]);

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

    // Instead of creating a paid link immediately, create a pending BrandSync row
    // and reload recent links. Payment is handled separately (bank transfer or gateway).
    setIsSubmitting(true);
    try {
      const payload = {
        shares: shares ?? 0,
        title: title.trim(),
        platform,
        videoUrl: videoUrl.trim(),
        createOnly: true,
      };

      const initResp = await fetch('/api/payment/initialize/brandsync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await initResp.json().catch(() => ({}));

      if (!initResp.ok) {
        toast.error((data.error as string) || 'Failed to create pending BrandSync link');
        return;
      }

      const brandsyncId = data.brandsyncId;
      const amount = data.amount;
      setPendingBrandSyncId(Number(brandsyncId));
      setRequiresPaymentAmount(Number(amount));

      // recent links removed: we don't auto-refresh or display them in the modal

      toast.success('Pending BrandSync link created. You can upload a bank slip or wait for payment.');
      setTitle('');
      setVideoUrl('');
      setThumbnailFile(null);
      setThumbnailName('');
      setShares(100);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pending BrandSync link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async () => {
    // Submit again with paid=true to mark as paid and create the link
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("platform", platform);
      formData.append("videoUrl", videoUrl.trim());
      formData.append("shares", String(shares ?? 0));
      formData.append("paid", "true");

      if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

      const response = await fetch("/api/brandsync-links", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        toast.error((data.error as string) || "Failed to create BrandSync link");
        return;
      }

      // link created — recent links view removed from modal UI

      toast.success("BrandSync link saved after payment");
      setTitle("");
      setVideoUrl("");
      setThumbnailFile(null);
      setThumbnailName("");
      setShares(100);
      setRequiresPaymentAmount(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to create BrandSync link");
    } finally {
      setIsSubmitting(false);
    }
  };

  // PayNow flow removed: Generate should create a pending link and payment is handled separately

  const handleCreatePendingForBank = async () => {
    try {
      setIsSubmitting(true);
      const payload = { shares: shares ?? 0, title: title.trim(), platform, videoUrl: videoUrl.trim(), createOnly: true };
      const res = await fetch('/api/payment/initialize/brandsync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Failed to create pending payment');
        return;
      }

      const data = await res.json();
      setPendingBrandSyncId(Number(data.brandsyncId));
      setRequiresPaymentAmount(Number(data.amount));
      toast.success('Pending BrandSync created. Upload your bank slip.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pending payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayPending = async (brandsyncId: number | null) => {
    if (!brandsyncId) {
      toast.error('No pending BrandSync to pay');
      return;
    }

    try {
      setIsSubmitting(true);
      const resp = await fetch(`/api/payment/initialize/brandsync/${brandsyncId}`, { method: 'POST' });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err?.error || 'Failed to initialize payment');
        return;
      }

      const formData = await resp.json();
      const paymentForm = document.createElement('form');
      paymentForm.method = 'post';
      paymentForm.action = formData.checkout_url;
      paymentForm.target = '_blank';

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          paymentForm.appendChild(input);
        }
      });

      document.body.appendChild(paymentForm);
      paymentForm.submit();
      setTimeout(() => document.body.removeChild(paymentForm), 100);

      toast.success('Opening payment checkout...');
    } catch (error) {
      console.error('Pay pending error', error);
      toast.error('Failed to start payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSlipChange = (file: File | null) => {
    setSlipFile(file);
  };

  const handleUploadSlip = async () => {
    if (!pendingBrandSyncId) {
      toast.error('Create a pending payment first');
      return;
    }
    if (!slipFile) {
      toast.error('Please choose a slip file');
      return;
    }

    if (!pendingBrandSyncId) {
      toast.error('Create a pending payment first');
      return;
    }
    try {
      setIsSubmitting(true);
      setSlipUploadProgress(0);

      await new Promise<void>((resolve, reject) => {
        const fd = new FormData();
        fd.append('slip', slipFile as File);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/brandsync-links/${pendingBrandSyncId}/bank-transfer`);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const percent = Math.round((ev.loaded / ev.total) * 100);
            setSlipUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              const text = xhr.responseText || `Upload failed: ${xhr.status}`;
              let parsed: any = null;
              try { parsed = JSON.parse(text); } catch {}
              const msg = parsed?.error || parsed?.message || text;
              reject(new Error(String(msg)));
            }
          } catch (e) {
            reject(e instanceof Error ? e : new Error('Unknown upload error'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload network error'));

        xhr.send(fd);
      });

      toast.success('Slip uploaded. Admin will verify and mark payment.');
      setSlipFile(null);
      setPendingBrandSyncId(null);
      setRequiresPaymentAmount(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload slip');
    } finally {
      setIsSubmitting(false);
      setSlipUploadProgress(null);
    }
  };

  const handleCopy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success("BrandSync link copied");
  };

  const stepperSteps = [
    { title: "Create Link" },
    { title: "Payment" },
  ];

  const currentStepperStep = pendingBrandSyncId ? 1 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl rounded-2xl border border-pink-100 bg-white p-0 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-pink-950/30 dark:via-gray-950 dark:to-gray-900" />
          <div className="relative p-6 sm:p-8">
            <DialogHeader className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-3 py-1 text-xs font-medium text-pink-700 shadow-sm backdrop-blur dark:border-pink-900/50 dark:bg-gray-900/80 dark:text-pink-300">
                <Sparkles className="h-3.5 w-3.5" />
                BrandSync Link Creator
              </div>
              <DialogTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                Create a hidden link in 2 steps
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Build your BrandSync link like the task creator: first enter the video details, then complete payment to unlock the live link.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6">
              <Stepper steps={stepperSteps} currentStep={currentStepperStep} />
            </div>

            <form onSubmit={handleGenerate} className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="overflow-hidden border-pink-100/70 bg-white/95 shadow-sm dark:border-gray-800 dark:bg-gray-950/90">
                <CardHeader className="space-y-2 border-b border-gray-100 bg-gradient-to-r from-pink-50/80 to-white dark:border-gray-800 dark:from-pink-950/20 dark:to-gray-950">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-white shadow-sm shadow-pink-200 dark:shadow-pink-950/30">1</div>
                    Create your link
                  </CardTitle>
                  <CardDescription>
                    Add the video details, thumbnail, and shares count.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="brandsync-title">Video Title</Label>
                      <Input id="brandsync-title" value={title} onChange={handleTitleInputChange} placeholder="Enter a title for the video" />
                    </div>

                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select value={platform} onValueChange={(value) => setPlatform(value as Platform)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YOUTUBE">YouTube</SelectItem>
                          <SelectItem value="TIKTOK">TikTok</SelectItem>
                          <SelectItem value="FACEBOOK">Facebook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brandsync-url">Video URL</Label>
                      <Input id="brandsync-url" type="url" value={videoUrl} onChange={handleVideoUrlInputChange} placeholder="https://youtube.com/..." />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brandsync-shares">Shares Count</Label>
                      <Input id="brandsync-shares" type="number" value={shares} min={100} onChange={handleSharesInputChange} placeholder="Enter number of shares" />
                      <p className="text-xs text-muted-foreground">Minimum 100 shares. Price LKR 6 per share.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandsync-thumbnail">Thumbnail</Label>
                    <div className="flex items-center gap-3">
                      <Input id="brandsync-thumbnail" type="file" accept="image/*" onChange={handleThumbnailInputChange} />
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

                  <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white shadow-sm shadow-pink-200 dark:shadow-pink-950/30" disabled={isSubmitting}>
                    <Link2 className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Creating link..." : "Create Link"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-gray-200 bg-gray-50/90 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
                <CardHeader className="space-y-2 border-b border-gray-200/70 bg-white/80 dark:border-gray-800 dark:bg-gray-900/50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${pendingBrandSyncId ? 'bg-emerald-600' : 'bg-gray-400'}`}>
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
                      Payment required: LKR {requiresPaymentAmount.toLocaleString()}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-950/50 dark:text-gray-400">
                      Step 2 becomes active after you create the link.
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="button" onClick={() => handlePayPending(pendingBrandSyncId)} disabled={isSubmitting || !pendingBrandSyncId} className="h-11 bg-emerald-600 text-white hover:bg-emerald-700">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Online
                    </Button>
                    <Button type="button" onClick={handleMarkPaid} disabled={isSubmitting || !pendingBrandSyncId} variant="outline" className="h-11 border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:hover:bg-gray-900">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      I have paid
                    </Button>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950/60">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <Upload className="h-4 w-4 text-pink-600" />
                      Bank transfer
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create a pending record and upload your transfer slip. The link goes live after admin accepts the payment.
                    </p>

                    <div className="mt-4 space-y-3">
                      <Button type="button" onClick={handleCreatePendingForBank} disabled={isSubmitting} className="w-full bg-pink-600 text-white hover:bg-pink-700">
                        Create Pending
                      </Button>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <Input type="file" accept="image/*,application/pdf" onChange={handleSlipInputChange} />
                        <Button type="button" onClick={handleUploadSlip} disabled={isSubmitting || !pendingBrandSyncId} className="bg-gray-900 text-white hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700">
                          Upload Slip
                        </Button>
                      </div>
                      {pendingBrandSyncId && <p className="text-xs text-muted-foreground">Pending ID: {pendingBrandSyncId}</p>}
                      {slipUploadProgress != null && (
                        <div className="space-y-1">
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                            <div className="h-2 rounded-full bg-pink-600 transition-all" style={{ width: `${slipUploadProgress}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground">Uploading: {slipUploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {pendingBrandSyncId && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
                      Payment step is ready. Your pending link ID is <span className="font-semibold">{pendingBrandSyncId}</span>.
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}