"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import { CreditCard, Upload } from "lucide-react"

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
            <div className="mt-4">
              <FileUpload
                onFileSelect={(file) => onSlipUpload?.(file as File)}
                selectedFile={bankSlip}
                accept="image/*"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Accepted formats: JPG, PNG, PDF up to 5MB
              </p>
            </div>
          )}
        </Card>

        <Card
          className={`p-6 cursor-pointer hover:border-primary transition-colors ${
            selectedMethod === 'card' ? 'border-primary' : ''
          }`}
          onClick={() => onMethodSelect('card')}
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
            </div>
          </div>

          {selectedMethod === 'card' && (
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