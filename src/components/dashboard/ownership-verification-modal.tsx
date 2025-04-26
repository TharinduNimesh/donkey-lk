import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export type VerificationRejectionReason = 
  | 'INSUFFICIENT_INFO'
  | 'ALREADY_VERIFIED'
  | 'FAKE_ACCOUNT'
  | 'LOW_FOLLOWERS'
  | 'INACTIVE_PROFILE'
  | 'SUSPICIOUS_ACTIVITY'
  | 'CONTENT_VIOLATION'
  | 'INCOMPLETE_PROFILE'
  | 'OTHER';

export interface RejectionReasonItem {
  value: VerificationRejectionReason;
  label: string;
  description: string;
}

export const verificationRejectionReasons: RejectionReasonItem[] = [
  {
    value: 'INSUFFICIENT_INFO',
    label: 'Insufficient Information',
    description: 'The provided verification details are incomplete or unclear.'
  },
  {
    value: 'ALREADY_VERIFIED',
    label: 'Already Verified Account',
    description: 'This platform account is already verified with another BrandSync profile.'
  },
  {
    value: 'FAKE_ACCOUNT',
    label: 'Fake/Impersonation Account',
    description: 'Unable to verify the authenticity of this social media account.'
  },
  {
    value: 'LOW_FOLLOWERS',
    label: 'Insufficient Followers',
    description: 'The account does not meet our minimum follower requirement for influencer status.'
  },
  {
    value: 'INACTIVE_PROFILE',
    label: 'Inactive Profile',
    description: 'The account shows insufficient recent activity or engagement.'
  },
  {
    value: 'SUSPICIOUS_ACTIVITY',
    label: 'Suspicious Activity',
    description: 'Detected unusual patterns or suspicious behavior on the account.'
  },
  {
    value: 'CONTENT_VIOLATION',
    label: 'Content Policy Violation',
    description: 'The account content violates our community guidelines or terms of service.'
  },
  {
    value: 'INCOMPLETE_PROFILE',
    label: 'Incomplete Platform Profile',
    description: 'The social media profile is incomplete or lacks required information.'
  },
  {
    value: 'OTHER',
    label: 'Other Reason',
    description: 'Specify a custom reason for rejection.'
  }
];

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    isAccepted: boolean, 
    verificationDetails?: {
      profileName: string;
      followerCount: string;
      profilePicUrl: string;
    },
    rejectionReason?: VerificationRejectionReason, 
    customReason?: string
  ) => Promise<void>;
  action: 'accept' | 'reject';
  platform: string;
}

export function OwnershipVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  platform
}: VerificationModalProps) {
  const [rejectionReason, setRejectionReason] = React.useState<VerificationRejectionReason>();
  const [customReason, setCustomReason] = React.useState('');
  const [profileName, setProfileName] = React.useState('');
  const [followerCount, setFollowerCount] = React.useState('');
  const [profilePicUrl, setProfilePicUrl] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirm = async () => {
    if (action === 'reject' && !rejectionReason) {
      return;
    }

    if (action === 'accept' && (!profileName || !followerCount)) {
      return;
    }
    
    try {
      setIsProcessing(true);
      await onConfirm(
        action === 'accept',
        action === 'accept' ? {
          profileName,
          followerCount,
          profilePicUrl
        } : undefined,
        rejectionReason,
        customReason
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setRejectionReason(undefined);
      setCustomReason('');
      setProfileName('');
      setFollowerCount('');
      setProfilePicUrl('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {action === 'accept' ? 'Accept Verification Request' : 'Reject Verification Request'}
          </DialogTitle>
          <DialogDescription>
            {action === 'accept' 
              ? `Enter the verified profile details for this ${platform} account.`
              : `Please provide a reason for rejecting this ${platform} verification request.`
            }
          </DialogDescription>
        </DialogHeader>

        {action === 'accept' ? (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Profile/Channel Name</Label>
              <Input
                id="profileName"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter profile or channel name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followers">Follower Count</Label>
              <Input
                id="followers"
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
                placeholder="e.g. 10K, 1.4M, 500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePic">Profile Picture URL</Label>
              <Input
                id="profilePic"
                value={profilePicUrl}
                onChange={(e) => setProfilePicUrl(e.target.value)}
                placeholder="Enter profile picture URL"
                type="url"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <RadioGroup
              value={rejectionReason}
              onValueChange={(value: VerificationRejectionReason) => setRejectionReason(value)}
              className="flex flex-col space-y-3"
            >
              {verificationRejectionReasons.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="cursor-pointer">
                    <div className="font-medium">{reason.label}</div>
                    <p className="text-sm text-muted-foreground">{reason.description}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {rejectionReason === 'OTHER' && (
              <div className="space-y-2">
                <Label htmlFor="customReason">Please specify the reason</Label>
                <Textarea
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter detailed reason for rejection..."
                  className="h-20"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            variant={action === 'accept' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={
              (action === 'reject' && !rejectionReason) || 
              (action === 'accept' && (!profileName || !followerCount)) ||
              isProcessing
            }
          >
            {isProcessing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"/>
                {action === 'accept' ? 'Verifying...' : 'Rejecting...'}
              </>
            ) : (
              action === 'accept' ? 'Verify Account' : 'Reject Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}