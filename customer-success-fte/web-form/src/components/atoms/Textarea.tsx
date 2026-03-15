"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoGrow?: boolean;
}

/**
 * Premium Textarea component with auto-grow feature and validation states
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, autoGrow = true, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    // Auto-grow logic
    useEffect(() => {
      if (!autoGrow) return;
      
      const textarea = internalRef.current;
      if (!textarea) return;

      const handleInput = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
      };

      textarea.addEventListener('input', handleInput);
      return () => textarea.removeEventListener('input', handleInput);
    }, [autoGrow]);

    return (
      <div className="w-full flex flex-col gap-sm">
        {label && (
          <label className="text-body-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative group">
          <textarea
            ref={(node) => {
              internalRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            className={cn(
              'w-full bg-bg-2 border border-bg-3 rounded-sm p-md text-body-reg text-text-primary placeholder:text-text-tertiary placeholder:opacity-70 focus-ring auto-grow-textarea scrollbar-premium',
              error && 'border-error focus:border-error focus:ring-error/10 border-b-2',
              className
            )}
            {...props}
          />
        </div>
        <div className="flex justify-between items-start">
          {error ? (
            <p className="text-body-sm text-error animate-fade-in">
              {error}
            </p>
          ) : <div />}
          {props.maxLength && (
            <span className="text-body-sm text-text-tertiary">
              {String(props.value || '').length} / {props.maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
