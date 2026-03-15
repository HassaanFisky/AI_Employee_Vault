"use client";

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Premium Modal component with backdrop and animations
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-bg-1 border border-bg-3 rounded-md shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="p-xl">
          <div className="flex justify-between items-center mb-lg">
            {title && <h3 className="text-h3 text-text-primary">{title}</h3>}
            <button 
              onClick={onClose}
              className="p-sm rounded-sm hover:bg-bg-3 text-text-tertiary hover:text-text-primary transition-colors focus-ring"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="scrollbar-premium max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
