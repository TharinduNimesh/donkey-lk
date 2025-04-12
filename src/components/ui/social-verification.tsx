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

interface ContactDetail {
  id: number;
  type: "EMAIL" | "MOBILE" | "WHATSAPP";
  detail: string;
  contactStatus?: {
    is_verified: boolean;
    verified_at: string | null;
  };
}

interface SocialVerificationProps {
  verifiedEmail?: string;
  contactDetails?: ContactDetail[];
  onVerify?: (contactId: number) => void;
  onSubmitUrl?: (url: string) => void;
  platform?: Database["public"]["Enums"]["Platforms"];
}

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
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication error. Please try logging in again.");
      }

      // Create verification request
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
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Details</h3>

          {/* Verified Email */}
          {verifiedEmail && (
            <div className="mb-4">
              <Label>Verified Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <span>{verifiedEmail}</span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Verified
                </span>
              </div>
            </div>
          )}

          {/* Other Contact Details */}
          {contactDetails.length > 0 && (
            <div className="space-y-4">
              {contactDetails.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <Label>{contact.type}</Label>
                    <div className="mt-1">{contact.detail}</div>
                  </div>
                  <div>
                    {contact.contactStatus?.is_verified ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Verified
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyClick(contact.id)}
                        disabled={sendingCode || (verifyingContactId === contact.id && isVerifyingContact)}
                      >
                        {sendingCode && verifyingContactId === contact.id ? (
                          <>
                            <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-foreground"/>
                            Sending...
                          </>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Administrative Verification */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Administrative Verification
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pageUrl">Page/Channel URL</Label>
              <Input
                id="pageUrl"
                type="url"
                placeholder="Enter your page or channel URL"
                className="mt-1"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
              />
              {!hasVerifiedNonEmailContact && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                  Please verify at least one phone number or WhatsApp contact before submitting
                </p>
              )}
              {!pageUrl && (
                <p className="text-sm text-muted-foreground mt-2">
                  Enter the URL of your social media page or channel
                </p>
              )}
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"/>
                  Submitting...
                </>
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isVerifyingContact} onOpenChange={(open) => {
        if (!open) {
          setIsVerifyingContact(false);
          setVerifyingContactId(null);
          setVerificationCode("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit verification code to your phone. Please enter it below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
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
              className="w-full"
            >
              Verify Code
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => handleVerifyClick(verifyingContactId!)}
              disabled={sendingCode}
              className="w-full"
            >
              {sendingCode ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"/>
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
