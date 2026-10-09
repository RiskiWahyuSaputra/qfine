import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  isDestructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  // Portal ke body: kartu kaca (backdrop-filter) mengurung elemen position:fixed di dalamnya,
  // sehingga overlay tidak menutupi layar bila modal dirender di dalam kartu
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl glass-modal p-6 z-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div
            className={cn(
              'p-3 rounded-2xl shrink-0',
              isDestructive ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            )}
          >
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  , document.body);
}
