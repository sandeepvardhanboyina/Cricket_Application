'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
        if (event.key === 'Enter') onConfirm();
      }}
      tabIndex={-1}
    >
      <Card className="w-full max-w-md shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p id="confirm-dialog-message" className="mt-1 text-sm text-gray-500">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            className={cn('min-w-24')}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
