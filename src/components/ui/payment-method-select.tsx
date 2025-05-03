"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import { AlertCircle, Building, CreditCard, Upload } from "lucide-react"

interface PaymentMethodSelectProps {
  onMethodSelect: (method: 'bank-transfer' | 'card') => void
  onSlipUpload?: (file: File) => void
  selectedMethod?: 'bank-transfer' | 'card'
  bankSlip?: File | null
  className?: string
}

export function PaymentMethodSelect({
  onMethodSelect,
  onSlipUpload,
  selectedMethod,
  bankSlip,
  className
}: PaymentMethodSelectProps) {
  // Check if PayHere is active from environment variable
  const isPayHereActive = process.env.NEXT_PUBLIC_PAYHERE_ACTIVE === 'true';
  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className={`p-6 cursor-pointer hover:border-primary transition-colors ${
            selectedMethod === 'bank-transfer' ? 'border-primary' : ''
          }`}
          onClick={() => onMethodSelect('bank-transfer')}
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Bank Transfer</h3>
              <p className="text-sm text-muted-foreground">
                Upload your bank transfer slip
              </p>
            </div>
          </div>

          {selectedMethod === 'bank-transfer' && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <div className="flex items-start gap-2">
                  <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-300">Bank Transfer Details</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><span className="font-medium">Bank:</span> Sampath Bank</p>
                      <p><span className="font-medium">Account Name:</span> K S M Fernando</p>
                      <p><span className="font-medium">Account Number:</span> 116557149139</p>
                      <p><span className="font-medium">Branch:</span> Kochchikade</p>
                      <p><span className="font-medium">Reference:</span> Your email address</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <FileUpload
                onFileSelect={(file) => onSlipUpload?.(file as File)}
                selectedFile={bankSlip}
                accept="image/*,.pdf"
                maxSize={5 * 1024 * 1024}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Accepted formats: JPG, PNG, PDF up to 5MB
              </p>
            </div>
          )}
        </Card>

        <Card
          className={`p-6 ${isPayHereActive ? 'cursor-pointer hover:border-primary' : 'opacity-60 cursor-not-allowed'} transition-colors ${
            selectedMethod === 'card' ? 'border-primary' : ''
          }`}
          onClick={() => isPayHereActive && onMethodSelect('card')}
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Card Payment</h3>
              <p className="text-sm text-muted-foreground">
                Pay with credit or debit card
              </p>
              {!isPayHereActive && (
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Currently unavailable</span>
                </div>
              )}
            </div>
          </div>

          {isPayHereActive && selectedMethod === 'card' && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                You will be redirected to PayHere to complete your payment securely.
              </p>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded text-sm text-yellow-800 dark:text-yellow-200">
                Note: We do not store any credit card information. All payments are processed securely through PayHere.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}