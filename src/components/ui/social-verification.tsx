import { Button } from "./button";
import { Card } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import { 
  Mail, 
  Smartphone, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Link2, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight
} from "lucide-react";
import {
  IconBrandYoutube,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandInstagram
} from "@tabler/icons-react";

interface ContactDetail {
  id: number;
  type: "EMAIL" | "MOBILE" | "WHATSAPP";
  detail: string;
  contactStatus: {
    is_verified: boolean;
    verified_at: string | null;
  } | null;
}

interface SocialVerificationProps {
  verifiedEmail?: string;
  contactDetails?: ContactDetail[];
  onVerify?: (contactId: number) => void;
  onSubmitUrl?: (url: string) => void;
  platform?: Database["public"]["Enums"]["Platforms"];
}

const platformConfigs: Record<string, {
  name: string;
  color: string;
  gradient: string;
  textColor: string;
  borderColor: string;
  placeholder: string;
  helpText: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  YOUTUBE: {
    name: "YouTube",
    color: "bg-red-500",
    gradient: "from-red-600 to-red-500",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "focus-visible:ring-red-500 border-red-200 dark:border-red-900/30",
    placeholder: "https://www.youtube.com/@yourchannel",
    helpText: "Enter your full YouTube channel URL (e.g., https://www.youtube.com/@username)",
    Icon: IconBrandYoutube
  },
  FACEBOOK: {
    name: "Facebook",
    color: "bg-blue-600",
    gradient: "from-blue-600 to-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "focus-visible:ring-blue-500 border-blue-200 dark:border-blue-900/30",
    placeholder: "https://www.facebook.com/yourpage",
    helpText: "Enter your public Facebook page or profile link (e.g., https://www.facebook.com/pagename)",
    Icon: IconBrandFacebook
  },
  INSTAGRAM: {
    name: "Instagram",
    color: "bg-pink-500",
    gradient: "from-purple-600 via-pink-500 to-orange-500",
    textColor: "text-pink-600 dark:text-pink-400",
    borderColor: "focus-visible:ring-pink-500 border-pink-200 dark:border-pink-900/30",
    placeholder: "https://www.instagram.com/yourprofile",
    helpText: "Enter your Instagram profile URL (e.g., https://www.instagram.com/username)",
    Icon: IconBrandInstagram
  },
  TIKTOK: {
    name: "TikTok",
    color: "bg-black",
    gradient: "from-gray-900 to-black dark:from-gray-800 dark:to-black",
    textColor: "text-gray-950 dark:text-gray-100",
    borderColor: "focus-visible:ring-black border-gray-200 dark:border-gray-800",
    placeholder: "https://www.tiktok.com/@yourprofile",
    helpText: "Enter your TikTok profile link (e.g., https://www.tiktok.com/@username)",
    Icon: IconBrandTiktok
  }
};

