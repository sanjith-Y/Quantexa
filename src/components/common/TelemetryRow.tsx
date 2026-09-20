import React from 'react';

interface TelemetryRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueColor?: string;
}

export function TelemetryRow({ label, value, icon, valueColor = 'text-slate-900' }: TelemetryRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-3 items-center py-2 min-w-0 w-full text-xs border-b border-slate-100 last:border-0">
      <span className="text-slate-500 font-medium truncate flex items-center gap-1.5 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className={`text-right font-semibold min-w-0 truncate font-mono tabular-nums ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}
