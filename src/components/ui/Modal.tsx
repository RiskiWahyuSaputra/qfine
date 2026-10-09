import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  // Portal ke body: kartu kaca (backdrop-filter) mengurung elemen position:fixed di dalamnya,
  // sehingga overlay tidak menutupi layar bila modal dirender di dalam kartu
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto glass-overlay animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full rounded-2xl glass-modal p-6 z-10 my-8 max-h-[90vh] flex flex-col',
          maxWidthClass
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="pt-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  , document.body);
}
