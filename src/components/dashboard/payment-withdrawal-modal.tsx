"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export type WithdrawalRejectionReason =
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_BANK_DETAILS'
  | 'SUSPICIOUS_ACTIVITY'
  | 'MINIMUM_THRESHOLD'
  | 'VERIFICATION_REQUIRED'
  | 'PENDING_TASKS'
  | 'ACCOUNT_RESTRICTED'
  | 'OTHER';

export interface RejectionReasonItem {
  value: WithdrawalRejectionReason;
  label: string;
  description: string;
}

export const withdrawalRejectionReasons: RejectionReasonItem[] = [
  {
    value: 'INSUFFICIENT_FUNDS',
    label: 'Insufficient Funds',
    description: 'The withdrawal amount exceeds the available account balance.'
  },
  {
    value: 'INVALID_BANK_DETAILS',
    label: 'Invalid Bank Details',
    description: 'The provided bank account information is incorrect or incomplete.'
  },
  {
    value: 'SUSPICIOUS_ACTIVITY',
    label: 'Suspicious Account Activity',
    description: 'Unusual patterns detected in account activity requiring review.'
  },
  {
    value: 'MINIMUM_THRESHOLD',
    label: 'Below Minimum Threshold',
    description: 'The requested amount is below our minimum withdrawal limit.'
  },
  {
    value: 'VERIFICATION_REQUIRED',
    label: 'Account Verification Required',
    description: 'Account needs to complete verification process before withdrawals.'
  },
  {
    value: 'PENDING_TASKS',
    label: 'Pending Task Completions',
    description: 'There are pending task verifications affecting available balance.'
  },
  {
    value: 'ACCOUNT_RESTRICTED',
    label: 'Account Temporarily Restricted',
    description: 'Account access is currently limited due to policy concerns.'
  },
  {
    value: 'OTHER',
    label: 'Other Reason',
    description: 'Specify a custom reason for rejection.'
  }
];

interface PaymentWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    isAccepted: boolean,
    reason?: WithdrawalRejectionReason,
    customReason?: string
  ) => Promise<void>;
  action: 'accept' | 'reject';
  withdrawalDetails: {
    amount: number;
    bankName: string;
    accountNumber: string;
  };
}

export function PaymentWithdrawalModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  withdrawalDetails
}: PaymentWithdrawalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<WithdrawalRejectionReason>();
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    try {
      setError('');
      setIsSubmitting(true);

      if (action === 'reject' && !rejectionReason) {
        setError('Please select a reason for rejection');
        return;
      }

      if (action === 'reject' && rejectionReason === 'OTHER' && !customReason.trim()) {
        setError('Please provide a custom reason for rejection');
        return;
      }

      await onConfirm(
        action === 'accept',
        rejectionReason,
        customReason
      );
    } catch (err) {
      setError('Failed to process withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setRejectionReason(undefined);
      setCustomReason('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'accept' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Confirm Withdrawal Approval
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Confirm Withdrawal Rejection
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === 'accept' ? 'Are you sure you want to approve this withdrawal request?' : 'Please specify the reason for rejecting this withdrawal request.'}
          </DialogDescription>
        </DialogHeader>

        {action === 'accept' ? (
          <div className="bg-muted/50 p-3 rounded-lg space-y-1 mt-2">
            <div className="flex">
              <span className="font-medium w-20">Amount:</span>
              <div className="space-y-1">
                <span>Rs. {withdrawalDetails.amount.toFixed(2)}</span>
                <span className="block text-sm text-red-500">
                  - Rs. {(withdrawalDetails.amount * 0.1).toFixed(2)} (10% service fee)
                </span>
                <span className="block font-medium text-green-600">
                  = Rs. {(withdrawalDetails.amount * 0.9).toFixed(2)} (Final amount)
                </span>
              </div>
            </div>
            <div className="flex">
              <span className="font-medium w-20">Bank:</span>
              <span>{withdrawalDetails.bankName}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-20">Account:</span>
              <span>{withdrawalDetails.accountNumber}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <RadioGroup
              value={rejectionReason}
              onValueChange={(value: WithdrawalRejectionReason) => {
                setRejectionReason(value);
                setError('');
              }}
              className="flex flex-col space-y-3"
            >
              {withdrawalRejectionReasons.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="cursor-pointer space-y-1">
                    <span className="block font-medium">{reason.label}</span>
                    <span className="block text-sm text-muted-foreground">{reason.description}</span>
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
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter detailed reason for rejection..."
                  rows={3}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant={action === 'accept' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={(action === 'reject' && !rejectionReason) || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : action === 'accept' ? (
              'Approve Withdrawal'
            ) : (
              'Reject Withdrawal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}