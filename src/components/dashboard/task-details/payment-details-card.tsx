import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelect } from "@/components/ui/payment-method-select";
import { Database } from "@/types/database.types";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  XCircle,
  Clock,
  Shield,
} from "lucide-react";

type BankTransferSlip = Database["public"]["Tables"]["bank_transfer_slip"]["Row"] & {
  status?: {
    status: Database["public"]["Enums"]["BankTransferStatus"];
    reviewed_at: string | null;
    reviewed_by: string | null;
  } | null;
};

interface PaymentDetailsCardProps {
  cost: {
    amount: number;
    payment_method: Database["public"]["Enums"]["PaymentMethod"];
    is_paid: boolean;
  };
  taskStatus: Database["public"]["Enums"]["TaskStatus"] | null;
  bankSlips: BankTransferSlip[];
  payment: {
    method?: "bank-transfer" | "card";
    bankSlip?: File;
  };
  isLoading: boolean;
  onMethodSelect: (method: "bank-transfer" | "card") => void;
  onSlipUpload: (file: File) => void;
  onProceedToPayment: () => void;
  onDeleteSlip: (slipId: number, slipName: string) => void;
}

export function PaymentDetailsCard({
  cost,
  taskStatus,
  bankSlips,
  payment,
  isLoading,
  onMethodSelect,
  onSlipUpload,
  onProceedToPayment,
  onDeleteSlip,
}: PaymentDetailsCardProps) {
  // Check if PayHere is active from environment variable
  const isPayHereActive = process.env.NEXT_PUBLIC_PAYHERE_ACTIVE === "true";

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Payment Details
          </h2>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            cost.is_paid
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
              : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
          }`}
        >
          {cost.is_paid ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Clock className="w-3.5 h-3.5" />
          )}
          {cost.is_paid ? "Paid" : "Unpaid"}
        </div>
      </div>

      {/* Amount Display */}
      <div className="bg-gradient-to-br from-pink-50 to-blue-50 dark:from-pink-900/10 dark:to-blue-900/10 rounded-xl border border-border p-6 mb-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Campaign Budget</p>
          <p className="text-4xl font-bold text-foreground">
            Rs. {cost?.amount?.toLocaleString() || "0"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Method: {cost.payment_method?.replace("_", " ") || "Not selected"}
          </p>
        </div>
      </div>

      {/* Payment States */}
      <div className="space-y-4">
        {cost?.is_paid ? (
          /* Payment Completed */
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-5 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
                  Payment Completed
                </h3>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-400/70 mt-1">
                  Payment Method: {cost.payment_method?.replace("_", " ")}
                </p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-emerald-500/20 rounded-full overflow-hidden mt-4">
              <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
            </div>
          </div>
        ) : taskStatus === "DRAFT" ? (
          <div className="space-y-4">
            {bankSlips.length > 0 ? (
              <div className="space-y-4">
                {bankSlips.map((slip) => (
                  <motion.div
                    key={slip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border rounded-xl p-4 space-y-3 ${
                      slip.status?.status === "ACCEPTED"
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"
                        : slip.status?.status === "REJECTED"
                        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
                        : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {slip.status?.status === "ACCEPTED" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : slip.status?.status === "REJECTED" ? (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          )}
                          <h4
                            className={`font-medium ${
                              slip.status?.status === "ACCEPTED"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : slip.status?.status === "REJECTED"
                                ? "text-red-700 dark:text-red-400"
                                : "text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {slip.status?.status === "ACCEPTED"
                              ? "Payment Accepted"
                              : slip.status?.status === "REJECTED"
                              ? "Payment Rejected"
                              : "Payment Verification in Progress"}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Bank transfer slip uploaded on{" "}
                          {format(new Date(slip.created_at), "MMM d, yyyy")}
                          {slip.status?.reviewed_at && (
                            <>
                              {" "}
                              • Reviewed on{" "}
                              {format(
                                new Date(slip.status.reviewed_at),
                                "MMM d, yyyy"
                              )}
                            </>
                          )}
                        </p>
                      </div>
                      {slip.status?.status !== "ACCEPTED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-500/30 dark:hover:border-red-500 dark:hover:bg-red-500/10"
                          onClick={() => onDeleteSlip(slip.id, slip.slip)}
                          disabled={isLoading}
                        >
                          Delete Slip
                        </Button>
                      )}
                    </div>
                    {slip.status?.status === "REJECTED" ? (
                      <p className="text-sm text-red-700/80 dark:text-red-400/80">
                        Your payment was rejected. Please upload a new bank
                        transfer slip or try a different payment method.
                      </p>
                    ) : slip.status?.status === "ACCEPTED" ? (
                      <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">
                        Your payment has been verified and your task is now
                        active.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Our team will verify your payment shortly. Once
                        verified, your task will be activated automatically.
                      </p>
                    )}
                  </motion.div>
                ))}

                {/* Show payment form only if no pending or accepted slips */}
                {!bankSlips.some(
                  (slip) =>
                    slip.status?.status === "PENDING" ||
                    slip.status?.status === "ACCEPTED"
                ) && (
                  <div className="border border-border rounded-xl p-6 bg-muted/20">
                    <h3 className="font-semibold mb-4 text-foreground flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-violet-600 dark:text-violet-400" />
                      Select Payment Method
                    </h3>
                    <PaymentMethodSelect
                      selectedMethod={payment.method}
                      onMethodSelect={onMethodSelect}
                      onSlipUpload={onSlipUpload}
                      bankSlip={payment.bankSlip}
                    />

                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={onProceedToPayment}
                        disabled={isLoading || !payment.method}
                        className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {isLoading ? "Processing..." : "Complete Payment"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Payment Required Warning */}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-amber-800 dark:text-amber-300">
                        Payment Required
                      </h3>
                      <p className="text-sm text-amber-700/80 dark:text-amber-400/70 mt-1">
                        Complete payment to activate your task
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-amber-500/20 rounded-full overflow-hidden mt-4">
                    <div className="h-full w-0 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="border border-border rounded-xl p-6 bg-muted/20">
                  <h3 className="font-semibold mb-4 text-foreground flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-violet-600 dark:text-violet-400" />
                    Select Payment Method
                  </h3>
                  <PaymentMethodSelect
                    selectedMethod={payment.method}
                    onMethodSelect={(method) => {
                      // Only allow card payment if PayHere is active
                      if (method === "card" && !isPayHereActive) return;
                      onMethodSelect(method);
                    }}
                    onSlipUpload={onSlipUpload}
                    bankSlip={payment.bankSlip}
                  />

                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={onProceedToPayment}
                      disabled={
                        isLoading ||
                        !payment.method ||
                        (payment.method === "card" && !isPayHereActive)
                      }
                      className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {isLoading ? "Processing..." : "Complete Payment"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
