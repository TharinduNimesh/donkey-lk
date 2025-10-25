import React from "react";
import { motion } from "framer-motion";
import { Check, DollarSign } from "lucide-react";
import { formatDateToNow } from "@/lib/utils";
import { formatViewCount, parseViewCount } from "@/lib/utils/views";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { PlatformIcon } from "./platform-icon";

type TaskApplication = Database["public"]["Tables"]["task_applications"]["Row"] & {
  application_promises: Database["public"]["Tables"]["application_promises"]["Row"][];
};

interface ExistingApplicationCardProps {
  application: TaskApplication;
}

export function ExistingApplicationCard({ application }: ExistingApplicationCardProps) {
  // Currency: 1 USD = NEXT_PUBLIC_LKR_PER_USD LKR
  const LKR_PER_USD = Number(process.env.NEXT_PUBLIC_LKR_PER_USD ?? "295");
  const LKR_TO_USD = 1 / (LKR_PER_USD || 295);
  const formatUSD = (lkrAmount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(lkrAmount * LKR_TO_USD);

  const calculateTotalEarnings = (application: TaskApplication) => {
    return application.application_promises.reduce(
      (total, promise) => total + parseFloat(promise.est_profit), 0
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="mb-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-medium text-gray-900 dark:text-gray-100">Your Application</CardTitle>
              <CardDescription>Applied {formatDateToNow(application.created_at)}</CardDescription>
            </div>
            <Badge className="pointer-events-none select-none bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1">
              <Check className="w-3.5 h-3.5 mr-1" />
              Active Application
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="py-6">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {application.application_promises.map((promise, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300 h-full">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <PlatformIcon platform={promise.platform} />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{promise.platform}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatViewCount(parseViewCount(promise.promised_reach))} views
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Estimated Earnings</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatUSD(parseFloat(promise.est_profit))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="border-0 bg-green-50 dark:bg-green-900/20 overflow-hidden relative">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-3">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium text-green-700 dark:text-green-300">Total Potential Earnings</span>
                  </div>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    {formatUSD(calculateTotalEarnings(application))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
