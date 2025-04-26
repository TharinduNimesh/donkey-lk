import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database.types";
import { ArrowLeft, Archive, CheckCircle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TaskConfirmationModal } from "./task-confirmation-modal";

interface TaskActionsFooterProps {
  taskStatus: Database['public']['Enums']['TaskStatus'] | null;
  isLoading: boolean;
  onBack: () => void;
  onArchive: () => void;
  onComplete: () => void;
  onDelete?: () => void;
  onUnarchive?: () => void;
}

export function TaskActionsFooter({
  taskStatus,
  isLoading,
  onBack,
  onArchive,
  onComplete,
  onDelete,
  onUnarchive
}: TaskActionsFooterProps) {
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    action: 'archive' | 'complete' | 'delete' | 'unarchive';
  }>({ isOpen: false, action: 'archive' });
  return (
    <Card className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          {/* Show Delete button for DRAFT tasks */}
          {taskStatus === 'DRAFT' && onDelete && (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:border-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 w-full sm:w-auto"
              onClick={() => setConfirmationModal({ isOpen: true, action: 'delete' })}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isLoading && confirmationModal.action === 'delete' ? 'Deleting...' : 'Delete Task'}
            </Button>
          )}
          
          {/* Show Archive button for ACTIVE tasks */}
          {taskStatus === 'ACTIVE' && (
            <Button
              variant="outline"
              className="text-amber-600 border-amber-200 hover:border-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20 w-full sm:w-auto"
              onClick={() => setConfirmationModal({ isOpen: true, action: 'archive' })}
              disabled={isLoading}
            >
              <Archive className="mr-2 h-4 w-4" />
              {isLoading && confirmationModal.action === 'archive' ? 'Archiving...' : 'Archive Task'}
            </Button>
          )}
          
          {/* Show Unarchive button for ARCHIVED tasks */}
          {taskStatus === 'ARCHIVED' && onUnarchive && (
            <Button
              variant="outline"
              className="text-blue-600 border-blue-200 hover:border-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 w-full sm:w-auto"
              onClick={() => setConfirmationModal({ isOpen: true, action: 'unarchive' })}
              disabled={isLoading}
            >
              <Archive className="mr-2 h-4 w-4 rotate-180" />
              {isLoading && confirmationModal.action === 'unarchive' ? 'Unarchiving...' : 'Unarchive Task'}
            </Button>
          )}
          
          {/* Show Complete button for ACTIVE tasks */}
          {taskStatus === 'ACTIVE' && (
            <Button
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
              onClick={() => setConfirmationModal({ isOpen: true, action: 'complete' })}
              disabled={isLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isLoading && confirmationModal.action === 'complete' ? 'Completing...' : 'Mark as Completed'}
            </Button>
          )}
          
          {/* Confirmation Modals */}
          {confirmationModal.isOpen && confirmationModal.action === 'delete' && (
            <TaskConfirmationModal
              isOpen={confirmationModal.isOpen}
              onClose={() => setConfirmationModal({ isOpen: false, action: 'delete' })}
              onConfirm={() => {
                if (onDelete) onDelete();
              }}
              title="Delete Task"
              description="Are you sure you want to delete this task? This action cannot be undone."
              confirmText="Delete Task"
              isLoading={isLoading}
              variant="delete"
            />
          )}
          
          {confirmationModal.isOpen && confirmationModal.action === 'archive' && (
            <TaskConfirmationModal
              isOpen={confirmationModal.isOpen}
              onClose={() => setConfirmationModal({ isOpen: false, action: 'archive' })}
              onConfirm={onArchive}
              title="Archive Task"
              description="Are you sure you want to archive this task? Archived tasks will no longer be visible to influencers."
              confirmText="Archive Task"
              isLoading={isLoading}
              variant="archive"
            />
          )}
          
          {confirmationModal.isOpen && confirmationModal.action === 'unarchive' && (
            <TaskConfirmationModal
              isOpen={confirmationModal.isOpen}
              onClose={() => setConfirmationModal({ isOpen: false, action: 'unarchive' })}
              onConfirm={() => {
                if (onUnarchive) onUnarchive();
              }}
              title="Unarchive Task"
              description="Are you sure you want to unarchive this task? This will make the task active again and visible to influencers."
              confirmText="Unarchive Task"
              isLoading={isLoading}
              variant="archive"
            />
          )}
          
          {confirmationModal.isOpen && confirmationModal.action === 'complete' && (
            <TaskConfirmationModal
              isOpen={confirmationModal.isOpen}
              onClose={() => setConfirmationModal({ isOpen: false, action: 'complete' })}
              onConfirm={onComplete}
              title="Complete Task"
              description="Are you sure you want to mark this task as completed? This will finalize the task and payments will be processed to influencers."
              confirmText="Mark as Completed"
              isLoading={isLoading}
              variant="complete"
            />
          )}
        </div>
      </div>
    </Card>
  );
}
