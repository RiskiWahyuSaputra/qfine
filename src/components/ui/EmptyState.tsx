import React from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl glass-card border-dashed border-white/10 my-4',
        className
      )}
    >
      <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
        {icon || <HelpCircle className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
