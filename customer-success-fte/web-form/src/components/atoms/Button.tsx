"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Premium Button component with multiple variants and states
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-ring';
    
    const variants = {
      primary: 'bg-accent-primary hover:bg-accent-hover text-white shadow-md hover:shadow-lg',
      secondary: 'bg-bg-3 hover:bg-bg-4 text-text-primary shadow-sm hover:shadow-md',
      neutral: 'bg-bg-2 border border-white/5 hover:bg-bg-3 text-text-secondary hover:text-text-primary shadow-sm hover:shadow-md',
      ghost: 'bg-transparent hover:bg-bg-3 text-text-primary border border-transparent hover:border-bg-3',
      danger: 'bg-error hover:bg-red-600 text-white shadow-md hover:shadow-lg',
    };

    const sizes = {
      sm: 'px-sm py-xs text-body-sm rounded-sm',
      md: 'px-lg py-sm text-body-reg rounded-sm',
      lg: 'px-xl py-md text-body-lg rounded-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="relative flex items-center justify-center gap-2 w-full">
          {isLoading && (
            <svg 
              className="animate-spin h-4 w-4 text-current" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          <span className={cn(isLoading ? 'opacity-0' : 'opacity-100 flex items-center gap-2')}>
            {children}
          </span>
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
              ...
            </span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