export function SocialVerification({
  verifiedEmail,
  contactDetails = [],
  onVerify,
  onSubmitUrl,
  platform,
}: SocialVerificationProps) {
  const [pageUrl, setPageUrl] = useState("");
  const [isVerifyingContact, setIsVerifyingContact] = useState(false);
  const [verifyingContactId, setVerifyingContactId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = platform ? platformConfigs[platform] : null;

  const hasVerifiedNonEmailContact = useMemo(() => {
    return contactDetails.some(
      contact => 
        contact.contactStatus?.is_verified && 
        (contact.type === "MOBILE" || contact.type === "WHATSAPP")
    );
  }, [contactDetails]);

  const canSubmit = pageUrl.trim() !== "" && hasVerifiedNonEmailContact;

  const handleVerifyClick = async (contactId: number) => {
    try {
      setSendingCode(true);

      const response = await fetch('/api/verification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(data.error || "Too many verification attempts. Please try again later.");
        } else if (response.status === 400 && data.error.includes("already verified")) {
          onVerify?.(contactId);
          throw new Error("This contact is already verified.");
        } else {
          throw new Error(data.error || "Failed to send verification code");
        }
      }

      toast.info("Verification code sent!", {
        description: "Please check your phone for the verification code."
      });

      setIsVerifyingContact(true);
      setVerifyingContactId(contactId);

    } catch (error) {
      console.error('Error sending verification code:', error);
      toast.error(error instanceof Error ? error.message : "Failed to send verification code");
      setIsVerifyingContact(false);
      setVerifyingContactId(null);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verifyingContactId || verificationCode.length !== 6) {
      return;
    }

    try {
      const response = await fetch('/api/verification/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: verifyingContactId,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      toast.success("Contact verified successfully!");
      setIsVerifyingContact(false);
      setVerifyingContactId(null);
      setVerificationCode("");
      onVerify?.(verifyingContactId);

    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error(error instanceof Error ? error.message : "Failed to verify code");
    }
  };

  const handleSubmit = async () => {
    if (!platform || !canSubmit) return;

    try {
      setIsSubmitting(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication error. Please try logging in again.");
      }

      const { error: requestError } = await supabase
        .from('influencer_profile_verification_requests')
        .insert({
          user_id: user.id,
          platform: platform,
          profile_url: pageUrl
        });

      if (requestError) {
        throw requestError;
      }

      onSubmitUrl?.(pageUrl);
    } catch (error) {
      console.error('Error submitting verification request:', error);
      toast.error(error instanceof Error ? error.message : "Failed to submit verification request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Banner */}
      {config && (
        <div className={`p-6 rounded-2xl bg-gradient-to-r ${config.gradient} text-white shadow-md relative overflow-hidden`}>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-6 translate-y-6 shrink-0 pointer-events-none">
            <config.Icon className="w-40 h-40" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <config.Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                Link Account Flow
              </span>
            </div>
            <h2 className="text-2xl font-bold">Connect your {config.name} Profile</h2>
            <p className="text-xs text-white/80 max-w-lg">
              Follow the simple 2-step verification process to link your account securely.
            </p>
          </div>
        </div>
      )}

      {/* Verification Steps Indicator */}
      <div className="grid grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
            hasVerifiedNonEmailContact 
              ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400" 
              : "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400 animate-pulse border border-pink-200 dark:border-pink-900/30"
          }`}>
            {hasVerifiedNonEmailContact ? <CheckCircle2 className="w-4 h-4" /> : "1"}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Step 1: Contact Details</p>
            <p className="text-[10px] text-gray-500">
              {hasVerifiedNonEmailContact ? "Completed" : "Action Required"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-gray-100 dark:border-gray-800 pl-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
            hasVerifiedNonEmailContact 
              ? "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 border border-violet-200 dark:border-violet-900/30" 
              : "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
          }`}>
            2
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Step 2: Profile Submission</p>
            <p className="text-[10px] text-gray-500">
              {hasVerifiedNonEmailContact ? "Unlocked" : "Locked"}
            </p>
          </div>
        </div>
      </div>

      {/* Step 1 Card: Contact Details */}
      <Card className="border border-gray-150 dark:border-gray-800/80 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800/40 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-gray-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Step 1: Contact Details
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Please verify a phone or WhatsApp contact to proceed</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Verified Email */}
            {verifiedEmail && (
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>Email Address</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 break-all">
                      {verifiedEmail}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-950/20 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 shrink-0 self-start sm:self-auto">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              </div>
            )}

            {/* Other Contacts */}
            {contactDetails.map((contact) => {
              const isVerified = contact.contactStatus?.is_verified;
              const isWhatsApp = contact.type === "WHATSAPP";
              
              return (
                <div 
                  key={contact.id} 
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isVerified 
                      ? "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30" 
                      : "border-pink-100 dark:border-pink-900/25 bg-pink-50/10 dark:bg-pink-950/5 hover:border-pink-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                        {isWhatsApp ? (
                          <MessageSquare className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                        )}
                        <span>{contact.type}</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 break-all">
                        {contact.detail}
                      </p>
                    </div>

                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-950/20 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 shrink-0 self-start sm:self-auto">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyClick(contact.id)}
                        disabled={sendingCode || (verifyingContactId === contact.id && isVerifyingContact)}
                        className="h-7 text-[10px] border-pink-200 hover:border-pink-500 text-pink-600 hover:bg-pink-50/40 dark:border-pink-900/30 dark:hover:border-pink-600 hover:text-pink-700 transition-colors shadow-sm font-semibold cursor-pointer shrink-0 self-start sm:self-auto"
                      >
                        {sendingCode && verifyingContactId === contact.id ? (
                          <>
                            <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-foreground"/>
                            Sending...
                          </>
                        ) : (
                          "Verify now"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Step 2 Card: URL Submission */}
      <Card className={`border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 ${
        !hasVerifiedNonEmailContact 
          ? "border-gray-100 bg-gray-50/30 dark:border-gray-800 dark:bg-gray-900/5 opacity-75 animate-pulse-slow" 
          : "border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900"
      }`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800/40 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-gray-100 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-violet-500" />
                Step 2: Profile Submission
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Submit your public profile URL for administrative approval</p>
            </div>
            {!hasVerifiedNonEmailContact && (
              <span className="flex items-center gap-1 text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
          </div>

          {!hasVerifiedNonEmailContact ? (
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 flex gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-400">Step 1 Verification Required</h4>
                <p className="text-[11px] text-amber-750/90 dark:text-amber-500/85">
                  Please verify at least one Phone number or WhatsApp contact above to unlock Step 2.
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageUrl" className="text-xs font-semibold text-gray-705 dark:text-gray-300">
                {config ? `${config.name} Channel URL / Profile Link` : "Page/Channel URL"}
              </Label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Link2 className="h-4 h-4 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  id="pageUrl"
                  type="url"
                  placeholder={config ? config.placeholder : "Enter page or channel URL"}
                  disabled={!hasVerifiedNonEmailContact}
                  className={`pl-9 py-5 rounded-lg border-gray-250 transition-shadow ${
                    config ? config.borderColor : "focus-visible:ring-violet-500"
                  }`}
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {config ? config.helpText : "Enter the URL of your social media page or channel"}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className={`py-5 px-6 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${
                  canSubmit && config
                    ? `bg-gradient-to-r ${config.gradient} hover:opacity-95 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer`
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-550 border border-gray-200 dark:border-gray-800 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"/>
                    Submitting...
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Submit for Approval
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* OTP Verification Dialog */}
      <Dialog open={isVerifyingContact} onOpenChange={(open) => {
        if (!open) {
          setIsVerifyingContact(false);
          setVerifyingContactId(null);
          setVerificationCode("");
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Enter Verification Code</DialogTitle>
            <DialogDescription className="text-xs">
              We've sent a 6-digit verification code to your phone. Please enter it below to complete verification.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-5 pt-3">
            <InputOTP 
              maxLength={6}
              value={verificationCode}
              onChange={(value) => setVerificationCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button 
              onClick={handleVerifyCode} 
              disabled={verificationCode.length !== 6}
              className="w-full py-5 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition-all cursor-pointer"
            >
              Verify Code
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => handleVerifyClick(verifyingContactId!)}
              disabled={sendingCode}
              className="w-full text-xs text-gray-500 hover:text-gray-850 hover:bg-gray-50 cursor-pointer"
            >
              {sendingCode ? (
                <>
                  <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-foreground"/>
                  Sending...
                </>
              ) : (
                "Resend Code"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
