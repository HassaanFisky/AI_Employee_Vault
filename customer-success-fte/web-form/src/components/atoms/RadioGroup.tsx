"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}

/**
 * Premium Radio Group component with custom button-like styling
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  error 
}) => {
  return (
    <div className="w-full flex flex-col gap-sm">
      {label && (
        <label className="text-body-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="flex flex-row gap-md">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'flex-1 px-lg py-sm rounded-sm text-body-reg font-semibold transition-all duration-fast focus-ring',
                isSelected 
                  ? 'bg-accent-primary text-white shadow-md' 
                  : 'bg-bg-3 text-text-secondary hover:bg-bg-4 hover:text-text-primary'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-body-sm text-error animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
};
