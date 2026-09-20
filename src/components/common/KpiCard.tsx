import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  value: React.ReactNode;
  unit?: string;
  badgeText?: string;
  badgeIcon?: LucideIcon;
  badgeVariant?: 'emerald' | 'amber' | 'rose' | 'teal' | 'slate';
  subValue?: string;
}

export function KpiCard({
  title,
  icon: Icon,
  iconBg = 'bg-teal-50',
  iconColor = 'text-teal-600',
  value,
  unit,
  badgeText,
  badgeIcon: BadgeIcon,
  badgeVariant = 'emerald',
  subValue,
}: KpiCardProps) {
  const badgeColors = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    teal: 'text-teal-700 bg-teal-50 border-teal-200/80',
    amber: 'text-amber-700 bg-amber-50 border-amber-200/80',
    rose: 'text-rose-700 bg-rose-50 border-rose-200/80',
    slate: 'text-slate-700 bg-slate-100 border-slate-200/80',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-[144px] min-w-0 max-w-full box-border">
      {/* Top Header Row */}
      <div className="flex items-center justify-between text-xs text-slate-500 gap-2 min-w-0">
        <span className="font-semibold text-slate-600 truncate min-w-0">{title}</span>
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} flex-shrink-0`}>
          <Icon size={16} />
        </div>
      </div>

      {/* Middle Value Row */}
      <div className="my-1.5 flex items-baseline gap-1.5 min-w-0 flex-wrap">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
        {subValue && <span className="text-[11px] font-semibold text-emerald-600 font-mono ml-1">{subValue}</span>}
      </div>

      {/* Bottom Trend Badge Row */}
      {badgeText && (
        <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border w-fit max-w-full min-w-0 truncate ${badgeColors[badgeVariant]}`}>
          {BadgeIcon && <BadgeIcon size={12} className="flex-shrink-0" />}
          <span className="truncate">{badgeText}</span>
        </div>
      )}
    </div>
  );
}
