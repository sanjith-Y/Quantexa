import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs min-w-0 max-w-full box-border ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
