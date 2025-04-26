import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelect } from "@/components/ui/payment-method-select";
import { Database } from "@/types/database.types";
import { AlertCircle, Building, CheckCircle2, CreditCard, DollarSign, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type BankTransferSlip = Database['public']['Tables']['bank_transfer_slip']['Row'] & {
  status?: {
    status: Database['public']['Enums']['BankTransferStatus'];
    reviewed_at: string | null;
    reviewed_by: string | null;
  } | null;
};

interface PaymentDetailsCardProps {
  cost: {
    amount: number;
    payment_method: Database['public']['Enums']['PaymentMethod'];
    is_paid: boolean;
  };
  taskStatus: Database['public']['Enums']['TaskStatus'] | null;
  bankSlips: BankTransferSlip[];
  payment: {
    method?: 'bank-transfer' | 'card';
    bankSlip?: File;
  };
  isLoading: boolean;
  onMethodSelect: (method: 'bank-transfer' | 'card') => void;
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
  onDeleteSlip
}: PaymentDetailsCardProps) {
  // Check if PayHere is active from environment variable
  const isPayHereActive = process.env.NEXT_PUBLIC_PAYHERE_ACTIVE === 'true';
  return (
    <Card className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-xl font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-blue-500" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Campaign Budget</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Total amount for this campaign</p>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                Rs. {cost?.amount.toLocaleString()}
              </div>
            </div>
          </div>
          
          {cost?.is_paid ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 p-6 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Payment Completed</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">Payment Method: {cost.payment_method.replace('_', ' ')}</p>
                </div>
              </div>
              <Progress className="h-2 mt-4 bg-green-100 dark:bg-green-800/30" value={100} />
            </div>
            ) : taskStatus === 'DRAFT' ? (
              <div className="space-y-4">
                {bankSlips.length > 0 ? (
                  <div className="space-y-4">
                    {bankSlips.map((slip) => (
                      <motion.div 
                        key={slip.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {slip.status?.status === 'ACCEPTED' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                              ) : slip.status?.status === 'REJECTED' ? (
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                              )}
                              <h4 className={`font-medium ${
                                slip.status?.status === 'ACCEPTED' ? 'text-green-600 dark:text-green-400' :
                                slip.status?.status === 'REJECTED' ? 'text-red-600 dark:text-red-400' :
                                'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {slip.status?.status === 'ACCEPTED' ? 'Payment Accepted' :
                                 slip.status?.status === 'REJECTED' ? 'Payment Rejected' :
                                 'Payment Verification in Progress'}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Bank transfer slip uploaded on {format(new Date(slip.created_at), 'MMM d, yyyy')}
                              {slip.status?.reviewed_at && (
                                <> • Reviewed on {format(new Date(slip.status.reviewed_at), 'MMM d, yyyy')}</>
                              )}
                            </p>
                          </div>
                          {slip.status?.status !== 'ACCEPTED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:border-red-600"
                              onClick={() => onDeleteSlip(slip.id, slip.slip)}
                              disabled={isLoading}
                            >
                              Delete Slip
                            </Button>
                          )}
                        </div>
                        {slip.status?.status === 'REJECTED' ? (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            Your payment was rejected. Please upload a new bank transfer slip or try a different payment method.
                          </p>
                        ) : slip.status?.status === 'ACCEPTED' ? (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Your payment has been verified and your task is now active.
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Our team will verify your payment shortly. Once verified, your task will be activated automatically.
                          </p>
                        )}
                      </motion.div>
                    ))}
                    
                    {/* Show payment form only if no pending or accepted slips */}
                    {!bankSlips.some(slip => 
                      slip.status?.status === 'PENDING' || 
                      slip.status?.status === 'ACCEPTED'
                    ) && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                          <CreditCard className="h-5 w-5 mr-2 text-pink-500" />
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
                            {isLoading ? 'Processing...' : 'Complete Payment'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 p-6 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">Payment Required</h3>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Complete payment to activate your task</p>
                        </div>
                      </div>
                      <Progress className="h-2 mt-4 bg-yellow-100 dark:bg-yellow-800/30" value={0} />
                    </div>
                    
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Select Payment Method</h3>
                      <PaymentMethodSelect
                        selectedMethod={payment.method}
                        onMethodSelect={(method) => {
                          // Only allow card payment if PayHere is active
                          if (method === 'card' && !isPayHereActive) return;
                          onMethodSelect(method);
                        }}
                        onSlipUpload={onSlipUpload}
                        bankSlip={payment.bankSlip}
                      />
                      
                      <div className="mt-6 flex justify-end">
                        <Button
                          onClick={onProceedToPayment}
                          disabled={isLoading || !payment.method || (payment.method === 'card' && !isPayHereActive)}
                          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white"
                        >
                          {isLoading ? 'Processing...' : 'Complete Payment'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
  );
}
