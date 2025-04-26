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
  variant
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
