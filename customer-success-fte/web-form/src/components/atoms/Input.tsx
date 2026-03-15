"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isSuccess?: boolean;
}

/**
 * Premium Input component with validation states
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, isSuccess, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-sm">
        {label && (
          <label className="text-body-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            className={cn(
              'w-full bg-bg-2 border border-bg-3 rounded-sm p-md text-body-reg text-text-primary placeholder:text-text-tertiary placeholder:opacity-70 focus-ring',
              error && 'border-error focus:border-error focus:ring-error/10 border-b-2',
              isSuccess && 'border-accent-primary',
              className
            )}
            {...props}
          />
          {isSuccess && !error && (
            <div className="absolute right-md top-1/2 -translate-y-1/2 text-accent-primary animate-bounce-in">
              <svg 
                className="w-5 h-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          )}
        </div>
        {error && (
          <p className="text-body-sm text-error animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

