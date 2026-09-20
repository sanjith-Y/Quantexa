import React from 'react';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'teal' | 'purple' | 'amber' | 'rose' | 'slate';
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ children, variant = 'teal', pulse = false, className = '' }: StatusBadgeProps) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-300',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold min-w-0 max-w-full truncate ${styles[variant]} ${className}`}>
      {pulse && (
        <span className={`w-2 h-2 rounded-full ${dotColors[variant]} animate-pulse flex-shrink-0`} />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}
