"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled';
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

/**
 * Premium Card component with multiple variants and header/footer support
 */
export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'elevated', 
  title,
  subtitle,
  footer,
  ...props 
}) => {
  const variants = {
    elevated: 'bg-bg-2 border border-bg-3 shadow-md hover:shadow-lg',
    outlined: 'bg-transparent border-2 border-bg-3',
    filled: 'bg-bg-3 border-none shadow-none',
  };

  return (
    <div 
      className={cn(
        'rounded-sm overflow-hidden transition-all duration-base',
        variants[variant],
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-lg py-md border-b border-bg-3 bg-white/[0.02]">
          {title && <h3 className="text-h3 font-semibold text-text-primary tracking-tight">{title}</h3>}
          {subtitle && <p className="text-body-sm text-text-secondary mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className="p-lg">
        {children}
      </div>

      {footer && (
        <div className="px-lg py-md bg-bg-1/50 border-t border-bg-3">
          {footer}
        </div>
      )}
    </div>
  );
};

