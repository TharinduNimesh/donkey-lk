import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProofRejectionReason = 
  | 'INVALID_PROOFS'
  | 'VIEWS_NOT_REACHED'
  | 'FAKE_OWNERSHIP'
  | 'DUPLICATE_SUBMISSION'
  | 'CONTENT_REMOVED'
  | 'METRICS_MISMATCH'
  | 'OTHER';

export interface RejectionReasonItem {
  value: ProofRejectionReason;
  label: string;
  description: string;
}

export const proofRejectionReasons: RejectionReasonItem[] = [
  {
    value: 'INVALID_PROOFS',
    label: 'Invalid Proofs',
    description: 'The submitted proofs are not valid or do not meet our requirements.'
  },
  {
    value: 'VIEWS_NOT_REACHED',
    label: 'Views Target Not Reached',
    description: 'The promised view count has not been achieved as per the submitted proof.'
  },
  {
    value: 'FAKE_OWNERSHIP',
    label: 'Fake Channel/Page Ownership',
    description: 'Could not verify ownership of the channel or page used for promotion.'
  },
  {
    value: 'DUPLICATE_SUBMISSION',
    label: 'Duplicate Submission',
    description: 'This proof has been submitted before or used for another task.'
  },
  {
    value: 'CONTENT_REMOVED',
    label: 'Content Removed/Unavailable',
    description: 'The promoted content is no longer accessible or has been removed.'
  },
  {
    value: 'METRICS_MISMATCH',
    label: 'Metrics Mismatch',
    description: 'The engagement metrics in the proof do not match with actual platform metrics.'
  },
  {
    value: 'OTHER',
    label: 'Other Reason',
    description: 'Specify a custom reason for rejection.'
  }
];

interface ProofVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isAccepted: boolean, reason?: ProofRejectionReason, customReason?: string) => Promise<void>;
  action: 'accept' | 'reject';
  proofDetails: {
    platform: string;
    promisedViews: number;
  };
}

export function ProofVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  proofDetails
}: ProofVerificationModalProps) {
  const [rejectionReason, setRejectionReason] = React.useState<ProofRejectionReason>();
  const [customReason, setCustomReason] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    if (action === 'reject' && !rejectionReason) {
      return; // Don't proceed without a reason for rejection
    }
    
    try {
      setIsLoading(true);
      await onConfirm(action === 'accept', rejectionReason, customReason);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setRejectionReason(undefined);
      setCustomReason('');
      setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {action === 'accept' ? 'Accept Proof' : 'Reject Proof'}
          </DialogTitle>
          <DialogDescription>
            {action === 'accept' 
              ? `Are you sure you want to accept this ${proofDetails.platform} proof submission with ${proofDetails.promisedViews.toLocaleString()} promised views?`
              : `Please provide a reason for rejecting this ${proofDetails.platform} proof submission.`
            }
          </DialogDescription>
        </DialogHeader>

        {action === 'reject' && (
          <div className="grid gap-4 py-4">
            <RadioGroup
              value={rejectionReason}
              onValueChange={(value: ProofRejectionReason) => setRejectionReason(value)}
              className="flex flex-col space-y-3"
            >
              {proofRejectionReasons.map((reason) => (
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
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant={action === 'accept' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={(action === 'reject' && !rejectionReason) || isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {action === 'accept' ? 'Accepting...' : 'Rejecting...'}
              </>
            ) : (
              action === 'accept' ? 'Accept Proof' : 'Reject Proof'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}