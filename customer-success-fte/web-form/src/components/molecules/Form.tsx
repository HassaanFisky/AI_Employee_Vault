"use client";

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  error?: string;
}

export const Form: React.FC<FormProps> = ({ error, children, className, ...props }) => {
  return (
    <form className={cn('space-y-6', className)} {...props}>
      {children}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium animate-fade-in">
          {error}
        </div>
      )}
    </form>
  );
};
