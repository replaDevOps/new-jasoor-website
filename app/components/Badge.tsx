import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'default';
  className?: string;
}

export const Badge = ({ children, variant = 'primary', className }: BadgeProps) => {
  const variants = {
    primary: "bg-[#004E39] text-white",
    success: "bg-[#10B981] text-white",
    warning: "bg-[#FBAA1A] text-white",
    danger: "bg-[#EF4444] text-white",
    neutral: "bg-gray-100 text-gray-600",
    default: "bg-gray-100 text-gray-600", // Alias for neutral/default
  };

  return (
    <span className={cn(
      "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold leading-none",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
