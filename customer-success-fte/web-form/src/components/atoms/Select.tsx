"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

/**
 * Premium Select component with custom styling and micro-interactions
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    const [showCheck, setShowCheck] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setShowCheck(true);
      setTimeout(() => setShowCheck(false), 1500);
      if (props.onChange) props.onChange(e);
    };

    return (
      <div className="w-full flex flex-col gap-sm">
        {label && (
          <label className="text-body-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative group">
          <select
            ref={ref}
            className={cn(
              'w-full bg-bg-2 border border-bg-3 rounded-sm p-md pr-12 text-body-reg text-text-primary placeholder:text-text-tertiary appearance-none focus-ring cursor-pointer transition-all duration-base',
              error && 'border-error focus:border-error focus:ring-error/10 border-b-2',
              className
            )}
            onChange={handleChange}
            {...props}
          >
            {props.placeholder && (
              <option value="" disabled>
                {props.placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-2 text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
          
          <div className="absolute right-md top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
            {showCheck && !error && (
              <Check className="w-4 h-4 text-accent-primary animate-bounce-in" />
            )}
            <ChevronDown className="w-4 h-4 text-text-tertiary group-focus-within:text-accent-primary group-focus-within:rotate-180 transition-all duration-base" />
          </div>
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

Select.displayName = 'Select';

