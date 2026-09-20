import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`w-full max-w-full min-w-0 p-6 lg:p-7 xl:p-8 space-y-6 box-border bg-[#F7F9FC] ${className}`}>
      {children}
    </div>
  );
}
