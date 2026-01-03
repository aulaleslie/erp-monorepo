import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuditLog } from '@gym-monorepo/shared';

interface AuditLogDetailsDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailsDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailsDialogProps) {
  if (!log) return null;

  const hasPreviousValues = log.previousValues && Object.keys(log.previousValues).length > 0;
  const hasNewValues = log.newValues && Object.keys(log.newValues).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Details - {log.action} {log.entityName}</DialogTitle>
          <DialogDescription>
            Detailed information about the changes made to this record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasPreviousValues && (
            <div>
              <h4 className="text-sm font-medium mb-2">Previous Values:</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                {JSON.stringify(log.previousValues, null, 2)}
              </pre>
            </div>
          )}

          {hasNewValues && (
            <div>
              <h4 className="text-sm font-medium mb-2">New Values:</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                {JSON.stringify(log.newValues, null, 2)}
              </pre>
            </div>
          )}

          {!hasPreviousValues && !hasNewValues && (
            <div className="text-sm text-muted-foreground">
              No detailed changes available for this action.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}