import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle: string;
  badge?: {
    text: string;
    variant?: 'teal' | 'purple' | 'rose' | 'slate' | 'emerald';
  };
  actions?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  iconColor = 'text-teal-600',
  title,
  subtitle,
  badge,
  actions,
}: PageHeaderProps) {
  const badgeClasses = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse',
    slate: 'bg-slate-100 text-slate-600 border-slate-200/90',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="bg-white p-5 xl:p-6 rounded-2xl border border-slate-200/90 shadow-2xs w-full min-w-0 box-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/90 flex items-center justify-center flex-shrink-0">
          <Icon className={iconColor} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg xl:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {title}
            </h1>
            {badge && (
              <span className={`text-xs px-3 py-1 rounded-full border font-bold ${badgeClasses[badge.variant || 'teal']}`}>
                {badge.text}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 min-w-0 max-w-full pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {actions}
        </div>
      )}
    </div>
  );
}
