"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

/**
 * Premium Toast notification component
 */
export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 4000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 200); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variants = {
    success: {
      border: 'border-l-accent-primary',
      icon: <CheckCircle className="w-5 h-5 text-accent-primary" />
    },
    error: {
      border: 'border-l-error',
      icon: <AlertCircle className="w-5 h-5 text-error" />
    },
    warning: {
      border: 'border-l-warning',
      icon: <AlertTriangle className="w-5 h-5 text-warning" />
    },
    info: {
      border: 'border-l-info',
      icon: <Info className="w-5 h-5 text-info" />
    }
  };

  return (
    <div 
      className={cn(
        'fixed top-lg right-lg z-[100] w-full max-w-[400px] bg-bg-2 border border-bg-3 border-l-4 rounded-sm shadow-xl p-md flex items-start gap-md transition-all duration-200',
        variants[type].border,
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {variants[type].icon}
      </div>
      <div className="flex-grow">
        <p className="text-body-reg text-text-primary font-medium">{message}</p>
      </div>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 200);
        }}
        className="flex-shrink-0 p-1 rounded-sm hover:bg-bg-3 text-text-tertiary hover:text-text-primary transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Toast Container to manage multiple toasts
 */
export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed top-0 right-0 z-[100] pointer-events-none p-lg flex flex-col gap-md">
      {children}
    </div>
  );
};
