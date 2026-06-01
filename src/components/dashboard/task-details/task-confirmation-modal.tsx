import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Archive, CheckCircle } from "lucide-react";

interface TaskConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  isLoading: boolean;
  variant: "delete" | "archive" | "complete";
}

export function TaskConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  isLoading,
  variant,
}: TaskConfirmationModalProps) {
  // Determine button styles based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case "delete":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "archive":
        return "bg-amber-600 hover:bg-amber-700 text-white";
      case "complete":
        return "bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90 text-white";
      default:
        return "";
    }
  };

  const getIcon = () => {
    switch (variant) {
      case "delete":
        return <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case "archive":
        return <Archive className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      case "complete":
        return <CheckCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />;
      default:
        return null;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "delete":
        return "bg-red-50 dark:bg-red-500/10";
      case "archive":
        return "bg-amber-50 dark:bg-amber-500/10";
      case "complete":
        return "bg-violet-50 dark:bg-violet-500/10";
      default:
        return "bg-muted dark:bg-white/5";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2 rounded-lg ${getIconBg()}`}>
              {getIcon()}
            </div>
            <DialogTitle className="text-foreground text-lg">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground pl-[52px]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto ${getButtonStyles()}`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
