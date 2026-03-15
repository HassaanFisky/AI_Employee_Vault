"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

/**
 * Premium Badge component for status and priorities
 */
export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'neutral', 
  children, 
  ...props 
}) => {
  const variants = {
    success: 'bg-accent-primary text-white',
    warning: 'bg-warning text-white',
    error: 'bg-error text-white',
    info: 'bg-info text-white',
    neutral: 'bg-bg-3 text-text-primary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-lg py-xs rounded-sm text-body-sm font-semibold leading-none text-center min-w-[60px]',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

