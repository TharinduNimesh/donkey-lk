import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type RejectionReason = 'INSUFFICIENT_AMOUNT' | 'INVALID_ACCOUNT' | 'FAKE_RECEIPT' | 'REFERENCE_NOT_FOUND' | 'OTHER';

export interface RejectionReasonItem {
  value: RejectionReason;
  label: string;
}

export const rejectionReasonsList: RejectionReasonItem[] = [
  { value: 'INSUFFICIENT_AMOUNT', label: 'Insufficient Payment Amount' },
  { value: 'INVALID_ACCOUNT', label: 'Invalid Account Details' },
  { value: 'FAKE_RECEIPT', label: 'Suspicious/Invalid Receipt' },
  { value: 'REFERENCE_NOT_FOUND', label: 'Reference Number Not Found' },
  { value: 'OTHER', label: 'Other Reason' }
];

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isAccepted: boolean, reason?: RejectionReason, customReason?: string) => void;
  action: 'accept' | 'reject';
  paymentDetails: {
    taskTitle: string;
    amount: number;
  };
}

export function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  paymentDetails
}: PaymentConfirmationModalProps) {
  const [rejectionReason, setRejectionReason] = React.useState<RejectionReason>();
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
            {action === 'accept' ? 'Accept Payment' : 'Reject Payment'}
          </DialogTitle>
          <DialogDescription>
            {action === 'accept' 
              ? `Are you sure you want to accept the payment of Rs. ${paymentDetails.amount} for task "${paymentDetails.taskTitle}"?`
              : `Please provide a reason for rejecting the payment of Rs. ${paymentDetails.amount} for task "${paymentDetails.taskTitle}".`
            }
          </DialogDescription>
        </DialogHeader>

        {action === 'reject' && (
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <Label>Reason for Rejection</Label>
              <RadioGroup
                value={rejectionReason}
                onValueChange={(value: RejectionReason) => setRejectionReason(value)}
                className="flex flex-col space-y-2"
              >
                {rejectionReasonsList.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {rejectionReason === 'OTHER' && (
              <div className="space-y-2">
                <Label htmlFor="customReason">
                  Please specify the reason
                </Label>
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
              action === 'accept' ? 'Accept Payment' : 'Reject Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}